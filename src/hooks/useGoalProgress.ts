import { useCallback } from 'react';

import type { Goal } from '@/domain/planner/types';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { createGoalFinanceTransaction } from '@/services/finance/financeAutoTracking';

type ProgressResult =
  | { status: 'logged'; transactionId?: string; budgetId?: string }
  | { status: 'needs-budget' }
  | { status: 'invalid' };

type ProgressOptions = {
  note?: string;
  budgetId?: string;
  dateKey?: string;
  accountId?: string;
  debtId?: string;
  plannedAmount?: number;
  paidAmount?: number;
};

export const useGoalProgress = (goal?: Goal) => {
  const addGoalCheckIn = usePlannerDomainStore((state) => state.addGoalCheckIn);

  const logProgress = useCallback(
    (value: number, options?: ProgressOptions): ProgressResult => {
      if (!goal || !(value > 0)) return { status: 'invalid' };

      const todayKey = options?.dateKey ?? new Date().toISOString().slice(0, 10);
      const createdAt = new Date().toISOString();

      if (goal.goalType === 'financial' || goal.metricType === 'amount') {
        const transaction = createGoalFinanceTransaction({
          goal,
          amount: value,
          budgetId: options?.budgetId ?? goal.linkedBudgetId,
          debtId: options?.debtId ?? goal.linkedDebtId,
          accountId: options?.accountId,
          note: options?.note ?? `Goal: ${goal.title}`,
          eventType: 'goal-progress',
          plannedAmount: options?.plannedAmount ?? goal.targetValue,
          paidAmount: options?.paidAmount ?? value,
        });
        if (transaction) {
          return { status: 'logged', transactionId: transaction.id, budgetId: transaction.budgetId };
        }
        return { status: 'needs-budget' };
      }

      addGoalCheckIn({
        goalId: goal.id,
        value,
        note: options?.note,
        sourceType: 'manual',
        dateKey: todayKey,
        createdAt,
      });
      return { status: 'logged' };
    },
    [addGoalCheckIn, goal],
  );

  return { logProgress };
};
