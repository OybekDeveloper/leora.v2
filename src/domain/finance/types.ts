export type DecimalString = string;

export type AccountType =
  | 'cash'
  | 'card'
  | 'savings'
  | 'investment'
  | 'credit'
  | 'debt'
  | 'other';

export interface Account {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  linkedGoalId?: string;
  isArchived: boolean;
  customTypeId?: string;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  parentId?: string;
  name: string;
  type: 'expense' | 'income';
  isUserDefined: boolean;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface TransactionSplit {
  splitId: string;
  categoryId: string;
  amount: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  currency: string;
  baseCurrency: string;
  rateUsedToBase: number;
  convertedAmountToBase: number;
  toAmount?: number;
  toCurrency?: string;
  effectiveRateFromTo?: number;
  feeAmount?: number;
  feeCategoryId?: string;
  categoryId?: string;
  subcategoryId?: string;
  description?: string;
  date: string;
  time?: string;
  goalId?: string;
  budgetId?: string;
  debtId?: string;
  habitId?: string;
  splits?: TransactionSplit[];
  recurringId?: string;
  attachments?: string[];
  tags?: string[];
  goalName?: string;
  goalType?: string;
  relatedBudgetId?: string;
  relatedDebtId?: string;
  plannedAmount?: number;
  paidAmount?: number;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BudgetType = 'category' | 'project';
export type BudgetPeriodType = 'none' | 'weekly' | 'monthly' | 'custom_range';
export type BudgetFlowType = 'income' | 'expense';

export interface Budget {
  id: string;
  userId: string;
  name: string;
  budgetType: BudgetType;
  categoryIds?: string[];
  linkedGoalId?: string;
  accountId?: string;
  transactionType?: BudgetFlowType;
  currency: string;
  limitAmount: number;
  periodType: BudgetPeriodType;
  startDate?: string;
  endDate?: string;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  rolloverMode?: 'none' | 'carryover';
  isArchived: boolean;
  notifyOnExceed?: boolean;
  contributionTotal?: number;
  currentBalance?: number;
  goalLinks?: string[];
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetEntry {
  id: string;
  budgetId: string;
  transactionId: string;
  appliedAmountBudgetCurrency: number;
  rateUsedTxnToBudget: number;
  snapshottedAt: string;
}

export type DebtDirection = 'i_owe' | 'they_owe_me';
export type DebtStatus = 'active' | 'paid' | 'overdue' | 'canceled';

export interface Counterparty {
  id: string;
  userId: string;
  displayName: string;
  searchKeywords?: string;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  direction: DebtDirection;
  counterpartyId?: string;
  counterpartyName: string;
  description?: string;
  principalAmount: number;
  principalOriginalAmount?: number;
  principalCurrency: string;
  principalOriginalCurrency?: string;
  baseCurrency: string;
  rateOnStart: number;
  principalBaseValue: number;
  startDate: string;
  dueDate?: string;
  interestMode?: 'simple' | 'compound';
  interestRateAnnual?: number;
  scheduleHint?: string;
  linkedGoalId?: string;
  linkedBudgetId?: string;
  fundingAccountId?: string;
  fundingTransactionId?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  status: DebtStatus;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  currency: string;
  baseCurrency: string;
  rateUsedToBase: number;
  convertedAmountToBase: number;
  rateUsedToDebt: number;
  convertedAmountToDebt: number;
  paymentDate: string;
  accountId?: string;
  note?: string;
  relatedTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FxRate {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: 'central_bank' | 'market_api' | 'manual';
  isOverridden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSummaryDaily {
  date: string;
  baseCurrency: string;
  income: number;
  expenses: number;
  net: number;
  transactions: number;
}

export interface FinanceSummaryMonthly {
  month: number;
  year: number;
  baseCurrency: string;
  income: number;
  expenses: number;
  net: number;
  averageDailySpend: number;
}

export interface OutstandingDebt {
  id: string;
  counterpartyName: string;
  remainingAmount: number;
  currency: string;
  baseAmount: number;
  direction: DebtDirection;
  status: DebtStatus;
  dueDate?: string;
}

export interface BudgetSnapshot {
  id: string;
  name: string;
  spentAmount: number;
  limitAmount: number;
  remainingAmount: number;
  percentUsed: number;
  currency: string;
  periodStart?: string;
  periodEnd?: string;
  budgetType: BudgetType;
}
