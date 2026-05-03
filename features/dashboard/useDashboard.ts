"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllAccounts,
  getRecentTransactions,
  getTransactionsByMonth,
  getFilteredTransactions,
  getUserSettings,
} from "@/lib/db/queries";
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
  userName: string;
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
  const [userName, setUserName] = useState("Sayang💗");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date();

      const [rawAccounts, recent, monthly, settings] = await Promise.all([
        getAllAccounts(),
        getRecentTransactions(5),
        getTransactionsByMonth(now.getFullYear(), now.getMonth()),
        getUserSettings(),
      ]);

      // All txns needed for accurate cross-account balance
      const allTxns = await getFilteredTransactions({}, 10000);

      const accountsWithBalance = rawAccounts.map((acc) => ({
        ...acc,
        balance: calculateAccountBalance(acc.id, allTxns),
      }));

      setAccounts(accountsWithBalance);
      setTotalBalance(calculateTotalBalance(rawAccounts, allTxns));
      setMonthlySummary(calculateMonthlySummary(monthly));
      setRecentTransactions(recent);
      // Use saved name or fallback to "Sayang💗"
      setUserName(settings.name && settings.name !== "Pengguna" ? settings.name : "Sayang💗");
    } catch (err) {
      setError("Gagal memuat data.");
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
    userName,
    isLoading,
    error,
    refresh: load,
  };
}
