"use client";

import { useMemo } from "react";
import { useDashboard } from "./useDashboard";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/calculations";
import { getGreeting, getGreetingEmoji } from "@/lib/utils/greeting";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Transaction } from "@/types";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

// ── SKELETON ──────────────────────────────────────────────────

function Skeleton({ w, h }: { w?: number | string; h: number }) {
  return <div className="skeleton" style={{ width: w ?? "100%", height: h, borderRadius: 8, marginBottom: 4 }} />;
}

function DashboardSkeleton() {
  return (
    <div style={{ padding: "32px 20px 0" }}>
      <Skeleton w={120} h={14} />
      <Skeleton w={220} h={44} />
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Skeleton h={80} /><Skeleton h={80} />
      </div>
      <div style={{ marginTop: 24 }}>
        <Skeleton h={56} /><Skeleton h={56} /><Skeleton h={56} />
      </div>
    </div>
  );
}

// ── TRANSACTION ROW ───────────────────────────────────────────

function TransactionRow({ txn }: { txn: Transaction }) {
  const isIncome = txn.type === "income";
  const isTransfer = txn.type === "transfer";
  const sign = isIncome ? "+" : isTransfer ? "" : "-";
  const color = isIncome ? "var(--income)" : isTransfer ? "var(--transfer)" : "var(--expense)";
  const iconBg = isIncome ? "var(--income-bg)" : isTransfer ? "var(--transfer-bg)" : "var(--expense-bg)";
  return (
    <Link href={`/transaction/${txn.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: iconBg, flexShrink: 0, fontSize: 17 }}>
        {isIncome ? "↑" : isTransfer ? "⇄" : "↓"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.category}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.note || "—"}</p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color }}>{sign}Rp {formatCurrencyCompact(txn.amount)}</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{format(parseISO(txn.date), "d MMM", { locale: id })}</p>
      </div>
    </Link>
  );
}

// ── ACCOUNT CARD ──────────────────────────────────────────────

function AccountCard({ name, balance, type }: { name: string; balance: number; type: string }) {
  const isSavings = type === "savings";
  return (
    <div className="card" style={{ padding: "14px 16px", minWidth: 160, flexShrink: 0, borderColor: isSavings ? "rgba(129,140,248,0.2)" : "var(--border)" }}>
      <p style={{ margin: "0 0 4px", fontSize: 10, color: isSavings ? "var(--transfer)" : "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {isSavings ? "💜 Tabungan" : "💳 Utama"}
      </p>
      <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrencyCompact(balance)}</p>
    </div>
  );
}

// ── MAIN VIEW ─────────────────────────────────────────────────

export function DashboardView() {
  const { accounts, totalBalance, monthlySummary, recentTransactions, userName, isLoading } = useDashboard();

  const greeting = useMemo(() => getGreeting(), []);
  const greetEmoji = useMemo(() => getGreetingEmoji(), []);
  const now = new Date();
  const monthLabel = format(now, "MMMM yyyy", { locale: id });
  const hasTransactions = recentTransactions.length > 0;
  const hasActivity = monthlySummary.totalIncome > 0 || monthlySummary.totalExpense > 0;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="animate-in" style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* ── HERO HEADER ── */}
      <div style={{ background: "linear-gradient(160deg, #0a1628 0%, #080c14 100%)", padding: "28px 20px 22px", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -60, right: -40, width: 220, height: 220, background: "radial-gradient(circle, rgba(0,212,170,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Greeting + quick-add */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", marginBottom: 3 }}>
              {greetEmoji} {greeting},
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {userName}
            </p>
          </div>
          <Link
            href="/transaction/add"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent-muted)", border: "1px solid var(--accent)", borderRadius: "var(--radius-sm)", color: "var(--accent)", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}
          >
            + Catat
          </Link>
        </div>

        {/* Total balance */}
        <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>Total Saldo</p>
        <p style={{ margin: "0 0 4px", fontSize: 34, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{formatCurrency(totalBalance)}</p>
        <p style={{ margin: 0, fontSize: 12, color: accounts.length > 0 ? "var(--accent)" : "var(--text-muted)" }}>{accounts.length} akun aktif</p>
      </div>

      {/* ── ACCOUNT CARDS ── */}
      {accounts.length > 0 && (
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {accounts.map((acc) => <AccountCard key={acc.id} name={acc.name} balance={acc.balance} type={acc.type} />)}
          </div>
        </div>
      )}

      {/* ── MONTHLY SUMMARY ── */}
      <div style={{ padding: "20px 20px 0" }}>
        <p style={{ margin: "0 0 10px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{monthLabel}</p>
        {hasActivity ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="card" style={{ padding: "14px 16px", borderColor: "rgba(34,197,94,0.2)" }}>
              <p style={{ margin: "0 0 5px", fontSize: 10, color: "var(--income)", fontWeight: 700, letterSpacing: "0.05em" }}>↑ PEMASUKAN</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{formatCurrencyCompact(monthlySummary.totalIncome)}</p>
            </div>
            <div className="card" style={{ padding: "14px 16px", borderColor: "rgba(244,63,94,0.2)" }}>
              <p style={{ margin: "0 0 5px", fontSize: 10, color: "var(--expense)", fontWeight: 700, letterSpacing: "0.05em" }}>↓ PENGELUARAN</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{formatCurrencyCompact(monthlySummary.totalExpense)}</p>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-muted)" }}>Belum ada aktivitas bulan ini</p>
            <Link href="/transaction/add" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>+ Tambah transaksi pertama</Link>
          </div>
        )}
      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Transaksi Terbaru</p>
          {hasTransactions && <Link href="/history" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Lihat semua →</Link>}
        </div>
        {hasTransactions ? (
          recentTransactions.map((txn) => <TransactionRow key={txn.id} txn={txn} />)
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
