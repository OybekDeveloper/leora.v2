import type { ShowStatus } from '../shared/showStatus';

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
  isArchived: boolean; // DEPRECATED: Use showStatus instead
  showStatus?: ShowStatus; // Defaults to 'active' in database schema
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
  showStatus?: ShowStatus; // Defaults to 'active' in database schema
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
  name?: string;
  description?: string;
  date: string;
  time?: string;
  goalId?: string;
  budgetId?: string;
  debtId?: string;
  habitId?: string;
  counterpartyId?: string;
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
  // Debt payment: original currency and conversion info
  originalCurrency?: string; // Qarz valyutasi (masalan USD)
  originalAmount?: number; // Qarz valyutasidagi summa (masalan 10 USD)
  conversionRate?: number; // Konvertatsiya kursi (masalan 12500 UZS/USD)
  isPending?: boolean;
  isBalanceAdjustment?: boolean; // Account balance qo'lda o'zgartirilganda yaratilgan transaction
  skipBudgetMatching?: boolean; // User explicitly chose "No budget" - skip auto-matching by category
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
  isOverspent: boolean;
  rolloverMode?: 'none' | 'carryover';
  isArchived: boolean; // DEPRECATED: Use showStatus instead
  showStatus?: ShowStatus; // Defaults to 'active' in database schema
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
  phoneNumber?: string;
  comment?: string;
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
  repaymentCurrency?: string;
  repaymentAmount?: number;
  repaymentRateOnStart?: number;
  isFixedRepaymentAmount?: boolean;
  startDate: string;
  dueDate?: string;
  interestMode?: 'simple' | 'compound';
  interestRateAnnual?: number;
  scheduleHint?: string;
  linkedGoalId?: string;
  linkedBudgetId?: string;
  fundingAccountId?: string;
  fundingTransactionId?: string;

  // Dual account system for debts
  // For "they_owe_me" (lending)
  lentFromAccountId?: string;    // Where money came from when lending
  returnToAccountId?: string;    // Where repayment will go

  // For "i_owe" (borrowing)
  receivedToAccountId?: string;  // Where borrowed money went
  payFromAccountId?: string;     // Where payments come from

  // Custom exchange rate used at creation
  customRateUsed?: number;
  reminderEnabled?: boolean;
  reminderTime?: string;
  status: DebtStatus;
  showStatus?: ShowStatus; // Defaults to 'active' in database schema
  isPending?: boolean;

  // Settlement info - saved when debt is fully paid
  settledAt?: string;                    // ISO timestamp when fully settled
  finalRateUsed?: number;                // Exchange rate used for final payment
  finalProfitLoss?: number;              // Profit (+) or Loss (-) in repayment currency
  finalProfitLossCurrency?: string;      // Currency of profit/loss (usually repaymentCurrency)
  totalPaidInRepaymentCurrency?: number; // Total amount paid in repayment currency

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
  rate: number;                    // Asosiy kurs (backward compatibility)
  rateMid?: number;                // O'rta kurs (markaziy bank rasmiy kursi)
  rateBid?: number;                // Sotib olish kursi (bank sotib oladi)
  rateAsk?: number;                // Sotish kursi (bank sotadi)
  nominal?: number;                // Nominal (odatda 1, ba'zi valyutalar uchun 100)
  spreadPercent?: number;          // Spread foizi
  source: 'cbu' | 'cbr' | 'tcmb' | 'sama' | 'cbuae' | 'ecb' | 'fed' | 'boe' | 'market_api' | 'manual';
  isOverridden: boolean;
  // Time-based rate tracking
  effectiveFrom?: string;          // ISO timestamp - when this rate became effective
  effectiveUntil?: string;         // ISO timestamp - when next rate took over (optional)
  createdAt: string;
  updatedAt: string;
}

export type FxDirection = 'buy' | 'sell';

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
