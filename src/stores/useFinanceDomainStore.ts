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
import type { ShowStatus } from '@/domain/shared/showStatus';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { getFinanceDaoRegistry } from '@/database/dao/financeDaoRegistry';
import type { BudgetCreateInput } from '@/database/dao/FinanceDAO';
import { plannerEventBus } from '@/events/plannerEventBus';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { FxService } from '@/services/fx/FxService';

type CreateDebtInput = Omit<
  Debt,
  'id' | 'status' | 'principalBaseValue' | 'createdAt' | 'updatedAt' | 'fundingTransactionId'
> & {
  fundingOverrideAmount?: number;
  // Optional - will use defaults if not provided
  status?: Debt['status'];
  principalBaseValue?: number;
};

type CounterpartyOptions = {
  reuseIfExists?: boolean;
  phoneNumber?: string;
  comment?: string;
};

type AddDebtPaymentInput = Omit<
  DebtPayment,
  'id' | 'baseCurrency' | 'convertedAmountToBase' | 'convertedAmountToDebt' | 'rateUsedToBase' | 'rateUsedToDebt' | 'createdAt' | 'updatedAt' | 'relatedTransactionId'
> & {
  // These are optional - will be calculated if not provided
  rateUsedToBase?: number;
  rateUsedToDebt?: number;
  convertedAmountToBase?: number;
  convertedAmountToDebt?: number;
};

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
  batchArchiveBudgets: (ids: string[]) => void;
  deleteBudgetPermanently: (id: string) => void;
  batchDeleteBudgetsPermanently: (ids: string[]) => void;
  // Soft-delete for undo functionality
  batchSoftDeleteBudgets: (ids: string[]) => Budget[];
  batchUndoDeleteBudgets: (budgets: Budget[]) => void;
  // Transaction soft-delete with balance reversal
  softDeleteTransaction: (id: string) => Transaction | null;
  batchSoftDeleteTransactions: (ids: string[]) => Transaction[];
  undoDeleteTransaction: (snapshot: Transaction) => void;
  batchUndoDeleteTransactions: (snapshots: Transaction[]) => void;
  // Account soft-delete
  softDeleteAccount: (id: string) => Account | null;
  batchSoftDeleteAccounts: (ids: string[]) => Account[];
  undoDeleteAccount: (snapshot: Account) => void;
  batchUndoDeleteAccounts: (snapshots: Account[]) => void;
  // Debt soft-delete
  softDeleteDebt: (id: string) => Debt | null;
  batchSoftDeleteDebts: (ids: string[]) => Debt[];
  undoDeleteDebt: (snapshot: Debt) => void;
  batchUndoDeleteDebts: (snapshots: Debt[]) => void;
  createDebt: (payload: CreateDebtInput) => Debt;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (payload: AddDebtPaymentInput) => DebtPayment;
  searchCounterparties: (query: string) => Counterparty[];
  createCounterparty: (displayName: string, options?: CounterpartyOptions) => Counterparty;
  updateCounterparty: (id: string, updates: { displayName?: string; phoneNumber?: string; comment?: string }) => Counterparty;
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

// Summani valyutaga qarab yaxlitlash (UZS: 0 kasr, boshqalar: 2 kasr)
const roundAmountForCurrency = (amount: number, currency: string): number => {
  if (!Number.isFinite(amount)) return 0;
  const decimals = currency === 'UZS' ? 0 : 2;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
};

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

const getFxRateForPair = (fxRates: FxRate[], fromCurrency: string, toCurrency: string): number | null => {
  if (!fromCurrency || !toCurrency) {
    return null;
  }
  if (fromCurrency === toCurrency) {
    return 1;
  }
  const normalizeRate = (rate: FxRate): number => {
    const nominal = rate.nominal ?? 1;
    if (!Number.isFinite(rate.rate) || nominal <= 0) {
      return rate.rate ?? 1;
    }
    return rate.rate / nominal;
  };
  const direct = fxRates.find(
    (rate) => rate.fromCurrency === fromCurrency && rate.toCurrency === toCurrency,
  );
  if (direct) {
    return normalizeRate(direct);
  }
  const inverse = fxRates.find(
    (rate) => rate.fromCurrency === toCurrency && rate.toCurrency === fromCurrency,
  );
  if (inverse) {
    const normalizedInverse = normalizeRate(inverse);
    if (normalizedInverse !== 0) {
      return 1 / normalizedInverse;
    }
  }
  return null;
};

const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  fxRates: FxRate[],
): number => {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    return amount;
  }

  const rate = getFxRateForPair(fxRates, fromCurrency, toCurrency);
  if (rate !== null) {
    return amount * rate;
  }

  return convertBetweenCurrencies(amount, fromCurrency, toCurrency);
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

  // For debt payments, paidAmount is ALWAYS in debt's principal currency
  // This is set by addDebtPayment to ensure correct deduction regardless of account currency
  if (transaction.paidAmount && transaction.paidAmount > 0) {
    // paidAmount is already in debt's principal currency - use it directly
    const amountDebtCurrency = transaction.paidAmount;
    const amountBaseCurrency = convertBetweenCurrencies(amountDebtCurrency, debt.principalCurrency, debt.baseCurrency);
    return { debt, amountDebtCurrency, amountBaseCurrency };
  }

  // Fallback for transactions without paidAmount (legacy or manual transactions)
  const sourceAmount = transaction.amount;
  if (!(sourceAmount > 0)) {
    return null;
  }
  const sourceCurrency = transaction.currency ?? debt.principalCurrency;
  const amountDebtCurrency = convertBetweenCurrencies(sourceAmount, sourceCurrency, debt.principalCurrency);
  const amountBaseCurrency = convertBetweenCurrencies(sourceAmount, sourceCurrency, debt.baseCurrency);
  return { debt, amountDebtCurrency, amountBaseCurrency };
};

/**
 * Calculate settlement info when debt is fully paid
 * Returns profit/loss based on exchange rate difference between start and settlement
 */
const calculateSettlementInfo = (
  debt: Debt,
  payments: DebtPayment[],
): {
  settledAt: string;
  finalRateUsed: number;
  finalProfitLoss: number;
  finalProfitLossCurrency: string;
  totalPaidInRepaymentCurrency: number;
} | null => {
  // Only calculate if repaymentCurrency is different from principalCurrency
  if (!debt.repaymentCurrency || debt.repaymentCurrency === debt.principalCurrency) {
    return null;
  }

  const debtPayments = payments.filter((p) => p.debtId === debt.id);
  if (debtPayments.length === 0) {
    return null;
  }

  // Calculate total paid in repayment currency
  // Each payment has amount in payment currency (which should be repaymentCurrency)
  const totalPaidInRepaymentCurrency = debtPayments.reduce((sum, payment) => {
    if (payment.currency === debt.repaymentCurrency) {
      return sum + payment.amount;
    }
    // If payment was in different currency, convert it
    return sum + convertBetweenCurrencies(payment.amount, payment.currency, debt.repaymentCurrency!);
  }, 0);

  // Get original amount and start rate
  const originalPrincipal = debt.principalOriginalAmount ?? debt.principalAmount;
  const startRate = debt.repaymentRateOnStart ?? 1;

  // Get current/final rate
  const finalRate = FxService.getInstance().getRate(
    debt.principalCurrency as FinanceCurrency,
    debt.repaymentCurrency as FinanceCurrency,
  );

  // Profit/Loss calculation BASED ON RATE CHANGE ONLY:
  // If rate didn't change, profit/loss = 0 (regardless of how much was paid)
  // If rate changed: profitLoss = rateDifference × originalPrincipal
  //
  // Example (i_owe - men qarz oldim):
  // - Borrowed 1000 USD at rate 12000 (startRate)
  // - Current rate: 12400 (finalRate)
  // - Rate difference: 12400 - 12000 = 400
  // - Loss = 400 × 1000 = 400,000 UZS (kurs oshdi = zarar)
  //
  // Example (they_owe_me - menga qarzdor):
  // - Lent 1000 USD at rate 12000
  // - Current rate: 12400
  // - Profit = 400 × 1000 = 400,000 UZS (kurs oshdi = foyda)

  const rateDifference = finalRate - startRate;

  // Agar kurs o'zgarmagan bo'lsa - foyda/zarar 0
  let profitLoss = 0;
  if (Math.abs(rateDifference) > 0.0001) {
    // Kurs o'zgarishi × original summa = foyda/zarar (repayment currency da)
    const profitLossAmount = originalPrincipal * rateDifference;

    // Yo'nalishga qarab:
    // i_owe: Kurs oshsa = zarar (ko'proq to'lashim kerak) = manfiy qiymat
    // they_owe_me: Kurs oshsa = foyda (ko'proq pul olaman) = musbat qiymat
    profitLoss = debt.direction === 'i_owe'
      ? -profitLossAmount  // Kurs oshsa = zarar = manfiy
      : profitLossAmount;  // Kurs oshsa = foyda = musbat
  }

  return {
    settledAt: new Date().toISOString(),
    finalRateUsed: finalRate,
    finalProfitLoss: roundAmountForCurrency(profitLoss, debt.repaymentCurrency),
    finalProfitLossCurrency: debt.repaymentCurrency,
    totalPaidInRepaymentCurrency: roundAmountForCurrency(totalPaidInRepaymentCurrency, debt.repaymentCurrency),
  };
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
  'Balance Adjustment',
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
): Account[] => {
  // Balance adjustment transactionlar uchun account balance o'zgartirilmaydi
  // chunki balance allaqachon updateAccount orqali o'zgartirilgan
  if (transaction.isBalanceAdjustment) {
    return accounts;
  }

  return accounts.map((account) => {
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
};

const buildBudgetEntriesForTransaction = (
  transaction: Transaction,
  budgets: Budget[],
  fxRates: FxRate[],
  timestamp: string,
): BudgetEntry[] => {
  if (transaction.type === 'transfer') {
    return [];
  }

  // If user explicitly chose "No budget", skip all budget matching
  if (transaction.skipBudgetMatching && !transaction.budgetId) {
    return [];
  }

  const amount = Math.abs(transaction.amount);
  const txnDate = new Date(transaction.date);

  return budgets
    .filter((budget) => {
      // 1. If transaction has explicit budgetId, only match that budget
      if (transaction.budgetId) {
        return budget.id === transaction.budgetId;
      }

      // 2. Match by transaction type
      // Spending budgets (expense) match expense transactions
      // Saving budgets (income) match income transactions
      const isSpendingBudget = budget.transactionType === 'expense';
      const isIncomeTransaction = transaction.type === 'income';
      if (isSpendingBudget && isIncomeTransaction) return false;
      if (!isSpendingBudget && !isIncomeTransaction) return false;

      // 3. Match by category (if budget tracks categories we require a match)
      const txnCategory = transaction.categoryId;
      if (budget.categoryIds && budget.categoryIds.length > 0) {
        if (!txnCategory || !budget.categoryIds.includes(txnCategory)) return false;
      }

      // 4. Match by period (if budget has period)
      if (budget.periodType !== 'none' && budget.startDate && budget.endDate) {
        const budgetStart = new Date(budget.startDate);
        const budgetEnd = new Date(budget.endDate);
        // Set budgetEnd to end of day (23:59:59.999) for inclusive comparison
        budgetEnd.setHours(23, 59, 59, 999);
        if (txnDate < budgetStart || txnDate > budgetEnd) return false;
      }

      return true;
    })
    .map((budget) => {
      const txnCurrency = transaction.currency ?? budget.currency;
      const convertedAmount = convertCurrency(amount, txnCurrency, budget.currency, fxRates);
      const roundedAmount = roundAmountForCurrency(convertedAmount, budget.currency);
      const rate = amount > 0 ? roundedAmount / amount : 1;
      return {
        id: generateId('bentry'),
        budgetId: budget.id,
        transactionId: transaction.id,
        appliedAmountBudgetCurrency: roundedAmount,
        rateUsedTxnToBudget: rate,
        snapshottedAt: timestamp,
      } satisfies BudgetEntry;
    });
};

const recalcBudgetsFromEntries = (budgets: Budget[], entries: BudgetEntry[], timestamp: string): Budget[] =>
  budgets.map((budget) => {
    const appliedEntries = entries.filter((entry) => entry.budgetId === budget.id);
    if (appliedEntries.length === 0) {
      return {
        ...budget,
        spentAmount: 0,
        contributionTotal: 0,
        currentBalance: budget.limitAmount,
        remainingAmount: budget.limitAmount,
        percentUsed: 0,
        isOverspent: budget.limitAmount < 0,
        updatedAt: timestamp,
      };
    }
    const spentAmount = appliedEntries.reduce((sum, entry) => sum + entry.appliedAmountBudgetCurrency, 0);
    const remainingAmount = budget.limitAmount - spentAmount;
    const percentUsed = budget.limitAmount > 0 ? spentAmount / budget.limitAmount : 0;
    const currentBalance = remainingAmount;
    return {
      ...budget,
      spentAmount,
      remainingAmount,
      percentUsed,
      contributionTotal: spentAmount,
      currentBalance,
      isOverspent: remainingAmount < 0,
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

const persistChangedBudgets = (updatedBudgets: Budget[], previousBudgets: Budget[]) => {
  if (!updatedBudgets.length) {
    return;
  }
  const { budgets: budgetDao } = getFinanceDaoRegistry();
  updatedBudgets.forEach((budget) => {
    const previous = previousBudgets.find((b) => b.id === budget.id);
    const hasChanged =
      !previous ||
      previous.spentAmount !== budget.spentAmount ||
      previous.remainingAmount !== budget.remainingAmount ||
      previous.percentUsed !== budget.percentUsed ||
      previous.isOverspent !== budget.isOverspent;
    if (!hasChanged) {
      return;
    }
    budgetDao.update(budget.id, {
      spentAmount: budget.spentAmount,
      remainingAmount: budget.remainingAmount,
      percentUsed: budget.percentUsed,
      contributionTotal: budget.contributionTotal,
      currentBalance: budget.currentBalance,
      isOverspent: budget.isOverspent,
      updatedAt: budget.updatedAt,
    });
  });
};

const resolveDebtStatus = (debt: Debt): DebtStatus => {
  // MUHIM: Floating point xatolari uchun tolerans (0.01 dan kichik = to'langan)
  // Chunki multi-currency conversion va rounding xatolari tufayli
  // principalAmount 0 dan sal katta bo'lishi mumkin
  if (debt.principalAmount <= 0.01) {
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
        accountDao.setShowStatus(accountId, 'archived');
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === accountId
              ? { ...account, isArchived: true, showStatus: 'archived' as ShowStatus }
              : account,
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
        // Summalarni valyutaga qarab yaxlitlash (UZS: 0, boshqalar: 2 kasr)
        const roundedAmount = roundAmountForCurrency(payload.amount, payload.currency);
        const convertedAmountToBase = roundAmountForCurrency(
          payload.convertedAmountToBase ?? roundedAmount * rateUsedToBase,
          baseCurrency,
        );
        const roundedToAmount = payload.toAmount !== undefined && payload.toCurrency
          ? roundAmountForCurrency(payload.toAmount, payload.toCurrency)
          : payload.toAmount;
        const roundedFeeAmount = payload.feeAmount !== undefined
          ? roundAmountForCurrency(payload.feeAmount, payload.currency)
          : payload.feeAmount;
        const { transactions: txnDao, budgets: budgetDao } = getFinanceDaoRegistry();
        const prevAccounts = get().accounts;
        const prevBudgets = get().budgets;
        const created = txnDao.create({
          ...payload,
          amount: roundedAmount,
          baseCurrency,
          rateUsedToBase,
          convertedAmountToBase,
          toAmount: roundedToAmount,
          feeAmount: roundedFeeAmount,
        });
        const timestamp = created.updatedAt;
        const newEntries = buildBudgetEntriesForTransaction(created, get().budgets, get().fxRates, timestamp);
        const persistedEntries = newEntries.map((entry) => budgetDao.recordEntry(entry));
        const nextAccountsSnapshot: Account[] = [];
        const nextBudgetsSnapshot: Budget[] = [];
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

            // NOTE: Settlement info hisoblash addDebtPayment ga ko'chirildi
            // chunki bu yerda yangi payment hali state.debtPayments ga qo'shilmagan

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
          nextBudgetsSnapshot.push(...updatedBudgets);
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
        // Persist updated budget values to Realm
        persistChangedBudgets(nextBudgetsSnapshot, prevBudgets);
        plannerEventBus.publish('finance.tx.created', { transaction: created });
        applyFinanceContributionToGoals(created, { budgets: get().budgets, debts: get().debts });
        return created;
      },

      updateTransaction: (id, updates) => {
        const existing = get().transactions.find((transaction) => transaction.id === id);
        if (!existing) {
          return;
        }
        const currency = updates.currency ?? existing.currency;
        const amount = updates.amount !== undefined
          ? roundAmountForCurrency(updates.amount, currency)
          : existing.amount;
        const rateUsedToBase = updates.rateUsedToBase ?? existing.rateUsedToBase ?? 1;
        const baseCurrency = updates.baseCurrency ?? existing.baseCurrency ?? getBaseCurrency();
        const convertedAmountToBase = roundAmountForCurrency(
          updates.convertedAmountToBase ?? amount * rateUsedToBase,
          baseCurrency,
        );
        const roundedToAmount = updates.toAmount !== undefined && (updates.toCurrency ?? existing.toCurrency)
          ? roundAmountForCurrency(updates.toAmount, updates.toCurrency ?? existing.toCurrency!)
          : updates.toAmount;
        const roundedFeeAmount = updates.feeAmount !== undefined
          ? roundAmountForCurrency(updates.feeAmount, currency)
          : updates.feeAmount;
        const { transactions: txnDao, budgets: budgetDao } = getFinanceDaoRegistry();
        const prevAccounts = get().accounts;
        const prevBudgets = get().budgets;
        const updated = txnDao.update(id, {
          ...updates,
          amount,
          baseCurrency,
          rateUsedToBase,
          convertedAmountToBase,
          toAmount: roundedToAmount,
          feeAmount: roundedFeeAmount,
        });
        if (!updated) {
          return;
        }
        removeFinanceContributionForTransaction(id);
        budgetDao.removeEntriesForTransaction(id);
        const timestamp = updated.updatedAt;
        const newEntries = buildBudgetEntriesForTransaction(updated, get().budgets, get().fxRates, timestamp);
        const persistedEntries = newEntries.map((entry) => budgetDao.recordEntry(entry));
        const nextAccountsSnapshot: Account[] = [];
        const nextBudgetsSnapshot: Budget[] = [];
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
          nextBudgetsSnapshot.push(...updatedBudgets);
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
        // Persist updated budget values to Realm
        persistChangedBudgets(nextBudgetsSnapshot, prevBudgets);
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
        const prevBudgets = get().budgets;
        txnDao.delete(id);
        budgetDao.removeEntriesForTransaction(id);
        const timestamp = new Date().toISOString();
        const nextAccountsSnapshot: Account[] = [];
        const nextBudgetsSnapshot: Budget[] = [];
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
          nextBudgetsSnapshot.push(...updatedBudgets);
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
        // Persist updated budget values to Realm
        persistChangedBudgets(nextBudgetsSnapshot, prevBudgets);
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

      searchCounterparties: (query) => {
        if (!query.trim()) {
          return get().counterparties;
        }
        const lower = query.toLowerCase();
        return get().counterparties.filter(
          (party) =>
            party.displayName.toLowerCase().includes(lower) ||
            party.phoneNumber?.includes(query) ||
            party.searchKeywords?.toLowerCase().includes(lower)
        );
      },

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
          phoneNumber: options?.phoneNumber?.trim() || undefined,
          comment: options?.comment?.trim() || undefined,
          searchKeywords: lower,
        });
        set((state) => ({
          counterparties: [created, ...state.counterparties],
        }));
        return created;
      },

      updateCounterparty: (id, updates) => {
        const { counterparties: counterpartyDao } = getFinanceDaoRegistry();
        const trimmedName = updates.displayName?.trim();
        if (trimmedName) {
          const lower = trimmedName.toLowerCase();
          const duplicate = get().counterparties.find(
            (party) => party.displayName.toLowerCase() === lower && party.id !== id,
          );
          if (duplicate) {
            const err = new Error('COUNTERPARTY_DUPLICATE');
            err.name = 'COUNTERPARTY_DUPLICATE';
            throw err;
          }
        }
        const updated = counterpartyDao.update(id, {
          ...(trimmedName && { displayName: trimmedName, searchKeywords: trimmedName.toLowerCase() }),
          ...(updates.phoneNumber !== undefined && { phoneNumber: updates.phoneNumber?.trim() || undefined }),
          ...(updates.comment !== undefined && { comment: updates.comment?.trim() || undefined }),
        });
        if (!updated) {
          throw new Error('Counterparty not found');
        }
        set((state) => ({
          counterparties: state.counterparties.map((party) =>
            party.id === id ? updated : party,
          ),
          debts: trimmedName
            ? state.debts.map((debt) =>
                debt.counterpartyId === id ? { ...debt, counterpartyName: trimmedName } : debt,
              )
            : state.debts,
        }));
        return updated;
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
        budgetDao.setShowStatus(id, 'archived');
        set((state) => ({
          budgets: state.budgets.map((budget) =>
            budget.id === id
              ? { ...budget, isArchived: true, showStatus: 'archived' as ShowStatus }
              : budget,
          ),
        }));
      },

      batchArchiveBudgets: (ids: string[]) => {
        ids.forEach((id) => get().archiveBudget(id));
      },

      deleteBudgetPermanently: (id: string) => {
        const budget = get().budgets.find((b) => b.id === id);

        // Unlink goal before deleting
        if (budget?.linkedGoalId) {
          const plannerStore = usePlannerDomainStore.getState();
          if (plannerStore?.updateGoal) {
            plannerStore.updateGoal(budget.linkedGoalId, {
              linkedBudgetId: undefined,
            });
          }
        }

        const { budgets: budgetDao } = getFinanceDaoRegistry();
        // Delete budget entries first, then the budget
        budgetDao.delete(id);
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
          budgetEntries: state.budgetEntries.filter((entry) => entry.budgetId !== id),
        }));
      },

      batchDeleteBudgetsPermanently: (ids: string[]) => {
        ids.forEach((id) => get().deleteBudgetPermanently(id));
      },

      // Soft-delete for undo functionality - sets showStatus to 'deleted' and returns snapshots
      batchSoftDeleteBudgets: (ids: string[]) => {
        const budgetsToDelete = get().budgets.filter((b) => ids.includes(b.id));
        const snapshots = budgetsToDelete.map((b) => ({ ...b })); // Create snapshots before soft-delete

        const { budgets: budgetDao } = getFinanceDaoRegistry();

        // Soft-delete each budget (unlinks goal and persists)
        ids.forEach((id) => {
          const budget = budgetsToDelete.find((b) => b.id === id);

          // Unlink goal before soft-delete
          if (budget?.linkedGoalId) {
            const plannerStore = usePlannerDomainStore.getState();
            if (plannerStore?.updateGoal) {
              plannerStore.updateGoal(budget.linkedGoalId, {
                linkedBudgetId: undefined,
              });
            }
          }

          budgetDao.setShowStatus(id, 'deleted');
        });

        set((state) => ({
          budgets: state.budgets.map((budget) =>
            ids.includes(budget.id)
              ? { ...budget, showStatus: 'deleted' as ShowStatus }
              : budget,
          ),
        }));

        return snapshots;
      },

      // Restore from undo - restores budgets from their snapshots
      batchUndoDeleteBudgets: (budgetSnapshots: Budget[]) => {
        const { budgets: budgetDao } = getFinanceDaoRegistry();

        // Restore each budget
        budgetSnapshots.forEach((snapshot) => {
          // Re-link goal if it was linked
          if (snapshot.linkedGoalId) {
            const plannerStore = usePlannerDomainStore.getState();
            if (plannerStore?.updateGoal) {
              plannerStore.updateGoal(snapshot.linkedGoalId, {
                linkedBudgetId: snapshot.id,
              });
            }
          }

          // Restore showStatus to active in database
          budgetDao.setShowStatus(snapshot.id, 'active');
        });

        set((state) => ({
          budgets: state.budgets.map((budget) => {
            const snapshot = budgetSnapshots.find((s) => s.id === budget.id);
            return snapshot
              ? { ...snapshot, showStatus: 'active' as ShowStatus, isArchived: false }
              : budget;
          }),
        }));
      },

      // Transaction soft-delete with FULL balance reversal
      softDeleteTransaction: (id) => {
        const existing = get().transactions.find((txn) => txn.id === id);
        if (!existing) {
          return null;
        }
        const snapshot = { ...existing };
        const { transactions: txnDao, budgets: budgetDao } = getFinanceDaoRegistry();
        const prevAccounts = get().accounts;
        const prevBudgets = get().budgets;
        const timestamp = new Date().toISOString();

        // Soft-delete in database (sets showStatus to 'deleted')
        txnDao.setShowStatus(id, 'deleted');
        budgetDao.removeEntriesForTransaction(id);

        const nextAccountsSnapshot: Account[] = [];
        const nextBudgetsSnapshot: Budget[] = [];
        set((state) => {
          // Reverse the transaction effect on accounts
          const revertedAccounts = applyTransactionToAccounts(state.accounts, existing, -1, timestamp);
          const nextBudgetEntries = removeBudgetEntriesForTransaction(state.budgetEntries, id);
          const updatedBudgets = recalcBudgetsFromEntries(state.budgets, nextBudgetEntries, timestamp);

          // Reverse debt adjustment if applicable
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
          nextBudgetsSnapshot.push(...updatedBudgets);
          return {
            accounts: revertedAccounts,
            transactions: state.transactions.map((txn) =>
              txn.id === id ? { ...txn, showStatus: 'deleted' as ShowStatus } : txn,
            ),
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
        persistChangedBudgets(nextBudgetsSnapshot, prevBudgets);
        removeFinanceContributionForTransaction(id, existing, { budgets: get().budgets, debts: get().debts });

        return snapshot;
      },

      batchSoftDeleteTransactions: (ids) => {
        const snapshots: Transaction[] = [];
        ids.forEach((id) => {
          const snapshot = get().softDeleteTransaction(id);
          if (snapshot) {
            snapshots.push(snapshot);
          }
        });
        return snapshots;
      },

      // Undo transaction delete - re-applies balance
      undoDeleteTransaction: (snapshot) => {
        const { transactions: txnDao, budgets: budgetDao } = getFinanceDaoRegistry();
        const prevAccounts = get().accounts;
        const prevBudgets = get().budgets;
        const timestamp = new Date().toISOString();

        // Restore showStatus to active in database
        txnDao.setShowStatus(snapshot.id, 'active');

        // Rebuild budget entries
        const newEntries = buildBudgetEntriesForTransaction(snapshot, get().budgets, get().fxRates, timestamp);
        const persistedEntries = newEntries.map((entry) => budgetDao.recordEntry(entry));

        const nextAccountsSnapshot: Account[] = [];
        const nextBudgetsSnapshot: Budget[] = [];
        set((state) => {
          // Re-apply the transaction effect on accounts
          const nextAccounts = applyTransactionToAccounts(state.accounts, snapshot, 1, timestamp);
          const nextBudgetEntries = [...state.budgetEntries, ...persistedEntries];
          const updatedBudgets = recalcBudgetsFromEntries(state.budgets, nextBudgetEntries, timestamp);

          // Re-apply debt adjustment if applicable
          const debtAdjustment = mapDebtAdjustmentFromTransaction(snapshot, state.debts);
          let updatedDebts = state.debts;
          if (debtAdjustment) {
            const nextPrincipal = Math.max(0, debtAdjustment.debt.principalAmount - debtAdjustment.amountDebtCurrency);
            const nextBase = Math.max(0, debtAdjustment.debt.principalBaseValue - debtAdjustment.amountBaseCurrency);
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

          nextAccountsSnapshot.push(...nextAccounts);
          nextBudgetsSnapshot.push(...updatedBudgets);
          return {
            accounts: nextAccounts,
            transactions: state.transactions.map((txn) =>
              txn.id === snapshot.id ? { ...snapshot, showStatus: 'active' as ShowStatus } : txn,
            ),
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
        persistChangedBudgets(nextBudgetsSnapshot, prevBudgets);
        applyFinanceContributionToGoals(snapshot, { budgets: get().budgets, debts: get().debts });
      },

      batchUndoDeleteTransactions: (snapshots) => {
        snapshots.forEach((snapshot) => get().undoDeleteTransaction(snapshot));
      },

      // Account soft-delete
      softDeleteAccount: (id) => {
        const existing = get().accounts.find((acc) => acc.id === id);
        if (!existing) {
          return null;
        }
        const snapshot = { ...existing };
        const { accounts: accountDao } = getFinanceDaoRegistry();

        // Soft-delete in database
        accountDao.setShowStatus(id, 'deleted');

        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === id ? { ...account, showStatus: 'deleted' as ShowStatus } : account,
          ),
        }));

        return snapshot;
      },

      batchSoftDeleteAccounts: (ids) => {
        const snapshots: Account[] = [];
        ids.forEach((id) => {
          const snapshot = get().softDeleteAccount(id);
          if (snapshot) {
            snapshots.push(snapshot);
          }
        });
        return snapshots;
      },

      undoDeleteAccount: (snapshot) => {
        const { accounts: accountDao } = getFinanceDaoRegistry();

        // Restore showStatus to active in database
        accountDao.setShowStatus(snapshot.id, 'active');

        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === snapshot.id
              ? { ...snapshot, showStatus: 'active' as ShowStatus, isArchived: false }
              : account,
          ),
        }));
      },

      batchUndoDeleteAccounts: (snapshots) => {
        snapshots.forEach((snapshot) => get().undoDeleteAccount(snapshot));
      },

      // Debt soft-delete
      softDeleteDebt: (id) => {
        const existing = get().debts.find((debt) => debt.id === id);
        if (!existing) {
          return null;
        }
        const snapshot = { ...existing };
        const { debts: debtDao } = getFinanceDaoRegistry();

        // Unlink goal before soft-delete
        if (existing.linkedGoalId) {
          const plannerStore = usePlannerDomainStore.getState();
          if (plannerStore?.updateGoal) {
            plannerStore.updateGoal(existing.linkedGoalId, {
              linkedDebtId: undefined,
            });
          }
        }

        // Soft-delete in database
        debtDao.setShowStatus(id, 'deleted');

        set((state) => ({
          debts: state.debts.map((debt) =>
            debt.id === id ? { ...debt, showStatus: 'deleted' as ShowStatus } : debt,
          ),
        }));

        return snapshot;
      },

      batchSoftDeleteDebts: (ids) => {
        const snapshots: Debt[] = [];
        ids.forEach((id) => {
          const snapshot = get().softDeleteDebt(id);
          if (snapshot) {
            snapshots.push(snapshot);
          }
        });
        return snapshots;
      },

      undoDeleteDebt: (snapshot) => {
        const { debts: debtDao } = getFinanceDaoRegistry();

        // Restore showStatus to active in database
        debtDao.setShowStatus(snapshot.id, 'active');

        // Re-link goal if it was linked
        if (snapshot.linkedGoalId) {
          const plannerStore = usePlannerDomainStore.getState();
          if (plannerStore?.updateGoal) {
            plannerStore.updateGoal(snapshot.linkedGoalId, {
              linkedDebtId: snapshot.id,
            });
          }
        }

        set((state) => ({
          debts: state.debts.map((debt) =>
            debt.id === snapshot.id ? { ...snapshot, showStatus: 'active' as ShowStatus } : debt,
          ),
        }));
      },

      batchUndoDeleteDebts: (snapshots) => {
        snapshots.forEach((snapshot) => get().undoDeleteDebt(snapshot));
      },

      createDebt: (payload) => {
        const { debts: debtDao } = getFinanceDaoRegistry();
        const { fundingOverrideAmount, ...debtPayload } = payload;
        const baseCurrency = debtPayload.baseCurrency ?? getBaseCurrency();
        const nowIso = new Date().toISOString();
        // Summalarni yaxlitlash
        const principalOriginalAmount = roundAmountForCurrency(
          debtPayload.principalOriginalAmount ?? debtPayload.principalAmount,
          debtPayload.principalOriginalCurrency ?? debtPayload.principalCurrency,
        );
        const principalOriginalCurrency =
          debtPayload.principalOriginalCurrency ?? debtPayload.principalCurrency;
        const resolvedPrincipal = roundAmountForCurrency(
          debtPayload.principalAmount ?? principalOriginalAmount,
          debtPayload.principalCurrency,
        );
        const principalBaseValueExplicit = roundAmountForCurrency(
          convertBetweenCurrencies(
            principalOriginalAmount,
            principalOriginalCurrency,
            baseCurrency,
          ),
          baseCurrency,
        );
        const rateOnStart =
          debtPayload.rateOnStart ??
          (principalOriginalAmount ? principalBaseValueExplicit / principalOriginalAmount : 1);
        const roundedRepaymentAmount = debtPayload.repaymentAmount !== undefined && debtPayload.repaymentCurrency
          ? roundAmountForCurrency(debtPayload.repaymentAmount, debtPayload.repaymentCurrency)
          : debtPayload.repaymentAmount;

        // Debug: Log resolved values before creating debt
        console.log('[Store.createDebt] Resolved values:', {
          payloadPrincipalAmount: debtPayload.principalAmount,
          principalOriginalAmount,
          resolvedPrincipal,
          fundingAccountId: debtPayload.fundingAccountId,
        });

        let created = debtDao.create({
          ...debtPayload,
          principalAmount: resolvedPrincipal,
          principalOriginalAmount,
          principalOriginalCurrency,
          principalBaseValue: debtPayload.principalBaseValue ?? principalBaseValueExplicit,
          baseCurrency,
          rateOnStart,
          repaymentAmount: roundedRepaymentAmount,
          status: debtPayload.status ?? 'active',
        });

        console.log('[Store.createDebt] After DAO create:', {
          id: created.id,
          principalAmount: created.principalAmount,
          principalOriginalAmount: created.principalOriginalAmount,
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
            // Note: We intentionally do NOT set debtId/relatedDebtId here
            // because this is a FUNDING transaction (money going out to lend / coming in from borrowing)
            // NOT a repayment transaction. Setting debtId would trigger mapDebtAdjustmentFromTransaction
            // which would incorrectly reduce principalAmount to 0.
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
              // debtId and relatedDebtId are intentionally omitted for funding transactions
              budgetId: debtPayload.linkedBudgetId,
              goalId: debtPayload.linkedGoalId,
              goalName: debtPayload.counterpartyName,
              goalType: 'financial',
              relatedBudgetId: debtPayload.linkedBudgetId,
              // Store reference without triggering debt adjustment
              plannedAmount: resolvedPrincipal,
              paidAmount: amountInAccountCurrency,
            });

            console.log('[Store.createDebt] After funding transaction created:', {
              transactionId: fundingTransaction.id,
              createdPrincipalAmount: created.principalAmount,
            });

            const patched = debtDao.update(created.id, {
              fundingTransactionId: fundingTransaction.id,
            });
            if (patched) {
              created = patched;
            } else {
              created = { ...created, fundingTransactionId: fundingTransaction.id };
            }

            console.log('[Store.createDebt] After patching fundingTransactionId:', {
              principalAmount: created.principalAmount,
            });
          }
        }

        const normalizedStatus = resolveDebtStatus(created);
        console.log('[Store.createDebt] Status normalization:', {
          currentStatus: created.status,
          normalizedStatus,
          principalAmount: created.principalAmount,
        });

        if (normalizedStatus !== created.status) {
          const patched = debtDao.update(created.id, { status: normalizedStatus });
          if (patched) {
            created = patched;
          } else {
            created = { ...created, status: normalizedStatus };
          }
        }

        console.log('[Store.createDebt] Final debt before set():', {
          id: created.id,
          principalAmount: created.principalAmount,
          principalOriginalAmount: created.principalOriginalAmount,
          status: created.status,
        });

        set((state) => ({
          accounts: [...state.accounts], // Force rerender by creating new array reference
          debts: [...state.debts.filter((debt) => debt.id !== created.id), created],
        }));
        return created;
      },

      updateDebt: (id, updates) => {
        console.log('[FinanceDomainStore] updateDebt called:', { id, updates });
        const existing = get().debts.find((debt) => debt.id === id);
        if (!existing) {
          console.log('[FinanceDomainStore] updateDebt: Debt not found');
          return;
        }
        // Summalarni yaxlitlash
        const roundedUpdates = { ...updates };
        if (updates.principalAmount !== undefined) {
          roundedUpdates.principalAmount = roundAmountForCurrency(
            updates.principalAmount,
            updates.principalCurrency ?? existing.principalCurrency,
          );
        }
        if (updates.principalBaseValue !== undefined) {
          roundedUpdates.principalBaseValue = roundAmountForCurrency(
            updates.principalBaseValue,
            updates.baseCurrency ?? existing.baseCurrency,
          );
        }
        if (updates.repaymentAmount !== undefined && (updates.repaymentCurrency ?? existing.repaymentCurrency)) {
          roundedUpdates.repaymentAmount = roundAmountForCurrency(
            updates.repaymentAmount,
            updates.repaymentCurrency ?? existing.repaymentCurrency!,
          );
        }
        const merged: Debt = {
          ...existing,
          ...roundedUpdates,
        };
        const normalizedStatus = resolveDebtStatus(merged);
        const { debts: debtDao } = getFinanceDaoRegistry();
        console.log('[FinanceDomainStore] updateDebt: Calling debtDao.update with:', { id, updates: { ...roundedUpdates, status: normalizedStatus } });
        const updated = debtDao.update(id, { ...roundedUpdates, status: normalizedStatus });
        if (!updated) {
          console.log('[FinanceDomainStore] updateDebt: debtDao.update returned null');
          return;
        }
        console.log('[FinanceDomainStore] updateDebt: Updated debt:', { dueDate: updated.dueDate });
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
        // To'lov summasini yaxlitlash
        const roundedPaymentAmount = roundAmountForCurrency(payload.amount, paymentCurrency);
        // Konvertatsiya qilib, valyutaga mos yaxlitlash
        const convertedAmountToDebtExplicit = roundAmountForCurrency(
          convertBetweenCurrencies(roundedPaymentAmount, paymentCurrency, debt.principalCurrency),
          debt.principalCurrency,
        );
        const convertedAmountToBaseExplicit = roundAmountForCurrency(
          convertBetweenCurrencies(roundedPaymentAmount, paymentCurrency, baseCurrency),
          baseCurrency,
        );

        // Oldingi to'lovlar yig'indisini hisoblash
        const existingPayments = get().debtPayments.filter((p) => p.debtId === debt.id);
        const totalAlreadyPaid = existingPayments.reduce((sum, p) => sum + p.convertedAmountToDebt, 0);
        const originalAmount = (debt as any).principalOriginalAmount ?? debt.principalAmount + totalAlreadyPaid;
        const remainingToPay = Math.max(0, originalAmount - totalAlreadyPaid);

        // Konvertatsiya qilingan summani qolgan summadan oshmasligini ta'minlash
        // Bu multi-currency to'lovlarda yaxlitlash xatolarini oldini oladi
        let convertedAmountToDebt = payload.convertedAmountToDebt ?? convertedAmountToDebtExplicit;
        if (convertedAmountToDebt > remainingToPay && remainingToPay > 0) {
          // Summani qolgan miqdorga cap qilish (tolerance 0.01 bilan)
          const tolerance = 0.01;
          if (convertedAmountToDebt - remainingToPay < tolerance * originalAmount) {
            convertedAmountToDebt = roundAmountForCurrency(remainingToPay, debt.principalCurrency);
          }
        }

        const convertedAmountToBase = payload.convertedAmountToBase ?? convertedAmountToBaseExplicit;
        const rateUsedToDebt =
          payload.rateUsedToDebt ??
          (roundedPaymentAmount !== 0 ? convertedAmountToDebt / roundedPaymentAmount : 1);
        const rateUsedToBase =
          payload.rateUsedToBase ??
          (roundedPaymentAmount !== 0 ? convertedAmountToBase / roundedPaymentAmount : 1);

        let relatedTransactionId: string | undefined;
        const targetAccountId = payload.accountId ?? debt.fundingAccountId;
        if (targetAccountId) {
          const account = get().accounts.find((acc) => acc.id === targetAccountId);
        if (account) {
          // Account valyutasiga konvertatsiya qilib yaxlitlash
          const amountInAccountCurrency = roundAmountForCurrency(
            convertBetweenCurrencies(payload.amount, paymentCurrency, account.currency),
            account.currency,
          );
          // IMPORTANT: paidAmount MUST be in debt's principal currency for correct deduction
          // mapDebtAdjustmentFromTransaction uses paidAmount directly when present
          // So we pass convertedAmountToDebt to ensure exact amount is deducted from debt

          // Konvertatsiya kursi: account currency -> debt currency
          const conversionRateToDebt = amountInAccountCurrency !== 0
            ? convertedAmountToDebt / amountInAccountCurrency
            : 1;

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
            paidAmount: convertedAmountToDebt,
            // Qarz valyutasi va konvertatsiya ma'lumotlari
            originalCurrency: debt.principalCurrency,
            originalAmount: convertedAmountToDebt,
            conversionRate: conversionRateToDebt,
          });
          relatedTransactionId = transaction.id;
        }
      }

        const payment: DebtPayment = {
          ...payload,
          amount: roundedPaymentAmount,
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
        // Note: Debt principalAmount is updated by createTransaction via mapDebtAdjustmentFromTransaction
        // We only persist the payment record here to avoid double reduction
        const { debts: debtDao } = getFinanceDaoRegistry();
        debtDao.addPayment(debt.id, payment);

        set((state) => ({
          debtPayments: [payment, ...state.debtPayments],
        }));

        // Settlement info hisoblash - payment state ga qo'shilgandan KEYIN
        // Bu yerda barcha paymentlar mavjud, shuning uchun to'g'ri hisoblash mumkin
        const updatedDebt = get().debts.find((d) => d.id === debt.id);
        if (updatedDebt && updatedDebt.status === 'paid' && !updatedDebt.settledAt) {
          const allPayments = get().debtPayments;
          const settlementInfo = calculateSettlementInfo(updatedDebt, allPayments);

          if (settlementInfo) {
            debtDao.update(updatedDebt.id, {
              settledAt: settlementInfo.settledAt,
              finalRateUsed: settlementInfo.finalRateUsed,
              finalProfitLoss: settlementInfo.finalProfitLoss,
              finalProfitLossCurrency: settlementInfo.finalProfitLossCurrency,
              totalPaidInRepaymentCurrency: settlementInfo.totalPaidInRepaymentCurrency,
            });

            set((state) => ({
              debts: state.debts.map((d) =>
                d.id === updatedDebt.id
                  ? { ...d, ...settlementInfo }
                  : d
              ),
            }));
          }
        }

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
        set((state) => {
          const nextBudgets = payload.budgets ?? state.budgets;
          const nextBudgetEntries = payload.budgetEntries ?? state.budgetEntries;
          const timestamp = new Date().toISOString();

          // Recalculate budget values from entries on hydration
          const recalculatedBudgets = recalcBudgetsFromEntries(nextBudgets, nextBudgetEntries, timestamp);

          return {
            ...state,
            ...payload,
            budgets: recalculatedBudgets,
          };
        }),
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
