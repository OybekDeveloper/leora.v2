import type { FocusSession, Goal, Habit, Task } from '@/domain/planner/types';
import type { Budget, Debt, Transaction as FinanceTransaction } from '@/domain/finance/types';

type PlannerTaskEvent = { task: Task };
type PlannerGoalEvent = { goal: Goal };
type PlannerHabitEvent = { habit: Habit; date?: string; status?: 'done' | 'miss' };
type PlannerFocusEvent = { session: FocusSession };
type FinanceTxEvent = { transaction: FinanceTransaction };
type FinanceBudgetEvent = { budget: Budget };
type FinanceDebtEvent = { debt: Debt };
type FinanceDebtPaymentEvent = { debt: Debt; payment: { id: string; amount: number } };
type FinanceDebtLinkEvent = { debtId: string; paymentId: string; transactionId: string; linkedAt: string };
type FinanceDebtUnlinkEvent = { paymentId: string; unlinkedAt: string };
type FinanceDebtSyncEvent = { debtId: string; transactionId: string; previousRemaining: number; newRemaining: number; syncedAt?: string; reversedAt?: string };
type TaskAutoCompletedEvent = { taskId: string; financeLink: string; transactionId?: string; debtId?: string; paymentId?: string; budgetId?: string; completedAt: string };
type InsightsActionEvent = { actionId: string; payload?: unknown };

export type PlannerEventName =
  | 'planner.task.created'
  | 'planner.task.updated'
  | 'planner.task.completed'
  | 'planner.task.auto_completed'
  | 'planner.task.canceled'
  | 'planner.goal.created'
  | 'planner.goal.updated'
  | 'planner.goal.completed'
  | 'planner.goal.archived'
  | 'planner.goal.progress_updated'
  | 'planner.habit.created'
  | 'planner.habit.updated'
  | 'planner.habit.day_evaluated'
  | 'planner.focus.started'
  | 'planner.focus.completed'
  | 'finance.tx.created'
  | 'finance.tx.updated'
  | 'finance.tx.deleted'
  | 'finance.budget.updated'
  | 'finance.budget.spending_changed'
  | 'finance.debt.created'
  | 'finance.debt.payment_added'
  | 'finance.debt.payment_linked'
  | 'finance.debt.payment_unlinked'
  | 'finance.debt.synced'
  | 'finance.debt.sync_reversed'
  | 'finance.debt.status_changed'
  | 'insights.actions.apply';

export type PlannerEventPayloadMap = {
  'planner.task.created': PlannerTaskEvent;
  'planner.task.updated': PlannerTaskEvent;
  'planner.task.completed': PlannerTaskEvent;
  'planner.task.auto_completed': TaskAutoCompletedEvent;
  'planner.task.canceled': PlannerTaskEvent;
  'planner.goal.created': PlannerGoalEvent;
  'planner.goal.updated': PlannerGoalEvent;
  'planner.goal.completed': PlannerGoalEvent;
  'planner.goal.archived': PlannerGoalEvent;
  'planner.goal.progress_updated': PlannerGoalEvent;
  'planner.habit.created': PlannerHabitEvent;
  'planner.habit.updated': PlannerHabitEvent;
  'planner.habit.day_evaluated': PlannerHabitEvent;
  'planner.focus.started': PlannerFocusEvent;
  'planner.focus.completed': PlannerFocusEvent;
  'finance.tx.created': FinanceTxEvent;
  'finance.tx.updated': FinanceTxEvent;
  'finance.tx.deleted': FinanceTxEvent;
  'finance.budget.updated': FinanceBudgetEvent;
  'finance.budget.spending_changed': FinanceBudgetEvent;
  'finance.debt.created': FinanceDebtEvent;
  'finance.debt.payment_added': FinanceDebtPaymentEvent;
  'finance.debt.payment_linked': FinanceDebtLinkEvent;
  'finance.debt.payment_unlinked': FinanceDebtUnlinkEvent;
  'finance.debt.synced': FinanceDebtSyncEvent;
  'finance.debt.sync_reversed': FinanceDebtSyncEvent;
  'finance.debt.status_changed': FinanceDebtEvent;
  'insights.actions.apply': InsightsActionEvent;
};

type EventHandler<E extends PlannerEventName> = (payload: PlannerEventPayloadMap[E]) => void;

class PlannerEventBus {
  private listeners = new Map<PlannerEventName, Set<EventHandler<any>>>();

  subscribe<E extends PlannerEventName>(event: E, handler: EventHandler<E>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(handler as EventHandler<any>);
    this.listeners.set(event, set);
    return () => {
      const next = this.listeners.get(event);
      if (!next) return;
      next.delete(handler as EventHandler<any>);
      if (next.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  publish<E extends PlannerEventName>(event: E, payload: PlannerEventPayloadMap[E]) {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }
    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.warn('[PlannerEventBus] handler error', event, error);
      }
    });
  }

  clear() {
    this.listeners.clear();
  }
}

export const plannerEventBus = new PlannerEventBus();
