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

  // Default main account only — user adds savings accounts themselves
  await db.accounts.bulkAdd([
    {
      id: "acc_main",
      name: "Dompet Utama",
      type: "main",
      createdAt: now,
    },
  ]);

  // Default categories (structural, no transactions)
  await db.categories.bulkAdd([
    { id: "cat_salary",        name: "Gaji",          type: "income"  },
    { id: "cat_freelance",     name: "Freelance",     type: "income"  },
    { id: "cat_bonus",         name: "Bonus",         type: "income"  },
    { id: "cat_other_in",      name: "Lainnya",       type: "income"  },
    { id: "cat_food",          name: "Makan & Minum", type: "expense" },
    { id: "cat_transport",     name: "Transportasi",  type: "expense" },
    { id: "cat_shop",          name: "Belanja",       type: "expense" },
    { id: "cat_bill",          name: "Tagihan",       type: "expense" },
    { id: "cat_health",        name: "Kesehatan",     type: "expense" },
    { id: "cat_entertainment", name: "Hiburan",       type: "expense" },
    { id: "cat_other_ex",      name: "Lainnya",       type: "expense" },
  ]);

  // Default user settings
  await db.settings.add({ id: "user", name: "Pengguna", currency: "IDR" });

  // No dummy transactions — user starts with a clean slate
}
