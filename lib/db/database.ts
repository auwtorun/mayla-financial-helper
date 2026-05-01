import Dexie, { type Table } from "dexie";
import type {
  Transaction,
  Account,
  Category,
  SavingsGoal,
  UserSettings,
} from "@/types";

// ============================================================
// DATABASE SCHEMA — MaylaDB
// Version history is append-only; never modify old versions.
// ============================================================

class MaylaDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  settings!: Table<UserSettings & { id: string }, string>;

  constructor() {
    super("MaylaDB");

    // Version 1 — initial schema
    this.version(1).stores({
      // Primary key + indexed fields (non-indexed fields don't need listing)
      transactions: "id, date, type, accountId, toAccountId, createdAt",
      accounts: "id, type, createdAt",
      categories: "id, type",
      savingsGoals: "id, accountId",
      settings: "id",
    });
  }
}

// Singleton — one instance for the whole app
export const db = new MaylaDatabase();

// ============================================================
// SEED — Default data on first open
// ============================================================

export async function seedDefaultData() {
  const accountCount = await db.accounts.count();
  if (accountCount > 0) return; // already seeded

  const now = new Date().toISOString();

  // Default accounts
  await db.accounts.bulkAdd([
    {
      id: "acc_main",
      name: "Dompet Utama",
      type: "main",
      createdAt: now,
    },
    {
      id: "acc_saving",
      name: "Tabungan",
      type: "savings",
      createdAt: now,
    },
  ]);

  // Default categories
  await db.categories.bulkAdd([
    { id: "cat_salary", name: "Gaji", type: "income" },
    { id: "cat_freelance", name: "Freelance", type: "income" },
    { id: "cat_bonus", name: "Bonus", type: "income" },
    { id: "cat_other_in", name: "Lainnya", type: "income" },
    { id: "cat_food", name: "Makan & Minum", type: "expense" },
    { id: "cat_transport", name: "Transportasi", type: "expense" },
    { id: "cat_shop", name: "Belanja", type: "expense" },
    { id: "cat_bill", name: "Tagihan", type: "expense" },
    { id: "cat_health", name: "Kesehatan", type: "expense" },
    { id: "cat_entertainment", name: "Hiburan", type: "expense" },
    { id: "cat_other_ex", name: "Lainnya", type: "expense" },
  ]);

  // Default settings
  await db.settings.add({
    id: "user",
    name: "Pengguna",
    currency: "IDR",
  });

  // Dummy transactions for a realistic dashboard
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return fmt(d);
  };

  await db.transactions.bulkAdd([
    {
      id: "txn_1",
      type: "income",
      amount: 8_000_000,
      category: "Gaji",
      note: "Gaji bulan ini",
      date: daysAgo(2),
      accountId: "acc_main",
      createdAt: new Date(today.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: "txn_2",
      type: "expense",
      amount: 150_000,
      category: "Makan & Minum",
      note: "Makan siang kantor",
      date: daysAgo(1),
      accountId: "acc_main",
      createdAt: new Date(today.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: "txn_3",
      type: "expense",
      amount: 50_000,
      category: "Transportasi",
      note: "Ojek online",
      date: daysAgo(1),
      accountId: "acc_main",
      createdAt: new Date(today.getTime() - 86400000 + 3600000).toISOString(),
    },
    {
      id: "txn_4",
      type: "transfer",
      amount: 1_000_000,
      category: "Transfer",
      note: "Setor tabungan",
      date: fmt(today),
      accountId: "acc_main",
      toAccountId: "acc_saving",
      createdAt: new Date(today.getTime() - 7200000).toISOString(),
    },
    {
      id: "txn_5",
      type: "expense",
      amount: 300_000,
      category: "Belanja",
      note: "Supermarket",
      date: fmt(today),
      accountId: "acc_main",
      createdAt: new Date(today.getTime() - 3600000).toISOString(),
    },
    {
      id: "txn_6",
      type: "income",
      amount: 500_000,
      category: "Freelance",
      note: "Proyek desain logo",
      date: daysAgo(5),
      accountId: "acc_main",
      createdAt: new Date(today.getTime() - 5 * 86400000).toISOString(),
    },
  ]);
}
