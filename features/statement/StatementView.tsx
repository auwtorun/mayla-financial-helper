"use client";

/**
 * REKENING KORAN — Bank Statement View
 *
 * Displays transactions in bank-statement style with running balance.
 * Columns: Tanggal | Deskripsi | Debit | Kredit | Saldo
 *
 * Architecture note: PDF export hook is pre-wired (returns null for now).
 * When iteration adds PDF, replace `exportToPDF` stub in useStatement.ts
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getFilteredTransactions,
  getAllAccounts,
} from "@/lib/db/queries";
import {
  calculateAccountBalance,
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/utils/calculations";
import { RangeDatePicker, type DateRangeValue } from "@/components/ui/DatePicker";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import type { Transaction, Account } from "@/types";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ── TYPES ────────────────────────────────────────────────────

interface StatementRow {
  txn: Transaction;
  debit: number;   // income into this account
  credit: number;  // expense / transfer out
  runningBalance: number;
}

// ── RUNNING BALANCE CALC ─────────────────────────────────────

function buildStatementRows(
  transactions: Transaction[],
  accountId: string,
  openingBalance: number
): StatementRow[] {
  // Sort ascending by date for running balance
  const sorted = [...transactions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );

  let running = openingBalance;
  return sorted.map((txn) => {
    let debit = 0;
    let credit = 0;

    if (txn.type === "income" && txn.accountId === accountId) {
      debit = txn.amount;
      running += txn.amount;
    } else if (txn.type === "expense" && txn.accountId === accountId) {
      credit = txn.amount;
      running -= txn.amount;
    } else if (txn.type === "transfer") {
      if (txn.accountId === accountId) {
        credit = txn.amount;
        running -= txn.amount;
      } else if (txn.toAccountId === accountId) {
        debit = txn.amount;
        running += txn.amount;
      }
    }

    return { txn, debit, credit, runningBalance: running };
  });
}

// ── SUMMARY BAR ──────────────────────────────────────────────

function SummaryBar({
  rows,
  accountName,
}: {
  rows: StatementRow[];
  accountName: string;
}) {
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const endBalance = rows[rows.length - 1]?.runningBalance ?? 0;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0e1f3b 0%, #081428 100%)",
        border: "1px solid rgba(0,212,170,0.15)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      <p
        style={{
          margin: "0 0 4px",
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          fontWeight: 600,
        }}
      >
        {accountName}
      </p>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 26,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        {formatCurrency(endBalance)}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 12px",
          }}
        >
          <p
            style={{
              margin: "0 0 3px",
              fontSize: 10,
              color: "var(--income)",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            ↑ TOTAL MASUK
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            {formatCurrencyCompact(totalDebit)}
          </p>
        </div>
        <div
          style={{
            background: "rgba(244,63,94,0.08)",
            border: "1px solid rgba(244,63,94,0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 12px",
          }}
        >
          <p
            style={{
              margin: "0 0 3px",
              fontSize: 10,
              color: "var(--expense)",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            ↓ TOTAL KELUAR
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            {formatCurrencyCompact(totalCredit)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── TABLE HEADER ─────────────────────────────────────────────

function TableHeader() {
  const th: React.CSSProperties = {
    padding: "10px 8px",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--text-muted)",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border-strong)",
    whiteSpace: "nowrap",
  };

  return (
    <thead>
      <tr>
        <th style={{ ...th, textAlign: "left", minWidth: 72 }}>Tanggal</th>
        <th style={{ ...th, textAlign: "left" }}>Deskripsi</th>
        <th style={{ ...th, textAlign: "right", minWidth: 80 }}>Masuk</th>
        <th style={{ ...th, textAlign: "right", minWidth: 80 }}>Keluar</th>
        <th style={{ ...th, textAlign: "right", minWidth: 88 }}>Saldo</th>
      </tr>
    </thead>
  );
}

// ── TABLE ROW ─────────────────────────────────────────────────

function StatementTableRow({
  row,
  isLast,
}: {
  row: StatementRow;
  isLast: boolean;
}) {
  const { txn, debit, credit, runningBalance } = row;
  const isNegative = runningBalance < 0;

  const td: React.CSSProperties = {
    padding: "11px 8px",
    fontSize: 13,
    borderBottom: isLast ? "none" : "1px solid var(--border)",
    verticalAlign: "top",
  };

  return (
    <tr
      style={{
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background =
          "var(--bg-muted)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
      }}
    >
      {/* Date */}
      <td style={{ ...td, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        <span style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
          {format(parseISO(txn.date), "d MMM", { locale: idLocale })}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {format(parseISO(txn.date), "yyyy")}
        </span>
      </td>

      {/* Description */}
      <td style={{ ...td, maxWidth: 120, color: "var(--text-primary)" }}>
        <span
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {txn.category}
        </span>
        {txn.note && (
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 1,
            }}
          >
            {txn.note}
          </span>
        )}
        {txn.type === "transfer" && (
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              color: "var(--transfer)",
              background: "var(--transfer-bg)",
              padding: "1px 6px",
              borderRadius: 4,
              marginTop: 2,
            }}
          >
            Transfer
          </span>
        )}
      </td>

      {/* Debit (income) */}
      <td style={{ ...td, textAlign: "right", color: "var(--income)", fontWeight: 600 }}>
        {debit > 0 ? formatCurrencyCompact(debit) : (
          <span style={{ color: "var(--border-strong)" }}>—</span>
        )}
      </td>

      {/* Credit (expense/transfer out) */}
      <td style={{ ...td, textAlign: "right", color: "var(--expense)", fontWeight: 600 }}>
        {credit > 0 ? formatCurrencyCompact(credit) : (
          <span style={{ color: "var(--border-strong)" }}>—</span>
        )}
      </td>

      {/* Running balance */}
      <td
        style={{
          ...td,
          textAlign: "right",
          fontWeight: 700,
          color: isNegative ? "var(--expense)" : "var(--text-primary)",
          whiteSpace: "nowrap",
        }}
      >
        {formatCurrencyCompact(runningBalance)}
      </td>
    </tr>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────

function StatementEmpty() {
  return (
    <div
      style={{
        padding: "48px 0",
        textAlign: "center",
        color: "var(--text-muted)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          margin: "0 auto 12px",
        }}
      >
        🧾
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>
        Tidak ada transaksi
      </p>
      <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6, maxWidth: 240, marginInline: "auto" }}>
        Pilih akun dan rentang tanggal untuk melihat rekening koran
      </p>
    </div>
  );
}

// ── MAIN VIEW ─────────────────────────────────────────────────

export function StatementView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: "", to: "" });
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load accounts once
  useEffect(() => {
    getAllAccounts().then((accs) => {
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountId(accs[0].id);
    });
  }, []);

  // Load ALL transactions for selected account (needed for accurate running balance)
  const loadTransactions = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);
    // Fetch all txns touching this account (as sender or receiver)
    const txns = await getFilteredTransactions({ accountId: selectedAccountId }, 5000);
    // Also fetch transfers where this account is the toAccountId
    const incoming = await getFilteredTransactions({}, 5000);
    const incomingTransfers = incoming.filter(
      (t) => t.type === "transfer" && t.toAccountId === selectedAccountId
    );
    const merged = [
      ...txns,
      ...incomingTransfers.filter(
        (t) => !txns.find((e) => e.id === t.id)
      ),
    ];
    setAllTransactions(merged);
    setIsLoading(false);
  }, [selectedAccountId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Apply date filter for display, keep all txns for opening balance
  const filteredRows = useMemo(() => {
    const { from, to } = dateRange;

    // Pre-date-range txns → used only for opening balance
    const preTxns = (from || to)
      ? allTransactions.filter((t) => from ? t.date < from : false)
      : [];

    const openingBalance = calculateAccountBalance(
      selectedAccountId,
      preTxns
    );

    // Txns within range (or all if no range set)
    const visible = allTransactions.filter((t) => {
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    });

    return buildStatementRows(visible, selectedAccountId, openingBalance);
  }, [allTransactions, dateRange, selectedAccountId]);

  // Dropdown options
  const accountOptions: DropdownOption[] = accounts.map((a) => ({
    value: a.id,
    label: a.name,
    description: a.type === "main" ? "Akun Utama" : "Tabungan",
    accentColor: a.type === "main" ? "var(--accent)" : "var(--transfer)",
  }));

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Pre-wired PDF export hook — replace stub in next iteration
  // const { exportToPDF } = useStatementPDF(filteredRows, selectedAccount);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          Rekening Koran
        </h1>
        {/* PDF button — disabled until next iteration */}
        <button
          disabled
          title="PDF export akan hadir di iterasi berikutnya"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "var(--bg-muted)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "not-allowed",
            opacity: 0.5,
          }}
        >
          <span>📄</span> PDF
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <Dropdown
          label="Akun"
          value={selectedAccountId}
          onChange={setSelectedAccountId}
          options={accountOptions}
          sheetTitle="Pilih Akun"
          placeholder="Pilih akun"
        />
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
          <RangeDatePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Semua waktu"
          />
        </div>
      </div>

      {/* Summary */}
      {filteredRows.length > 0 && selectedAccount && (
        <SummaryBar
          rows={filteredRows}
          accountName={selectedAccount.name}
        />
      )}

      {/* Statement table */}
      {isLoading ? (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 14,
          }}
        >
          Memuat...
        </div>
      ) : filteredRows.length === 0 ? (
        <StatementEmpty />
      ) : (
        <div
          className="card"
          style={{ overflow: "hidden", marginBottom: 24 }}
        >
          {/* Horizontal scroll wrapper for table */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 420,
              }}
            >
              <TableHeader />
              <tbody>
                {filteredRows.map((row, i) => (
                  <StatementTableRow
                    key={row.txn.id}
                    row={row}
                    isLast={i === filteredRows.length - 1}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border-strong)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {filteredRows.length} transaksi
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Saldo akhir:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {formatCurrencyCompact(
                  filteredRows[filteredRows.length - 1]?.runningBalance ?? 0
                )}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
