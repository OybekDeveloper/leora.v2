// types/store.types.ts
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'income' | 'outcome' | 'transfer';
  amount: number;
  category?: string;
  accountId: string;
  toAccountId?: string;
  toAmount?: number;
  toCurrency?: string;
  effectiveRateFromTo?: number;
  note?: string;
  description?: string;
  date: Date;
  currency?: string;
  createdAt: Date;
  updatedAt?: Date;
  relatedDebtId?: string;
  sourceTransactionId?: string;
  transferDirection?: 'incoming' | 'outgoing';
  goalId?: string;
  goalName?: string;
  goalType?: string;
  budgetId?: string;
  debtId?: string;
  relatedBudgetId?: string;
  relatedDebtId?: string;
  plannedAmount?: number;
  paidAmount?: number;
}

export interface Debt {
  id: string;
  person: string;
  amount: number;
  remainingAmount: number;
  type: 'borrowed' | 'lent';
  currency: FinanceCurrency;
  date: Date;
  expectedReturnDate?: Date;
  reminderEnabled?: boolean;
  reminderTime?: string;
  note?: string;
  status: 'active' | 'settled' | 'overdue';
  createdAt: Date;
  accountId: string;
  transactionId?: string;
}

export interface FocusSession {
  id: string;
  duration: number; // in minutes
  startedAt: Date;
  endedAt?: Date;
  completed: boolean;
}
