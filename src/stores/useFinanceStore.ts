// stores/useFinanceStore.ts
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Colors } from "@/constants/theme";
import type {
  AccountItem,
  AccountKind,
  AddAccountPayload,
} from "@/types/accounts";
import type { Debt, Transaction } from "@/types/store.types";
import {
  type FinanceCurrency,
  useFinancePreferencesStore,
} from "@/stores/useFinancePreferencesStore";
import { useNotificationsStore } from "@/stores/useNotificationsStore";
import { mmkvStorageAdapter } from "@/utils/storage";
import { normalizeFinanceCurrency } from "@/utils/financeCurrency";

type BudgetState = "exceeding" | "within" | "fixed";
type BudgetPeriod = "weekly" | "monthly" | "quarterly" | "yearly";

export interface Budget {
  id: string;
  name: string;
  category: string;
  categories: string[];
  limit: number;
  spent: number;
  remaining: number;
  period: BudgetPeriod;
  color: string;
  startDate: Date;
  endDate: Date;
  state: BudgetState;
  accountId: string;
  transactionType: Exclude<Transaction["type"], "transfer">;
  notifyOnExceed: boolean;
  lastNotificationAt?: Date;
}

type BudgetInput = {
  id?: string;
  name: string;
  category?: string;
  categories: string[];
  limit: number;
  accountId: string;
  transactionType: Exclude<Transaction["type"], "transfer">;
  period?: BudgetPeriod;
  color?: string;
  startDate?: Date;
  endDate?: Date;
  notifyOnExceed?: boolean;
};

const TYPE_COLORS: Record<AccountKind, string> = {
  cash: Colors.primary,
  card: Colors.secondary,
  savings: Colors.success,
  usd: "#f59e0b",
  crypto: "#14b8a6",
  other: Colors.textSecondary,
  custom: Colors.textSecondary,
};

const getCurrencyForType = (type: AccountKind): string => {
  if (type === "usd") return "USD";
  if (type === "crypto") return "USDT";
  return "UZS";
};

const convertBetweenCurrencies = (
  amount: number,
  fromCurrency: FinanceCurrency,
  toCurrency: FinanceCurrency
) => {
  if (!Number.isFinite(amount) || amount === 0 || fromCurrency === toCurrency) {
    return amount;
  }
  const { convertAmount } = useFinancePreferencesStore.getState();
  return convertAmount(amount, fromCurrency, toCurrency);
};

type TransactionInput = Omit<Transaction, "id" | "createdAt">;
type DebtInput = Omit<
  Debt,
  "id" | "createdAt" | "remainingAmount" | "status"
> & {
  remainingAmount?: number;
  status?: Debt["status"];
};

type DebtPaymentInput = {
  debtId: string;
  amount: number;
  currency: FinanceCurrency;
  accountId: string;
  date?: Date;
  note?: string;
};

interface FinanceStore {
  transactions: Transaction[];
  debts: Debt[];
  accounts: AccountItem[];
  budgets: Budget[];
  categories: string[];

  // Account actions
  setAccounts: (accounts: AccountItem[]) => void;
  addAccount: (payload: AddAccountPayload) => void;
  editAccount: (id: string, payload: AddAccountPayload) => void;
  updateAccount: (id: string, updates: Partial<AccountItem>) => void;
  deleteAccount: (id: string) => void;
  archiveAccount: (id: string) => void;
  getAccountById: (id: string) => AccountItem | undefined;

  // Transaction actions
  addTransaction: (transaction: TransactionInput) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Debt actions
  addDebt: (debt: DebtInput) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  payDebt: (payment: DebtPaymentInput) => void;

  // Budgets actions
  addBudget: (budget: BudgetInput) => void;
  updateBudget: (id: string, updates: Partial<BudgetInput>) => void;
  deleteBudget: (id: string) => void;

  // Category actions
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  renameCategory: (prev: string, next: string) => void;

  // Computed values
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
  getTotalDebt: () => number;
  getTransactionsByType: (type: Transaction["type"]) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];
  getMonthlyTransactions: (month: number, year: number) => Transaction[];
  getMonthlyReport: (
    month: number,
    year: number
  ) => {
    income: number;
    expenses: number;
    balance: number;
  };
  getCategoryBreakdown: () => Record<string, number>;
}

type FinancePersistedShape = Pick<
  FinanceStore,
  "transactions" | "debts" | "accounts" | "categories" | "budgets"
>;

const resolveDebtStatus = (
  debt: Pick<Debt, "remainingAmount" | "expectedReturnDate" | "status">
): Debt["status"] => {
  if (debt.remainingAmount <= 0) {
    return "settled";
  }
  if (debt.expectedReturnDate) {
    const now = new Date();
    const expected = new Date(debt.expectedReturnDate);
    if (expected.getTime() < now.setHours(0, 0, 0, 0)) {
      return "overdue";
    }
  }
  return "active";
};

const DEFAULT_ACCOUNTS: AccountItem[] = [
  {
    id: "acc-cash",
    name: "CASH",
    type: "cash",
    balance: 1_500_000,
    currency: "UZS",
    subtitle: "MAIN BALANCE",
    iconColor: TYPE_COLORS.cash,
    transactions: [],
    isArchived: false,
  },
  {
    id: "acc-card",
    name: "HUMO CARD",
    type: "card",
    balance: 3_200_000,
    currency: "UZS",
    subtitle: "CREDIT CARD",
    iconColor: TYPE_COLORS.card,
    transactions: [],
    isArchived: false,
  },
  {
    id: "acc-savings",
    name: "SAVINGS",
    type: "savings",
    balance: 8_000_000,
    currency: "UZS",
    subtitle: "FOR DREAM CAR",
    iconColor: TYPE_COLORS.savings,
    progress: 80,
    goal: 10_000_000,
    transactions: [],
    isArchived: false,
  },
  {
    id: "acc-usd-wallet",
    name: "USD WALLET",
    type: "usd",
    balance: 5_000,
    currency: "USD",
    subtitle: "1 USD = 12,450 UZS",
    iconColor: TYPE_COLORS.usd,
    usdRate: 12_450,
    transactions: [],
    isArchived: false,
  },
];

const DEFAULT_CATEGORIES: string[] = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Salary",
  "Business",
  "Other",
  "Debt",
];

const buildBudget = (config: {
  id: string;
  name: string;
  categories: string[];
  limit: number;
  period: BudgetPeriod;
  color: string;
  accountId: string;
  transactionType: Exclude<Transaction["type"], "transfer">;
  notifyOnExceed?: boolean;
  startOffsetDays?: number;
  durationDays?: number;
}): Budget => {
  const { startOffsetDays = 0, durationDays = 30 } = config;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startOffsetDays);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + durationDays);
  const categories = config.categories.length
    ? Array.from(new Set(config.categories))
    : ["Other"];
  const categoryLabel =
    categories.length === 1 ? categories[0] : `${categories.length} categories`;

  return {
    id: config.id,
    name: config.name,
    category: categoryLabel,
    categories,
    limit: config.limit,
    spent: 0,
    remaining: config.limit,
    period: config.period,
    color: config.color,
    startDate,
    endDate,
    state: "within",
    accountId: config.accountId,
    transactionType: config.transactionType,
    notifyOnExceed: config.notifyOnExceed ?? true,
    lastNotificationAt: undefined,
  };
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BUDGET_DURATION_DAYS = 30;

const formatBudgetCategoryLabel = (categories: string[]): string => {
  if (!categories.length) {
    return "All categories";
  }
  if (categories.length === 1) {
    return categories[0]!;
  }
  return `${categories.length} categories`;
};

const DEFAULT_BUDGETS: Budget[] = [
  buildBudget({
    id: "bud-food",
    name: "Food Budget",
    categories: ["Food & Dining"],
    limit: 300_000,
    period: "monthly",
    color: "#ef4444",
    accountId: DEFAULT_ACCOUNTS[0]?.id ?? "acc-cash",
    transactionType: "outcome",
  }),
  buildBudget({
    id: "bud-transport",
    name: "Transport Budget",
    categories: ["Transportation"],
    limit: 250_000,
    period: "monthly",
    color: "#3b82f6",
    accountId: DEFAULT_ACCOUNTS[1]?.id ?? DEFAULT_ACCOUNTS[0]?.id ?? "acc-cash",
    transactionType: "outcome",
  }),
  buildBudget({
    id: "bud-living",
    name: "Living Budget",
    categories: ["Bills & Utilities", "Healthcare"],
    limit: 150_000,
    period: "monthly",
    color: "#10b981",
    accountId: DEFAULT_ACCOUNTS[2]?.id ?? DEFAULT_ACCOUNTS[0]?.id ?? "acc-cash",
    transactionType: "outcome",
  }),
];

const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const hydrateAccount = (account: Partial<AccountItem>): AccountItem => {
  const type: AccountKind = account.type ?? "cash";
  return {
    id: account.id ?? generateId("account"),
    name: account.name ?? "Untitled account",
    type,
    balance: account.balance ?? 0,
    currency: account.currency ?? getCurrencyForType(type),
    subtitle: account.subtitle ?? "No description",
    iconColor: account.iconColor ?? TYPE_COLORS[type],
    customTypeId: account.customTypeId,
    customTypeLabel: account.customTypeLabel,
    customIcon: account.customIcon,
    progress: account.progress,
    goal: account.goal,
    usdRate: account.usdRate,
    transactions: account.transactions ?? [],
    isArchived: account.isArchived ?? false,
  };
};

const createAccountFromPayload = (payload: AddAccountPayload): AccountItem => {
  const type = payload.type;
  const balance = payload.amount;
  const goal = type === "savings" ? payload.amount : undefined;

  return hydrateAccount({
    name: payload.name.trim() || "Untitled account",
    subtitle: payload.description.trim() || "No description",
    type,
    balance,
    goal,
    customTypeId: payload.customTypeId,
    customTypeLabel: payload.customTypeLabel,
    customIcon: payload.customIcon,
  });
};

const mergeAccountWithPayload = (
  account: AccountItem,
  payload: AddAccountPayload
): AccountItem => {
  const nextType = payload.type;
  const nextGoal = nextType === "savings" ? payload.amount : undefined;

  return hydrateAccount({
    ...account,
    name: payload.name.trim() || account.name,
    subtitle: payload.description.trim() || account.subtitle,
    type: nextType,
    balance: payload.amount,
    goal: nextGoal,
    customTypeId: payload.customTypeId,
    customTypeLabel: payload.customTypeLabel,
    customIcon: payload.customIcon,
  });
};

const normalizeBudget = (input: BudgetInput): Budget => {
  const categories = input.categories?.length
    ? Array.from(new Set(input.categories))
    : input.category
      ? [input.category]
      : ["Other"];
  const limit = Math.max(input.limit ?? 0, 0);
  const startDate = input.startDate ? new Date(input.startDate) : new Date();
  const endDate = input.endDate
    ? new Date(input.endDate)
    : new Date(startDate.getTime() + DEFAULT_BUDGET_DURATION_DAYS * DAY_IN_MS);

  return {
    id: input.id ?? generateId("budget"),
    name: input.name.trim() || "New budget",
    category: input.category ?? formatBudgetCategoryLabel(categories),
    categories,
    limit,
    spent: 0,
    remaining: limit,
    period: input.period ?? "monthly",
    color: input.color ?? Colors.secondary,
    startDate,
    endDate,
    state: "within",
    accountId: input.accountId,
    transactionType: input.transactionType,
    notifyOnExceed: input.notifyOnExceed ?? true,
    lastNotificationAt: undefined,
  };
};

const calculateBudgetUsage = (
  budget: Budget,
  transactions: Transaction[]
): Pick<Budget, "spent" | "remaining" | "state"> => {
  const spent = transactions.reduce((sum, transaction) => {
    if (
      transaction.type !== budget.transactionType ||
      transaction.accountId !== budget.accountId
    ) {
      return sum;
    }

    const txnDate = new Date(transaction.date ?? new Date());
    if (txnDate < budget.startDate || txnDate > budget.endDate) {
      return sum;
    }

    const transactionCategory = transaction.category ?? "Other";
    if (
      budget.categories.length > 0 &&
      !budget.categories.includes(transactionCategory)
    ) {
      return sum;
    }

    return sum + Math.abs(transaction.amount);
  }, 0);

  const remaining = Math.max(budget.limit - spent, 0);
  let state: BudgetState = "within";
  if (spent > budget.limit) {
    state = "exceeding";
  } else if (Math.abs(budget.limit - spent) < 1) {
    state = "fixed";
  }

  return { spent, remaining, state };
};

const notifyBudgetExceeded = (budget: Budget, accounts: AccountItem[]) => {
  const account = accounts.find((item) => item.id === budget.accountId);
  const currency = normalizeFinanceCurrency(account?.currency ?? "UZS");
  const locale = currency === "UZS" ? "uz-UZ" : "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "UZS" ? 0 : 2,
  });

  useNotificationsStore.getState().addNotification({
    title: "Budget limit exceeded",
    message: `${budget.name} exceeded ${formatter.format(budget.limit)}.`,
    createdAt: new Date(),
    category: "system",
  });
};

const reconcileBudgetsWithTransactions = (
  budgets: Budget[],
  transactions: Transaction[],
  accounts: AccountItem[],
  options?: { skipNotifications?: boolean }
): Budget[] =>
  budgets.map((budget) => {
    const usage = calculateBudgetUsage(budget, transactions);
    const nextBudget: Budget = {
      ...budget,
      ...usage,
    };

    if (
      !options?.skipNotifications &&
      nextBudget.notifyOnExceed &&
      nextBudget.state === "exceeding" &&
      (!budget.lastNotificationAt || budget.state !== "exceeding")
    ) {
      notifyBudgetExceeded(nextBudget, accounts);
      nextBudget.lastNotificationAt = new Date();
    } else if (nextBudget.state !== "exceeding") {
      nextBudget.lastNotificationAt = undefined;
    } else {
      nextBudget.lastNotificationAt = budget.lastNotificationAt;
    }

    return nextBudget;
  });

const now = new Date();

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "txn-salary",
    type: "income",
    amount: 5_500_000,
    category: "Salary",
    accountId: "acc-card",
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
    currency: "UZS",
    description: "Monthly salary",
    createdAt: new Date(),
  },
  {
    id: "txn-food",
    type: "outcome",
    amount: 180_000,
    category: "Food & Dining",
    accountId: "acc-card",
    date: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      13,
      30
    ),
    currency: "UZS",
    description: "Lunch with clients",
    createdAt: new Date(),
  },
  {
    id: "txn-transport",
    type: "outcome",
    amount: 65_000,
    category: "Transportation",
    accountId: "acc-cash",
    date: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      19,
      0
    ),
    currency: "UZS",
    description: "Taxi rides",
    createdAt: new Date(),
  },
  {
    id: "txn-transfer",
    type: "transfer",
    amount: 750_000,
    category: "Transfer",
    accountId: "acc-card",
    toAccountId: "acc-savings",
    date: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 2,
      11,
      15
    ),
    currency: "UZS",
    description: "Savings top-up",
    createdAt: new Date(),
  },
  {
    id: "txn-rent",
    type: "outcome",
    amount: 2_200_000,
    category: "Living",
    accountId: "acc-card",
    date: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 3,
      8,
      45
    ),
    currency: "UZS",
    description: "Apartment rent",
    createdAt: new Date(),
  },
  {
    id: "txn-freelance",
    type: "income",
    amount: 1_200_000,
    category: "Business",
    accountId: "acc-cash",
    date: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 4,
      17,
      20
    ),
    currency: "UZS",
    description: "Freelance project",
    createdAt: new Date(),
  },
];

const DEFAULT_DEBTS_SOURCE: Debt[] = [
  {
    id: "debt-aziz",
    person: "Aziz",
    amount: 500_000,
    remainingAmount: 500_000,
    type: "lent",
    currency: "UZS",
    accountId: "acc-cash",
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
    expectedReturnDate: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    ),
    note: "Wedding gift loan",
    reminderEnabled: false,
    status: "active",
    createdAt: new Date(),
    transactionId: undefined,
  },
  {
    id: "debt-parent",
    person: "Parents",
    amount: 2_000_000,
    remainingAmount: 1_500_000,
    type: "borrowed",
    currency: "UZS",
    accountId: "acc-card",
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
    expectedReturnDate: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 20
    ),
    note: "Home repair help",
    reminderEnabled: false,
    status: "active",
    createdAt: new Date(),
    transactionId: undefined,
  },
];

const DEFAULT_DEBTS: Debt[] = DEFAULT_DEBTS_SOURCE.map((debt) => ({
  ...debt,
  status: resolveDebtStatus(debt),
}));

const DEFAULT_HYDRATED_ACCOUNTS = DEFAULT_ACCOUNTS.map(hydrateAccount);
const DEFAULT_INITIAL_BUDGETS = reconcileBudgetsWithTransactions(
  DEFAULT_BUDGETS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_HYDRATED_ACCOUNTS,
  { skipNotifications: true }
);

const applyTransactionToAccounts = (
  accounts: AccountItem[],
  transaction: Transaction,
  direction: 1 | -1
): AccountItem[] => {
  return accounts.map((account) => {
    if (transaction.type === "transfer") {
      if (account.id === transaction.accountId) {
        return {
          ...account,
          balance: account.balance - direction * transaction.amount,
        };
      }
      if (transaction.toAccountId && account.id === transaction.toAccountId) {
        return {
          ...account,
          balance: account.balance + direction * transaction.amount,
        };
      }
      return account;
    }

    if (account.id !== transaction.accountId) {
      return account;
    }

    const delta =
      transaction.type === "income" ? transaction.amount : -transaction.amount;
    return {
      ...account,
      balance: account.balance + direction * delta,
    };
  });
};

const reconcileTransactionUpdate = (
  accounts: AccountItem[],
  previous: Transaction,
  next: Transaction
) => {
  const reverted = applyTransactionToAccounts(accounts, previous, -1);
  return applyTransactionToAccounts(reverted, next, 1);
};

const createFinanceStore: StateCreator<FinanceStore> = (set, get) => ({
  transactions: DEFAULT_TRANSACTIONS,
  debts: DEFAULT_DEBTS,
  accounts: DEFAULT_HYDRATED_ACCOUNTS.map((account) => ({ ...account })),
  budgets: DEFAULT_INITIAL_BUDGETS.map((budget) => ({ ...budget })),
  categories: DEFAULT_CATEGORIES,

  // Account actions
  setAccounts: (accounts) =>
    set(() => ({ accounts: accounts.map(hydrateAccount) })),
  addAccount: (payload) =>
    set((state) => ({
      accounts: [...state.accounts, createAccountFromPayload(payload)],
    })),
  editAccount: (id, payload) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id
          ? mergeAccountWithPayload(account, payload)
          : account
      ),
    })),
  updateAccount: (id, updates) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id
          ? hydrateAccount({ ...account, ...updates })
          : account
      ),
    })),
  deleteAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== id),
      transactions: state.transactions.filter(
        (transaction) =>
          transaction.accountId !== id &&
          transaction.toAccountId !== id
      ),
    })),
  archiveAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id ? { ...account, isArchived: true } : account
      ),
    })),
  getAccountById: (id) => get().accounts.find((account) => account.id === id),

  // Transaction actions
  addTransaction: (transactionData) =>
    set((state) => {
      const account = state.accounts.find(
        (acc) => acc.id === transactionData.accountId
      );
      const tx: Transaction = {
        ...transactionData,
        id: generateId("txn"),
        createdAt: new Date(),
        currency: transactionData.currency ?? account?.currency ?? "USD",
        date: transactionData.date
          ? new Date(transactionData.date)
          : new Date(),
      };

      const updatedAccounts = applyTransactionToAccounts(
        state.accounts,
        tx,
        1
      );

      const nextTransactions = [tx, ...state.transactions];

      return {
        transactions: nextTransactions,
        accounts: updatedAccounts,
        budgets: reconcileBudgetsWithTransactions(
          state.budgets,
          nextTransactions,
          updatedAccounts
        ),
      };
    }),

  updateTransaction: (id, updates) =>
    set((state) => {
      const existing = state.transactions.find((txn) => txn.id === id);
      if (!existing) {
        return state;
      }

      const merged: Transaction = {
        ...existing,
        ...updates,
        id: existing.id,
        updatedAt: new Date(),
        date: updates.date ? new Date(updates.date) : existing.date,
      };

      const updatedAccounts = reconcileTransactionUpdate(
        state.accounts,
        existing,
        merged
      );

      const nextTransactions = state.transactions.map((txn) =>
        txn.id === id ? merged : txn
      );

      return {
        transactions: nextTransactions,
        accounts: updatedAccounts,
        budgets: reconcileBudgetsWithTransactions(
          state.budgets,
          nextTransactions,
          updatedAccounts
        ),
      };
    }),

  deleteTransaction: (id) =>
    set((state) => {
      const existing = state.transactions.find((txn) => txn.id === id);
      if (!existing) {
        return state;
      }

      const updatedAccounts = applyTransactionToAccounts(
        state.accounts,
        existing,
        -1
      );

      const nextTransactions = state.transactions.filter(
        (txn) => txn.id !== id
      );

      return {
        transactions: nextTransactions,
        accounts: updatedAccounts,
        budgets: reconcileBudgetsWithTransactions(
          state.budgets,
          nextTransactions,
          updatedAccounts
        ),
      };
    }),

  // Debt actions
  addDebt: (debtData) =>
    set((state) => {
      const targetAccount =
        state.accounts.find((acc) => acc.id === debtData.accountId) ??
        state.accounts[0];

      if (!targetAccount) {
        return state;
      }

      const debtId = generateId("debt");
      const debtCurrency = normalizeFinanceCurrency(debtData.currency);
      const accountCurrency = normalizeFinanceCurrency(targetAccount.currency);
      const convertedAmount = convertBetweenCurrencies(
        debtData.amount,
        debtCurrency,
        accountCurrency
      );

      const transaction: Transaction = {
        id: generateId("txn"),
        type: debtData.type === "lent" ? "outcome" : "income",
        amount: convertedAmount,
        accountId: targetAccount.id,
        toAccountId: undefined,
        category: "Debt",
        note: debtData.note || `Debt • ${debtData.person}`,
        description: debtData.note,
        date: debtData.date ?? new Date(),
        currency: accountCurrency,
        createdAt: new Date(),
        relatedDebtId: debtId,
      };

      const updatedAccounts = applyTransactionToAccounts(
        state.accounts,
        transaction,
        1
      );

      const remainingAmount =
        debtData.remainingAmount ?? debtData.amount;

      const debt: Debt = {
        ...debtData,
        id: debtId,
        createdAt: new Date(),
        accountId: targetAccount.id,
        transactionId: transaction.id,
        currency: debtCurrency,
        remainingAmount,
        reminderEnabled: debtData.reminderEnabled ?? false,
        reminderTime: (debtData.reminderEnabled ?? false) ? debtData.reminderTime : undefined,
        status:
          debtData.status ??
          resolveDebtStatus({
            remainingAmount,
            expectedReturnDate: debtData.expectedReturnDate,
            status: "active",
          }),
      };

      return {
        debts: [debt, ...state.debts],
        transactions: [transaction, ...state.transactions],
        accounts: updatedAccounts,
      };
    }),

  updateDebt: (id, updates) =>
    set((state) => {
      const debt = state.debts.find((item) => item.id === id);
      if (!debt) {
        return state;
      }

      const nextAccountId = updates.accountId ?? debt.accountId;
      const account =
        state.accounts.find((acc) => acc.id === nextAccountId) ??
        state.accounts[0];

      if (!account) {
        return state;
      }

      const nextAmount = updates.amount ?? debt.amount;
      const paidPortion = debt.amount - debt.remainingAmount;
      const nextRemaining =
        updates.remainingAmount ??
        Math.max(nextAmount - paidPortion, 0);
      const nextType = updates.type ?? debt.type;
      const nextCurrency = normalizeFinanceCurrency(
        updates.currency ?? debt.currency
      );
      const nextExpected =
        updates.expectedReturnDate ?? debt.expectedReturnDate;
      const nextNote = updates.note ?? debt.note;
      const nextDate = updates.date ? new Date(updates.date) : debt.date;

      const accountCurrency = normalizeFinanceCurrency(account.currency);
      const convertedAmount = convertBetweenCurrencies(
        nextAmount,
        nextCurrency,
        accountCurrency
      );

      let accounts = state.accounts;
      let transactions = state.transactions;
      let transactionId = debt.transactionId;

      const buildTransaction = (
        base?: Transaction
      ): Transaction => ({
        id: base?.id ?? generateId("txn"),
        type: nextType === "lent" ? "outcome" : "income",
        amount: convertedAmount,
        accountId: account.id,
        toAccountId: undefined,
        category: base?.category ?? "Debt",
        note: nextNote || `Debt • ${debt.person}`,
        description: nextNote,
        date: nextDate,
        currency: accountCurrency,
        createdAt: base?.createdAt ?? new Date(),
        updatedAt: base ? new Date() : undefined,
        relatedDebtId: debt.id,
      });

      if (transactionId) {
        const existingTransaction = state.transactions.find(
          (txn) => txn.id === transactionId
        );
        if (existingTransaction) {
          accounts = applyTransactionToAccounts(
            accounts,
            existingTransaction,
            -1
          );
          const updatedTransaction = buildTransaction({
            ...existingTransaction,
          });
          accounts = applyTransactionToAccounts(
            accounts,
            updatedTransaction,
            1
          );
          transactions = state.transactions.map((txn) =>
            txn.id === updatedTransaction.id ? updatedTransaction : txn
          );
        } else {
          const newTransaction = buildTransaction();
          accounts = applyTransactionToAccounts(
            accounts,
            newTransaction,
            1
          );
          transactions = [newTransaction, ...state.transactions];
          transactionId = newTransaction.id;
        }
      } else {
        const newTransaction = buildTransaction();
        accounts = applyTransactionToAccounts(accounts, newTransaction, 1);
        transactions = [newTransaction, ...state.transactions];
        transactionId = newTransaction.id;
      }

      const reminderEnabledNext =
        updates.reminderEnabled ?? debt.reminderEnabled ?? false;
      const reminderTimeNext = reminderEnabledNext
        ? updates.reminderTime ?? debt.reminderTime
        : undefined;

      const updatedDebt: Debt = {
        ...debt,
        ...updates,
        amount: nextAmount,
        remainingAmount: nextRemaining,
        type: nextType,
        currency: nextCurrency,
        accountId: account.id,
        transactionId,
        expectedReturnDate: nextExpected,
        note: nextNote,
        date: nextDate,
         reminderEnabled: reminderEnabledNext,
         reminderTime: reminderTimeNext,
        status:
          updates.status ??
          resolveDebtStatus({
            remainingAmount: nextRemaining,
            expectedReturnDate: nextExpected,
            status: debt.status,
          }),
      };

      return {
        debts: state.debts.map((item) =>
          item.id === id ? updatedDebt : item
        ),
        accounts,
        transactions,
      };
    }),

  deleteDebt: (id) =>
    set((state) => {
      const debt = state.debts.find((item) => item.id === id);
      if (!debt) {
        return state;
      }

      let accounts = state.accounts;
      let transactions = state.transactions;

      if (debt.transactionId) {
        const existingTransaction = state.transactions.find(
          (txn) => txn.id === debt.transactionId
        );
        if (existingTransaction) {
          accounts = applyTransactionToAccounts(
            accounts,
            existingTransaction,
            -1
          );
          transactions = state.transactions.filter(
            (txn) => txn.id !== existingTransaction.id
          );
        }
      }

      return {
        debts: state.debts.filter((item) => item.id !== id),
        accounts,
        transactions,
      };
    }),

  payDebt: ({ debtId, amount, currency, accountId, date, note }) =>
    set((state) => {
      const debt = state.debts.find((item) => item.id === debtId);
      const account = state.accounts.find((acc) => acc.id === accountId);
      if (!debt || !account || amount <= 0) {
        return state;
      }

      const paymentCurrency = normalizeFinanceCurrency(currency);
      const accountCurrency = normalizeFinanceCurrency(account.currency);
      const paymentInDebtCurrency = convertBetweenCurrencies(
        amount,
        paymentCurrency,
        debt.currency
      );
      const paymentInAccountCurrency = convertBetweenCurrencies(
        amount,
        paymentCurrency,
        accountCurrency
      );

      const transaction: Transaction = {
        id: generateId("txn"),
        type: debt.type === "lent" ? "income" : "outcome",
        amount: Math.abs(paymentInAccountCurrency),
        accountId: account.id,
        toAccountId: undefined,
        category: "Debt",
        note: note ?? debt.note ?? `Debt • ${debt.person}`,
        description: note ?? debt.note,
        date: date ?? new Date(),
        currency: accountCurrency,
        createdAt: new Date(),
        relatedDebtId: debt.id,
      };

      const updatedAccounts = applyTransactionToAccounts(
        state.accounts,
        transaction,
        1
      );

      const remainingAmount = Math.max(
        debt.remainingAmount - paymentInDebtCurrency,
        0
      );

      const updatedDebt: Debt = {
        ...debt,
        remainingAmount,
        status: resolveDebtStatus({
          remainingAmount,
          expectedReturnDate: debt.expectedReturnDate,
          status: debt.status,
        }),
      };

      const nextTransactions = [transaction, ...state.transactions];

      return {
        debts: state.debts.map((item) =>
          item.id === debtId ? updatedDebt : item
        ),
        accounts: updatedAccounts,
        transactions: nextTransactions,
        budgets: reconcileBudgetsWithTransactions(
          state.budgets,
          nextTransactions,
          updatedAccounts
        ),
      };
    }),

  // Budget actions
  addBudget: (budgetInput) =>
    set((state) => {
      const nextBudgets = [
        ...state.budgets,
        normalizeBudget(budgetInput),
      ];
      return {
        budgets: reconcileBudgetsWithTransactions(
          nextBudgets,
          state.transactions,
          state.accounts
        ),
      };
    }),

  updateBudget: (id, updates) =>
    set((state) => {
      const nextBudgets = state.budgets.map((budget) => {
        if (budget.id !== id) {
          return budget;
        }
        const categories =
          updates.categories && updates.categories.length
            ? Array.from(new Set(updates.categories))
            : budget.categories;
        return {
          ...budget,
          ...updates,
          name: updates.name?.trim() || budget.name,
          limit: updates.limit ?? budget.limit,
          accountId: updates.accountId ?? budget.accountId,
          categories,
          category:
            updates.category ??
            (updates.categories
              ? formatBudgetCategoryLabel(categories)
              : budget.category),
          transactionType:
            updates.transactionType ?? budget.transactionType,
          period: updates.period ?? budget.period,
          color: updates.color ?? budget.color,
          startDate: updates.startDate
            ? new Date(updates.startDate)
            : budget.startDate,
          endDate: updates.endDate
            ? new Date(updates.endDate)
            : budget.endDate,
          notifyOnExceed:
            updates.notifyOnExceed ?? budget.notifyOnExceed,
        };
      });

      return {
        budgets: reconcileBudgetsWithTransactions(
          nextBudgets,
          state.transactions,
          state.accounts
        ),
      };
    }),

  deleteBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((budget) => budget.id !== id),
    })),

  // Category actions
  addCategory: (category) =>
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories
        : [...state.categories, category],
    })),

  deleteCategory: (category) =>
    set((state) => ({
      categories: state.categories.filter((cat) => cat !== category),
    })),

  renameCategory: (prev, next) =>
    set((state) => {
      if (!next.trim() || prev === next) {
        return state;
      }

      const nextCategories = state.categories.map((category) =>
        category === prev ? next : category
      );

      return {
        categories: nextCategories,
        transactions: state.transactions.map((transaction) =>
          transaction.category === prev
            ? { ...transaction, category: next }
            : transaction
        ),
      };
    }),

  // Computed values
  getTotalIncome: () =>
    get()
      .transactions.filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),

  getTotalExpenses: () =>
    get()
      .transactions.filter((t) => t.type === "outcome")
      .reduce((sum, t) => sum + t.amount, 0),

  getBalance: () => {
    const income = get().getTotalIncome();
    const expenses = get().getTotalExpenses();
    return income - expenses;
  },

  getTotalDebt: () =>
    get()
      .debts.filter((debt) => debt.status !== "settled")
      .reduce((sum, debt) => sum + debt.remainingAmount, 0),

  getTransactionsByType: (type) =>
    get().transactions.filter((transaction) => transaction.type === type),

  getTransactionsByCategory: (category) =>
    get().transactions.filter(
      (transaction) => transaction.category === category
    ),

  getMonthlyTransactions: (month, year) =>
    get().transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return (
        date.getMonth() === month && date.getFullYear() === year
      );
    }),

  getMonthlyReport: (month, year) => {
    const monthlyTransactions =
      get().getMonthlyTransactions(month, year);

    const income = monthlyTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

    const expenses = monthlyTransactions
      .filter((transaction) => transaction.type === "outcome")
      .reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  },

  getCategoryBreakdown: () => {
    const breakdown = get()
      .transactions.filter(
        (transaction) => transaction.type === "outcome"
      )
      .reduce<Record<string, number>>((acc, transaction) => {
        const key = transaction.category ?? "Other";
        acc[key] = (acc[key] ?? 0) + transaction.amount;
        return acc;
      }, {});
    return breakdown;
  },
});

export const useFinanceStore = create<FinanceStore>()(
  persist<FinanceStore, [], [], FinancePersistedShape>(
    createFinanceStore,
    {
      name: "finance-storage",
      storage: createJSONStorage<FinancePersistedShape>(
        () => mmkvStorageAdapter
      ),
      version: 4,
      migrate: (
        persistedState: FinancePersistedShape | undefined,
        version: number
      ): FinancePersistedShape => {
        const fallbackState: FinancePersistedShape = {
          transactions: DEFAULT_TRANSACTIONS,
          debts: DEFAULT_DEBTS,
          accounts: DEFAULT_ACCOUNTS,
          budgets: DEFAULT_BUDGETS,
          categories: DEFAULT_CATEGORIES,
        };

        const typedState = persistedState ?? fallbackState;

        const accounts = (
          typedState.accounts?.length
            ? typedState.accounts
            : DEFAULT_ACCOUNTS
        ).map(hydrateAccount);

        const transactions = (typedState.transactions ??
          DEFAULT_TRANSACTIONS).map((transaction) => ({
          ...transaction,
          date: new Date(transaction.date ?? new Date()),
          createdAt: new Date(transaction.createdAt ?? new Date()),
          updatedAt: transaction.updatedAt
            ? new Date(transaction.updatedAt)
            : transaction.updatedAt,
          relatedDebtId: transaction.relatedDebtId,
        }));

        const debts = (typedState.debts ?? DEFAULT_DEBTS).map((debt) => {
          const fallbackAccount =
            typedState.accounts?.[0]?.id ??
            DEFAULT_ACCOUNTS[0]?.id ??
            "acc-cash";
          const normalized: Debt = {
            ...debt,
            currency: normalizeFinanceCurrency(debt.currency),
            date: new Date(debt.date ?? new Date()),
            createdAt: new Date(debt.createdAt ?? new Date()),
            expectedReturnDate: debt.expectedReturnDate
              ? new Date(debt.expectedReturnDate)
              : undefined,
            remainingAmount: debt.remainingAmount ?? debt.amount,
            accountId: debt.accountId ?? fallbackAccount,
            transactionId: debt.transactionId,
          };
          return {
            ...normalized,
            status: resolveDebtStatus(normalized),
          };
        });

        const rawBudgets = typedState.budgets ?? DEFAULT_BUDGETS;
        const normalizedBudgets =
          version < 4
            ? rawBudgets.map((budget) =>
                normalizeBudget({
                  id: (budget as Budget).id,
                  name:
                    (budget as Budget).name ??
                    (budget as Budget).category ??
                    "Budget",
                  category: (budget as Budget).category,
                  categories:
                    (budget as Budget).categories &&
                    (budget as Budget).categories.length
                      ? (budget as Budget).categories
                      : [(budget as Budget).category ?? "Other"],
                  limit: (budget as Budget).limit ?? 0,
                  accountId:
                    (budget as Budget).accountId ??
                    accounts[0]?.id ??
                    "acc-cash",
                  transactionType:
                    ((budget as Budget).transactionType as
                      | "income"
                      | "outcome") ?? "outcome",
                  period: (budget as Budget).period ?? "monthly",
                  color: (budget as Budget).color ?? Colors.secondary,
                  startDate: (budget as Budget).startDate
                    ? new Date(
                        (budget as Budget).startDate ?? new Date()
                      )
                    : undefined,
                  endDate: (budget as Budget).endDate
                    ? new Date((budget as Budget).endDate ?? new Date())
                    : undefined,
                  notifyOnExceed:
                    (budget as Budget).notifyOnExceed ?? true,
                })
              )
            : (rawBudgets as Budget[]).map((budget) => ({
                ...budget,
                startDate: new Date(budget.startDate ?? new Date()),
                endDate: new Date(budget.endDate ?? new Date()),
              }));

        return {
          transactions,
          debts,
          accounts,
          budgets: reconcileBudgetsWithTransactions(
            normalizedBudgets,
            transactions,
            accounts,
            { skipNotifications: true }
          ),
          categories: typedState.categories?.length
            ? typedState.categories
            : DEFAULT_CATEGORIES,
        };
      },
    }
  )
);
