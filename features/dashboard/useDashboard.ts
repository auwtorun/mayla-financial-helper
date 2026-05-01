"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllAccounts } from "@/lib/db/queries";
import { getRecentTransactions, getTransactionsByMonth } from "@/lib/db/queries";
import {
  calculateAccountBalance,
  calculateTotalBalance,
  calculateMonthlySummary,
} from "@/lib/utils/calculations";
import type { Account, Transaction, MonthlySummary } from "@/types";

interface DashboardData {
  accounts: Array<Account & { balance: number }>;
  totalBalance: number;
  monthlySummary: MonthlySummary;
  recentTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboard(): DashboardData {
  const [accounts, setAccounts] = useState<Array<Account & { balance: number }>>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    totalIncome: 0,
    totalExpense: 0,
    netFlow: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date();

      const [rawAccounts, recent, monthly] = await Promise.all([
        getAllAccounts(),
        getRecentTransactions(5),
        getTransactionsByMonth(now.getFullYear(), now.getMonth()),
      ]);

      // We need ALL transactions to compute balance correctly (transfers cross accounts)
      // For a large dataset, this would be paginated; for MVP this is fine.
      const { getFilteredTransactions } = await import("@/lib/db/queries");
      const allTxns = await getFilteredTransactions({}, 10000);

      const accountsWithBalance = rawAccounts.map((acc) => ({
        ...acc,
        balance: calculateAccountBalance(acc.id, allTxns),
      }));

      setAccounts(accountsWithBalance);
      setTotalBalance(calculateTotalBalance(rawAccounts, allTxns));
      setMonthlySummary(calculateMonthlySummary(monthly));
      setRecentTransactions(recent);
    } catch (err) {
      setError("Gagal memuat data. Coba refresh.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    accounts,
    totalBalance,
    monthlySummary,
    recentTransactions,
    isLoading,
    error,
    refresh: load,
  };
}
