import type { Goal } from '@/domain/planner/types';
import { createGoalFinanceTransaction } from '@/services/finance/financeAutoTracking';

type GoalTransactionInput = {
  goal: Goal;
  amount: number;
  budgetId?: string;
  note?: string;
};

export const createGoalProgressEntry = ({ goal, amount, budgetId, note }: GoalTransactionInput) =>
  createGoalFinanceTransaction({
    goal,
    amount,
    budgetId,
    note,
    eventType: 'goal-progress',
  });

export const createGoalCompletionEntry = ({ goal, amount, budgetId, note }: GoalTransactionInput) =>
  createGoalFinanceTransaction({
    goal,
    amount,
    budgetId,
    note,
    eventType: 'goal-completed',
  });
