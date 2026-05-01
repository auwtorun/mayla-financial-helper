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
import type { Account, Category, Transaction, TransactionType } from "@/types";

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
  textTransform: "uppercase",
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

// ── MAIN FORM ────────────────────────────────────────────────

interface TransactionFormProps {
  editId?: string;
}

export function TransactionForm({ editId }: TransactionFormProps) {
  const router = useRouter();
  const isEdit = !!editId;

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
  const [isDeleting, setIsDeleting] = useState(false);

  // Load meta
  useEffect(() => {
    getAllAccounts().then((accs) => {
      setAccounts(accs);
      if (accs.length > 0 && !accountId) {
        setAccountId(accs[0].id);
      }
    });
  }, []);

  // Load categories by type
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

  // Load existing transaction for edit
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
      } else {
        await addTransaction({
          id: generateId("txn"),
          ...txnData,
          createdAt: new Date().toISOString(),
        });
      }

      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  }, [type, amount, category, note, date, accountId, toAccountId, isEdit, editId, router]);

  const handleDelete = useCallback(async () => {
    if (!editId) return;
    if (!confirm("Hapus transaksi ini?")) return;
    setIsDeleting(true);
    await deleteTransaction(editId);
    router.push("/history");
  }, [editId, router]);

  // Format amount input with thousand separator
  const handleAmountChange = (v: string) => {
    const clean = v.replace(/\D/g, "");
    setAmount(clean);
  };

  const displayAmount = amount
    ? Number(amount).toLocaleString("id-ID")
    : "";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>
      {/* Header */}
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

      {/* Type tabs */}
      <TypeTabs value={type} onChange={setType} />

      {/* Amount */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Nominal</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14, fontWeight: 600 }}>
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={displayAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0"
            style={{ ...inputStyle, paddingLeft: 40, fontSize: 20, fontWeight: 700 }}
          />
        </div>
        {errors.amount && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>{errors.amount}</p>}
      </div>

      {/* Category (hidden for transfer) */}
      {type !== "transfer" && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Kategori</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {errors.category && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>{errors.category}</p>}
        </div>
      )}

      {/* Account */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{type === "transfer" ? "Dari Akun" : "Akun"}</label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={selectStyle}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        {errors.accountId && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>{errors.accountId}</p>}
      </div>

      {/* To Account (transfer only) */}
      {type === "transfer" && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Ke Akun</label>
          <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} style={selectStyle}>
            <option value="">Pilih akun tujuan</option>
            {accounts.filter((a) => a.id !== accountId).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {errors.toAccountId && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>{errors.toAccountId}</p>}
        </div>
      )}

      {/* Date */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
        {errors.date && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>{errors.date}</p>}
      </div>

      {/* Note */}
      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>Catatan (opsional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tambahkan catatan..."
          style={inputStyle}
        />
      </div>

      {/* Submit */}
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
          marginBottom: 12,
          opacity: isSubmitting ? 0.7 : 1,
          boxShadow: "0 4px 20px rgba(0, 212, 170, 0.3)",
        }}
      >
        {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
      </button>

      {/* Delete */}
      {isEdit && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            width: "100%",
            padding: "14px",
            background: "var(--expense-bg)",
            color: "var(--expense)",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
          }}
        >
          {isDeleting ? "Menghapus..." : "Hapus Transaksi"}
        </button>
      )}
    </div>
  );
}
