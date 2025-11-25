// services/financePlannerLinker.ts
import { plannerEventBus } from '@/events/plannerEventBus';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import type { Debt } from '@/domain/finance/types';

/**
 * PL-30: Create task automatically when debt is created
 */
const handleDebtCreated = (debt: Debt) => {
  // Only create task for "i_owe" debts
  if (debt.direction !== 'i_owe') {
    return;
  }

  const { createTask } = usePlannerDomainStore.getState();

  // Find linked goal if exists
  const goalId = debt.linkedGoalId;

  // Create task with due date matching debt due date
  const dueDate = debt.dueDate || undefined;

  createTask({
    userId: debt.userId,
    title: `Pay debt: ${debt.counterpartyName}`,
    notes: debt.description || `Pay back ${debt.principalAmount} ${debt.principalCurrency}`,
    status: 'inbox',
    priority: debt.dueDate ? 'high' : 'medium',
    dueDate,
    goalId,
    financeLink: 'pay_debt',
    estimatedMinutes: 30,
  });
};

/**
 * PL-31: Update goal progress when budget spending changes
 */
const handleBudgetSpendingChanged = (budgetId: string) => {
  const { goals, updateGoal } = usePlannerDomainStore.getState();

  // Find goals linked to this budget
  const linkedGoals = goals.filter((g) => g.linkedBudgetId === budgetId);

  if (linkedGoals.length === 0) {
    return;
  }

  // Get budget data from finance store
  const { budgets } = require('@/stores/useFinanceDomainStore').useFinanceDomainStore.getState();
  const budget = budgets.find((b: any) => b.id === budgetId);

  if (!budget) {
    return;
  }

  // Update each linked goal
  linkedGoals.forEach((goal) => {
    if (goal.metricType !== 'none' && goal.targetValue && goal.initialValue != null) {
      // Calculate progress based on goal direction
      let newProgressPercent = 0;

      if (goal.direction === 'increase') {
        // For savings goals: progress = (current - initial) / (target - initial)
        const gained = budget.spentAmount - goal.initialValue;
        const needed = goal.targetValue - goal.initialValue;
        newProgressPercent = needed > 0 ? Math.min(gained / needed, 1) : 0;
      } else if (goal.direction === 'decrease') {
        // For spend-limiting goals: progress = (initial - current) / (initial - target)
        const reduced = goal.initialValue - budget.spentAmount;
        const needed = goal.initialValue - goal.targetValue;
        newProgressPercent = needed > 0 ? Math.min(reduced / needed, 1) : 0;
      } else {
        // Fallback for goals without direction
        newProgressPercent = Math.min((budget.spentAmount / budget.limitAmount), 1);
      }

      updateGoal(goal.id, {
        stats: {
          ...goal.stats,
          financialProgressPercent: Math.max(0, newProgressPercent),
        },
      });
    }
  });
};

/**
 * PL-32: Update goal progress when debt payment is added
 */
const handleDebtPaymentAdded = (debtId: string) => {
  const { goals, updateGoal } = usePlannerDomainStore.getState();

  // Find goals linked to this debt
  const linkedGoals = goals.filter((g) => g.linkedDebtId === debtId);

  if (linkedGoals.length === 0) {
    return;
  }

  // Get debt data from finance store
  const { debts, debtPayments } = require('@/stores/useFinanceDomainStore').useFinanceDomainStore.getState();
  const debt = debts.find((d: any) => d.id === debtId);

  if (!debt) {
    return;
  }

  // Calculate total payments
  const payments = debtPayments.filter((p: any) => p.debtId === debtId);
  const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amountInDebtCurrency, 0);

  // Update each linked goal
  linkedGoals.forEach((goal) => {
    if (goal.metricType !== 'none' && goal.targetValue && goal.initialValue != null) {
      // Calculate progress based on goal direction
      let newProgressPercent = 0;

      if (goal.direction === 'decrease') {
        // For debt payoff goals: progress = (initial - remaining) / (initial - target)
        // Where remaining = principal - totalPaid
        const remaining = debt.principalAmount - totalPaid;
        const reduced = goal.initialValue - remaining;
        const needed = goal.initialValue - goal.targetValue;
        newProgressPercent = needed > 0 ? Math.min(reduced / needed, 1) : 0;
      } else {
        // Fallback: simple paid / principal
        newProgressPercent = Math.min((totalPaid / debt.principalAmount), 1);
      }

      updateGoal(goal.id, {
        stats: {
          ...goal.stats,
          financialProgressPercent: Math.max(0, newProgressPercent),
        },
      });
    }
  });
};

/**
 * Sync budget contributionTotal to goal currentValue
 */
const handleBudgetUpdated = (budgetId: string) => {
  const { goals, updateGoal } = usePlannerDomainStore.getState();

  // Find goals linked to this budget
  const linkedGoals = goals.filter((g) => g.linkedBudgetId === budgetId);

  if (linkedGoals.length === 0) {
    return;
  }

  // Get budget data from finance store
  const { budgets } = require('@/stores/useFinanceDomainStore').useFinanceDomainStore.getState();
  const budget = budgets.find((b: any) => b.id === budgetId);

  if (!budget) {
    return;
  }

  // Sync contributionTotal to currentValue for linked goals
  linkedGoals.forEach((goal) => {
    // Only sync if budget has contributionTotal defined
    if (budget.contributionTotal !== undefined) {
      updateGoal(goal.id, {
        currentValue: budget.contributionTotal,
        __skipBudgetSync: true,
      } as any);
    }
  });
};

/**
 * Initialize Finance ↔ Planner linker
 */
export const initFinancePlannerLinker = () => {
  // PL-30: Auto-create task when debt is created
  plannerEventBus.subscribe('finance.debt.created', ({ debt }) => {
    handleDebtCreated(debt);
  });

  // PL-31: Update goal progress when budget spending changes
  plannerEventBus.subscribe('finance.budget.spending_changed', ({ budget }) => {
    handleBudgetSpendingChanged(budget.id);
  });

  // PL-32: Update goal progress when debt payment is added
  plannerEventBus.subscribe('finance.debt.payment_added', ({ debt }) => {
    handleDebtPaymentAdded(debt.id);
  });

  // Sync budget contributionTotal to goal currentValue
  plannerEventBus.subscribe('finance.budget.updated', ({ budget }) => {
    handleBudgetUpdated(budget.id);
  });
};
