import type { FocusSession, Goal, Habit, Task } from '@/domain/planner/types';
import type { Budget, Debt, Transaction as FinanceTransaction } from '@/domain/finance/types';

type PlannerTaskEvent = { task: Task };
type PlannerGoalEvent = { goal: Goal };
type PlannerHabitEvent = { habit: Habit; date?: string; status?: 'done' | 'miss' };
type PlannerFocusEvent = { session: FocusSession };
type FinanceTxEvent = { transaction: FinanceTransaction };
type FinanceBudgetEvent = { budget: Budget };
type FinanceDebtEvent = { debt: Debt };
type InsightsActionEvent = { actionId: string; payload?: unknown };

export type PlannerEventName =
  | 'planner.task.created'
  | 'planner.task.updated'
  | 'planner.task.completed'
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
  | 'finance.budget.updated'
  | 'finance.budget.spending_changed'
  | 'finance.debt.created'
  | 'finance.debt.payment_added'
  | 'finance.debt.status_changed'
  | 'insights.actions.apply';

export type PlannerEventPayloadMap = {
  'planner.task.created': PlannerTaskEvent;
  'planner.task.updated': PlannerTaskEvent;
  'planner.task.completed': PlannerTaskEvent;
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
  'finance.budget.updated': FinanceBudgetEvent;
  'finance.budget.spending_changed': FinanceBudgetEvent;
  'finance.debt.created': FinanceDebtEvent;
  'finance.debt.payment_added': FinanceDebtEvent;
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
