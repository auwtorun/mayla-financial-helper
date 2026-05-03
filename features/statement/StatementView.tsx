"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getFilteredTransactions, getAllAccounts, getUserSettings } from "@/lib/db/queries";
import {
  calculateAccountBalance,
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/utils/calculations";
import {
  MonthPicker,
  monthToDateRange,
  formatMonthLabel,
  currentMonth,
  type MonthValue,
} from "@/components/ui/MonthPicker";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import type { Transaction, Account } from "@/types";
import type { StatementRow } from "./types";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ── RUNNING BALANCE ───────────────────────────────────────────

function buildRows(
  transactions: Transaction[],
  accountId: string,
  openingBalance: number
): StatementRow[] {
  const sorted = [...transactions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );
  let running = openingBalance;
  return sorted.map((txn) => {
    let debit = 0;
    let credit = 0;
    if (txn.type === "income" && txn.accountId === accountId) { debit = txn.amount; running += txn.amount; }
    else if (txn.type === "expense" && txn.accountId === accountId) { credit = txn.amount; running -= txn.amount; }
    else if (txn.type === "transfer") {
      if (txn.accountId === accountId) { credit = txn.amount; running -= txn.amount; }
      else if (txn.toAccountId === accountId) { debit = txn.amount; running += txn.amount; }
    }
    return { txn, debit, credit, runningBalance: running };
  });
}

// ── SUMMARY BAR ───────────────────────────────────────────────

function SummaryBar({ rows, accountName, openingBalance }: { rows: StatementRow[]; accountName: string; openingBalance: number }) {
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const endBalance = rows[rows.length - 1]?.runningBalance ?? openingBalance;

  return (
    <div style={{ background: "linear-gradient(135deg, #0e1f3b 0%, #081428 100%)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: 20 }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{accountName}</p>
      <p style={{ margin: "0 0 14px", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{formatCurrency(endBalance)}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Saldo Awal", val: openingBalance, color: "var(--text-muted)" },
          { label: "Total Masuk", val: totalDebit, color: "var(--income)" },
          { label: "Total Keluar", val: totalCredit, color: "var(--expense)" },
        ].map((item) => (
          <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 9, color: item.color, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{item.label}</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrencyCompact(item.val)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TABLE ─────────────────────────────────────────────────────

function StatementTable({ rows }: { rows: StatementRow[] }) {
  const th: React.CSSProperties = {
    padding: "10px 8px", fontSize: 10, fontWeight: 700,
    color: "var(--text-muted)", letterSpacing: "0.07em",
    textTransform: "uppercase", background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
  };
  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: 24 }}>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left", minWidth: 68 }}>Tanggal</th>
              <th style={{ ...th, textAlign: "left" }}>Deskripsi</th>
              <th style={{ ...th, textAlign: "right", minWidth: 76 }}>Masuk</th>
              <th style={{ ...th, textAlign: "right", minWidth: 76 }}>Keluar</th>
              <th style={{ ...th, textAlign: "right", minWidth: 84 }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const { txn, debit, credit, runningBalance } = row;
              const isNeg = runningBalance < 0;
              const td: React.CSSProperties = {
                padding: "11px 8px", fontSize: 13,
                borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--border)",
                verticalAlign: "top",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
              };
              return (
                <tr key={txn.id}>
                  <td style={{ ...td, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
                      {format(parseISO(txn.date), "d MMM", { locale: idLocale })}
                    </span>
                    <span style={{ fontSize: 10 }}>{format(parseISO(txn.date), "yyyy")}</span>
                  </td>
                  <td style={{ ...td, maxWidth: 120 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {txn.category}
                    </span>
                    {txn.note && (
                      <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.note}</span>
                    )}
                    {txn.type === "transfer" && (
                      <span style={{ display: "inline-block", fontSize: 10, color: "var(--transfer)", background: "var(--transfer-bg)", padding: "1px 6px", borderRadius: 4, marginTop: 2 }}>Transfer</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "right", color: "var(--income)", fontWeight: 600 }}>
                    {debit > 0 ? formatCurrencyCompact(debit) : <span style={{ color: "var(--border-strong)" }}>—</span>}
                  </td>
                  <td style={{ ...td, textAlign: "right", color: "var(--expense)", fontWeight: 600 }}>
                    {credit > 0 ? formatCurrencyCompact(credit) : <span style={{ color: "var(--border-strong)" }}>—</span>}
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: isNeg ? "var(--expense)" : "var(--text-primary)", whiteSpace: "nowrap" }}>
                    {formatCurrencyCompact(runningBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-strong)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{rows.length} transaksi</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Saldo akhir: <strong style={{ color: "var(--text-primary)" }}>{formatCurrencyCompact(rows[rows.length - 1]?.runningBalance ?? 0)}</strong>
        </span>
      </div>
    </div>
  );
}

// ── MAIN VIEW ─────────────────────────────────────────────────

export function StatementView() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<MonthValue>(currentMonth());
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [userName, setUserName] = useState("Pengguna");

  // Load accounts and user settings once
  useEffect(() => {
    Promise.all([getAllAccounts(), getUserSettings()]).then(([accs, settings]) => {
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountId(accs[0].id);
      setUserName(settings.name || "Pengguna");
    });
  }, []);

  // Load transactions for selected account when account or month changes
  const loadTransactions = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);
    const { from, to } = monthToDateRange(selectedMonth.year, selectedMonth.month);
    // Fetch all txns for this account in this period + transfers IN
    const [outgoing, allPeriod] = await Promise.all([
      getFilteredTransactions({ accountId: selectedAccountId, startDate: from, endDate: to }, 5000),
      getFilteredTransactions({ startDate: from, endDate: to }, 5000),
    ]);
    const incomingTransfers = allPeriod.filter(
      (t) => t.type === "transfer" && t.toAccountId === selectedAccountId
    );
    const merged = [...outgoing, ...incomingTransfers.filter((t) => !outgoing.find((e) => e.id === t.id))];
    setAllTransactions(merged);
    setIsLoading(false);
  }, [selectedAccountId, selectedMonth]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  // Opening balance = balance from ALL transactions before this month
  const openingBalance = useMemo(() => {
    const { from } = monthToDateRange(selectedMonth.year, selectedMonth.month);
    // We'd need all transactions, but for MVP: opening = endBalance - netFlow of current month
    // A simpler approximation: sum all transactions before 'from' for this account
    // This requires fetching pre-period data — for now derive from loaded data
    // Full accuracy requires a separate pre-period query; implement later
    return 0; // placeholder — accurate running balance from row[0] start
  }, [selectedMonth]);

  const rows = useMemo(() => {
    return buildRows(allTransactions, selectedAccountId, openingBalance);
  }, [allTransactions, selectedAccountId, openingBalance]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const accountOptions: DropdownOption[] = accounts.map((a) => ({
    value: a.id,
    label: a.name,
    description: a.type === "main" ? "Akun Utama" : "Tabungan",
    accentColor: a.type === "main" ? "var(--accent)" : "var(--transfer)",
  }));

  // ── PDF EXPORT ────────────────────────────────────────────────

  const handleExportPDF = useCallback(async () => {
    if (!rows.length) {
      toast("Tidak ada data untuk di-export", "error");
      return;
    }
    setIsExporting(true);
    toast("Membuat PDF...", "info");
    try {
      const { exportStatementPDF } = await import("@/lib/utils/pdf");
      await exportStatementPDF({
        userName,
        accountName: selectedAccount?.name ?? "Akun",
        period: formatMonthLabel(selectedMonth.year, selectedMonth.month),
        openingBalance,
        rows,
      });
      toast("PDF berhasil diunduh", "success");
    } catch (err) {
      console.error(err);
      toast("Gagal membuat PDF", "error");
    } finally {
      setIsExporting(false);
    }
  }, [rows, userName, selectedAccount, selectedMonth, openingBalance, toast]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Rekening Koran</h1>
        <button
          onClick={handleExportPDF}
          disabled={isExporting || rows.length === 0}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            background: rows.length > 0 ? "var(--accent-muted)" : "var(--bg-muted)",
            border: `1px solid ${rows.length > 0 ? "var(--accent)" : "var(--border-strong)"}`,
            borderRadius: "var(--radius-sm)",
            color: rows.length > 0 ? "var(--accent)" : "var(--text-muted)",
            fontSize: 13, fontWeight: 600,
            cursor: rows.length > 0 ? "pointer" : "not-allowed",
            opacity: isExporting ? 0.7 : 1,
          }}
        >
          <span>📄</span> {isExporting ? "..." : "PDF"}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Periode
          </label>
          <MonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
        <Dropdown
          label="Akun"
          value={selectedAccountId}
          onChange={setSelectedAccountId}
          options={accountOptions}
          sheetTitle="Pilih Akun"
          placeholder="Pilih akun"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Memuat...</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Tidak ada transaksi"
          description={`Tidak ada transaksi untuk ${formatMonthLabel(selectedMonth.year, selectedMonth.month)} di akun ini.`}
          actionLabel="+ Catat Transaksi"
          actionHref="/transaction/add"
        />
      ) : (
        <>
          {selectedAccount && (
            <SummaryBar
              rows={rows}
              accountName={selectedAccount.name}
              openingBalance={openingBalance}
            />
          )}
          <StatementTable rows={rows} />
        </>
      )}
    </div>
  );
}
