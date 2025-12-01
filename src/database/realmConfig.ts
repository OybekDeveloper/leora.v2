import Realm from 'realm';

import { financeSchemas } from './schema/financeSchemas';
import { plannerSchemas } from './schema/plannerSchemas';
import { SeedService } from '@/services/SeedService';

const schemaVersion = 17;

const ensureField = <T>(collection: Realm.Results<T>, field: keyof T, value: any) => {
  collection.forEach((item: any) => {
    if (item[field] === undefined || item[field] === null) {
      item[field] = typeof value === 'function' ? value(item) : value;
    }
  });
};

export const realmConfig: Realm.Configuration = {
  schema: [...financeSchemas, ...plannerSchemas],
  schemaVersion,
  onMigration: (oldRealm, newRealm) => {
    if (oldRealm.schemaVersion >= schemaVersion) {
      return;
    }

    const accounts = newRealm.objects<any>('Account');
    ensureField(accounts, 'userId', 'local-user');
    ensureField(accounts, 'syncStatus', 'local');
    ensureField(accounts, 'customTypeId', null);

    const transactions = newRealm.objects<any>('Transaction');
    transactions.forEach((txn) => {
      if (!txn.userId) txn.userId = 'local-user';
      if (!txn.baseCurrency) txn.baseCurrency = txn.currency;
      if (!txn.rateUsedToBase) txn.rateUsedToBase = 1;
      if (!txn.convertedAmountToBase) txn.convertedAmountToBase = txn.amount;
      if (!txn.syncStatus) txn.syncStatus = 'local';
      if (txn.goalName === undefined) txn.goalName = null;
      if (txn.goalType === undefined) txn.goalType = null;
      if (txn.relatedBudgetId === undefined) txn.relatedBudgetId = null;
      if (txn.relatedDebtId === undefined) txn.relatedDebtId = null;
      if (txn.plannedAmount === undefined) txn.plannedAmount = null;
      if (txn.paidAmount === undefined) txn.paidAmount = null;
    });

    const budgets = newRealm.objects<any>('Budget');
    ensureField(budgets, 'userId', 'local-user');
    ensureField(budgets, 'syncStatus', 'local');
    ensureField(budgets, 'accountId', null);
    ensureField(budgets, 'transactionType', 'expense');
    ensureField(budgets, 'notifyOnExceed', false);
    ensureField(budgets, 'contributionTotal', 0);
    ensureField(budgets, 'currentBalance', (item: any) => item.remainingAmount ?? item.limitAmount ?? 0);

    const budgetEntries = newRealm.objects<any>('BudgetEntry');
    ensureField(budgetEntries, 'syncStatus', 'local');

    const goals = newRealm.objects<any>('Goal');
    ensureField(goals, 'direction', 'increase');
    ensureField(goals, 'currentValue', 0);
    ensureField(goals, 'linkedDebtId', null);
    ensureField(goals, 'financeContributionIds', []);

    const debts = newRealm.objects<any>('Debt');
    ensureField(debts, 'userId', 'local-user');
    ensureField(debts, 'syncStatus', 'local');
    ensureField(debts, 'counterpartyId', null);
    ensureField(debts, 'principalOriginalAmount', (item: any) => item.principalAmount ?? 0);
    ensureField(debts, 'principalOriginalCurrency', (item: any) => item.principalCurrency);
    ensureField(debts, 'fundingAccountId', null);
    ensureField(debts, 'fundingTransactionId', null);
    ensureField(debts, 'reminderEnabled', false);
    ensureField(debts, 'reminderTime', null);
    debts.forEach((debt: any) => {
      debt.payments?.forEach((payment: any) => {
        if (payment.accountId === undefined) payment.accountId = null;
        if (payment.note === undefined) payment.note = null;
      });
    });

    const fxRates = newRealm.objects<any>('FxRate');
    ensureField(fxRates, 'syncStatus', 'local');

    // Migration for FxRate bid/ask fields (schema version 14)
    fxRates.forEach((fxRate: any) => {
      // rateMid ni rate dan olish
      if (fxRate.rateMid === undefined || fxRate.rateMid === null) {
        fxRate.rateMid = fxRate.rate;
      }
      // Default spread 0.5%
      const spreadPercent = fxRate.spreadPercent ?? 0.5;
      const spreadMultiplier = spreadPercent / 100;

      // rateBid ni hisoblash (agar yo'q bo'lsa)
      if (fxRate.rateBid === undefined || fxRate.rateBid === null) {
        fxRate.rateBid = fxRate.rate * (1 - spreadMultiplier);
      }
      // rateAsk ni hisoblash (agar yo'q bo'lsa)
      if (fxRate.rateAsk === undefined || fxRate.rateAsk === null) {
        fxRate.rateAsk = fxRate.rate * (1 + spreadMultiplier);
      }
      // nominal ni default 1 qilish
      if (fxRate.nominal === undefined || fxRate.nominal === null) {
        fxRate.nominal = 1;
      }
      // spreadPercent ni default 0.5 qilish
      if (fxRate.spreadPercent === undefined || fxRate.spreadPercent === null) {
        fxRate.spreadPercent = 0.5;
      }
      // source migration - eski nomlarni yangilariga aylantirish
      if (fxRate.source === 'central_bank_stub' || fxRate.source === 'central_bank') {
        fxRate.source = 'cbu';
      }
      if (fxRate.source === 'market_stub') {
        fxRate.source = 'market_api';
      }
    });

    // Migration for showStatus field (schema version 12)
    // Migrate Goals: derive showStatus from status field
    goals.forEach((goal: any) => {
      if (!goal.showStatus) {
        goal.showStatus = goal.status === 'archived' ? 'archived' : 'active';
      }
    });

    // Migrate Tasks: derive showStatus from status field
    const tasks = newRealm.objects<any>('Task');
    tasks.forEach((task: any) => {
      if (!task.showStatus) {
        if (task.status === 'deleted') {
          task.showStatus = 'deleted';
        } else if (task.status === 'archived') {
          task.showStatus = 'archived';
        } else {
          task.showStatus = 'active';
        }
      }
    });

    // Migrate Habits: derive showStatus from status field
    const habits = newRealm.objects<any>('Habit');
    habits.forEach((habit: any) => {
      if (!habit.showStatus) {
        habit.showStatus = habit.status === 'archived' ? 'archived' : 'active';
      }
    });

    // Migration for new Habit fields (schema version 13)
    ensureField(habits, 'countingType', 'create');
    ensureField(habits, 'difficulty', 'medium');
    ensureField(habits, 'reminderEnabled', false);
    ensureField(habits, 'reminderTime', null);

    // Migration for Habit priority field (schema version 17)
    ensureField(habits, 'priority', 'medium');

    // Migrate Accounts: derive showStatus from isArchived boolean
    accounts.forEach((account: any) => {
      if (!account.showStatus) {
        account.showStatus = account.isArchived ? 'archived' : 'active';
      }
    });

    // Migrate Transactions: derive showStatus from deletedAt timestamp
    transactions.forEach((txn: any) => {
      if (!txn.showStatus) {
        txn.showStatus = txn.deletedAt ? 'deleted' : 'active';
      }
    });

    // Migrate Budgets: derive showStatus from isArchived boolean
    budgets.forEach((budget: any) => {
      if (!budget.showStatus) {
        budget.showStatus = budget.isArchived ? 'archived' : 'active';
      }
    });

    // Migrate Debts: default to active (no prior archive/delete mechanism)
    debts.forEach((debt: any) => {
      if (!debt.showStatus) {
        debt.showStatus = 'active';
      }
    });

    // Migration for schema version 15 - new Counterparty, Debt, Transaction fields
    const counterparties = newRealm.objects<any>('Counterparty');
    ensureField(counterparties, 'phoneNumber', null);
    ensureField(counterparties, 'comment', null);

    // Debt multi-currency repayment fields
    ensureField(debts, 'repaymentCurrency', null);
    ensureField(debts, 'repaymentAmount', null);
    ensureField(debts, 'repaymentRateOnStart', null);
    ensureField(debts, 'isFixedRepaymentAmount', false);

    // Transaction name and counterparty fields
    ensureField(transactions, 'name', null);
    ensureField(transactions, 'counterpartyId', null);

    // Migration for schema version 16 - debt payment conversion fields
    ensureField(transactions, 'originalCurrency', null);
    ensureField(transactions, 'originalAmount', null);
    ensureField(transactions, 'conversionRate', null);
  },
  onFirstOpen: (realm) => {
    const seeder = new SeedService(realm);
    seeder.seedDemoAccounts();
  },
};
