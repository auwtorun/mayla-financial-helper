/**
 * ZUSTAND STORE — Mayla Financial Tracker
 *
 * Lightweight global state. DB queries stay in features/hooks.
 * Store only holds derived/cached data that multiple views need.
 */

import { create } from "zustand";
import type { Account, Transaction } from "@/types";

// ── TYPES ────────────────────────────────────────────────────

interface AppState {
  // Cached data (refreshed on mount and after mutations)
  accounts: Account[];
  recentTransactions: Transaction[];
  totalBalance: number;
  isLoading: boolean;
  error: string | null;

  // UI state
  activeAccountId: string | null;

  // Actions
  setAccounts: (accounts: Account[]) => void;
  setRecentTransactions: (transactions: Transaction[]) => void;
  setTotalBalance: (balance: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveAccountId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  accounts: [],
  recentTransactions: [],
  totalBalance: 0,
  isLoading: false,
  error: null,
  activeAccountId: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setAccounts: (accounts) => set({ accounts }),
  setRecentTransactions: (recentTransactions) => set({ recentTransactions }),
  setTotalBalance: (totalBalance) => set({ totalBalance }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setActiveAccountId: (activeAccountId) => set({ activeAccountId }),
  reset: () => set(initialState),
}));
