import Realm, { BSON } from 'realm';

import type {
  Account,
  AccountType,
  Transaction,
  TransactionSplit,
  TransactionType,
  Budget,
  BudgetEntry,
  BudgetFlowType,
  Debt,
  DebtPayment,
  FxRate,
  DebtDirection,
  Counterparty,
} from '@/domain/finance/types';

import { fromObjectId, toISODate, toObjectId } from './helpers';

const defaultUserId = 'local-user';

const hasRealmInstance = (realm: Realm | null): realm is Realm => Boolean(realm && !realm.isClosed);

// Summani valyutaga qarab yaxlitlash (UZS: 0 kasr, boshqalar: 2 kasr)
const roundAmountForCurrency = (amount: number, currency: string): number => {
  if (!Number.isFinite(amount)) return 0;
  const decimals = currency === 'UZS' ? 0 : 2;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
};

const mapAccount = (record: any): Account => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  name: record.name,
  accountType: record.accountType as AccountType,
  currency: record.currency,
  initialBalance: record.initialBalance ?? 0,
  currentBalance: record.currentBalance ?? 0,
  linkedGoalId: fromObjectId(record.linkedGoalId),
  customTypeId: record.customTypeId ?? undefined,
  isArchived: Boolean(record.isArchived),
  showStatus: record.showStatus ?? (record.isArchived ? 'archived' : 'active'),
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapSplit = (record: any): TransactionSplit => ({
  splitId: fromObjectId(record.splitId)!,
  categoryId: record.categoryId,
  amount: record.amount,
});

const mapTransaction = (record: any): Transaction => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  type: record.type as TransactionType,
  showStatus: record.showStatus ?? (record.deletedAt ? 'deleted' : 'active'),
  accountId: fromObjectId(record.accountId),
  fromAccountId: fromObjectId(record.fromAccountId),
  toAccountId: fromObjectId(record.toAccountId),
  amount: record.amount,
  currency: record.currency,
  baseCurrency: record.baseCurrency,
  rateUsedToBase: record.rateUsedToBase ?? 1,
  convertedAmountToBase: record.convertedAmountToBase ?? record.amount,
  toAmount: record.toAmount ?? undefined,
  toCurrency: record.toCurrency ?? undefined,
  effectiveRateFromTo: record.effectiveRateFromTo ?? undefined,
  feeAmount: record.feeAmount ?? undefined,
  feeCategoryId: record.feeCategoryId ?? undefined,
  categoryId: record.categoryId ?? undefined,
  subcategoryId: record.subcategoryId ?? undefined,
  name: record.name ?? undefined,
  description: record.description ?? undefined,
  date: toISODate(record.date)!,
  time: record.time ?? undefined,
  goalId: fromObjectId(record.goalId),
  budgetId: fromObjectId(record.budgetId),
  debtId: fromObjectId(record.debtId),
  habitId: fromObjectId(record.habitId),
  counterpartyId: fromObjectId(record.counterpartyId),
  goalName: record.goalName ?? undefined,
  goalType: record.goalType ?? undefined,
  relatedBudgetId: fromObjectId(record.relatedBudgetId),
  relatedDebtId: fromObjectId(record.relatedDebtId),
  plannedAmount: record.plannedAmount ?? undefined,
  paidAmount: record.paidAmount ?? undefined,
  originalCurrency: record.originalCurrency ?? undefined,
  originalAmount: record.originalAmount ?? undefined,
  conversionRate: record.conversionRate ?? undefined,
  splits: record.splits?.map(mapSplit),
  recurringId: record.recurringId ?? undefined,
  attachments: record.attachments ?? [],
  tags: record.tags ?? [],
  isBalanceAdjustment: record.isBalanceAdjustment ?? false,
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapBudget = (record: any): Budget => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  name: record.name,
  budgetType: record.budgetType,
  categoryIds: record.categoryIds ? Array.from(record.categoryIds) : [],
  linkedGoalId: fromObjectId(record.linkedGoalId),
  accountId: fromObjectId(record.accountId),
  transactionType: record.transactionType ?? undefined,
  currency: record.currency,
  limitAmount: record.limitAmount,
  periodType: record.periodType,
  startDate: toISODate(record.startDate) ?? undefined,
  endDate: toISODate(record.endDate) ?? undefined,
  spentAmount: record.spentAmount ?? 0,
  remainingAmount: record.remainingAmount ?? record.limitAmount,
  percentUsed: record.percentUsed ?? 0,
  contributionTotal: record.contributionTotal ?? 0,
  currentBalance: record.currentBalance ?? record.remainingAmount ?? record.limitAmount,
  isOverspent: record.isOverspent ?? false,
  rolloverMode: record.rolloverMode ?? undefined,
  isArchived: Boolean(record.isArchived),
  showStatus: record.showStatus ?? (record.isArchived ? 'archived' : 'active'),
  notifyOnExceed: Boolean(record.notifyOnExceed),
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapBudgetEntry = (record: any): BudgetEntry => ({
  id: fromObjectId(record._id)!,
  budgetId: fromObjectId(record.budgetId)!,
  transactionId: fromObjectId(record.transactionId)!,
  appliedAmountBudgetCurrency: record.appliedAmountBudgetCurrency,
  rateUsedTxnToBudget: record.rateUsedTxnToBudget,
  snapshottedAt: toISODate(record.snapshottedAt)!,
});

const mapDebt = (record: any): Debt => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  direction: record.direction as DebtDirection,
  counterpartyId: fromObjectId(record.counterpartyId),
  counterpartyName: record.counterpartyName,
  description: record.description ?? undefined,
  principalAmount: record.principalAmount,
  principalOriginalAmount: record.principalOriginalAmount ?? record.principalAmount,
  principalCurrency: record.principalCurrency,
  principalOriginalCurrency: record.principalOriginalCurrency ?? record.principalCurrency,
  baseCurrency: record.baseCurrency,
  rateOnStart: record.rateOnStart ?? 1,
  principalBaseValue: record.principalBaseValue ?? record.principalAmount,
  repaymentCurrency: record.repaymentCurrency ?? undefined,
  repaymentAmount: record.repaymentAmount ?? undefined,
  repaymentRateOnStart: record.repaymentRateOnStart ?? undefined,
  isFixedRepaymentAmount: Boolean(record.isFixedRepaymentAmount),
  startDate: toISODate(record.startDate)!,
  dueDate: toISODate(record.dueDate) ?? undefined,
  interestMode: record.interestMode ?? undefined,
  interestRateAnnual: record.interestRateAnnual ?? undefined,
  scheduleHint: record.scheduleHint ?? undefined,
  linkedGoalId: fromObjectId(record.linkedGoalId),
  linkedBudgetId: fromObjectId(record.linkedBudgetId),
  fundingAccountId: fromObjectId(record.fundingAccountId),
  fundingTransactionId: fromObjectId(record.fundingTransactionId),
  reminderEnabled: Boolean(record.reminderEnabled),
  reminderTime: record.reminderTime ?? undefined,
  status: record.status,
  showStatus: record.showStatus ?? 'active',
  // Settlement info
  settledAt: toISODate(record.settledAt) ?? undefined,
  finalRateUsed: record.finalRateUsed ?? undefined,
  finalProfitLoss: record.finalProfitLoss ?? undefined,
  finalProfitLossCurrency: record.finalProfitLossCurrency ?? undefined,
  totalPaidInRepaymentCurrency: record.totalPaidInRepaymentCurrency ?? undefined,
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapDebtPayment = (record: any, debtId: string): DebtPayment => ({
  id: fromObjectId(record.paymentId)!,
  debtId,
  amount: record.amount,
  currency: record.currency,
  baseCurrency: record.baseCurrency,
  rateUsedToBase: record.rateUsedToBase,
  convertedAmountToBase: record.convertedAmountToBase,
  rateUsedToDebt: record.rateUsedToDebt,
  convertedAmountToDebt: record.convertedAmountToDebt,
  paymentDate: toISODate(record.paymentDate)!,
  accountId: fromObjectId(record.accountId),
  note: record.note ?? undefined,
  relatedTransactionId: fromObjectId(record.relatedTransactionId),
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapFxRate = (record: any): FxRate => ({
  id: fromObjectId(record._id)!,
  fromCurrency: record.fromCurrency,
  toCurrency: record.toCurrency,
  rate: record.rate,
  rateMid: record.rateMid ?? record.rate,
  rateBid: record.rateBid,
  rateAsk: record.rateAsk,
  nominal: record.nominal ?? 1,
  spreadPercent: record.spreadPercent ?? 0.5,
  source: record.source,
  isOverridden: Boolean(record.isOverridden),
  date: toISODate(record.date)!,
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapCounterparty = (record: any): Counterparty => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  displayName: record.displayName,
  phoneNumber: record.phoneNumber ?? undefined,
  comment: record.comment ?? undefined,
  searchKeywords: record.searchKeywords ?? undefined,
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

export type AccountCreateInput = {
  userId?: string;
  name: string;
  accountType: AccountType;
  currency: string;
  initialBalance: number;
  linkedGoalId?: string;
  customTypeId?: string;
  isArchived?: boolean;
  idempotencyKey?: string;
};

export class AccountDAO {
  constructor(private realm: Realm) {}

  list(): Account[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('Account').map(mapAccount);
  }

  create(input: AccountCreateInput): Account {
    let created: Realm.Object;
    this.realm.write(() => {
      created = this.realm.create('Account', {
        _id: new BSON.ObjectId(),
        userId: input.userId ?? defaultUserId,
        name: input.name,
        accountType: input.accountType,
        currency: input.currency,
        initialBalance: input.initialBalance,
        currentBalance: input.initialBalance,
        linkedGoalId: toObjectId(input.linkedGoalId),
        customTypeId: input.customTypeId ?? null,
        isArchived: input.isArchived ?? false,
        idempotencyKey: input.idempotencyKey ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'local',
      });
    });
    return mapAccount(created!);
  }

  update(id: string, updates: Partial<Account>): Account | null {
    const account = this.realm.objectForPrimaryKey('Account', toObjectId(id)!);
    if (!account) return null;
    this.realm.write(() => {
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return;
        if (key === 'linkedGoalId') {
          (account as any)[key] = toObjectId(value as string | undefined) ?? null;
        } else if (key === 'customTypeId') {
          (account as any)[key] = value ?? null;
        } else {
          (account as any)[key] = value;
        }
      });
      (account as any).updatedAt = new Date();
    });
    return mapAccount(account);
  }

  delete(id: string) {
    const account = this.realm.objectForPrimaryKey('Account', toObjectId(id)!);
    if (!account) return;
    this.realm.write(() => {
      this.realm.delete(account);
    });
  }

  archive(id: string, archived: boolean) {
    const account = this.realm.objectForPrimaryKey('Account', toObjectId(id)!);
    if (!account) return;
    this.realm.write(() => {
      (account as any).isArchived = archived;
      (account as any).showStatus = archived ? 'archived' : 'active';
      (account as any).updatedAt = new Date();
    });
  }

  setShowStatus(id: string, showStatus: 'active' | 'archived' | 'deleted') {
    const account = this.realm.objectForPrimaryKey('Account', toObjectId(id)!);
    if (!account) return;
    this.realm.write(() => {
      (account as any).showStatus = showStatus;
      // Sync deprecated field for backward compatibility
      (account as any).isArchived = showStatus === 'archived';
      (account as any).updatedAt = new Date();
    });
  }
}

export type TransactionCreateInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;

export class TransactionDAO {
  constructor(private realm: Realm) {}

  list(): Transaction[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('Transaction').sorted('date', true).map(mapTransaction);
  }

  create(input: TransactionCreateInput): Transaction {
    const now = new Date();
    const splits = input.splits?.map((split) => ({
      splitId: new BSON.ObjectId(),
      categoryId: split.categoryId,
      amount: split.amount,
    }));
    let created: any;
    this.realm.write(() => {
      created = this.realm.create('Transaction', {
        _id: new BSON.ObjectId(),
        userId: input.userId ?? defaultUserId,
        type: input.type,
        accountId: toObjectId(input.accountId),
        fromAccountId: toObjectId(input.fromAccountId),
        toAccountId: toObjectId(input.toAccountId),
        amount: input.amount,
        currency: input.currency,
        baseCurrency: input.baseCurrency ?? input.currency,
        rateUsedToBase: input.rateUsedToBase ?? 1,
        convertedAmountToBase: input.convertedAmountToBase ?? input.amount,
        toAmount: input.toAmount ?? null,
        toCurrency: input.toCurrency ?? null,
        effectiveRateFromTo: input.effectiveRateFromTo ?? null,
        feeAmount: input.feeAmount ?? null,
        feeCategoryId: input.feeCategoryId ?? null,
        categoryId: input.categoryId ?? null,
        subcategoryId: input.subcategoryId ?? null,
        name: input.name ?? null,
        description: input.description ?? null,
        date: new Date(input.date),
        time: input.time ?? null,
        goalId: toObjectId(input.goalId),
        budgetId: toObjectId(input.budgetId),
        debtId: toObjectId(input.debtId),
        habitId: toObjectId(input.habitId),
        counterpartyId: toObjectId(input.counterpartyId),
        goalName: input.goalName ?? null,
        goalType: input.goalType ?? null,
        relatedBudgetId: toObjectId(input.relatedBudgetId),
        relatedDebtId: toObjectId(input.relatedDebtId),
        plannedAmount: input.plannedAmount ?? null,
        paidAmount: input.paidAmount ?? null,
        originalCurrency: input.originalCurrency ?? null,
        originalAmount: input.originalAmount ?? null,
        conversionRate: input.conversionRate ?? null,
        recurringId: input.recurringId ?? null,
        attachments: input.attachments ?? [],
        tags: input.tags ?? [],
        splits,
        idempotencyKey: (input as any).idempotencyKey ?? null,
        isBalanceAdjustment: input.isBalanceAdjustment ?? false,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
      });
    });
    return mapTransaction(created);
  }

  update(id: string, updates: Partial<Transaction>): Transaction | null {
    const record = this.realm.objectForPrimaryKey('Transaction', toObjectId(id)!);
    if (!record) return null;
    // Fields that are ObjectId type (not string)
    const objectIdFields = new Set([
      'accountId', 'fromAccountId', 'toAccountId', 'goalId', 'budgetId',
      'debtId', 'habitId', 'counterpartyId', 'relatedBudgetId', 'relatedDebtId'
    ]);
    // Fields that end with 'Id' but are string type
    const stringIdFields = new Set(['categoryId', 'subcategoryId', 'feeCategoryId', 'recurringId']);
    this.realm.write(() => {
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined) return;
        if (objectIdFields.has(key)) {
          // Handle ObjectId fields
          if (value === null || value === '') {
            (record as any)[key] = null;
            return;
          }
          (record as any)[key] = toObjectId(value as string) ?? null;
        } else if (stringIdFields.has(key)) {
          // Handle string Id fields - don't convert to ObjectId
          (record as any)[key] = value ?? null;
        } else if (key === 'date' && value) {
          (record as any).date = new Date(value as string);
        } else {
          (record as any)[key] = value;
        }
      });
      (record as any).updatedAt = new Date();
    });
    return mapTransaction(record);
  }

  delete(id: string) {
    const record = this.realm.objectForPrimaryKey('Transaction', toObjectId(id)!);
    if (!record) return;
    this.realm.write(() => {
      this.realm.delete(record);
    });
  }

  setShowStatus(id: string, showStatus: 'active' | 'archived' | 'deleted') {
    const record = this.realm.objectForPrimaryKey('Transaction', toObjectId(id)!);
    if (!record) return;
    this.realm.write(() => {
      (record as any).showStatus = showStatus;
      // Sync deprecated field for backward compatibility
      (record as any).deletedAt = showStatus === 'deleted' ? new Date() : null;
      (record as any).updatedAt = new Date();
    });
  }
}

export type BudgetCreateInput = Omit<Budget, 'id' | 'spentAmount' | 'remainingAmount' | 'percentUsed' | 'createdAt' | 'updatedAt' | 'isOverspent'> & {
  transactionType?: BudgetFlowType;
};

export class BudgetDAO {
  constructor(private realm: Realm) {}

  list(): Budget[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('Budget').map(mapBudget);
  }

  create(input: BudgetCreateInput): Budget {
    const now = new Date();
    // Summalarni yaxlitlash
    const roundedLimitAmount = roundAmountForCurrency(input.limitAmount, input.currency);
    let created: any;
    this.realm.write(() => {
      created = this.realm.create('Budget', {
        _id: new BSON.ObjectId(),
        userId: input.userId ?? defaultUserId,
        name: input.name,
        budgetType: input.budgetType,
        categoryIds: input.categoryIds ?? [],
        linkedGoalId: toObjectId(input.linkedGoalId),
        accountId: toObjectId(input.accountId),
        transactionType: input.transactionType ?? 'expense',
        currency: input.currency,
        limitAmount: roundedLimitAmount,
        periodType: input.periodType,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        spentAmount: 0,
        remainingAmount: roundedLimitAmount,
        percentUsed: 0,
        rolloverMode: input.rolloverMode ?? null,
        isArchived: false,
        notifyOnExceed: input.notifyOnExceed ?? false,
        contributionTotal: 0,
        currentBalance: roundedLimitAmount,
        isOverspent: false,
        idempotencyKey: (input as any).idempotencyKey ?? null,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
      });
    });
    return mapBudget(created);
  }

  update(id: string, updates: Partial<Budget>): Budget | null {
    const record = this.realm.objectForPrimaryKey('Budget', toObjectId(id)!);
    if (!record) return null;
    // Valyutani olish
    const currency = updates.currency ?? (record as any).currency;
    this.realm.write(() => {
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined) return;
        if (key.endsWith('Id')) {
          (record as any)[key] = toObjectId(value as string) ?? null;
        } else if ((key === 'startDate' || key === 'endDate') && value) {
          (record as any)[key] = new Date(value as string);
        } else if (key === 'limitAmount' || key === 'spentAmount' || key === 'remainingAmount' || key === 'currentBalance' || key === 'contributionTotal') {
          // Summalarni yaxlitlash
          (record as any)[key] = roundAmountForCurrency(value as number, currency);
        } else {
          (record as any)[key] = value;
        }
      });
      (record as any).updatedAt = new Date();
    });
    return mapBudget(record);
  }

  archive(id: string, archived: boolean) {
    const record = this.realm.objectForPrimaryKey('Budget', toObjectId(id)!);
    if (!record) return;
    this.realm.write(() => {
      (record as any).isArchived = archived;
      (record as any).showStatus = archived ? 'archived' : 'active';
      (record as any).updatedAt = new Date();
    });
  }

  setShowStatus(id: string, showStatus: 'active' | 'archived' | 'deleted') {
    const record = this.realm.objectForPrimaryKey('Budget', toObjectId(id)!);
    if (!record) return;
    this.realm.write(() => {
      (record as any).showStatus = showStatus;
      // Sync deprecated field for backward compatibility
      (record as any).isArchived = showStatus === 'archived';
      (record as any).updatedAt = new Date();
    });
  }

  delete(id: string) {
    const budgetObjectId = toObjectId(id);
    if (!budgetObjectId) return;
    if (!hasRealmInstance(this.realm)) return;

    this.realm.write(() => {
      // First delete associated budget entries
      const entries = this.realm.objects('BudgetEntry').filtered('budgetId == $0', budgetObjectId);
      this.realm.delete(entries);

      // Then delete the budget
      const record = this.realm.objectForPrimaryKey('Budget', budgetObjectId);
      if (record) {
        this.realm.delete(record);
      }
    });
  }

  recordEntry(entry: BudgetEntry): BudgetEntry {
    const now = new Date();
    let created: any;
    this.realm.write(() => {
      created = this.realm.create('BudgetEntry', {
        _id: new BSON.ObjectId(),
        budgetId: toObjectId(entry.budgetId),
        transactionId: toObjectId(entry.transactionId),
        appliedAmountBudgetCurrency: entry.appliedAmountBudgetCurrency,
        rateUsedTxnToBudget: entry.rateUsedTxnToBudget,
        snapshottedAt: entry.snapshottedAt ? new Date(entry.snapshottedAt) : now,
        idempotencyKey: (entry as any).idempotencyKey ?? null,
        syncStatus: 'local',
      });
    });
    return mapBudgetEntry(created);
  }

  removeEntriesForTransaction(transactionId: string) {
    const txnObjectId = toObjectId(transactionId);
    if (!txnObjectId) {
      return;
    }
    if (!hasRealmInstance(this.realm)) {
      return;
    }
    this.realm.write(() => {
      const entries = this.realm.objects('BudgetEntry').filtered('transactionId == $0', txnObjectId);
      this.realm.delete(entries);
    });
  }
}

const isBsonObjectId = (input: unknown): input is BSON.ObjectId => {
  if (!input || typeof input !== 'object') {
    return false;
  }
  return typeof (input as BSON.ObjectId).toHexString === 'function';
};

const DEBT_OBJECT_ID_FIELDS = new Set([
  'accountId',
  'fromAccountId',
  'toAccountId',
  'counterpartyId',
  'linkedGoalId',
  'linkedBudgetId',
  'fundingAccountId',
  'fundingTransactionId',
  'relatedTransactionId',
  'goalId',
  'budgetId',
  'debtId',
  'habitId',
]);

export class DebtDAO {
  constructor(private realm: Realm) {}

  list(): Debt[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('Debt').map(mapDebt);
  }

  listPayments(debtId: string): DebtPayment[] {
    const debt = this.realm.objectForPrimaryKey('Debt', toObjectId(debtId)!);
    if (!debt) {
      return [];
    }
    return (debt as any).payments?.map((payment: any) => mapDebtPayment(payment, debtId)) ?? [];
  }

  create(input: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'> & { payments?: DebtPayment[] }): Debt {
    const now = new Date();
    let record: any;
    this.realm.write(() => {
      record = this.realm.create('Debt', {
        _id: new BSON.ObjectId(),
        userId: input.userId ?? defaultUserId,
        direction: input.direction,
        counterpartyId: toObjectId(input.counterpartyId),
        counterpartyName: input.counterpartyName,
        description: input.description ?? null,
        principalAmount: input.principalAmount,
        principalOriginalAmount: input.principalOriginalAmount ?? input.principalAmount,
        principalCurrency: input.principalCurrency,
        principalOriginalCurrency: input.principalOriginalCurrency ?? input.principalCurrency,
        baseCurrency: input.baseCurrency,
        rateOnStart: input.rateOnStart ?? 1,
        principalBaseValue: input.principalBaseValue ?? input.principalAmount,
        repaymentCurrency: input.repaymentCurrency ?? null,
        repaymentAmount: input.repaymentAmount ?? null,
        repaymentRateOnStart: input.repaymentRateOnStart ?? null,
        isFixedRepaymentAmount: input.isFixedRepaymentAmount ?? false,
        startDate: new Date(input.startDate),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        interestMode: input.interestMode ?? null,
        interestRateAnnual: input.interestRateAnnual ?? null,
        scheduleHint: input.scheduleHint ?? null,
        linkedGoalId: toObjectId(input.linkedGoalId),
        linkedBudgetId: toObjectId(input.linkedBudgetId),
        fundingAccountId: toObjectId(input.fundingAccountId),
        fundingTransactionId: toObjectId(input.fundingTransactionId),
        reminderEnabled: input.reminderEnabled ?? false,
        reminderTime: input.reminderTime ?? null,
        status: input.status,
        payments:
          input.payments?.map((payment) => ({
            paymentId: new BSON.ObjectId(),
            amount: payment.amount,
            currency: payment.currency,
            baseCurrency: payment.baseCurrency,
            rateUsedToBase: payment.rateUsedToBase,
            convertedAmountToBase: payment.convertedAmountToBase,
            rateUsedToDebt: payment.rateUsedToDebt,
            convertedAmountToDebt: payment.convertedAmountToDebt,
            paymentDate: new Date(payment.paymentDate),
            accountId: toObjectId(payment.accountId),
            note: payment.note ?? null,
            relatedTransactionId: toObjectId(payment.relatedTransactionId),
            createdAt: new Date(payment.createdAt),
            updatedAt: new Date(payment.updatedAt),
          })) ?? [],
        idempotencyKey: (input as any).idempotencyKey ?? null,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
      });
    });
    return mapDebt(record);
  }

  update(id: string, updates: Partial<Debt>): Debt | null {
    const record = this.realm.objectForPrimaryKey('Debt', toObjectId(id)!);
    if (!record) return null;
    this.realm.write(() => {
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined) return;
        if (DEBT_OBJECT_ID_FIELDS.has(key)) {
          if (value === null) {
            (record as any)[key] = null;
            return;
          }
          if (isBsonObjectId(value)) {
            (record as any)[key] = value;
            return;
          }
          if (typeof value === 'string') {
            const converted = toObjectId(value);
            (record as any)[key] = converted ?? null;
            return;
          }
          (record as any)[key] = null;
          return;
        } else if ((key === 'startDate' || key === 'dueDate' || key === 'settledAt') && value) {
          (record as any)[key] = new Date(value as string);
        } else {
          (record as any)[key] = value;
        }
      });
      (record as any).updatedAt = new Date();
    });
    return mapDebt(record);
  }

  archive(id: string, status: Debt['status']) {
    const record = this.realm.objectForPrimaryKey('Debt', toObjectId(id)!);
    if (!record) return;
    this.realm.write(() => {
      (record as any).status = status;
      (record as any).updatedAt = new Date();
    });
  }

  setShowStatus(id: string, showStatus: 'active' | 'archived' | 'deleted') {
    const record = this.realm.objectForPrimaryKey('Debt', toObjectId(id)!);
    if (!record) return;
    this.realm.write(() => {
      (record as any).showStatus = showStatus;
      (record as any).updatedAt = new Date();
    });
  }

  delete(id: string) {
    const record = this.realm.objectForPrimaryKey('Debt', toObjectId(id)!);
    if (!record) return;
    this.realm.write(() => {
      this.realm.delete(record);
    });
  }

  addPayment(debtId: string, payment: DebtPayment) {
    const record = this.realm.objectForPrimaryKey('Debt', toObjectId(debtId)!);
    if (!record) return;
    this.realm.write(() => {
      (record as any).payments.push({
        paymentId: new BSON.ObjectId(),
        amount: payment.amount,
        currency: payment.currency,
        baseCurrency: payment.baseCurrency,
        rateUsedToBase: payment.rateUsedToBase,
        convertedAmountToBase: payment.convertedAmountToBase,
        rateUsedToDebt: payment.rateUsedToDebt,
        convertedAmountToDebt: payment.convertedAmountToDebt,
        paymentDate: new Date(payment.paymentDate),
        accountId: toObjectId(payment.accountId),
        note: payment.note ?? null,
        relatedTransactionId: toObjectId(payment.relatedTransactionId),
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
      });
      (record as any).updatedAt = new Date();
    });
  }
}

export type FxRateInput = Omit<FxRate, 'id' | 'createdAt' | 'updatedAt'>;

export class FxRateDAO {
  constructor(private realm: Realm) {}

  list(): FxRate[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('FxRate').map(mapFxRate);
  }

  upsert(input: FxRateInput): FxRate | null {
    if (!hasRealmInstance(this.realm)) {
      return null;
    }
    let record: any;
    const now = new Date();
    this.realm.write(() => {
      const existing = this.realm
        .objects('FxRate')
        .filtered('fromCurrency = $0 AND toCurrency = $1 AND date = $2', input.fromCurrency, input.toCurrency, new Date(input.date));
      if (existing.length > 0) {
        record = existing[0];
        record.rate = input.rate;
        record.rateMid = input.rateMid ?? input.rate;
        record.rateBid = input.rateBid;
        record.rateAsk = input.rateAsk;
        record.nominal = input.nominal ?? 1;
        record.spreadPercent = input.spreadPercent ?? 0.5;
        record.source = input.source;
        record.isOverridden = input.isOverridden;
        record.updatedAt = now;
      } else {
        record = this.realm.create('FxRate', {
          _id: new BSON.ObjectId(),
          date: new Date(input.date),
          fromCurrency: input.fromCurrency,
          toCurrency: input.toCurrency,
          rate: input.rate,
          rateMid: input.rateMid ?? input.rate,
          rateBid: input.rateBid,
          rateAsk: input.rateAsk,
          nominal: input.nominal ?? 1,
          spreadPercent: input.spreadPercent ?? 0.5,
          source: input.source,
          isOverridden: input.isOverridden ?? false,
          idempotencyKey: (input as any).idempotencyKey ?? null,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'local',
        });
      }
    });
    return mapFxRate(record);
  }

  // Create new FxRate record for journal (always creates new, never updates)
  create(input: FxRateInput): FxRate | null {
    if (!hasRealmInstance(this.realm)) {
      return null;
    }
    let record: any;
    const now = new Date();
    this.realm.write(() => {
      record = this.realm.create('FxRate', {
        _id: new BSON.ObjectId(),
        date: new Date(input.date),
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        rate: input.rate,
        rateMid: input.rateMid ?? input.rate,
        rateBid: input.rateBid,
        rateAsk: input.rateAsk,
        nominal: input.nominal ?? 1,
        spreadPercent: input.spreadPercent ?? 0.5,
        source: input.source,
        isOverridden: input.isOverridden ?? false,
        idempotencyKey: (input as any).idempotencyKey ?? null,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
      });
    });
    return mapFxRate(record);
  }

  // Update existing FxRate by id
  update(id: string, input: Partial<FxRateInput>): FxRate | null {
    if (!hasRealmInstance(this.realm)) {
      return null;
    }
    let record: any = null;
    this.realm.write(() => {
      const existing = this.realm
        .objects('FxRate')
        .filtered('_id = $0', new BSON.ObjectId(id))[0];
      if (existing) {
        if (input.rate !== undefined) existing.rate = input.rate;
        if (input.rateMid !== undefined) existing.rateMid = input.rateMid;
        if (input.rateBid !== undefined) existing.rateBid = input.rateBid;
        if (input.rateAsk !== undefined) existing.rateAsk = input.rateAsk;
        if (input.nominal !== undefined) existing.nominal = input.nominal;
        if (input.source !== undefined) existing.source = input.source;
        if (input.isOverridden !== undefined) existing.isOverridden = input.isOverridden;
        existing.updatedAt = new Date();
        record = existing;
      }
    });
    return record ? mapFxRate(record) : null;
  }

  // Delete FxRate by id
  delete(id: string): boolean {
    if (!hasRealmInstance(this.realm)) {
      return false;
    }
    let deleted = false;
    this.realm.write(() => {
      const existing = this.realm
        .objects('FxRate')
        .filtered('_id = $0', new BSON.ObjectId(id))[0];
      if (existing) {
        this.realm.delete(existing);
        deleted = true;
      }
    });
    return deleted;
  }
}

export type CounterpartyCreateInput = {
  userId?: string;
  displayName: string;
  phoneNumber?: string;
  comment?: string;
  searchKeywords?: string;
};

export class CounterpartyDAO {
  constructor(private realm: Realm) {}

  list(): Counterparty[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('Counterparty').map(mapCounterparty);
  }

  search(query: string): Counterparty[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    if (!query.trim()) {
      return this.list();
    }
    const needle = query.toLowerCase();
    return this.realm
      .objects('Counterparty')
      .filtered(
        'displayName CONTAINS[c] $0 OR searchKeywords CONTAINS[c] $0 OR phoneNumber CONTAINS[c] $0',
        needle
      )
      .map(mapCounterparty);
  }

  create(input: CounterpartyCreateInput): Counterparty {
    let record: any;
    this.realm.write(() => {
      record = this.realm.create('Counterparty', {
        _id: new BSON.ObjectId(),
        userId: input.userId ?? defaultUserId,
        displayName: input.displayName,
        phoneNumber: input.phoneNumber ?? null,
        comment: input.comment ?? null,
        searchKeywords: input.searchKeywords ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'local',
      });
    });
    return mapCounterparty(record);
  }

  update(id: string, updates: Partial<Counterparty>): Counterparty | null {
    const record = this.realm.objectForPrimaryKey('Counterparty', toObjectId(id)!);
    if (!record) return null;
    this.realm.write(() => {
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined) return;
        (record as any)[key] = value ?? null;
      });
      (record as any).updatedAt = new Date();
    });
    return mapCounterparty(record);
  }

  delete(id: string) {
    const record = this.realm.objectForPrimaryKey('Counterparty', toObjectId(id)!);
    if (!record) return;
    this.realm.write(() => {
      this.realm.delete(record);
    });
  }
}
