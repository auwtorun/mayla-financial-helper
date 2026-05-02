"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getAllAccounts,
  getCategoriesByType,
  getTransactionById,
} from "@/lib/db/queries";
import {
  generateId,
  getTodayISO,
  validateTransaction,
} from "@/lib/utils/calculations";
import { Modal, useConfirmModal, useModal } from "@/components/ui/Modal";
import { SingleDatePicker } from "@/components/ui/DatePicker";
import { useToast } from "@/components/ui/Toast";
import type { Account, Category, TransactionType } from "@/types";

// ── STYLES ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  background: "var(--bg-muted)",
  border: "1px solid var(--border-strong)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234d5e7a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--text-muted)",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: 6,
};

// ── TYPE TABS ────────────────────────────────────────────────

function TypeTabs({
  value,
  onChange,
}: {
  value: TransactionType;
  onChange: (v: TransactionType) => void;
}) {
  const tabs: { value: TransactionType; label: string; color: string }[] = [
    { value: "expense", label: "Keluar", color: "var(--expense)" },
    { value: "income", label: "Masuk", color: "var(--income)" },
    { value: "transfer", label: "Transfer", color: "var(--transfer)" },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        background: "var(--bg-muted)",
        padding: 4,
        borderRadius: "var(--radius-md)",
        marginBottom: 24,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: value === tab.value ? "var(--bg-elevated)" : "transparent",
            color: value === tab.value ? tab.color : "var(--text-muted)",
            border: `1px solid ${value === tab.value ? "var(--border-strong)" : "transparent"}`,
            transition: "all 0.15s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── FIELD WRAPPER ────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── MAIN FORM ────────────────────────────────────────────────

export function TransactionForm({ editId }: { editId?: string }) {
  const router = useRouter();
  const isEdit = !!editId;
  const { toast } = useToast();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { confirm, modalProps: confirmModalProps } = useConfirmModal();
  const { show: showError, modalProps: errorModalProps } = useModal();

  useEffect(() => {
    getAllAccounts().then((accs) => {
      setAccounts(accs);
      if (accs.length > 0) setAccountId(accs[0].id);
    });
  }, []);

  useEffect(() => {
    if (type === "transfer") {
      setCategories([]);
      setCategory("Transfer");
      return;
    }
    getCategoriesByType(type).then((cats) => {
      setCategories(cats);
      setCategory(cats[0]?.name ?? "");
    });
  }, [type]);

  useEffect(() => {
    if (!editId) return;
    getTransactionById(editId).then((txn) => {
      if (!txn) return;
      setType(txn.type);
      setAmount(txn.amount.toString());
      setCategory(txn.category);
      setNote(txn.note);
      setDate(txn.date);
      setAccountId(txn.accountId);
      setToAccountId(txn.toAccountId ?? "");
    });
  }, [editId]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateTransaction({
      amount,
      category,
      date,
      accountId,
      type,
      toAccountId: toAccountId || undefined,
    });

    if (validationErrors.length > 0) {
      const errMap: Record<string, string> = {};
      validationErrors.forEach((e) => (errMap[e.field] = e.message));
      setErrors(errMap);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const txnData = {
        type,
        amount: Number(amount),
        category,
        note: note.trim(),
        date,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
      };

      if (isEdit && editId) {
        await updateTransaction(editId, txnData);
        toast("Transaksi berhasil diperbarui", "success");
      } else {
        await addTransaction({
          id: generateId("txn"),
          ...txnData,
          createdAt: new Date().toISOString(),
        });
        toast("Transaksi berhasil disimpan", "success");
      }
      router.push("/");
    } catch {
      showError({
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan transaksi. Silakan coba lagi.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [type, amount, category, note, date, accountId, toAccountId, isEdit, editId, router, toast, showError]);

  const handleDelete = useCallback(() => {
    if (!editId) return;
    confirm({
      title: "Hapus Transaksi?",
      description: "Tindakan ini tidak bisa dibatalkan. Transaksi akan dihapus permanen.",
      confirmLabel: "Ya, Hapus",
      onConfirm: async () => {
        await deleteTransaction(editId);
        toast("Transaksi dihapus", "info");
        router.push("/history");
      },
    });
  }, [editId, confirm, toast, router]);

  const displayAmount = amount ? Number(amount).toLocaleString("id-ID") : "";

  return (
    <>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "var(--bg-muted)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {isEdit ? "Edit Transaksi" : "Tambah Transaksi"}
          </h1>
        </div>

        <TypeTabs value={type} onChange={setType} />

        {/* Amount */}
        <Field label="Nominal" error={errors.amount}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14, fontWeight: 600 }}>
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              style={{ ...inputStyle, paddingLeft: 40, fontSize: 20, fontWeight: 700 }}
            />
          </div>
        </Field>

        {/* Category */}
        {type !== "transfer" && (
          <Field label="Kategori" error={errors.category}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
        )}

        {/* Account */}
        <Field label={type === "transfer" ? "Dari Akun" : "Akun"} error={errors.accountId}>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={selectStyle}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>

        {/* To Account */}
        {type === "transfer" && (
          <Field label="Ke Akun" error={errors.toAccountId}>
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} style={selectStyle}>
              <option value="">Pilih akun tujuan</option>
              {accounts.filter((a) => a.id !== accountId).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
        )}

        {/* Date — custom picker */}
        <div style={{ marginBottom: 16 }}>
          <SingleDatePicker
            label="Tanggal"
            value={date}
            onChange={setDate}
            error={errors.date}
          />
        </div>

        {/* Note */}
        <Field label="Catatan (opsional)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tambahkan catatan..."
            style={inputStyle}
          />
        </Field>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "16px",
            background: "var(--accent)",
            color: "#000",
            fontSize: 16,
            fontWeight: 700,
            borderRadius: "var(--radius-md)",
            marginTop: 8,
            marginBottom: 12,
            opacity: isSubmitting ? 0.7 : 1,
            boxShadow: "0 4px 20px rgba(0, 212, 170, 0.3)",
          }}
        >
          {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
        </button>

        {isEdit && (
          <button
            onClick={handleDelete}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--expense-bg)",
              color: "var(--expense)",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              marginBottom: 24,
            }}
          >
            Hapus Transaksi
          </button>
        )}
      </div>

      {/* Portalled modals */}
      {confirmModalProps && <Modal {...confirmModalProps} />}
      {errorModalProps && <Modal {...errorModalProps} />}
    </>
  );
}
