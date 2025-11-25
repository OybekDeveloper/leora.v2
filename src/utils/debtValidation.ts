/**
 * Debt Validation Utilities
 *
 * Provides validation and lock checking for debt entities to prevent
 * editing or deletion when linked to transactions.
 */

import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';

/**
 * Check if a debt is locked (linked to any transactions)
 *
 * A debt is considered "locked" if it has associated transactions.
 * Locked debts cannot be edited or deleted until all linked transactions
 * are removed first.
 *
 * @param debtId - The ID of the debt to check
 * @returns true if debt is locked (has linked transactions), false otherwise
 */
export function isDebtLocked(debtId: string): boolean {
  const transactions = useFinanceDomainStore.getState().transactions;
  return transactions.some(tx => tx.debtId === debtId);
}

/**
 * Get all transactions linked to a specific debt
 *
 * @param debtId - The ID of the debt
 * @returns Array of transactions linked to this debt
 */
export function getDebtTransactions(debtId: string) {
  const transactions = useFinanceDomainStore.getState().transactions;
  return transactions.filter(tx => tx.debtId === debtId);
}

/**
 * Get the total number of transactions linked to a debt
 *
 * @param debtId - The ID of the debt
 * @returns Count of linked transactions
 */
export function getDebtTransactionCount(debtId: string): number {
  return getDebtTransactions(debtId).length;
}

/**
 * Check if a debt can be safely deleted
 *
 * A debt can be deleted if:
 * - It has no linked transactions
 * - It has no linked goals
 * - It has no linked budgets
 *
 * @param debtId - The ID of the debt to check
 * @returns Object with canDelete flag and reason if not deletable
 */
export function canDeleteDebt(debtId: string): { canDelete: boolean; reason?: string } {
  const { debts, transactions } = useFinanceDomainStore.getState();

  const debt = debts.find(d => d.id === debtId);
  if (!debt) {
    return { canDelete: false, reason: 'Debt not found' };
  }

  // Check for linked transactions
  const linkedTransactions = transactions.filter(tx => tx.debtId === debtId);
  if (linkedTransactions.length > 0) {
    return {
      canDelete: false,
      reason: `Debt is linked to ${linkedTransactions.length} transaction(s). Delete transactions first.`
    };
  }

  // Check for linked goals (if planner integration exists)
  if (debt.linkedGoalId) {
    return {
      canDelete: false,
      reason: 'Debt is linked to a goal. Unlink the goal first.'
    };
  }

  // Check for linked budgets
  if (debt.linkedBudgetId) {
    return {
      canDelete: false,
      reason: 'Debt is linked to a budget. Unlink the budget first.'
    };
  }

  return { canDelete: true };
}

/**
 * Check if a debt can be edited
 *
 * @param debtId - The ID of the debt to check
 * @returns Object with canEdit flag and reason if not editable
 */
export function canEditDebt(debtId: string): { canEdit: boolean; reason?: string } {
  // For now, same logic as deletion
  // In the future, we might allow editing some fields even with transactions
  const deleteCheck = canDeleteDebt(debtId);
  return {
    canEdit: deleteCheck.canDelete,
    reason: deleteCheck.reason
  };
}
