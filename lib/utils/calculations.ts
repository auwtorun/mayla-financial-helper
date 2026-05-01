/**
 * BUSINESS LOGIC — pure functions only, zero side effects.
 * Never import from /lib/db here. Keep this layer testable.
 */

import type { Transaction, Account, MonthlySummary } from "@/types";

// ── BALANCE CALCULATION ──────────────────────────────────────

/**
 * Calculate the current balance of an account from its transactions.
 * Transfer is NOT counted as income or expense.
 */
export function calculateAccountBalance(
  accountId: string,
  transactions: Transaction[]
): number {
  return transactions.reduce((balance, txn) => {
    if (txn.type === "transfer") {
      if (txn.accountId === accountId) return balance - txn.amount; // outgoing
      if (txn.toAccountId === accountId) return balance + txn.amount; // incoming
      return balance;
    }
    if (txn.accountId !== accountId) return balance;
    return txn.type === "income"
      ? balance + txn.amount
      : balance - txn.amount;
  }, 0);
}

/**
 * Calculate total balance across all accounts.
 */
export function calculateTotalBalance(
  accounts: Account[],
  transactions: Transaction[]
): number {
  return accounts.reduce(
    (total, acc) => total + calculateAccountBalance(acc.id, transactions),
    0
  );
}

// ── MONTHLY SUMMARY ─────────────────────────────────────────

/**
 * Summarize income/expense for a given month's transactions.
 * Ignores transfers.
 */
export function calculateMonthlySummary(
  transactions: Transaction[]
): MonthlySummary {
  const summary = transactions.reduce(
    (acc, txn) => {
      if (txn.type === "income") acc.totalIncome += txn.amount;
      if (txn.type === "expense") acc.totalExpense += txn.amount;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 }
  );

  return {
    ...summary,
    netFlow: summary.totalIncome - summary.totalExpense,
  };
}

// ── FORMATTING ──────────────────────────────────────────────

/**
 * Format a number as IDR currency.
 * e.g. 8000000 → "Rp 8.000.000"
 */
export function formatCurrency(
  amount: number,
  currency = "IDR",
  locale = "id-ID"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Short currency format for tight spaces.
 * e.g. 8000000 → "8 Jt" | 1500000 → "1,5 Jt" | 250000 → "250 Rb"
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} Rb`;
  }
  return amount.toString();
}

// ── ID GENERATION ───────────────────────────────────────────

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── DATE UTILS ──────────────────────────────────────────────

export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { start, end };
}

// ── VALIDATION ──────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validateTransaction(data: {
  amount: number | string;
  category: string;
  date: string;
  accountId: string;
  type: string;
  toAccountId?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  const amount = Number(data.amount);

  if (!amount || amount <= 0) {
    errors.push({ field: "amount", message: "Nominal harus lebih dari 0" });
  }
  if (!data.category) {
    errors.push({ field: "category", message: "Kategori wajib diisi" });
  }
  if (!data.date) {
    errors.push({ field: "date", message: "Tanggal wajib diisi" });
  }
  if (!data.accountId) {
    errors.push({ field: "accountId", message: "Akun wajib dipilih" });
  }
  if (
    data.type === "transfer" &&
    data.toAccountId &&
    data.toAccountId === data.accountId
  ) {
    errors.push({
      field: "toAccountId",
      message: "Akun tujuan harus berbeda",
    });
  }

  return errors;
}
