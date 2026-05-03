import type { Transaction } from "@/types";

export interface StatementRow {
  txn: Transaction;
  debit: number;
  credit: number;
  runningBalance: number;
}
