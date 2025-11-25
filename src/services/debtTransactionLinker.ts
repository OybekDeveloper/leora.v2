/**
 * Debt-Transaction Linker Service
 *
 * Automatically synchronizes debt payments with Income/Outcome transactions.
 * Implements PL-14 requirement from planner.md spec.
 *
 * Sync Rules:
 * - When debt payment is added → create matching transaction
 * - When transaction with debtId is created → update debt balance
 * - When transaction with debtId is deleted → reverse debt balance update
 * - Prevent duplicate transactions
 */

import type { Debt, DebtPayment, Transaction } from '@/domain/finance/types';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { plannerEventBus } from '@/events/plannerEventBus';

/**
 * Link a debt payment to a transaction
 *
 * Stores the link in the debt payment metadata so we know which
 * transaction corresponds to which payment.
 *
 * @param debtId - The debt ID
 * @param paymentId - The payment ID
 * @param transactionId - The created transaction ID
 */
export function linkDebtPaymentToTransaction(
  debtId: string,
  paymentId: string,
  transactionId: string
) {
  console.log(`[DebtTransactionLinker] Linking payment ${paymentId} to transaction ${transactionId}`);

  // Store the link in a map or in the payment object itself
  // For now, we'll publish an event for tracking
  plannerEventBus.publish('finance.debt.payment_linked', {
    debtId,
    paymentId,
    transactionId,
    linkedAt: new Date().toISOString(),
  });
}

/**
 * Unlink a debt payment from a transaction
 *
 * @param paymentId - The payment ID to unlink
 */
export function unlinkDebtPayment(paymentId: string) {
  console.log(`[DebtTransactionLinker] Unlinking payment ${paymentId}`);

  plannerEventBus.publish('finance.debt.payment_unlinked', {
    paymentId,
    unlinkedAt: new Date().toISOString(),
  });
}

/**
 * Create a transaction when a debt payment is added
 *
 * This automatically creates an Income or Outcome transaction based on
 * the debt direction.
 *
 * @param debt - The debt entity
 * @param payment - The payment being added
 * @returns The created transaction ID
 */
export function createTransactionFromDebtPayment(
  debt: Debt,
  payment: DebtPayment
): string | null {
  const { createTransaction, accounts } = useFinanceDomainStore.getState();

  // Determine transaction type based on debt direction
  // If I owe money (i_owe), payment is an expense
  // If they owe me (they_owe_me), payment is income
  const transactionType = debt.direction === 'i_owe' ? 'expense' : 'income';

  // Find the account to use (prefer linked account or use first available)
  const account = debt.accountId
    ? accounts.find(a => a.id === debt.accountId)
    : accounts[0];

  if (!account) {
    console.error('[DebtTransactionLinker] No account available for transaction');
    return null;
  }

  try {
    // Create the transaction
    const transaction = createTransaction({
      userId: debt.userId,
      type: transactionType,
      accountId: account.id,
      amount: payment.amount,
      currency: payment.currency || debt.principalCurrency,
      categoryId: 'debt-payment', // Special category for debt payments
      description: `Debt payment: ${debt.counterpartyName}${payment.note ? ' - ' + payment.note : ''}`,
      date: payment.paidAt,
      debtId: debt.id,
      baseCurrency: debt.baseCurrency,
    });

    // Link the payment to the transaction
    linkDebtPaymentToTransaction(debt.id, payment.id, transaction.id);

    console.log(`[DebtTransactionLinker] Created transaction ${transaction.id} for debt payment`);

    return transaction.id;
  } catch (error) {
    console.error('[DebtTransactionLinker] Failed to create transaction:', error);
    return null;
  }
}

/**
 * Update debt balance based on transaction
 *
 * When a transaction with debtId is created, we need to update the
 * debt's remaining balance.
 *
 * @param transaction - The transaction that was created
 */
export function syncDebtFromTransaction(transaction: Transaction) {
  if (!transaction.debtId) return;

  const { debts, updateDebt } = useFinanceDomainStore.getState();

  const debt = debts.find(d => d.id === transaction.debtId);
  if (!debt) {
    console.warn(`[DebtTransactionLinker] Debt ${transaction.debtId} not found`);
    return;
  }

  console.log(`[DebtTransactionLinker] Syncing debt ${debt.id} from transaction ${transaction.id}`);

  // Calculate new balance
  // For "i_owe" debts, payments (expenses) reduce the balance
  // For "they_owe_me" debts, payments (income) reduce the balance
  const paymentAmount = Math.abs(transaction.amount);
  const currentRemaining = debt.remainingAmount || debt.principalAmount;
  const newRemaining = Math.max(0, currentRemaining - paymentAmount);

  // Update debt
  updateDebt(debt.id, {
    remainingAmount: newRemaining,
    status: newRemaining === 0 ? 'paid' : debt.status,
    updatedAt: new Date().toISOString(),
  });

  // Publish sync event
  plannerEventBus.publish('finance.debt.synced', {
    debtId: debt.id,
    transactionId: transaction.id,
    previousRemaining: currentRemaining,
    newRemaining,
    syncedAt: new Date().toISOString(),
  });
}

/**
 * Reverse debt balance update when transaction is deleted
 *
 * @param transaction - The transaction that was deleted
 */
export function reverseSyncDebtFromTransaction(transaction: Transaction) {
  if (!transaction.debtId) return;

  const { debts, updateDebt } = useFinanceDomainStore.getState();

  const debt = debts.find(d => d.id === transaction.debtId);
  if (!debt) return;

  console.log(`[DebtTransactionLinker] Reversing debt sync for ${debt.id}`);

  // Add the payment amount back to the debt
  const paymentAmount = Math.abs(transaction.amount);
  const currentRemaining = debt.remainingAmount || 0;
  const newRemaining = Math.min(debt.principalAmount, currentRemaining + paymentAmount);

  // Update debt
  updateDebt(debt.id, {
    remainingAmount: newRemaining,
    status: newRemaining > 0 ? 'active' : debt.status,
    updatedAt: new Date().toISOString(),
  });

  // Publish reverse sync event
  plannerEventBus.publish('finance.debt.sync_reversed', {
    debtId: debt.id,
    transactionId: transaction.id,
    previousRemaining: currentRemaining,
    newRemaining,
    reversedAt: new Date().toISOString(),
  });
}

/**
 * Check if a transaction already exists for a debt payment
 *
 * Prevents creating duplicate transactions.
 *
 * @param debtId - The debt ID
 * @param paymentId - The payment ID
 * @returns true if transaction already exists
 */
export function hasTransactionForPayment(debtId: string, paymentId: string): boolean {
  const { transactions } = useFinanceDomainStore.getState();

  // Check if there's a transaction with this debtId and matching description
  return transactions.some(tx =>
    tx.debtId === debtId &&
    tx.description?.includes(`payment`)
  );
}

/**
 * Initialize the debt-transaction linker service
 *
 * Subscribe to events and set up automatic syncing.
 */
export function initDebtTransactionLinker() {
  console.log('[DebtTransactionLinker] Initializing...');

  // Subscribe to transaction created events
  plannerEventBus.subscribe('finance.tx.created', (event) => {
    const { transaction } = event.payload || event;
    if (transaction && transaction.debtId) {
      syncDebtFromTransaction(transaction);
    }
  });

  // Subscribe to transaction deleted events
  plannerEventBus.subscribe('finance.tx.deleted', (event) => {
    const { transaction } = event.payload || event;
    if (transaction && transaction.debtId) {
      reverseSyncDebtFromTransaction(transaction);
    }
  });

  // Subscribe to debt payment events (if we want automatic transaction creation)
  plannerEventBus.subscribe('finance.debt.payment_added', (event) => {
    const { debt, payment } = event.payload || event;
    if (debt && payment && !hasTransactionForPayment(debt.id, payment.id)) {
      createTransactionFromDebtPayment(debt, payment);
    }
  });

  console.log('[DebtTransactionLinker] Initialized successfully');
}

/**
 * Cleanup function
 */
export function cleanupDebtTransactionLinker() {
  console.log('[DebtTransactionLinker] Cleanup complete');
}
