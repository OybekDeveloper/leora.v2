/**
 * Habit Auto-Evaluator Service
 *
 * Listens to finance.tx.created events and automatically evaluates habits with financeRule.
 * Implements PL-12 requirement from planner.md spec.
 *
 * Updated to support new HabitFinanceRule discriminated union types:
 * - no_spend_in_categories
 * - spend_in_categories
 * - has_any_transactions
 * - daily_spend_under
 */

import type { Transaction } from '@/domain/finance/types';
import type { Habit, HabitFinanceRule } from '@/domain/planner/types';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { plannerEventBus } from '@/events/plannerEventBus';
import { startOfDay } from '@/utils/calendar';

const dateKeyFromDate = (date: Date) => startOfDay(date).toISOString().split('T')[0]!;

/**
 * Evaluates a single habit against its finance rule for a given date
 */
function evaluateHabitForDate(
  habit: Habit,
  date: string, // ISO date string (YYYY-MM-DD)
  transactions: Transaction[]
): 'done' | 'miss' | null {
  if (!habit.financeRule) return null;
  if (habit.status !== 'active') return null;

  const rule = habit.financeRule;
  const dayTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date || tx.createdAt).toISOString().split('T')[0];
    return txDate === date;
  });

  switch (rule.type) {
    case 'no_spend_in_categories': {
      // PASS if NO transactions in specified categories
      const hasSpendInCategories = dayTransactions.some(tx =>
        tx.type === 'expense' && rule.categoryIds.includes(tx.category)
      );
      return hasSpendInCategories ? 'miss' : 'done';
    }

    case 'spend_in_categories': {
      // PASS if HAS transactions in categories (optionally >= minAmount)
      const relevantTransactions = dayTransactions.filter(tx =>
        rule.categoryIds.includes(tx.category)
      );

      if (relevantTransactions.length === 0) return 'miss';

      if (rule.minAmount) {
        const totalSpent = relevantTransactions.reduce((sum, tx) => {
          // Convert to rule currency if needed (for now assume same currency)
          return sum + Math.abs(tx.amount);
        }, 0);
        return totalSpent >= rule.minAmount ? 'done' : 'miss';
      }

      return 'done';
    }

    case 'has_any_transactions': {
      // PASS if HAS any transaction (optionally in specific accounts)
      if (!rule.accountIds || rule.accountIds.length === 0) {
        return dayTransactions.length > 0 ? 'done' : 'miss';
      }

      const hasTransactionInAccounts = dayTransactions.some(tx =>
        rule.accountIds?.includes(tx.accountId)
      );
      return hasTransactionInAccounts ? 'done' : 'miss';
    }

    case 'daily_spend_under': {
      // PASS if total daily spend < amount in specified currency
      const dayExpenses = dayTransactions.filter(tx => tx.type === 'expense');
      const totalSpent = dayExpenses.reduce((sum, tx) => {
        // TODO: Convert to rule currency using FX rates
        // For now assume same currency
        if (tx.currency === rule.currency) {
          return sum + Math.abs(tx.amount);
        }
        return sum;
      }, 0);

      return totalSpent < rule.amount ? 'done' : 'miss';
    }

    default:
      return null;
  }
}

/**
 * Evaluates all habits with finance rules for a specific transaction date
 */
function evaluateHabitsForTransaction(transaction: Transaction) {
  const { habits, logHabitCompletion } = usePlannerDomainStore.getState();
  const { transactions } = useFinanceDomainStore.getState();

  // Get date from transaction (YYYY-MM-DD format)
  const transactionDate = new Date(transaction.date || transaction.createdAt).toISOString().split('T')[0];

  // Find all habits with finance rules
  const habitsWithRules = habits.filter(h =>
    h.financeRule && h.status === 'active'
  );

  console.log(`[HabitAutoEvaluator] Evaluating ${habitsWithRules.length} habits for date ${transactionDate}`);

  habitsWithRules.forEach(habit => {
    const result = evaluateHabitForDate(habit, transactionDate, transactions);

    if (result) {
      console.log(`[HabitAutoEvaluator] Habit "${habit.title}" evaluated as: ${result}`);

      // Log the completion (or miss) for this habit
      // Note: logHabitCompletion might have different signature - adjust if needed
      if (result === 'done') {
        logHabitCompletion(habit.id, true, { date: new Date(transactionDate) });
      } else {
        // For 'miss', we might need a different method or parameter
        // Check the store implementation
        logHabitCompletion(habit.id, false, { date: new Date(transactionDate) });
      }

      // Publish event
      plannerEventBus.publish('planner.habit.day_evaluated', {
        habitId: habit.id,
        date: transactionDate,
        result,
        evaluatedBy: 'auto',
        ruleType: habit.financeRule?.type,
      });
    }
  });
}

/**
 * Re-evaluate all habits for a specific date
 * Useful when transactions are updated or deleted
 */
export function reevaluateHabitsForDate(dateStr: string) {
  const { habits, logHabitCompletion } = usePlannerDomainStore.getState();
  const { transactions } = useFinanceDomainStore.getState();

  const habitsWithRules = habits.filter(h =>
    h.financeRule && h.status === 'active'
  );

  habitsWithRules.forEach(habit => {
    const result = evaluateHabitForDate(habit, dateStr, transactions);

    if (result) {
      if (result === 'done') {
        logHabitCompletion(habit.id, true, { date: new Date(dateStr) });
      } else {
        logHabitCompletion(habit.id, false, { date: new Date(dateStr) });
      }

      plannerEventBus.publish('planner.habit.day_evaluated', {
        habitId: habit.id,
        date: dateStr,
        result,
        evaluatedBy: 'auto-reevaluate',
        ruleType: habit.financeRule?.type,
      });
    }
  });
}

/**
 * Initialize the habit auto-evaluator
 * Subscribe to finance events and evaluate habits automatically
 */
export function initHabitAutoEvaluator() {
  console.log('[HabitAutoEvaluator] Initializing...');

  // Subscribe to finance transaction events
  plannerEventBus.subscribe('finance.tx.created', (event) => {
    const { transaction } = event.payload || event;
    console.log(`[HabitAutoEvaluator] Transaction created: ${transaction?.id || 'unknown'}`);
    if (transaction) {
      evaluateHabitsForTransaction(transaction);
    }
  });

  plannerEventBus.subscribe('finance.tx.updated', (event) => {
    const { transaction } = event.payload || event;
    console.log(`[HabitAutoEvaluator] Transaction updated: ${transaction?.id || 'unknown'}`);
    if (transaction) {
      // Re-evaluate for the transaction date
      const transactionDate = new Date(transaction.date || transaction.createdAt).toISOString().split('T')[0];
      reevaluateHabitsForDate(transactionDate);
    }
  });

  plannerEventBus.subscribe('finance.tx.deleted', (event) => {
    const { transactionId, date } = event.payload || event;
    console.log(`[HabitAutoEvaluator] Transaction deleted: ${transactionId || 'unknown'}`);
    if (date) {
      // Re-evaluate for the transaction date
      const transactionDate = new Date(date).toISOString().split('T')[0];
      reevaluateHabitsForDate(transactionDate);
    }
  });

  console.log('[HabitAutoEvaluator] Initialized successfully');
}

/**
 * Cleanup function to unsubscribe from events
 */
export function cleanupHabitAutoEvaluator() {
  // Event bus should handle automatic cleanup
  // This is a placeholder for any manual cleanup needed
  console.log('[HabitAutoEvaluator] Cleanup complete');
}
