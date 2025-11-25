import { create } from 'zustand';
import { BSON } from 'realm';

import type {
  Account,
  Budget,
  Debt,
  DebtPayment,
  FxRate,
  FinanceSummaryDaily,
  FinanceSummaryMonthly,
  Transaction,
  BudgetEntry,
  DebtStatus,
  OutstandingDebt,
  BudgetSnapshot,
  Counterparty,
} from '@/domain/finance/types';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { getFinanceDaoRegistry } from '@/database/dao/financeDaoRegistry';
import type { BudgetCreateInput } from '@/database/dao/FinanceDAO';
import { plannerEventBus } from '@/events/plannerEventBus';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

type CreateDebtInput = Omit<
  Debt,
  'id' | 'status' | 'principalBaseValue' | 'createdAt' | 'updatedAt' | 'fundingTransactionId'
> & {
  fundingOverrideAmount?: number;
};

type CounterpartyOptions = {
  reuseIfExists?: boolean;
};

type AddDebtPaymentInput = Omit<
  DebtPayment,
  'id' | 'baseCurrency' | 'convertedAmountToBase' | 'convertedAmountToDebt' | 'createdAt' | 'updatedAt' | 'relatedTransactionId'
>;

interface FinanceDomainState {
  accounts: Account[];
  categories: string[];
  transactions: Transaction[];
  budgets: Budget[];
  budgetEntries: BudgetEntry[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  fxRates: FxRate[];
  counterparties: Counterparty[];
  createAccount: (payload: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'> & { initialBalance: number }) => Account;
  updateAccount: (accountId: string, updates: Partial<Account>) => void;
  deleteAccount: (accountId: string) => void;
  archiveAccount: (accountId: string) => void;
  clearCustomTypeFromAccounts: (customTypeId: string) => void;
  createTransaction: (
    payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> &
      Partial<Pick<Transaction, 'rateUsedToBase' | 'convertedAmountToBase'>>
  ) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (previous: string, next: string) => void;
  createBudget: (payload: Omit<Budget, 'id' | 'spentAmount' | 'remainingAmount' | 'percentUsed' | 'createdAt' | 'updatedAt'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  archiveBudget: (id: string) => void;
  createDebt: (payload: CreateDebtInput) => Debt;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (payload: AddDebtPaymentInput) => DebtPayment;
  createCounterparty: (displayName: string, options?: CounterpartyOptions) => Counterparty;
  renameCounterparty: (id: string, displayName: string) => Counterparty;
  deleteCounterparty: (id: string) => void;
  overrideFxRate: (payload: Omit<FxRate, 'id' | 'createdAt' | 'updatedAt'>) => FxRate;
  getRate: (date: Date, from: string, to: string) => number;
  getFinanceSummaryDaily: (date: Date) => FinanceSummaryDaily;
  getFinanceSummaryMonthly: (month: number, year: number) => FinanceSummaryMonthly;
  getOutstandingDebts: () => OutstandingDebt[];
  getBudgetSnapshots: () => BudgetSnapshot[];
  hydrateFromRealm: (payload: Partial<Pick<FinanceDomainState, 'accounts' | 'transactions' | 'budgets' | 'budgetEntries' | 'debts' | 'debtPayments' | 'fxRates' | 'counterparties'>>) => void;
  reset: () => void;
}

const generateId = (_prefix: string) => new BSON.ObjectId().toHexString();

const getBaseCurrency = () => useFinancePreferencesStore.getState().baseCurrency;

const convertToBase = (amount: number, fromCurrency: string, baseCurrency: string, rates: FxRate[]): number => {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  if (fromCurrency === baseCurrency) {
    return amount;
  }
  const matchingRate = rates.find((rate) => rate.fromCurrency === fromCurrency && rate.toCurrency === baseCurrency);
  if (matchingRate) {
    return amount * matchingRate.rate;
  }
  return amount;
};

const convertBetweenCurrencies = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (!Number.isFinite(amount) || !fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    return amount;
  }
  const convertAmount = useFinancePreferencesStore.getState().convertAmount;
  try {
    return convertAmount(amount, fromCurrency as FinanceCurrency, toCurrency as FinanceCurrency);
  } catch {
    return amount;
  }
};

const mapDebtAdjustmentFromTransaction = (
  transaction: Transaction,
  debts: Debt[],
): { debt: Debt; amountDebtCurrency: number; amountBaseCurrency: number } | null => {
  const targetId = transaction.debtId ?? transaction.relatedDebtId;
  if (!targetId) {
    return null;
  }
  const debt = debts.find((item) => item.id === targetId);
  if (!debt) {
    return null;
  }
  const sourceAmount = transaction.paidAmount ?? transaction.amount;
  if (!(sourceAmount > 0)) {
    return null;
  }
  const sourceCurrency = transaction.currency ?? debt.principalCurrency;
  const amountDebtCurrency = convertBetweenCurrencies(sourceAmount, sourceCurrency, debt.principalCurrency);
  const amountBaseCurrency = convertBetweenCurrencies(sourceAmount, sourceCurrency, debt.baseCurrency);
  return { debt, amountDebtCurrency, amountBaseCurrency };
};

const resolveGoalLinksForTransaction = (
  transaction: Transaction,
  budgets: Budget[],
  debts: Debt[],
): string[] => {
  const goalIds = new Set<string>();
  if (transaction.goalId) {
    goalIds.add(transaction.goalId);
  }
  if (transaction.budgetId) {
    const budget = budgets.find((item) => item.id === transaction.budgetId && item.linkedGoalId);
    if (budget?.linkedGoalId) {
      goalIds.add(budget.linkedGoalId);
    }
  }
  if (transaction.relatedBudgetId) {
    const budget = budgets.find((item) => item.id === transaction.relatedBudgetId && item.linkedGoalId);
    if (budget?.linkedGoalId) {
      goalIds.add(budget.linkedGoalId);
    }
  }
  budgets.forEach((budget) => {
    if (!budget.linkedGoalId) return;
    const matchesCurrency =
      !transaction.currency ||
      budget.currency === transaction.currency ||
      transaction.baseCurrency === budget.currency;
    if (matchesCurrency) {
      goalIds.add(budget.linkedGoalId);
    }
  });
  if (transaction.debtId) {
    const debt = debts.find((item) => item.id === transaction.debtId && item.linkedGoalId);
    if (debt?.linkedGoalId) {
      goalIds.add(debt.linkedGoalId);
    }
  }
  if (transaction.relatedDebtId) {
    const debt = debts.find((item) => item.id === transaction.relatedDebtId && item.linkedGoalId);
    if (debt?.linkedGoalId) {
      goalIds.add(debt.linkedGoalId);
    }
  }
  return Array.from(goalIds);
};

const applyFinanceContributionToGoals = (
  transaction: Transaction,
  state: Pick<FinanceDomainState, 'budgets' | 'debts'>,
) => {
  const plannerStore = usePlannerDomainStore.getState();
  if (!plannerStore?.addGoalCheckIn || !plannerStore?.updateGoal) {
    return;
  }
  const goalIds = resolveGoalLinksForTransaction(transaction, state.budgets, state.debts);
  if (!goalIds.length) {
    return;
  }
  const dateKey = transaction.date?.slice(0, 10);
  const amountSource = transaction.paidAmount ?? transaction.toAmount ?? transaction.amount;
  const currencySource = transaction.toCurrency ?? transaction.currency ?? getBaseCurrency();

  goalIds.forEach((goalId) => {
    const goal = plannerStore.goals.find((item) => item.id === goalId);
    if (!goal || goal.metricType !== 'amount') {
      return;
    }
    const targetCurrency = goal.currency ?? currencySource;
    const convertedAmount = convertBetweenCurrencies(amountSource, currencySource, targetCurrency);
    const value = Number.isFinite(convertedAmount) ? Math.max(convertedAmount, 0) : Math.max(amountSource, 0);
    if (!(value > 0)) {
      return;
    }

    // Add check-in
    plannerStore.addGoalCheckIn({
      goalId,
      value,
      note: transaction.description,
      sourceId: transaction.id,
      sourceType: 'finance',
      dateKey,
      createdAt: transaction.date,
    });

    // Update goal currentValue (atomic sync) with flag to skip budget sync
    const newCurrentValue = (goal.currentValue ?? 0) + value;
    plannerStore.updateGoal(goalId, {
      currentValue: newCurrentValue,
      __skipBudgetSync: true,
    } as any);
  });
};

const removeFinanceContributionForTransaction = (
  transactionId: string,
  transaction?: Transaction,
  state?: Pick<FinanceDomainState, 'budgets' | 'debts'>,
) => {
  const plannerStore = usePlannerDomainStore.getState();
  if (!plannerStore?.removeFinanceContribution || !plannerStore?.updateGoal) {
    return;
  }

  // Remove check-in
  plannerStore.removeFinanceContribution(transactionId);

  // Rollback goal currentValue if transaction data is provided
  if (transaction && state) {
    const goalIds = resolveGoalLinksForTransaction(transaction, state.budgets, state.debts);
    const amountSource = transaction.paidAmount ?? transaction.toAmount ?? transaction.amount;
    const currencySource = transaction.toCurrency ?? transaction.currency ?? getBaseCurrency();

    goalIds.forEach((goalId) => {
      const goal = plannerStore.goals.find((item) => item.id === goalId);
      if (!goal || goal.metricType !== 'amount') {
        return;
      }
      const targetCurrency = goal.currency ?? currencySource;
      const convertedAmount = convertBetweenCurrencies(amountSource, currencySource, targetCurrency);
      const value = Number.isFinite(convertedAmount) ? Math.max(convertedAmount, 0) : Math.max(amountSource, 0);
      if (!(value > 0)) {
        return;
      }

      // Rollback currentValue with flag to skip budget sync
      const newCurrentValue = Math.max((goal.currentValue ?? 0) - value, 0);
      plannerStore.updateGoal(goalId, {
        currentValue: newCurrentValue,
        __skipBudgetSync: true,
      } as any);
    });
  }
};

const DEFAULT_CATEGORIES: string[] = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Salary',
  'Business',
  'Other',
  'Debt',
];

const createInitialFinanceCollections = () => ({
  accounts: [] as Account[],
  categories: [...DEFAULT_CATEGORIES],
  transactions: [] as Transaction[],
  budgets: [] as Budget[],
  budgetEntries: [] as BudgetEntry[],
  debts: [] as Debt[],
  debtPayments: [] as DebtPayment[],
  fxRates: [] as FxRate[],
  counterparties: [] as Counterparty[],
});

const applyTransactionToAccounts = (
  accounts: Account[],
  transaction: Transaction,
  multiplier: 1 | -1,
  timestamp: string,
): Account[] =>
  accounts.map((account) => {
    let delta = 0;
    if (transaction.type === 'transfer') {
      const fromId = transaction.fromAccountId ?? transaction.accountId;
      if (fromId && account.id === fromId) {
        delta = -transaction.amount;
      } else if (transaction.toAccountId && account.id === transaction.toAccountId) {
        const incoming = transaction.toAmount ?? transaction.amount;
        delta = incoming;
      }
    } else if (transaction.accountId && account.id === transaction.accountId) {
      delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    }
    if (delta === 0) {
      return account;
    }
    return {
      ...account,
      currentBalance: account.currentBalance + delta * multiplier,
      updatedAt: timestamp,
    } satisfies Account;
  });

const buildBudgetEntriesForTransaction = (
  transaction: Transaction,
  budgets: Budget[],
  timestamp: string,
): BudgetEntry[] => {
  if (transaction.type === 'transfer') {
    return [];
  }
  const amount = Math.abs(transaction.amount);
  return budgets
    .filter((budget) => {
      if (transaction.budgetId && budget.id !== transaction.budgetId) {
        return false;
      }
      if (!transaction.currency) {
        return true;
      }
      if (budget.currency === transaction.currency) {
        return true;
      }
      return transaction.baseCurrency === budget.currency;
    })
    .map((budget) => {
      const sameCurrency = budget.currency === transaction.currency;
      const rate = sameCurrency ? 1 : transaction.rateUsedToBase ?? 1;
      const convertedAmount = amount * rate;
      return {
        id: generateId('bentry'),
        budgetId: budget.id,
        transactionId: transaction.id,
        appliedAmountBudgetCurrency: convertedAmount,
        rateUsedTxnToBudget: rate,
        snapshottedAt: timestamp,
      } satisfies BudgetEntry;
    });
};

const recalcBudgetsFromEntries = (budgets: Budget[], entries: BudgetEntry[], timestamp: string): Budget[] =>
  budgets.map((budget) => {
    const appliedEntries = entries.filter((entry) => entry.budgetId === budget.id);
    if (appliedEntries.length === 0) {
      const baselineBalance =
        budget.transactionType === 'income'
          ? budget.limitAmount
          : Math.max(0, budget.limitAmount);
      return {
        ...budget,
        spentAmount: 0,
        contributionTotal: 0,
        currentBalance: baselineBalance,
        remainingAmount: baselineBalance,
        percentUsed: 0,
        updatedAt: timestamp,
      };
    }
    const spentAmount = appliedEntries.reduce((sum, entry) => sum + entry.appliedAmountBudgetCurrency, 0);
    const isIncomeBudget = budget.transactionType === 'income';
    const remainingAmount = isIncomeBudget
      ? budget.limitAmount + spentAmount
      : Math.max(0, budget.limitAmount - spentAmount);
    const percentUsed = budget.limitAmount > 0
      ? isIncomeBudget
        ? spentAmount / budget.limitAmount
        : spentAmount / budget.limitAmount
      : 0;
    const currentBalance = isIncomeBudget ? remainingAmount : remainingAmount;
    return {
      ...budget,
      spentAmount,
      remainingAmount,
      percentUsed,
      contributionTotal: spentAmount,
      currentBalance,
      updatedAt: timestamp,
    } satisfies Budget;
  });

const removeBudgetEntriesForTransaction = (entries: BudgetEntry[], transactionId: string): BudgetEntry[] =>
  entries.filter((entry) => entry.transactionId !== transactionId);

const persistChangedAccounts = (updatedAccounts: Account[]) => {
  if (!updatedAccounts.length) {
    return;
  }
  const { accounts: accountDao } = getFinanceDaoRegistry();
  updatedAccounts.forEach((account) => {
    accountDao.update(account.id, {
      currentBalance: account.currentBalance,
      updatedAt: account.updatedAt,
    });
  });
};

const resolveDebtStatus = (debt: Debt): DebtStatus => {
  if (debt.principalAmount <= 0) {
    return 'paid';
  }
  if (debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'paid') {
    return 'overdue';
  }
  return debt.status;
};

const syncLinkedGoalFromBudget = (budget: Budget, previousLinkedGoalId?: string | null) => {
  const plannerStore = usePlannerDomainStore.getState();
  if (!plannerStore?.updateGoal) {
    return;
  }
  const prevGoalId = previousLinkedGoalId ?? null;
  const nextGoalId = budget.linkedGoalId ?? null;
  if (prevGoalId && prevGoalId !== nextGoalId) {
    plannerStore.updateGoal(prevGoalId, {
      linkedBudgetId: undefined,
      __skipBudgetSync: true,
    } as any);
  }
  if (nextGoalId) {
    const goal = plannerStore.goals.find((g) => g.id === nextGoalId);
    const nextUpdates: any = {
      linkedBudgetId: budget.id,
      currency: budget.currency,
      __skipBudgetSync: true,
    };
    if (goal && goal.targetValue !== budget.limitAmount) {
      nextUpdates.targetValue = budget.limitAmount;
    }
    plannerStore.updateGoal(nextGoalId, {
      ...nextUpdates,
    } as any);
  }
};

export const useFinanceDomainStore = create<FinanceDomainState>((set, get) => ({
      ...createInitialFinanceCollections(),

      createAccount: (payload) => {
        const { accounts: accountDao } = getFinanceDaoRegistry();
        const created = accountDao.create({
          name: payload.name,
          accountType: payload.accountType,
          currency: payload.currency,
          initialBalance: payload.initialBalance,
          linkedGoalId: payload.linkedGoalId,
          customTypeId: payload.customTypeId,
          isArchived: payload.isArchived,
        });
        set((state) => ({
          accounts: [...state.accounts.filter((acc) => acc.id !== created.id), created],
        }));
        return created;
      },

      updateAccount: (accountId, updates) => {
        const { accounts: accountDao } = getFinanceDaoRegistry();
        const updated = accountDao.update(accountId, updates);
        if (!updated) {
          return;
        }
        set((state) => ({
          accounts: state.accounts.map((account) => (account.id === accountId ? updated : account)),
        }));
      },

      deleteAccount: (accountId) => {
        const { accounts: accountDao } = getFinanceDaoRegistry();
        accountDao.delete(accountId);
        set((state) => ({
          accounts: state.accounts.filter((account) => account.id !== accountId),
          transactions: state.transactions.filter(
            (txn) =>
              txn.accountId !== accountId &&
              txn.fromAccountId !== accountId &&
              txn.toAccountId !== accountId,
          ),
        }));
      },

      archiveAccount: (accountId) => {
        const { accounts: accountDao } = getFinanceDaoRegistry();
        accountDao.archive(accountId, true);
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === accountId ? { ...account, isArchived: true } : account,
          ),
        }));
      },

      clearCustomTypeFromAccounts: (customTypeId) => {
        const { accounts: accountDao } = getFinanceDaoRegistry();
        set((state) => ({
          accounts: state.accounts.map((account) => {
            if (account.customTypeId === customTypeId) {
              // Update in Realm
              accountDao.update(account.id, { customTypeId: undefined, accountType: 'other' });
              // Return updated account
              return { ...account, customTypeId: undefined, accountType: 'other' };
            }
            return account;
          }),
        }));
      },

      createTransaction: (payload) => {
        const baseCurrency = payload.baseCurrency ?? getBaseCurrency();
        const rateUsedToBase = payload.rateUsedToBase ?? 1;
        const convertedAmountToBase = payload.convertedAmountToBase ?? payload.amount * rateUsedToBase;
        const { transactions: txnDao, budgets: budgetDao } = getFinanceDaoRegistry();
        const prevAccounts = get().accounts;
        const created = txnDao.create({
          ...payload,
          baseCurrency,
          rateUsedToBase,
          convertedAmountToBase,
        });
        const timestamp = created.updatedAt;
        const newEntries = buildBudgetEntriesForTransaction(created, get().budgets, timestamp);
        const persistedEntries = newEntries.map((entry) => budgetDao.recordEntry(entry));
        const nextAccountsSnapshot: Account[] = [];
        set((state) => {
          const nextAccounts = applyTransactionToAccounts(state.accounts, created, 1, timestamp);
          const nextBudgetEntries = [...state.budgetEntries, ...persistedEntries];
          const updatedBudgets = recalcBudgetsFromEntries(state.budgets, nextBudgetEntries, timestamp);
          const debtAdjustment = mapDebtAdjustmentFromTransaction(created, state.debts);
          let updatedDebts = state.debts;
          if (debtAdjustment) {
            const nextPrincipal = Math.max(0, debtAdjustment.debt.principalAmount - debtAdjustment.amountDebtCurrency);
            const nextBase = Math.max(0, debtAdjustment.debt.principalBaseValue - debtAdjustment.amountBaseCurrency);
            const normalizedStatus = resolveDebtStatus({
              ...debtAdjustment.debt,
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
            });
            const updatedDebt: Debt = {
              ...debtAdjustment.debt,
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
              status: normalizedStatus,
              updatedAt: timestamp,
            };
            const { debts: debtDao } = getFinanceDaoRegistry();
            debtDao.update(updatedDebt.id, {
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
              status: normalizedStatus,
              updatedAt: timestamp,
            });
            updatedDebts = state.debts.map((debt) => (debt.id === updatedDebt.id ? updatedDebt : debt));
          }
          nextAccountsSnapshot.push(...nextAccounts);
          return {
            accounts: nextAccounts,
            transactions: [created, ...state.transactions],
            budgetEntries: nextBudgetEntries,
            budgets: updatedBudgets,
            debts: updatedDebts,
          };
        });
        const changedAccounts = nextAccountsSnapshot.filter((account) => {
          const previous = prevAccounts.find((item) => item.id === account.id);
          return previous && previous.currentBalance !== account.currentBalance;
        });
        persistChangedAccounts(changedAccounts);
        plannerEventBus.publish('finance.tx.created', { transaction: created });
        applyFinanceContributionToGoals(created, { budgets: get().budgets, debts: get().debts });
        return created;
      },

      updateTransaction: (id, updates) => {
        const existing = get().transactions.find((transaction) => transaction.id === id);
        if (!existing) {
          return;
        }
        const amount = updates.amount ?? existing.amount;
        const rateUsedToBase = updates.rateUsedToBase ?? existing.rateUsedToBase ?? 1;
        const baseCurrency = updates.baseCurrency ?? existing.baseCurrency ?? getBaseCurrency();
        const convertedAmountToBase = updates.convertedAmountToBase ?? amount * rateUsedToBase;
        const { transactions: txnDao, budgets: budgetDao } = getFinanceDaoRegistry();
        const prevAccounts = get().accounts;
        const updated = txnDao.update(id, {
          ...updates,
          baseCurrency,
          rateUsedToBase,
          convertedAmountToBase,
        });
        if (!updated) {
          return;
        }
        removeFinanceContributionForTransaction(id);
        budgetDao.removeEntriesForTransaction(id);
        const timestamp = updated.updatedAt;
        const newEntries = buildBudgetEntriesForTransaction(updated, get().budgets, timestamp);
        const persistedEntries = newEntries.map((entry) => budgetDao.recordEntry(entry));
        const nextAccountsSnapshot: Account[] = [];
        set((state) => {
          const revertedAccounts = applyTransactionToAccounts(state.accounts, existing, -1, timestamp);
          const nextAccounts = applyTransactionToAccounts(revertedAccounts, updated, 1, timestamp);
          const filteredEntries = removeBudgetEntriesForTransaction(state.budgetEntries, id);
          const nextBudgetEntries = [...filteredEntries, ...persistedEntries];
          const updatedBudgets = recalcBudgetsFromEntries(state.budgets, nextBudgetEntries, timestamp);
          const revertAdjustment = mapDebtAdjustmentFromTransaction(existing, state.debts);
          const applyAdjustment = mapDebtAdjustmentFromTransaction(updated, state.debts);
          let adjustedDebts = state.debts;
          const { debts: debtDao } = getFinanceDaoRegistry();
          if (revertAdjustment) {
            const nextPrincipal = revertAdjustment.debt.principalAmount + revertAdjustment.amountDebtCurrency;
            const nextBase = revertAdjustment.debt.principalBaseValue + revertAdjustment.amountBaseCurrency;
            const normalizedStatus = resolveDebtStatus({
              ...revertAdjustment.debt,
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
            });
            const debtUpdated: Debt = {
              ...revertAdjustment.debt,
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
              status: normalizedStatus,
              updatedAt: timestamp,
            };
            debtDao.update(debtUpdated.id, {
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
              status: normalizedStatus,
              updatedAt: timestamp,
            });
            adjustedDebts = adjustedDebts.map((debt) => (debt.id === debtUpdated.id ? debtUpdated : debt));
          }
          if (applyAdjustment) {
            const nextPrincipal = Math.max(0, (adjustedDebts.find((item) => item.id === applyAdjustment.debt.id)?.principalAmount ?? applyAdjustment.debt.principalAmount) - applyAdjustment.amountDebtCurrency);
            const nextBase = Math.max(0, (adjustedDebts.find((item) => item.id === applyAdjustment.debt.id)?.principalBaseValue ?? applyAdjustment.debt.principalBaseValue) - applyAdjustment.amountBaseCurrency);
            const normalizedStatus = resolveDebtStatus({
              ...applyAdjustment.debt,
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
            });
            const debtUpdated: Debt = {
              ...applyAdjustment.debt,
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
              status: normalizedStatus,
              updatedAt: timestamp,
            };
            debtDao.update(debtUpdated.id, {
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
              status: normalizedStatus,
              updatedAt: timestamp,
            });
            adjustedDebts = adjustedDebts.map((debt) => (debt.id === debtUpdated.id ? debtUpdated : debt));
          }
          nextAccountsSnapshot.push(...nextAccounts);
          return {
            accounts: nextAccounts,
            transactions: state.transactions.map((transaction) =>
              transaction.id === id ? updated : transaction,
            ),
            budgetEntries: nextBudgetEntries,
            budgets: updatedBudgets,
            debts: adjustedDebts,
          };
        });
        const changedAccounts = nextAccountsSnapshot.filter((account) => {
          const previous = prevAccounts.find((item) => item.id === account.id);
          return previous && previous.currentBalance !== account.currentBalance;
        });
        persistChangedAccounts(changedAccounts);
        applyFinanceContributionToGoals(updated, { budgets: get().budgets, debts: get().debts });
        plannerEventBus.publish('finance.tx.updated', { transaction: updated });
      },

      deleteTransaction: (id) => {
        const existing = get().transactions.find((txn) => txn.id === id);
        if (!existing) {
          return;
        }
        const { transactions: txnDao, budgets: budgetDao } = getFinanceDaoRegistry();
        const prevAccounts = get().accounts;
        txnDao.delete(id);
        budgetDao.removeEntriesForTransaction(id);
        const timestamp = new Date().toISOString();
        const nextAccountsSnapshot: Account[] = [];
        set((state) => {
          const revertedAccounts = applyTransactionToAccounts(state.accounts, existing, -1, timestamp);
          const nextBudgetEntries = removeBudgetEntriesForTransaction(state.budgetEntries, id);
          const updatedBudgets = recalcBudgetsFromEntries(state.budgets, nextBudgetEntries, timestamp);
          const debtAdjustment = mapDebtAdjustmentFromTransaction(existing, state.debts);
          let updatedDebts = state.debts;
          if (debtAdjustment) {
            const nextPrincipal = debtAdjustment.debt.principalAmount + debtAdjustment.amountDebtCurrency;
            const nextBase = debtAdjustment.debt.principalBaseValue + debtAdjustment.amountBaseCurrency;
            const normalizedStatus = resolveDebtStatus({
              ...debtAdjustment.debt,
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
            });
            const debtUpdated: Debt = {
              ...debtAdjustment.debt,
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
              status: normalizedStatus,
              updatedAt: timestamp,
            };
            const { debts: debtDao } = getFinanceDaoRegistry();
            debtDao.update(debtUpdated.id, {
              principalAmount: nextPrincipal,
              principalBaseValue: nextBase,
              status: normalizedStatus,
              updatedAt: timestamp,
            });
            updatedDebts = state.debts.map((debt) => (debt.id === debtUpdated.id ? debtUpdated : debt));
          }
          nextAccountsSnapshot.push(...revertedAccounts);
          return {
            accounts: revertedAccounts,
            transactions: state.transactions.filter((txn) => txn.id !== id),
            budgetEntries: nextBudgetEntries,
            budgets: updatedBudgets,
            debts: updatedDebts,
          };
        });
        const changedAccounts = nextAccountsSnapshot.filter((account) => {
          const previous = prevAccounts.find((item) => item.id === account.id);
          return previous && previous.currentBalance !== account.currentBalance;
        });
        persistChangedAccounts(changedAccounts);
        removeFinanceContributionForTransaction(id, existing, { budgets: get().budgets, debts: get().debts });
      },

      addCategory: (name) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed || state.categories.includes(trimmed)) {
            return state;
          }
          return {
            categories: [...state.categories, trimmed],
          };
        }),

      renameCategory: (previous, next) =>
        set((state) => {
          const trimmed = next.trim();
          if (!trimmed || trimmed === previous) {
            return state;
          }
          const nowIso = new Date().toISOString();
          return {
            categories: state.categories.map((category) => (category === previous ? trimmed : category)),
            transactions: state.transactions.map((transaction) =>
              transaction.categoryId === previous
                ? { ...transaction, categoryId: trimmed, updatedAt: nowIso }
                : transaction,
            ),
          };
        }),

      createCounterparty: (displayName, options) => {
        const normalizedName = displayName.trim();
        if (!normalizedName) {
          const err = new Error('COUNTERPARTY_NAME_REQUIRED');
          err.name = 'COUNTERPARTY_NAME_REQUIRED';
          throw err;
        }
        const lower = normalizedName.toLowerCase();
        const existing = get().counterparties.find(
          (party) => party.displayName.toLowerCase() === lower,
        );
        if (existing) {
          if (options?.reuseIfExists === false) {
            const err = new Error('COUNTERPARTY_DUPLICATE');
            err.name = 'COUNTERPARTY_DUPLICATE';
            throw err;
          }
          return existing;
        }
        const { counterparties: counterpartyDao } = getFinanceDaoRegistry();
        const created = counterpartyDao.create({
          displayName: normalizedName,
          searchKeywords: lower,
        });
        set((state) => ({
          counterparties: [created, ...state.counterparties],
        }));
        return created;
      },

      renameCounterparty: (id, displayName) => {
        const trimmed = displayName.trim();
        if (!trimmed) {
          const err = new Error('COUNTERPARTY_NAME_REQUIRED');
          err.name = 'COUNTERPARTY_NAME_REQUIRED';
          throw err;
        }
        const lower = trimmed.toLowerCase();
        const duplicate = get().counterparties.find(
          (party) => party.displayName.toLowerCase() === lower && party.id !== id,
        );
        if (duplicate) {
          const err = new Error('COUNTERPARTY_DUPLICATE');
          err.name = 'COUNTERPARTY_DUPLICATE';
          throw err;
        }
        const { counterparties: counterpartyDao } = getFinanceDaoRegistry();
        const updated = counterpartyDao.update(id, {
          displayName: trimmed,
          searchKeywords: lower,
        });
        if (!updated) {
          throw new Error('Counterparty not found');
        }
        set((state) => ({
          counterparties: state.counterparties.map((party) =>
            party.id === id ? updated : party,
          ),
          debts: state.debts.map((debt) =>
            debt.counterpartyId === id ? { ...debt, counterpartyName: trimmed } : debt,
          ),
        }));
        return updated;
      },

      deleteCounterparty: (id) => {
        if (get().debts.some((debt) => debt.counterpartyId === id)) {
          const err = new Error('COUNTERPARTY_IN_USE');
          err.name = 'COUNTERPARTY_IN_USE';
          throw err;
        }
        const { counterparties: counterpartyDao } = getFinanceDaoRegistry();
        counterpartyDao.delete(id);
        set((state) => ({
          counterparties: state.counterparties.filter((party) => party.id !== id),
        }));
      },

      createBudget: (payload) => {
        const { budgets: budgetDao } = getFinanceDaoRegistry();
        const created = budgetDao.create(payload as BudgetCreateInput);
        set((state) => ({ budgets: [...state.budgets.filter((budget) => budget.id !== created.id), created] }));
        syncLinkedGoalFromBudget(created);
        return created;
      },

      updateBudget: (id, updates) => {
        const { budgets: budgetDao } = getFinanceDaoRegistry();
        const previous = get().budgets.find((budget) => budget.id === id);
        const updated = budgetDao.update(id, updates);
        if (!updated) {
          return;
        }
        set((state) => ({
          budgets: state.budgets.map((budget) => (budget.id === id ? updated : budget)),
        }));
        syncLinkedGoalFromBudget(updated, previous?.linkedGoalId);
        plannerEventBus.publish('finance.budget.updated', { budget: updated });
      },

      archiveBudget: (id) => {
        const budget = get().budgets.find((b) => b.id === id);

        // Unlink goal before archiving
        if (budget?.linkedGoalId) {
          const plannerStore = usePlannerDomainStore.getState();
          if (plannerStore?.updateGoal) {
            plannerStore.updateGoal(budget.linkedGoalId, {
              linkedBudgetId: undefined,
            });
          }
        }

        const { budgets: budgetDao } = getFinanceDaoRegistry();
        budgetDao.archive(id, true);
        set((state) => ({
          budgets: state.budgets.map((budget) =>
            budget.id === id ? { ...budget, isArchived: true } : budget,
          ),
        }));
      },

      createDebt: (payload) => {
        const { debts: debtDao } = getFinanceDaoRegistry();
        const { fundingOverrideAmount, ...debtPayload } = payload;
        const baseCurrency = debtPayload.baseCurrency ?? getBaseCurrency();
        const nowIso = new Date().toISOString();
        const principalOriginalAmount =
          debtPayload.principalOriginalAmount ?? debtPayload.principalAmount;
        const principalOriginalCurrency =
          debtPayload.principalOriginalCurrency ?? debtPayload.principalCurrency;
        const resolvedPrincipal = debtPayload.principalAmount ?? principalOriginalAmount;
        const principalBaseValueExplicit = convertBetweenCurrencies(
          principalOriginalAmount,
          principalOriginalCurrency,
          baseCurrency,
        );
        const rateOnStart =
          debtPayload.rateOnStart ??
          (principalOriginalAmount ? principalBaseValueExplicit / principalOriginalAmount : 1);

        let created = debtDao.create({
          ...debtPayload,
          principalAmount: resolvedPrincipal,
          principalOriginalAmount,
          principalOriginalCurrency,
          principalBaseValue: debtPayload.principalBaseValue ?? principalBaseValueExplicit,
          baseCurrency,
          rateOnStart,
          status: debtPayload.status ?? 'active',
        });

        if (debtPayload.fundingAccountId && principalOriginalAmount) {
          const account = get().accounts.find((acc) => acc.id === debtPayload.fundingAccountId);
          if (account) {
            const accountCurrency = account.currency;
            const amountInAccountCurrency =
              typeof fundingOverrideAmount === 'number' && Number.isFinite(fundingOverrideAmount)
                ? fundingOverrideAmount
                : convertBetweenCurrencies(
                    principalOriginalAmount,
                    principalOriginalCurrency,
                    accountCurrency,
                  );
            const fundingTransaction = get().createTransaction({
              userId: debtPayload.userId,
              type: debtPayload.direction === 'they_owe_me' ? 'expense' : 'income',
              accountId: account.id,
              amount: amountInAccountCurrency,
              currency: accountCurrency,
              baseCurrency: accountCurrency,
              rateUsedToBase: 1,
              convertedAmountToBase: amountInAccountCurrency,
              description: debtPayload.description ?? `Debt • ${debtPayload.counterpartyName}`,
              date: debtPayload.startDate ?? nowIso,
              debtId: created.id,
              budgetId: debtPayload.linkedBudgetId,
              goalId: debtPayload.linkedGoalId,
              goalName: debtPayload.counterpartyName,
              goalType: 'financial',
              relatedBudgetId: debtPayload.linkedBudgetId,
              relatedDebtId: created.id,
              plannedAmount: resolvedPrincipal,
              paidAmount: amountInAccountCurrency,
            });
            const patched = debtDao.update(created.id, {
              fundingTransactionId: fundingTransaction.id,
            });
            if (patched) {
              created = patched;
            } else {
              created = { ...created, fundingTransactionId: fundingTransaction.id };
            }
          }
        }

        const normalizedStatus = resolveDebtStatus(created);
        if (normalizedStatus !== created.status) {
          const patched = debtDao.update(created.id, { status: normalizedStatus });
          if (patched) {
            created = patched;
          } else {
            created = { ...created, status: normalizedStatus };
          }
        }

        set((state) => ({ debts: [...state.debts.filter((debt) => debt.id !== created.id), created] }));
        return created;
      },

      updateDebt: (id, updates) => {
        const existing = get().debts.find((debt) => debt.id === id);
        if (!existing) {
          return;
        }
        const merged: Debt = {
          ...existing,
          ...updates,
        };
        const normalizedStatus = resolveDebtStatus(merged);
        const { debts: debtDao } = getFinanceDaoRegistry();
        const updated = debtDao.update(id, { ...updates, status: normalizedStatus });
        if (!updated) {
          return;
        }
        set((state) => ({
          debts: state.debts.map((debt) => (debt.id === id ? updated : debt)),
        }));
      },

      deleteDebt: (id) => {
        const state = get();
        const debt = state.debts.find((item) => item.id === id);
        if (!debt) {
          return;
        }
        const paymentTransactionIds = state.debtPayments
          .filter((payment) => payment.debtId === id)
          .map((payment) => payment.relatedTransactionId)
          .filter((txnId): txnId is string => Boolean(txnId));
        const linkedTransactions = [debt.fundingTransactionId, ...paymentTransactionIds].filter(
          (txnId): txnId is string => Boolean(txnId),
        );
        linkedTransactions.forEach((txnId) => {
          state.deleteTransaction(txnId);
        });
        const { debts: debtDao } = getFinanceDaoRegistry();
        debtDao.delete(id);
        set((current) => ({
          debts: current.debts.filter((item) => item.id !== id),
          debtPayments: current.debtPayments.filter((payment) => payment.debtId !== id),
        }));
      },

      addDebtPayment: (payload) => {
        const nowIso = new Date().toISOString();
        const debt = get().debts.find((item) => item.id === payload.debtId);
        if (!debt) {
          throw new Error('Debt not found');
        }
        const paymentCurrency = payload.currency;
        const baseCurrency = debt.baseCurrency;
        const convertedAmountToDebtExplicit = convertBetweenCurrencies(
          payload.amount,
          paymentCurrency,
          debt.principalCurrency,
        );
        const convertedAmountToBaseExplicit = convertBetweenCurrencies(
          payload.amount,
          paymentCurrency,
          baseCurrency,
        );
        const convertedAmountToDebt = payload.convertedAmountToDebt ?? convertedAmountToDebtExplicit;
        const convertedAmountToBase = payload.convertedAmountToBase ?? convertedAmountToBaseExplicit;
        const rateUsedToDebt =
          payload.rateUsedToDebt ??
          (payload.amount !== 0 ? convertedAmountToDebt / payload.amount : 1);
        const rateUsedToBase =
          payload.rateUsedToBase ??
          (payload.amount !== 0 ? convertedAmountToBase / payload.amount : 1);

        let relatedTransactionId: string | undefined;
        const targetAccountId = payload.accountId ?? debt.fundingAccountId;
        if (targetAccountId) {
          const account = get().accounts.find((acc) => acc.id === targetAccountId);
        if (account) {
          const amountInAccountCurrency = convertBetweenCurrencies(
            payload.amount,
            paymentCurrency,
            account.currency,
          );
          const transaction = get().createTransaction({
            userId: debt.userId,
            type: debt.direction === 'they_owe_me' ? 'income' : 'expense',
            accountId: account.id,
            amount: amountInAccountCurrency,
            currency: account.currency,
            baseCurrency: account.currency,
            rateUsedToBase: 1,
            convertedAmountToBase: amountInAccountCurrency,
            description: payload.note ?? debt.description ?? `Debt payment • ${debt.counterpartyName}`,
            date: payload.paymentDate,
            debtId: debt.id,
            budgetId: debt.linkedBudgetId,
            goalId: debt.linkedGoalId,
            goalName: debt.counterpartyName,
            goalType: 'financial',
            relatedBudgetId: debt.linkedBudgetId,
            relatedDebtId: debt.id,
            plannedAmount: debt.principalAmount,
            paidAmount: payload.amount,
          });
          relatedTransactionId = transaction.id;
        }
      }

        const payment: DebtPayment = {
          ...payload,
          id: generateId('dpay'),
          baseCurrency,
          rateUsedToBase,
          convertedAmountToBase,
          rateUsedToDebt,
          convertedAmountToDebt,
          relatedTransactionId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const nextPrincipal = Math.max(0, debt.principalAmount - convertedAmountToDebt);
        const nextPrincipalBaseValue = Math.max(0, debt.principalBaseValue - convertedAmountToBase);
        const nextDebt: Debt = {
          ...debt,
          principalAmount: nextPrincipal,
          principalBaseValue: nextPrincipalBaseValue,
          updatedAt: nowIso,
        };
        const normalizedStatus = resolveDebtStatus(nextDebt);
        const { debts: debtDao } = getFinanceDaoRegistry();
        debtDao.addPayment(debt.id, payment);
        const refreshed = debtDao.update(debt.id, {
          principalAmount: nextPrincipal,
          principalBaseValue: nextPrincipalBaseValue,
          status: normalizedStatus,
        });
        const patchedDebt = refreshed ?? { ...nextDebt, status: normalizedStatus };

        set((state) => ({
          debts: state.debts.map((item) => (item.id === debt.id ? patchedDebt : item)),
          debtPayments: [payment, ...state.debtPayments],
        }));
        return payment;
      },

      overrideFxRate: (payload) => {
        const nowIso = new Date().toISOString();
        const rate: FxRate = {
          ...payload,
          id: generateId('fx'),
          isOverridden: payload.isOverridden ?? true,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        set((state) => ({
          fxRates: [rate, ...state.fxRates.filter((fx) => !(fx.date === rate.date && fx.fromCurrency === rate.fromCurrency && fx.toCurrency === rate.toCurrency))],
        }));
        return rate;
      },

      getRate: (date, from, to) => {
        if (from === to) {
          return 1;
        }
        const match = get().fxRates.find((rate) => rate.date === date.toISOString().slice(0, 10) && rate.fromCurrency === from && rate.toCurrency === to);
        if (match) {
          return match.rate;
        }
        return 1;
      },

      getFinanceSummaryDaily: (date) => {
        const baseCurrency = getBaseCurrency();
        const dayIso = date.toISOString().slice(0, 10);
        const rates = get().fxRates;
        const dayTransactions = get().transactions.filter((txn) => txn.date.slice(0, 10) === dayIso);
        const income = dayTransactions
          .filter((txn) => txn.type === 'income')
          .reduce((sum, txn) => sum + convertToBase(txn.amount, txn.currency, baseCurrency, rates), 0);
        const expenses = dayTransactions
          .filter((txn) => txn.type === 'expense')
          .reduce((sum, txn) => sum + convertToBase(txn.amount, txn.currency, baseCurrency, rates), 0);
        return {
          date: dayIso,
          baseCurrency,
          income,
          expenses,
          net: income - expenses,
          transactions: dayTransactions.length,
        } satisfies FinanceSummaryDaily;
      },

      getFinanceSummaryMonthly: (month, year) => {
        const baseCurrency = getBaseCurrency();
        const rates = get().fxRates;
        const monthlyTransactions = get().transactions.filter((txn) => {
          const date = new Date(txn.date);
          return date.getMonth() === month && date.getFullYear() === year;
        });
        const income = monthlyTransactions
          .filter((txn) => txn.type === 'income')
          .reduce((sum, txn) => sum + convertToBase(txn.amount, txn.currency, baseCurrency, rates), 0);
        const expenses = monthlyTransactions
          .filter((txn) => txn.type === 'expense')
          .reduce((sum, txn) => sum + convertToBase(txn.amount, txn.currency, baseCurrency, rates), 0);
        const days = new Set(monthlyTransactions.map((txn) => txn.date.slice(0, 10))).size || 1;
        return {
          month,
          year,
          baseCurrency,
          income,
          expenses,
          net: income - expenses,
          averageDailySpend: expenses / days,
        } satisfies FinanceSummaryMonthly;
      },

      getOutstandingDebts: () => {
        const baseCurrency = getBaseCurrency();
        return get().debts.map((debt) => {
          const baseAmount = convertBetweenCurrencies(
            debt.principalAmount,
            debt.principalCurrency,
            baseCurrency,
          );
          return {
            id: debt.id,
            counterpartyName: debt.counterpartyName,
            remainingAmount: debt.principalAmount,
            currency: debt.principalCurrency,
            baseAmount,
            direction: debt.direction,
            status: debt.status,
            dueDate: debt.dueDate,
          } satisfies OutstandingDebt;
        });
      },

      getBudgetSnapshots: () =>
        get().budgets.map((budget) => ({
          id: budget.id,
          name: budget.name,
          spentAmount: budget.spentAmount,
          limitAmount: budget.limitAmount,
          remainingAmount: budget.remainingAmount,
          percentUsed: budget.percentUsed,
          currency: budget.currency,
          periodStart: budget.startDate,
          periodEnd: budget.endDate,
          budgetType: budget.budgetType,
        } satisfies BudgetSnapshot)),
      hydrateFromRealm: (payload) =>
        set((state) => ({
          ...state,
          ...payload,
        })),
      reset: () => set(createInitialFinanceCollections()),
}));

plannerEventBus.subscribe('planner.goal.updated', ({ goal }) => {
  const financeStore = useFinanceDomainStore.getState();
  if (goal.linkedBudgetId) {
    financeStore.updateBudget(goal.linkedBudgetId, {
      linkedGoalId: goal.id,
      limitAmount: Number.isFinite(goal.targetValue ?? NaN) ? goal.targetValue : undefined,
    });
  }
  if (goal.linkedDebtId) {
    financeStore.updateDebt(goal.linkedDebtId, { linkedGoalId: goal.id });
  }
  const relatedTransactions = financeStore.transactions.filter((txn) => txn.goalId === goal.id);
  relatedTransactions.forEach((txn) => {
    financeStore.updateTransaction(txn.id, {
      goalName: goal.title,
      goalType: goal.goalType,
      plannedAmount: goal.targetValue ?? txn.plannedAmount,
      relatedBudgetId: goal.linkedBudgetId ?? txn.relatedBudgetId,
      relatedDebtId: goal.linkedDebtId ?? txn.relatedDebtId,
    });
  });
});

plannerEventBus.subscribe('planner.goal.created', ({ goal }) => {
  if (!goal.linkedBudgetId && !goal.linkedDebtId) {
    return;
  }
  const financeStore = useFinanceDomainStore.getState();
  if (goal.linkedBudgetId) {
    financeStore.updateBudget(goal.linkedBudgetId, { linkedGoalId: goal.id });
  }
  if (goal.linkedDebtId) {
    financeStore.updateDebt(goal.linkedDebtId, { linkedGoalId: goal.id });
  }
});
