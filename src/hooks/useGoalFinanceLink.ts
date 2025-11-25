import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { Budget, BudgetFlowType, BudgetPeriodType } from '@/domain/finance/types';
import type { Goal } from '@/domain/planner/types';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { createGoalFinanceTransaction } from '@/services/finance/financeAutoTracking';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

type BudgetInput = {
  name?: string;
  amount?: number;
  currency?: string;
  transactionType?: BudgetFlowType;
  accountId?: string | null;
  periodType?: BudgetPeriodType;
};

const defaultBudgetName = (goal?: Goal) => goal?.title ? `Budget · ${goal.title}` : 'Goal budget';

export const useGoalFinanceLink = (goal?: Goal) => {
  const { budgets, accounts, createBudget, updateBudget } = useFinanceDomainStore(
    useShallow((state) => ({
      budgets: state.budgets,
      accounts: state.accounts,
      createBudget: state.createBudget,
      updateBudget: state.updateBudget,
    })),
  );
  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
  const updateGoal = usePlannerDomainStore((state) => state.updateGoal);

  const linkedBudget = useMemo(() => {
    if (!goal) return undefined;
    return (
      budgets.find((budget) => budget.id === goal.linkedBudgetId) ??
      budgets.find((budget) => budget.linkedGoalId === goal.id)
    );
  }, [budgets, goal]);

  const availableBudgets = useMemo(
    () => budgets.filter((budget) => !budget.isArchived),
    [budgets],
  );

  const createAndLinkBudget = useCallback(
    (input: BudgetInput): Budget => {
      const currency = input.currency ?? goal?.currency ?? baseCurrency;
      const transactionType: BudgetFlowType =
        input.transactionType ??
        (goal?.financeMode === 'save' ? 'income' : 'expense');
      const budget = createBudget({
        userId: 'local-user',
        name: input.name || defaultBudgetName(goal),
        budgetType: 'project',
        categoryIds: [],
        linkedGoalId: goal?.id,
        accountId: input.accountId ?? undefined,
        transactionType,
        currency,
        limitAmount: input.amount && input.amount > 0 ? input.amount : goal?.targetValue ?? 0,
        periodType: input.periodType ?? 'none',
        startDate: new Date().toISOString(),
        endDate: undefined,
        isArchived: false,
        rolloverMode: 'none',
        notifyOnExceed: false,
      });
      if (goal?.id) {
        updateBudget(budget.id, { linkedGoalId: goal.id });
        updateGoal?.(goal.id, {
          linkedBudgetId: budget.id,
          currency: budget.currency,
        } as any);
      }
      return budget;
    },
    [baseCurrency, createBudget, goal, updateBudget, updateGoal],
  );

  const linkExistingBudget = useCallback(
    (budgetId: string) => {
      if (!goal?.id) return;
      const target = budgets.find((b) => b.id === budgetId);
      updateBudget(budgetId, { linkedGoalId: goal.id });
      updateGoal?.(goal.id, {
        linkedBudgetId: budgetId,
        currency: target?.currency ?? goal.currency ?? baseCurrency,
      } as any);
    },
    [baseCurrency, budgets, goal?.id, goal?.currency, updateBudget, updateGoal],
  );

  const applyProgressWithBudget = useCallback(
    (
      amount: number,
      note?: string,
      options?: { budgetId?: string; accountId?: string; debtId?: string; plannedAmount?: number; paidAmount?: number },
    ) => {
      if (!goal) return undefined;
      const targetBudgetId = options?.budgetId ?? goal.linkedBudgetId ?? linkedBudget?.id;
      const targetDebtId = options?.debtId ?? goal.linkedDebtId;
      if (!targetBudgetId) return undefined;
      return createGoalFinanceTransaction({
        goal,
        amount,
        budgetId: targetBudgetId,
        debtId: targetDebtId,
        accountId: options?.accountId,
        note,
        eventType: 'goal-progress',
        plannedAmount: options?.plannedAmount,
        paidAmount: options?.paidAmount,
      });
    },
    [goal, linkedBudget?.id],
  );

  return {
    accounts,
    availableBudgets,
    linkedBudget,
    createAndLinkBudget,
    linkExistingBudget,
    applyProgressWithBudget,
  };
};
