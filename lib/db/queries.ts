/**
 * DATA ACCESS LAYER
 * All Dexie queries live here. Features import from this file only.
 * Business logic stays separate (lib/utils/calculations.ts).
 */

import { db } from "./database";
import type {
  Transaction,
  Account,
  Category,
  SavingsGoal,
  TransactionFilter,
  UserSettings,
} from "@/types";

// ── TRANSACTIONS ────────────────────────────────────────────

export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
  return db.transactions.orderBy("createdAt").reverse().limit(limit).toArray();
}

export async function getTransactionsByMonth(
  year: number,
  month: number // 0-indexed
): Promise<Transaction[]> {
  const start = new Date(year, month, 1).toISOString().split("T")[0];
  const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
  return db.transactions
    .where("date")
    .between(start, end, true, true)
    .toArray();
}

export async function getFilteredTransactions(
  filter: TransactionFilter,
  limit = 50,
  offset = 0
): Promise<Transaction[]> {
  let collection = db.transactions.orderBy("date").reverse();

  // Apply indexed filters first (fast)
  if (filter.accountId) {
    collection = db.transactions
      .where("accountId")
      .equals(filter.accountId)
      .reverse();
  }

  // Then filter in-memory for non-indexed fields
  const results = await collection
    .filter((txn) => {
      if (filter.startDate && txn.date < filter.startDate) return false;
      if (filter.endDate && txn.date > filter.endDate) return false;
      if (filter.category && txn.category !== filter.category) return false;
      if (filter.type && txn.type !== filter.type) return false;
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        if (
          !txn.note.toLowerCase().includes(kw) &&
          !txn.category.toLowerCase().includes(kw)
        )
          return false;
      }
      return true;
    })
    .offset(offset)
    .limit(limit)
    .toArray();

  return results;
}

export async function getTransactionById(
  id: string
): Promise<Transaction | undefined> {
  return db.transactions.get(id);
}

export async function addTransaction(
  txn: Transaction
): Promise<string> {
  return db.transactions.add(txn);
}

export async function updateTransaction(
  id: string,
  changes: Partial<Transaction>
): Promise<number> {
  return db.transactions.update(id, changes);
}

export async function deleteTransaction(id: string): Promise<void> {
  return db.transactions.delete(id);
}

// ── ACCOUNTS ────────────────────────────────────────────────

export async function getAllAccounts(): Promise<Account[]> {
  return db.accounts.orderBy("createdAt").toArray();
}

export async function getAccountById(
  id: string
): Promise<Account | undefined> {
  return db.accounts.get(id);
}

export async function addAccount(account: Account): Promise<string> {
  return db.accounts.add(account);
}

export async function updateAccount(
  id: string,
  changes: Partial<Account>
): Promise<number> {
  return db.accounts.update(id, changes);
}

export async function deleteAccount(id: string): Promise<void> {
  return db.accounts.delete(id);
}

// ── CATEGORIES ──────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  return db.categories.toArray();
}

export async function getCategoriesByType(
  type: "income" | "expense"
): Promise<Category[]> {
  return db.categories.where("type").equals(type).toArray();
}

// ── SAVINGS GOALS ───────────────────────────────────────────

export async function getAllSavingsGoals(): Promise<SavingsGoal[]> {
  return db.savingsGoals.toArray();
}

export async function addSavingsGoal(goal: SavingsGoal): Promise<string> {
  return db.savingsGoals.add(goal);
}

export async function updateSavingsGoal(
  id: string,
  changes: Partial<SavingsGoal>
): Promise<number> {
  return db.savingsGoals.update(id, changes);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  return db.savingsGoals.delete(id);
}

// ── SETTINGS ────────────────────────────────────────────────

export async function getUserSettings(): Promise<UserSettings> {
  const s = await db.settings.get("user");
  return s ?? { name: "Pengguna", currency: "IDR" };
}

export async function updateUserSettings(
  changes: Partial<UserSettings>
): Promise<number> {
  return db.settings.update("user", changes);
}

// ── EXPORT / IMPORT ─────────────────────────────────────────

export async function exportAllData() {
  const [transactions, accounts, categories, savingsGoals, settingsRaw] =
    await Promise.all([
      db.transactions.toArray(),
      db.accounts.toArray(),
      db.categories.toArray(),
      db.savingsGoals.toArray(),
      db.settings.toArray(),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    accounts,
    categories,
    savingsGoals,
    settings: settingsRaw[0] ?? null,
  };
}

export async function importAllData(data: ReturnType<typeof exportAllData> extends Promise<infer T> ? T : never) {
  await db.transaction(
    "rw",
    [db.transactions, db.accounts, db.categories, db.savingsGoals, db.settings],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.accounts.clear(),
        db.categories.clear(),
        db.savingsGoals.clear(),
        db.settings.clear(),
      ]);

      await Promise.all([
        db.transactions.bulkAdd(data.transactions),
        db.accounts.bulkAdd(data.accounts),
        db.categories.bulkAdd(data.categories),
        db.savingsGoals.bulkAdd(data.savingsGoals),
        data.settings ? db.settings.add(data.settings) : Promise.resolve(),
      ]);
    }
  );
}
