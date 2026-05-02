"use client";

import { useDashboard } from "./useDashboard";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/calculations";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Transaction } from "@/types";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

// ── SKELETON ─────────────────────────────────────────────────

function Skeleton({ w, h }: { w?: number | string; h: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: w ?? "100%", height: h, borderRadius: 8, marginBottom: 4 }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ padding: "32px 20px 0" }}>
      <Skeleton w={120} h={14} />
      <Skeleton w={220} h={44} />
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Skeleton h={80} />
        <Skeleton h={80} />
      </div>
    </div>
  );
}

// ── TRANSACTION ROW ──────────────────────────────────────────

function TransactionRow({ txn }: { txn: Transaction }) {
  const isIncome = txn.type === "income";
  const isTransfer = txn.type === "transfer";
  const sign = isIncome ? "+" : isTransfer ? "" : "−";
  const color = isIncome ? "var(--income)" : isTransfer ? "var(--transfer)" : "var(--expense)";
  const bg = isIncome ? "var(--income-bg)" : isTransfer ? "var(--transfer-bg)" : "var(--expense-bg)";
  const glyph = isIncome ? "↑" : isTransfer ? "⇄" : "↓";

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
          width: 40, height: 40,
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: bg, flexShrink: 0, fontSize: 17,
        }}
      >
        {glyph}
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
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color }}>
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

function AccountCard({ name, balance, type }: { name: string; balance: number; type: string }) {
  const isSavings = type === "savings";
  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        minWidth: 160,
        flexShrink: 0,
        borderColor: isSavings ? "rgba(129, 140, 248, 0.25)" : "var(--border)",
      }}
    >
      <p style={{
        margin: 0, fontSize: 10, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
        color: isSavings ? "var(--transfer)" : "var(--text-muted)",
      }}>
        {isSavings ? "🏦 Tabungan" : "💳 Utama"}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
        {formatCurrencyCompact(balance)}
      </p>
    </div>
  );
}

// ── SUMMARY CARD ─────────────────────────────────────────────

function SummaryCard({ label, amount, color, prefix }: {
  label: string; amount: number; color: string; prefix: string;
}) {
  return (
    <div className="card" style={{ padding: "14px 16px", borderColor: `${color}33` }}>
      <p style={{ margin: 0, fontSize: 10, color, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
        {prefix}{formatCurrencyCompact(amount)}
      </p>
    </div>
  );
}

// ── MAIN VIEW ────────────────────────────────────────────────

export function DashboardView() {
  const { accounts, totalBalance, monthlySummary, recentTransactions, isLoading } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  const now = new Date();
  const monthLabel = format(now, "MMMM yyyy", { locale: id });
  const hasTransactions = recentTransactions.length > 0;
  const hasActivity = monthlySummary.totalIncome > 0 || monthlySummary.totalExpense > 0;

  return (
    <div className="animate-in" style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #0e1f3b 0%, #081428 100%)",
        padding: "32px 20px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200,
          background: "var(--accent-glow)",
          borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
        }} />
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
          Total Saldo
        </p>
        <p style={{ margin: "8px 0 4px", fontSize: 36, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          {formatCurrency(totalBalance)}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--accent)" }}>
          {accounts.length} akun aktif
        </p>
      </div>

      {/* ── ACCOUNT CARDS ── */}
      {accounts.length > 0 && (
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {accounts.map((acc) => (
              <AccountCard key={acc.id} name={acc.name} balance={acc.balance} type={acc.type} />
            ))}
          </div>
        </div>
      )}

      {/* ── MONTHLY SUMMARY ── */}
      <div style={{ padding: "20px 20px 0" }}>
        <p style={{ margin: "0 0 12px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
          {monthLabel}
        </p>
        {hasActivity ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <SummaryCard label="↑ Pemasukan" amount={monthlySummary.totalIncome} color="var(--income)" prefix="" />
            <SummaryCard label="↓ Pengeluaran" amount={monthlySummary.totalExpense} color="var(--expense)" prefix="" />
          </div>
        ) : (
          <div className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Belum ada transaksi bulan ini
            </p>
            <Link href="/transaction/add" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              + Tambah transaksi pertama
            </Link>
          </div>
        )}
      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
            Transaksi Terbaru
          </p>
          {hasTransactions && (
            <Link href="/history" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
              Lihat semua →
            </Link>
          )}
        </div>

        {hasTransactions ? (
          recentTransactions.map((txn) => (
            <TransactionRow key={txn.id} txn={txn} />
          ))
        ) : (
          <EmptyState
            icon="📋"
            title="Belum ada transaksi"
            description="Catat pemasukan atau pengeluaran pertama kamu untuk mulai melacak keuangan."
            actionLabel="+ Tambah Transaksi"
            actionHref="/transaction/add"
          />
        )}
      </div>
    </div>
  );
}
