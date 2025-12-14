import { BSON, ObjectSchema } from 'realm';

const objectId = () => new BSON.ObjectId();
const now = () => new Date();

export const AccountSchema: ObjectSchema = {
  name: 'Account',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    name: 'string',
    accountType: 'string',
    currency: 'string',
    initialBalance: { type: 'double', default: 0 },
    currentBalance: { type: 'double', default: 0 },
    linkedGoalId: 'objectId?',
    customTypeId: 'string?',
    icon: 'string?',
    color: 'string?',
    isArchived: { type: 'bool', default: false }, // DEPRECATED: Use showStatus
    showStatus: { type: 'string', default: 'active' },
    idempotencyKey: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const TransactionSplitSchema: ObjectSchema = {
  name: 'TransactionSplit',
  embedded: true,
  properties: {
    splitId: { type: 'objectId', default: objectId },
    categoryId: 'string',
    amount: 'double',
  },
};

export const TransactionSchema: ObjectSchema = {
  name: 'Transaction',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    type: 'string',
    showStatus: { type: 'string', default: 'active' },
    accountId: 'objectId?',
    fromAccountId: 'objectId?',
    toAccountId: 'objectId?',
    amount: 'double',
    currency: 'string',
    baseCurrency: 'string',
    rateUsedToBase: 'double',
    convertedAmountToBase: 'double',
    toAmount: 'double?',
    toCurrency: 'string?',
    effectiveRateFromTo: 'double?',
    feeAmount: 'double?',
    feeCategoryId: 'string?',
    categoryId: 'string?',
    subcategoryId: 'string?',
    name: 'string?',
    description: 'string?',
    date: 'date',
    time: 'string?',
    goalId: 'objectId?',
    budgetId: 'objectId?',
    debtId: 'objectId?',
    habitId: 'objectId?',
    counterpartyId: 'objectId?',
    goalName: 'string?',
    goalType: 'string?',
    relatedBudgetId: 'objectId?',
    relatedDebtId: 'objectId?',
    plannedAmount: 'double?',
    paidAmount: 'double?',
    // Debt payment: original currency and conversion info
    originalCurrency: 'string?',
    originalAmount: 'double?',
    conversionRate: 'double?',
    isBalanceAdjustment: { type: 'bool', default: false },
    recurringId: 'string?',
    attachments: 'string[]',
    tags: 'string[]',
    splits: { type: 'list', objectType: 'TransactionSplit' },
    idempotencyKey: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    deletedAt: 'date?',
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const BudgetSchema: ObjectSchema = {
  name: 'Budget',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    name: 'string',
    budgetType: 'string',
    categoryIds: 'string[]',
    linkedGoalId: 'objectId?',
    accountId: 'objectId?',
    transactionType: 'string?',
    currency: 'string',
    limitAmount: 'double',
    periodType: 'string',
    startDate: 'date?',
    endDate: 'date?',
    spentAmount: { type: 'double', default: 0 },
    remainingAmount: { type: 'double', default: 0 },
    percentUsed: { type: 'double', default: 0 },
    contributionTotal: { type: 'double', default: 0 },
    currentBalance: { type: 'double', default: 0 },
    isOverspent: { type: 'bool', default: false },
    rolloverMode: 'string?',
    isArchived: { type: 'bool', default: false }, // DEPRECATED: Use showStatus
    showStatus: { type: 'string', default: 'active' },
    notifyOnExceed: { type: 'bool', default: false },
    idempotencyKey: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const BudgetEntrySchema: ObjectSchema = {
  name: 'BudgetEntry',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    budgetId: 'objectId',
    transactionId: 'objectId',
    appliedAmountBudgetCurrency: 'double',
    rateUsedTxnToBudget: 'double',
    snapshottedAt: { type: 'date', default: now },
    idempotencyKey: 'string?',
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const DebtPaymentSchema: ObjectSchema = {
  name: 'DebtPayment',
  embedded: true,
  properties: {
    paymentId: { type: 'objectId', default: objectId },
    amount: 'double',
    currency: 'string',
    baseCurrency: 'string',
    rateUsedToBase: 'double',
    convertedAmountToBase: 'double',
    rateUsedToDebt: 'double',
    convertedAmountToDebt: 'double',
    paymentDate: 'date',
    accountId: 'objectId?',
    note: 'string?',
    relatedTransactionId: 'objectId?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
  },
};

export const DebtSchema: ObjectSchema = {
  name: 'Debt',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    direction: 'string',
    counterpartyId: 'objectId?',
    counterpartyName: 'string',
    description: 'string?',
    principalAmount: 'double',
    principalOriginalAmount: 'double?',
    principalCurrency: 'string',
    principalOriginalCurrency: 'string?',
    baseCurrency: 'string',
    rateOnStart: 'double',
    principalBaseValue: 'double',
    repaymentCurrency: 'string?',
    repaymentAmount: 'double?',
    repaymentRateOnStart: 'double?',
    isFixedRepaymentAmount: { type: 'bool', default: false },
    startDate: 'date',
    dueDate: 'date?',
    interestMode: 'string?',
    interestRateAnnual: 'double?',
    scheduleHint: 'string?',
    linkedGoalId: 'objectId?',
    linkedBudgetId: 'objectId?',
    fundingAccountId: 'objectId?',
    fundingTransactionId: 'objectId?',
    // Dual account system for debts
    lentFromAccountId: 'objectId?',    // Where money came from when lending
    returnToAccountId: 'objectId?',    // Where repayment will go
    receivedToAccountId: 'objectId?',  // Where borrowed money went
    payFromAccountId: 'objectId?',     // Where payments come from
    customRateUsed: 'double?',         // Custom exchange rate at creation
    reminderEnabled: { type: 'bool', default: false },
    reminderTime: 'string?',
    status: 'string',
    showStatus: { type: 'string', default: 'active' },
    payments: { type: 'list', objectType: 'DebtPayment' },
    idempotencyKey: 'string?',
    // Settlement info - saved when debt is fully paid
    settledAt: 'date?',                           // When fully settled
    finalRateUsed: 'double?',                     // Exchange rate used for final payment
    finalProfitLoss: 'double?',                   // Profit (+) or Loss (-) in repayment currency
    finalProfitLossCurrency: 'string?',           // Currency of profit/loss
    totalPaidInRepaymentCurrency: 'double?',      // Total amount paid in repayment currency
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const FxRateSchema: ObjectSchema = {
  name: 'FxRate',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    date: 'date',
    fromCurrency: 'string',
    toCurrency: 'string',
    rate: 'double',                                    // Asosiy kurs (eski, backward compatibility)
    rateMid: 'double?',                                // O'rta kurs (markaziy bank rasmiy kursi)
    rateBid: 'double?',                                // Sotib olish kursi (bank sotib oladi)
    rateAsk: 'double?',                                // Sotish kursi (bank sotadi)
    nominal: { type: 'int', default: 1 },              // Nominal (odatda 1, ba'zi valyutalar uchun 100)
    spreadPercent: { type: 'double', default: 0.5 },   // Spread foizi
    source: 'string',
    isOverridden: { type: 'bool', default: false },
    // Time-based rate tracking
    effectiveFrom: 'date?',                            // When this rate became effective
    effectiveUntil: 'date?',                           // When next rate took over (optional)
    idempotencyKey: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const CounterpartySchema: ObjectSchema = {
  name: 'Counterparty',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    displayName: 'string',
    phoneNumber: 'string?',
    comment: 'string?',
    searchKeywords: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const financeSchemas = [
  AccountSchema,
  TransactionSplitSchema,
  TransactionSchema,
  BudgetSchema,
  BudgetEntrySchema,
  DebtPaymentSchema,
  DebtSchema,
  FxRateSchema,
  CounterpartySchema,
];
