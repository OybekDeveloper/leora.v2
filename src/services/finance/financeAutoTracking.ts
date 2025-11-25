import type { BudgetFlowType, Transaction } from '@/domain/finance/types';
import type { Goal } from '@/domain/planner/types';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore, type FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import type { Debt } from '@/domain/finance/types';

type GoalFinanceEvent = 'goal-progress' | 'goal-completed';

type GoalFinanceTransactionInput = {
  goal: Goal;
  amount: number;
  budgetId?: string;
  debtId?: string;
  accountId?: string;
  note?: string;
  eventType: GoalFinanceEvent;
  plannedAmount?: number;
  paidAmount?: number;
};

const getFinancePreferences = () => useFinancePreferencesStore.getState();
const getBaseCurrency = () => getFinancePreferences().baseCurrency;

const resolveRateToBase = (
  convertAmount: (amount: number, fromCurrency?: FinanceCurrency, toCurrency?: FinanceCurrency) => number,
  fromCurrency: FinanceCurrency,
  toCurrency: FinanceCurrency,
): number => {
  if (fromCurrency === toCurrency) return 1;
  const rate = convertAmount(1, fromCurrency, toCurrency);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
};

const resolveFlowDirection = (goal?: Goal, debt?: Debt): BudgetFlowType => {
  if (debt) {
    return debt.direction === 'they_owe_me' ? 'income' : 'expense';
  }
  if (!goal) {
    return 'expense';
  }
  if (goal.financeMode === 'save') {
    return 'income';
  }
  return 'expense';
};

const ensureBudgetLinked = (budgetId: string, goalId?: string) => {
  if (!goalId) return;
  const financeStore = useFinanceDomainStore.getState();
  const target = financeStore.budgets.find((budget) => budget.id === budgetId);
  if (!target || target.linkedGoalId === goalId) return;
  financeStore.updateBudget(budgetId, { linkedGoalId: goalId });
};

export const createGoalFinanceTransaction = ({
  goal,
  amount,
  budgetId,
  debtId,
  accountId,
  note,
  eventType,
  plannedAmount,
  paidAmount,
}: GoalFinanceTransactionInput): Transaction | undefined => {
  const financeStore = useFinanceDomainStore.getState();
  const financePrefs = getFinancePreferences();
  const convertAmount = financePrefs.convertAmount;
  const targetDebt =
    debtId ??
    goal?.linkedDebtId ??
    financeStore.debts.find((d) => d.linkedGoalId === goal?.id)?.id;
  const budgetFromLink =
    budgetId ??
    goal?.linkedBudgetId ??
    financeStore.budgets.find((b) => b.linkedGoalId === goal?.id)?.id;
  const requiresBudget = !targetDebt;
  if (!goal || !(amount > 0) || (requiresBudget && !budgetFromLink)) {
    return undefined;
  }
  const budget = financeStore.budgets.find((item) => item.id === budgetFromLink);
  const debt = targetDebt ? financeStore.debts.find((item) => item.id === targetDebt) : undefined;
  const budgetCurrency = budget?.currency as FinanceCurrency | undefined;
  const goalCurrency = goal.currency as FinanceCurrency | undefined;
  const baseCurrency = (budgetCurrency ?? goalCurrency ?? financePrefs.baseCurrency) as FinanceCurrency;
  const resolvedAccount =
    (accountId ? financeStore.accounts.find((item) => item.id === accountId) : undefined) ??
    (budget?.accountId ? financeStore.accounts.find((item) => item.id === budget.accountId) : undefined) ??
    financeStore.accounts.find((item) => item.currency === budgetCurrency) ??
    financeStore.accounts[0];
  const resolvedAccountId = resolvedAccount?.id ?? accountId ?? budget?.accountId;
  const currency = (resolvedAccount?.currency ?? budgetCurrency ?? goalCurrency ?? baseCurrency) as FinanceCurrency;
  const rateUsedToBudget = resolveRateToBase(convertAmount, currency, baseCurrency);
  const flow = resolveFlowDirection(goal, debt);
  const today = new Date().toISOString();
  const financeCategory = (goal as any).financeCategoryId ?? (goal as any).financeCategory ?? (goal as any).categoryId;
  const descriptionBudgetPart = budget?.name ? ` · Budget: ${budget.name}` : '';

  const transaction = financeStore.createTransaction({
    type: flow === 'income' ? 'income' : 'expense',
    goalId: goal.id,
    budgetId: budgetFromLink,
    debtId: targetDebt ?? undefined,
    accountId: resolvedAccountId,
    amount: Math.abs(amount),
    currency,
    baseCurrency,
    rateUsedToBase: rateUsedToBudget,
    convertedAmountToBase: Math.abs(amount) * rateUsedToBudget,
    categoryId: financeCategory,
    description: note ?? `Goal: ${goal.title}${descriptionBudgetPart}`,
    tags: ['goal', eventType, goal.title],
    date: today,
    createdAt: today,
    updatedAt: today,
    goalName: goal.title,
    goalType: goal.goalType,
    relatedBudgetId: budgetFromLink,
    relatedDebtId: targetDebt ?? undefined,
    plannedAmount: plannedAmount ?? goal.targetValue,
    paidAmount: paidAmount ?? amount,
  });

  if (budgetFromLink) {
    ensureBudgetLinked(budgetFromLink, goal.id);
  }
  return transaction;
};
