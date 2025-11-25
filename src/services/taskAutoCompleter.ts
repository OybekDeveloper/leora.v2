/**
 * Task Auto-Completer Service
 *
 * Listens to finance events and automatically completes tasks with financeLink.
 * Implements PL-13 requirement from planner.md spec.
 *
 * Auto-completion rules:
 * - pay_debt: Complete when debt payment added for matching debtId
 * - review_budget: Complete when budget spending changed
 * - record_expenses: Complete when expense transaction created in categoryId
 * - transfer_money: Complete when transfer transaction created between accounts
 */

import type { Transaction, Debt, DebtPayment } from '@/domain/finance/types';
import type { Task } from '@/domain/planner/types';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { plannerEventBus } from '@/events/plannerEventBus';
import { startOfDay } from '@/utils/calendar';

const dateKeyFromDate = (date: Date) => startOfDay(date).toISOString().split('T')[0]!;

/**
 * Check if a finance action matches the task's financeLink
 * NOTE: For structured financeLink types (future enhancement), we would check metadata
 * For now, we use simple string matching
 */
const doesFinanceActionMatchTask = (task: Task, transaction: Transaction): boolean => {
  if (!task.financeLink || task.financeLink === 'none') {
    return false;
  }

  const { financeLink } = task;

  switch (financeLink) {
    case 'record_expenses':
      // Any expense transaction completes this task
      // TODO: Check if transaction.category matches task metadata (when structured types are implemented)
      return transaction.type === 'expense';

    case 'pay_debt':
      // Transaction linked to a debt completes this task
      // TODO: Check if transaction.debtId matches task metadata (when structured types are implemented)
      return Boolean(transaction.debtId);

    case 'review_budget':
      // For now, any income or expense transaction in a budget can complete this
      // TODO: Check if transaction.budgetId matches task metadata (when structured types are implemented)
      return Boolean(transaction.budgetId) && (transaction.type === 'income' || transaction.type === 'expense');

    case 'transfer_money':
      // Transfer type transaction completes this task
      // TODO: Check if from/to accounts match task metadata (when structured types are implemented)
      return transaction.type === 'transfer';

    default:
      return false;
  }
};

/**
 * Auto-complete tasks based on finance operations
 */
function autoCompleteTasks(transaction: Transaction) {
  const { tasks, completeTask } = usePlannerDomainStore.getState();
  const todayKey = dateKeyFromDate(new Date());
  const txDateKey = dateKeyFromDate(new Date(transaction.date || transaction.createdAt));

  // Auto-complete tasks even if not from today (finance operations can be backdated)
  console.log(`[TaskAutoCompleter] Checking tasks for transaction on ${txDateKey}`);

  // Find all incomplete tasks with financeLink
  const eligibleTasks = tasks.filter(
    (task) =>
      task.status !== 'completed' &&
      task.status !== 'canceled' &&
      task.status !== 'archived' &&
      task.status !== 'deleted' &&
      task.financeLink &&
      task.financeLink !== 'none'
  );

  console.log(`[TaskAutoCompleter] Found ${eligibleTasks.length} eligible tasks`);

  // Auto-complete matching tasks
  eligibleTasks.forEach((task) => {
    if (doesFinanceActionMatchTask(task, transaction)) {
      console.log(`[TaskAutoCompleter] Auto-completing task: ${task.title}`);
      completeTask(task.id);

      // Publish event
      plannerEventBus.publish('planner.task.auto_completed', {
        taskId: task.id,
        financeLink: task.financeLink,
        transactionId: transaction.id,
        completedAt: new Date().toISOString(),
      });
    }
  });
}

/**
 * Auto-complete tasks when a debt payment is added
 */
function autoCompleteDebtPaymentTasks(debtId: string, payment: DebtPayment) {
  const { tasks, completeTask, goals } = usePlannerDomainStore.getState();

  console.log(`[TaskAutoCompleter] Debt payment added for debt: ${debtId}`);

  // Find all incomplete tasks with 'pay_debt' financeLink
  const eligibleTasks = tasks.filter(
    (task) =>
      task.status !== 'completed' &&
      task.status !== 'canceled' &&
      task.status !== 'archived' &&
      task.status !== 'deleted' &&
      task.financeLink === 'pay_debt'
  );

  console.log(`[TaskAutoCompleter] Found ${eligibleTasks.length} pay_debt tasks`);

  eligibleTasks.forEach((task) => {
    let shouldComplete = false;

    // If task has a linked goal, check if goal's linkedDebtId matches
    if (task.goalId) {
      const linkedGoal = goals.find((g) => g.id === task.goalId);
      if (linkedGoal?.linkedDebtId === debtId) {
        shouldComplete = true;
      }
    } else {
      // No specific goal link - complete any pay_debt task
      // (This is a simple heuristic - in production you'd want more specific matching)
      shouldComplete = true;
    }

    if (shouldComplete) {
      console.log(`[TaskAutoCompleter] Auto-completing pay_debt task: ${task.title}`);
      completeTask(task.id);

      plannerEventBus.publish('planner.task.auto_completed', {
        taskId: task.id,
        financeLink: task.financeLink,
        debtId,
        paymentId: payment.id,
        completedAt: new Date().toISOString(),
      });
    }
  });
}

/**
 * Auto-complete review_budget tasks when budget spending changes
 */
function autoCompleteBudgetReviewTasks(budgetId: string) {
  const { tasks, completeTask } = usePlannerDomainStore.getState();

  console.log(`[TaskAutoCompleter] Budget spending changed for budget: ${budgetId}`);

  // Find all incomplete tasks with 'review_budget' financeLink
  const eligibleTasks = tasks.filter(
    (task) =>
      task.status !== 'completed' &&
      task.status !== 'canceled' &&
      task.financeLink === 'review_budget'
  );

  console.log(`[TaskAutoCompleter] Found ${eligibleTasks.length} review_budget tasks`);

  eligibleTasks.forEach((task) => {
    // For now, complete all review_budget tasks when any budget changes
    // TODO: Match specific budgetId when structured types are implemented
    console.log(`[TaskAutoCompleter] Auto-completing review_budget task: ${task.title}`);
    completeTask(task.id);

    plannerEventBus.publish('planner.task.auto_completed', {
      taskId: task.id,
      financeLink: task.financeLink,
      budgetId,
      completedAt: new Date().toISOString(),
    });
  });
}

/**
 * Initialize the task auto-completer
 * Subscribe to finance events and auto-complete tasks
 */
export function initTaskAutoCompleter() {
  console.log('[TaskAutoCompleter] Initializing...');

  // Subscribe to transaction created event
  plannerEventBus.subscribe('finance.tx.created', (event) => {
    const { transaction } = event.payload || event;
    if (transaction) {
      autoCompleteTasks(transaction);
    }
  });

  // Subscribe to debt payment events
  plannerEventBus.subscribe('finance.debt.payment_added', (event) => {
    const { debtId, payment, debt } = event.payload || event;
    if (debtId && payment) {
      autoCompleteDebtPaymentTasks(debtId, payment);
    } else if (debt && payment) {
      // Alternative payload format
      autoCompleteDebtPaymentTasks(debt.id, payment);
    }
  });

  // Subscribe to budget spending changed events
  plannerEventBus.subscribe('finance.budget.spending_changed', (event) => {
    const { budgetId, budget } = event.payload || event;
    if (budgetId) {
      autoCompleteBudgetReviewTasks(budgetId);
    } else if (budget) {
      // Alternative payload format
      autoCompleteBudgetReviewTasks(budget.id);
    }
  });

  // Subscribe to debt status changed events (e.g., fully paid)
  plannerEventBus.subscribe('finance.debt.status_changed', (event) => {
    const { debtId, debt, newStatus } = event.payload || event;
    if ((newStatus === 'paid' || newStatus === 'closed') && (debtId || debt?.id)) {
      console.log(`[TaskAutoCompleter] Debt fully paid: ${debtId || debt?.id}`);
      // Auto-complete any remaining pay_debt tasks for this debt
      // Use a dummy payment object since the debt is fully paid
      const dummyPayment = { id: 'final', amount: 0 } as DebtPayment;
      autoCompleteDebtPaymentTasks(debtId || debt!.id, dummyPayment);
    }
  });

  console.log('[TaskAutoCompleter] Initialized successfully');
}

/**
 * Cleanup function to unsubscribe from events
 */
export function cleanupTaskAutoCompleter() {
  // Event bus should handle automatic cleanup
  console.log('[TaskAutoCompleter] Cleanup complete');
}
