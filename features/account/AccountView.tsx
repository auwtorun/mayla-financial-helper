"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAllAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  getUserSettings,
  updateUserSettings,
  exportAllData,
  importAllData,
} from "@/lib/db/queries";
import { generateId } from "@/lib/utils/calculations";
import { Modal, useConfirmModal, useModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Account } from "@/types";

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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--text-muted)",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: 6,
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 11,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  fontWeight: 600,
};

// ── ACCOUNT EDIT SHEET ────────────────────────────────────────

interface AccountSheetProps {
  open: boolean;
  onClose: () => void;
  initial?: Account;
  onSave: (name: string) => void;
  title: string;
}

function AccountSheet({ open, onClose, initial, onSave, title }: AccountSheetProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setName(initial?.name ?? "");
    setError("");
  }, [open, initial]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Nama akun tidak boleh kosong"); return; }
    if (trimmed.length < 2) { setError("Minimal 2 karakter"); return; }
    onSave(trimmed);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 95,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
        animation: "fadeIn 0.15s ease",
        padding: "0 0 env(safe-area-inset-bottom)",
      }}
    >
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        width: "100%", maxWidth: 480,
        padding: "0 20px 28px",
        animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
      }}>
        <div style={{ padding: "12px 0 16px", textAlign: "center" }}>
          <div aria-hidden style={{ width: 36, height: 4, background: "var(--border-strong)", borderRadius: 99, display: "inline-block" }} />
        </div>
        <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>{title}</h2>
        <label style={labelStyle}>Nama Akun</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="Contoh: BCA, Dana, OVO..."
          style={{ ...inputStyle, borderColor: error ? "var(--expense)" : "var(--border-strong)" }}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
        />
        {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--expense)" }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: "var(--bg-muted)", color: "var(--text-secondary)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 500 }}>
            Batal
          </button>
          <button onClick={handleSave} style={{ flex: 2, padding: 12, background: "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 700 }}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ACCOUNT ROW ──────────────────────────────────────────────

function AccountRow({
  account,
  onEdit,
  onDelete,
  canDelete,
}: {
  account: Account;
  onEdit: (a: Account) => void;
  onDelete: (a: Account) => void;
  canDelete: boolean;
}) {
  const isMain = account.type === "main";
  return (
    <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        background: isMain ? "var(--accent-muted)" : "var(--transfer-bg)",
        border: `1px solid ${isMain ? "rgba(0,212,170,0.2)" : "rgba(129,140,248,0.2)"}`,
      }}>
        {isMain ? "💳" : "🏦"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {account.name}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: isMain ? "var(--accent)" : "var(--transfer)" }}>
          {isMain ? "Akun Utama" : "Tabungan"}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(account)}
          style={{ padding: "7px 14px", background: "var(--bg-muted)", color: "var(--text-secondary)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500 }}
        >
          Edit
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(account)}
            style={{ padding: "7px 14px", background: "var(--expense-bg)", color: "var(--expense)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500 }}
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}

// ── MAIN VIEW ────────────────────────────────────────────────

export function AccountView() {
  const { toast } = useToast();
  const { confirm, modalProps: confirmModalProps } = useConfirmModal();
  const { show: showInfo, modalProps: infoModalProps } = useModal();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [userName, setUserName] = useState("Pengguna");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

  const importRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    const [accs, settings] = await Promise.all([getAllAccounts(), getUserSettings()]);
    setAccounts(accs);
    setUserName(settings.name);
    setNameInput(settings.name);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── User name ──

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await updateUserSettings({ name: trimmed });
    setUserName(trimmed);
    setEditingName(false);
    toast("Nama diperbarui", "success");
  };

  // ── Account CRUD ──

  const handleAddAccount = () => {
    setEditingAccount(undefined);
    setSheetOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setSheetOpen(true);
  };

  const handleSaveAccount = async (name: string) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, { name });
      toast("Akun diperbarui", "success");
    } else {
      await addAccount({
        id: generateId("acc"),
        name,
        type: "savings",
        createdAt: new Date().toISOString(),
      });
      toast("Akun tabungan ditambahkan", "success");
    }
    loadData();
  };

  const handleDeleteAccount = (account: Account) => {
    confirm({
      title: "Hapus Akun?",
      description: `Akun "${account.name}" akan dihapus. Pastikan tidak ada transaksi aktif di akun ini.`,
      confirmLabel: "Ya, Hapus",
      onConfirm: async () => {
        await deleteAccount(account.id);
        toast("Akun dihapus", "info");
        loadData();
      },
    });
  };

  // ── Export ──

  const handleExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mayla-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Data berhasil diekspor", "success");
  };

  // ── Import ──

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !Array.isArray(data.transactions)) {
        throw new Error("Format tidak valid");
      }

      confirm({
        title: "Import Data?",
        description: "Data yang ada akan diganti dengan data dari file ini. Tindakan ini tidak bisa dibatalkan.",
        confirmLabel: "Ya, Import",
        onConfirm: async () => {
          await importAllData(data);
          await loadData();
          toast("Data berhasil diimpor", "success");
        },
      });
    } catch {
      showInfo({
        title: "Gagal Import",
        description: "File tidak valid atau rusak. Pastikan file adalah backup JSON dari Mayla.",
        variant: "error",
      });
    }
  };

  // ── Reset ──

  const handleReset = () => {
    confirm({
      title: "Reset Semua Data?",
      description: "SEMUA transaksi, akun, dan tabungan akan dihapus permanen. Data tidak dapat dipulihkan.",
      confirmLabel: "Ya, Reset Semua",
      onConfirm: async () => {
        const { db } = await import("@/lib/db/database");
        await Promise.all([
          db.transactions.clear(),
          db.savingsGoals.clear(),
        ]);
        // Keep accounts/categories/settings — only clear user data
        await loadData();
        toast("Data transaksi direset", "info");
      },
    });
  };

  const mainAccounts = accounts.filter((a) => a.type === "main");
  const savingsAccounts = accounts.filter((a) => a.type === "savings");

  return (
    <>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>

        {/* ── USER PROFILE ── */}
        <div
          className="card"
          style={{
            padding: "20px",
            marginBottom: 24,
            background: "linear-gradient(135deg, #0e1f3b 0%, #0d1526 100%)",
            borderColor: "rgba(0,212,170,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--accent-muted)", border: "2px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              👤
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    style={{ ...inputStyle, padding: "8px 12px", fontSize: 14, flex: 1 }}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                  />
                  <button onClick={handleSaveName} style={{ padding: "8px 14px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700 }}>✓</button>
                </div>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{userName}</p>
                  <button onClick={() => setEditingName(true)} style={{ background: "none", border: "none", padding: 0, color: "var(--accent)", fontSize: 12, cursor: "pointer", marginTop: 2 }}>
                    ✎ Ubah nama
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN ACCOUNTS ── */}
        <p style={sectionTitle}>Akun Utama</p>
        {mainAccounts.map((acc) => (
          <AccountRow
            key={acc.id}
            account={acc}
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
            canDelete={false}
          />
        ))}

        {/* ── SAVINGS ACCOUNTS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 12 }}>
          <p style={{ ...sectionTitle, margin: 0 }}>Akun Tabungan</p>
          <button
            onClick={handleAddAccount}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", background: "var(--accent-muted)",
              color: "var(--accent)", border: "1px solid var(--accent)",
              borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600,
            }}
          >
            + Tambah
          </button>
        </div>

        {savingsAccounts.length === 0 ? (
          <div className="card" style={{ padding: "20px", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--text-muted)" }}>
              Belum ada akun tabungan
            </p>
            <button
              onClick={handleAddAccount}
              style={{ fontSize: 13, color: "var(--accent)", background: "none", border: "none", fontWeight: 600, cursor: "pointer" }}
            >
              + Tambah Tabungan Pertama
            </button>
          </div>
        ) : (
          savingsAccounts.map((acc) => (
            <AccountRow
              key={acc.id}
              account={acc}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
              canDelete
            />
          ))
        )}

        {/* ── DATA MANAGEMENT ── */}
        <p style={{ ...sectionTitle, marginTop: 28 }}>Kelola Data</p>
        <div className="card" style={{ overflow: "hidden", marginBottom: 24 }}>
          {/* Export */}
          <button
            onClick={handleExport}
            style={{
              width: "100%", padding: "15px 16px",
              display: "flex", alignItems: "center", gap: 12,
              background: "transparent", borderBottom: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <span style={{ fontSize: 20 }}>📤</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Export JSON</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Simpan semua data ke file backup</p>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: 18 }}>›</span>
          </button>

          {/* Import */}
          <button
            onClick={() => importRef.current?.click()}
            style={{
              width: "100%", padding: "15px 16px",
              display: "flex", alignItems: "center", gap: 12,
              background: "transparent", borderBottom: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <span style={{ fontSize: 20 }}>📥</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Import JSON</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Pulihkan data dari file backup</p>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: 18 }}>›</span>
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImportFile} />

          {/* Reset */}
          <button
            onClick={handleReset}
            style={{
              width: "100%", padding: "15px 16px",
              display: "flex", alignItems: "center", gap: 12,
              background: "transparent",
              color: "var(--expense)",
            }}
          >
            <span style={{ fontSize: 20 }}>🗑️</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Reset Data Transaksi</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Hapus semua transaksi (tidak bisa dibatalkan)</p>
            </div>
            <span style={{ color: "var(--expense)", fontSize: 18 }}>›</span>
          </button>
        </div>

        {/* Version */}
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
          Mayla Financial Tracker v1.0
        </p>
      </div>

      {/* Account sheet */}
      <AccountSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initial={editingAccount}
        onSave={handleSaveAccount}
        title={editingAccount ? "Edit Akun" : "Tambah Akun Tabungan"}
      />

      {/* Modals */}
      {confirmModalProps && <Modal {...confirmModalProps} />}
      {infoModalProps && <Modal {...infoModalProps} />}
    </>
  );
}
