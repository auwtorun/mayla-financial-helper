"use client";

import { useDashboard } from "./useDashboard";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/calculations";
import type { Transaction } from "@/types";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

// ── SKELETON ─────────────────────────────────────────────────

function BalanceSkeleton() {
  return (
    <div style={{ padding: "24px 20px 0" }}>
      <div className="skeleton" style={{ height: 16, width: 120, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 44, width: 220, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 14, width: 160 }} />
    </div>
  );
}

// ── TRANSACTION ROW ──────────────────────────────────────────

function TransactionRow({ txn }: { txn: Transaction }) {
  const isIncome = txn.type === "income";
  const isTransfer = txn.type === "transfer";
  const sign = isIncome ? "+" : isTransfer ? "" : "-";
  const colorClass = isIncome
    ? "text-income"
    : isTransfer
    ? "text-transfer"
    : "text-expense";

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
      {/* Icon pill */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isIncome
            ? "var(--income-bg)"
            : isTransfer
            ? "var(--transfer-bg)"
            : "var(--expense-bg)",
          flexShrink: 0,
          fontSize: 18,
        }}
      >
        {isIncome ? "↑" : isTransfer ? "⇄" : "↓"}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {txn.category}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 12,
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {txn.note || "—"}
        </p>
      </div>

      {/* Amount + date */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p
          className={colorClass}
          style={{ margin: 0, fontSize: 14, fontWeight: 600 }}
        >
          {sign}Rp {formatCurrencyCompact(txn.amount)}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
          {format(parseISO(txn.date), "d MMM", { locale: id })}
        </p>
      </div>
    </Link>
  );
}

// ── ACCOUNT CARD ─────────────────────────────────────────────

function AccountCard({
  name,
  balance,
  type,
}: {
  name: string;
  balance: number;
  type: string;
}) {
  const isSavings = type === "savings";
  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        minWidth: 160,
        flexShrink: 0,
        borderColor: isSavings ? "rgba(129, 140, 248, 0.2)" : "var(--border)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: isSavings ? "var(--transfer)" : "var(--text-muted)",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        {isSavings ? "💜 Tabungan" : "💳 Utama"}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: "var(--text-secondary)",
          marginBottom: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {formatCurrencyCompact(balance)}
      </p>
    </div>
  );
}

// ── MAIN VIEW ────────────────────────────────────────────────

export function DashboardView() {
  const { accounts, totalBalance, monthlySummary, recentTransactions, isLoading } =
    useDashboard();

  const now = new Date();
  const monthLabel = format(now, "MMMM yyyy", { locale: id });

  if (isLoading) {
    return <BalanceSkeleton />;
  }

  return (
    <div className="animate-in" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* ── HEADER BALANCE CARD ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0e1f3b 0%, #081428 100%)",
          padding: "32px 20px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            background: "var(--accent-glow)",
            borderRadius: "50%",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Total Saldo
        </p>
        <p
          style={{
            margin: "8px 0 4px",
            fontSize: 36,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {formatCurrency(totalBalance)}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--accent)" }}>
          {accounts.length} akun aktif
        </p>
      </div>

      {/* ── ACCOUNT CARDS ── */}
      {accounts.length > 0 && (
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "none",
            }}
          >
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                name={acc.name}
                balance={acc.balance}
                type={acc.type}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── MONTHLY SUMMARY ── */}
      <div style={{ padding: "20px 20px 0" }}>
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 12,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
        >
          {monthLabel}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Income */}
          <div
            className="card"
            style={{
              padding: "14px 16px",
              borderColor: "rgba(34, 197, 94, 0.2)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--income)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              ↑ PEMASUKAN
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {formatCurrencyCompact(monthlySummary.totalIncome)}
            </p>
          </div>

          {/* Expense */}
          <div
            className="card"
            style={{
              padding: "14px 16px",
              borderColor: "rgba(244, 63, 94, 0.2)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--expense)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              ↓ PENGELUARAN
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {formatCurrencyCompact(monthlySummary.totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div style={{ padding: "24px 20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            Transaksi Terbaru
          </p>
          <Link
            href="/history"
            style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}
          >
            Lihat semua →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            Belum ada transaksi.{" "}
            <Link
              href="/transaction/add"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              Tambah sekarang
            </Link>
          </div>
        ) : (
          <div>
            {recentTransactions.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
