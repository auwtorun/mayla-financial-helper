// ============================================================
// CORE DOMAIN TYPES — Mayla Financial Tracker
// ============================================================

export type TransactionType = "income" | "expense" | "transfer";
export type AccountType = "main" | "savings";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date string YYYY-MM-DD
  accountId: string;
  toAccountId?: string; // for transfer only
  createdAt: string; // ISO datetime
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  accountId: string;
  createdAt: string;
}

export interface UserSettings {
  name: string;
  currency: string; // e.g. "IDR"
}

// ============================================================
// DERIVED / VIEW TYPES
// ============================================================

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
}

// ============================================================
// FILTER TYPES — for history & queries
// ============================================================

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  accountId?: string;
  keyword?: string;
  type?: TransactionType;
}

// ============================================================
// FORM TYPES — input shapes before validation
// ============================================================

export type TransactionFormData = Omit<Transaction, "id" | "createdAt">;
export type AccountFormData = Omit<Account, "id" | "createdAt">;
export type SavingsGoalFormData = Omit<SavingsGoal, "id" | "createdAt">;
