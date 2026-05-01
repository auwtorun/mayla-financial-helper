"use client";

import { useState, useEffect, useCallback } from "react";
import { getFilteredTransactions, getAllCategories, getAllAccounts } from "@/lib/db/queries";
import { formatCurrencyCompact, getTodayISO } from "@/lib/utils/calculations";
import type { Transaction, Category, Account, TransactionFilter } from "@/types";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

// ── INPUT STYLES ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
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

// ── TRANSACTION ROW ──────────────────────────────────────────

function HistoryRow({ txn }: { txn: Transaction }) {
  const isIncome = txn.type === "income";
  const isTransfer = txn.type === "transfer";
  const sign = isIncome ? "+" : isTransfer ? "" : "-";
  const colorClass = isIncome ? "text-income" : isTransfer ? "text-transfer" : "text-expense";

  return (
    <Link
      href={`/transaction/${txn.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        textDecoration: "none",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isIncome ? "var(--income-bg)" : isTransfer ? "var(--transfer-bg)" : "var(--expense-bg)",
          flexShrink: 0,
          fontSize: 16,
        }}
      >
        {isIncome ? "↑" : isTransfer ? "⇄" : "↓"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {txn.category}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {txn.note || "—"}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p className={colorClass} style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          {sign}Rp {formatCurrencyCompact(txn.amount)}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
          {format(parseISO(txn.date), "d MMM yyyy", { locale: id })}
        </p>
      </div>
    </Link>
  );
}

// ── MAIN VIEW ────────────────────────────────────────────────

export function HistoryView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  // Filter state
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(getTodayISO());
  const [categoryFilter, setCategoryFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    const filter: TransactionFilter = {
      keyword: keyword || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      category: categoryFilter || undefined,
      accountId: accountFilter || undefined,
    };
    const txns = await getFilteredTransactions(filter, 100);
    setTransactions(txns);
    setIsLoading(false);
  }, [keyword, startDate, endDate, categoryFilter, accountFilter]);

  useEffect(() => {
    getAllCategories().then(setCategories);
    getAllAccounts().then(setAccounts);
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 300); // debounce
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>
      <h1 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 700 }}>Riwayat</h1>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 16 }}>🔍</span>
        <input
          type="text"
          placeholder="Cari catatan atau kategori..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 36 }}
        />
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setShowFilter((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: showFilter ? "var(--accent-muted)" : "var(--bg-muted)",
          border: `1px solid ${showFilter ? "var(--accent)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "8px 14px",
          color: showFilter ? "var(--accent)" : "var(--text-secondary)",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 16,
        }}
      >
        ⚙ Filter {showFilter ? "▲" : "▼"}
      </button>

      {/* Filter panel */}
      {showFilter && (
        <div
          className="card animate-in"
          style={{ padding: 16, marginBottom: 16, display: "grid", gap: 10 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>DARI</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>SAMPAI</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>KATEGORI</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>AKUN</label>
            <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} style={selectStyle}>
              <option value="">Semua Akun</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
          Memuat...
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>📭</p>
          <p style={{ fontSize: 14, margin: 0 }}>Tidak ada transaksi ditemukan</p>
        </div>
      ) : (
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-muted)" }}>
            {transactions.length} transaksi
          </p>
          {transactions.map((txn) => (
            <HistoryRow key={txn.id} txn={txn} />
          ))}
        </div>
      )}
    </div>
  );
}
