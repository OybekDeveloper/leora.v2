import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import type {
  UserDailyContext,
  UserPeriodContext,
  UserShortContext,
} from '@/types/ai-gateway';
import { startOfDay } from '@/utils/calendar';

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export const buildDailyContext = (date: Date): UserDailyContext => {
  const financeStore = useFinanceDomainStore.getState();
  const plannerStore = usePlannerDomainStore.getState();
  const financePrefs = useFinancePreferencesStore.getState();

  const dayKey = startOfDay(date).toISOString();
  const transactionsToday = financeStore.transactions.filter((txn) => {
    const txnDate = new Date(txn.date);
    return startOfDay(txnDate).toISOString() === dayKey;
  });

  const totalIncome = transactionsToday
    .filter((txn) => txn.type === 'income')
    .reduce((sum, txn) => sum + txn.amount, 0);
  const totalOutcome = transactionsToday
    .filter((txn) => txn.type === 'expense')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const financeIndex = clamp(totalIncome > 0 ? totalIncome / Math.max(totalOutcome, 1) : 0.5);
  const tasksDone = plannerStore.tasks.filter((task) => task.status === 'completed').length;
  const productivityIndex = clamp(plannerStore.tasks.length ? tasksDone / plannerStore.tasks.length : 0.5);
  const habitsIndex = clamp(0.6);
  const overallIndex = clamp((financeIndex + productivityIndex + habitsIndex) / 3);

  return {
    date: dayKey,
    region: financePrefs.region,
    baseCurrency: financePrefs.baseCurrency,
    language: financePrefs.region === 'uzbekistan' ? 'ru' : 'en',
    indices: {
      financeIndex,
      productivityIndex,
      habitsIndex,
      overallIndex,
    },
    financeSummary: {
      income: totalIncome,
      expenses: totalOutcome,
      accounts: financeStore.accounts.map((account) => ({
        id: account.id,
        balance: account.currentBalance,
        currency: account.currency,
      })),
      budgets: financeStore.budgets.map((budget) => ({
        id: budget.id,
        state: budget.percentUsed >= 1 ? 'exceeding' : 'within',
        spent: budget.spentAmount,
        limit: budget.limitAmount,
      })),
      debts: financeStore.debts.map((debt) => ({
        id: debt.id,
        remainingAmount: debt.principalAmount,
        status: debt.status,
      })),
    },
    plannerSummary: {
      tasksTotal: plannerStore.tasks.length,
      tasksDone,
      focusSessions: plannerStore.focusSessions.map((session) => ({
        id: session.id,
        status: session.status,
      })),
    },
  };
};

export const buildPeriodContext = (
  from: Date,
  to: Date,
): UserPeriodContext => {
  const base = buildDailyContext(from);
  return {
    ...base,
    periodType: 'custom',
    from: startOfDay(from).toISOString(),
    to: startOfDay(to).toISOString(),
  };
};

export const buildShortContext = (): UserShortContext => {
  const financePrefs = useFinancePreferencesStore.getState();
  const financeStore = useFinanceDomainStore.getState();
  const plannerStore = usePlannerDomainStore.getState();

  return {
    language: financePrefs.region === 'uzbekistan' ? 'ru' : 'en',
    baseCurrency: financePrefs.baseCurrency,
    keyFinanceFacts: {
      totalAccounts: financeStore.accounts.length,
      overdueBudgets: financeStore.budgets.filter((budget) => budget.percentUsed >= 1).length,
      activeDebts: financeStore.debts.filter((debt) => debt.status === 'active').length,
    },
    keyPlannerFacts: {
      tasksOpen: plannerStore.tasks.filter((task) => task.status !== 'completed').length,
      tasksDone: plannerStore.tasks.filter((task) => task.status === 'completed').length,
    },
  };
};
