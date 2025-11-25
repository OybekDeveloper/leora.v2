import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  AccountItem,
  AccountKind,
  AddAccountPayload,
} from '@/types/accounts';
import { mmkvStorageAdapter } from '@/utils/storage';

const TYPE_COLORS: Record<AccountKind, string> = {
  cash: '#3b82f6',
  card: '#8b5cf6',
  savings: '#10b981',
  usd: '#f59e0b',
  crypto: '#6366f1',
  other: '#64748b',
  custom: '#3f3f46',
};

const DEFAULT_ACCOUNTS: AccountItem[] = [
  {
    id: 'acc-1',
    name: 'CASH',
    type: 'cash',
    balance: 1_500_000,
    currency: 'UZS',
    subtitle: 'MAIN BALANCE',
    iconColor: TYPE_COLORS.cash,
    isArchived: false,
    transactions: [
      { id: 't1', type: 'income', amount: 500000, time: 'Today 14:30' },
      { id: 't2', type: 'outcome', amount: 150000, time: 'Today 10:15' },
      { id: 't3', type: 'income', amount: 300000, time: 'Yesterday' },
      { id: 't4', type: 'outcome', amount: 75000, time: '2 Jan 19:45' },
    ],
  },
  {
    id: 'acc-2',
    name: 'PLASTIC CARD',
    type: 'card',
    balance: 3_200_000,
    currency: 'UZS',
    subtitle: 'CREDIT CARD',
    iconColor: TYPE_COLORS.card,
    isArchived: false,
    transactions: [
      { id: 't5', type: 'outcome', amount: 250000, time: 'Today 16:22' },
      { id: 't6', type: 'income', amount: 1000000, time: 'Yesterday' },
      { id: 't7', type: 'outcome', amount: 125000, time: '3 days ago' },
    ],
  },
  {
    id: 'acc-3',
    name: 'SAVINGS',
    type: 'savings',
    balance: 8_000_000,
    currency: 'UZS',
    subtitle: 'FOR DREAM CAR',
    iconColor: TYPE_COLORS.savings,
    progress: 80,
    goal: 10_000_000,
    isArchived: false,
    transactions: [
      { id: 't8', type: 'income', amount: 500000, time: '3 days ago' },
      { id: 't9', type: 'income', amount: 1000000, time: '1 week ago' },
    ],
  },
  {
    id: 'acc-4',
    name: 'USD BALANCE',
    type: 'usd',
    balance: 6_225_000,
    currency: 'UZS',
    subtitle: '1 USD = 12,450 UZS',
    iconColor: TYPE_COLORS.usd,
    usdRate: 12450,
    isArchived: false,
    transactions: [
      { id: 't10', type: 'income', amount: 1245000, time: 'Today 09:00' },
      { id: 't11', type: 'outcome', amount: 622500, time: 'Yesterday' },
      { id: 't12', type: 'income', amount: 498000, time: '2 days ago' },
    ],
  },
];

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getCurrencyForType = (type: AccountKind): string => {
  if (type === 'usd') {
    return 'USD';
  }
  if (type === 'crypto') {
    return 'USDT';
  }
  return 'UZS';
};

const createAccountFromPayload = (payload: AddAccountPayload): AccountItem => {
  const id = generateId('account');
  return {
    id,
    name: payload.name.trim() || 'Untitled account',
    type: payload.type,
    balance: payload.amount,
    currency: getCurrencyForType(payload.type),
    subtitle: payload.description.trim() || 'No description',
    iconColor: TYPE_COLORS[payload.type],
    customTypeId: payload.customTypeId,
    customTypeLabel: payload.customTypeLabel,
    customIcon: payload.customIcon,
    progress: payload.type === 'savings' ? 0 : undefined,
    goal: payload.type === 'savings' ? payload.amount : undefined,
    usdRate: payload.type === 'usd' ? 0 : undefined,
    transactions: [],
    isArchived: false,
  };
};

const mergeAccountWithPayload = (
  account: AccountItem,
  payload: AddAccountPayload,
): AccountItem => {
  const trimmedName = payload.name.trim();
  const trimmedDesc = payload.description.trim();
  const updatedType = payload.type;

  return {
    ...account,
    name: trimmedName || account.name,
    subtitle: trimmedDesc || account.subtitle || 'No description',
    type: updatedType,
    balance: payload.amount,
    currency: getCurrencyForType(updatedType),
    iconColor: TYPE_COLORS[updatedType],
    customTypeId: payload.customTypeId,
    customTypeLabel: payload.customTypeLabel,
    customIcon: payload.customIcon,
    goal: updatedType === 'savings' ? payload.amount : undefined,
    progress:
      updatedType === 'savings' ? account.progress ?? 0 : undefined,
    usdRate: updatedType === 'usd' ? account.usdRate ?? 0 : undefined,
  };
};

interface AccountsStoreState {
  accounts: AccountItem[];
  addAccount: (payload: AddAccountPayload) => void;
  editAccount: (id: string, payload: AddAccountPayload) => void;
  updateAccount: (id: string, updates: Partial<AccountItem>) => void;
  deleteAccount: (id: string) => void;
  archiveAccount: (id: string) => void;
  resetAccounts: () => void;
}

const createAccountsStore: StateCreator<AccountsStoreState> = (set) => ({
  accounts: DEFAULT_ACCOUNTS,
  addAccount: (payload) =>
    set((state) => ({
      accounts: [...state.accounts, createAccountFromPayload(payload)],
    })),
  editAccount: (id, payload) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id ? mergeAccountWithPayload(account, payload) : account
      ),
    })),
  updateAccount: (id, updates) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id ? { ...account, ...updates } : account
      ),
    })),
  deleteAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== id),
    })),
  archiveAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id ? { ...account, isArchived: true } : account
      ),
    })),
  resetAccounts: () => set({ accounts: DEFAULT_ACCOUNTS }),
});

export const useAccountsStore = create<AccountsStoreState>()(
  persist(createAccountsStore, {
    name: 'accounts-storage',
    storage: createJSONStorage(() => mmkvStorageAdapter),
  })
);
