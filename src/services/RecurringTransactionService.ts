// apps/mobile/src/data/services/RecurringTransactionService.ts
import Realm from 'realm';
import { RecurringTransaction } from '@/utils/models/RecurringTransaction';
import { Transaction } from '@/utils/models/Transaction';

export class RecurringTransactionService {
  private realm: Realm;
  private isProcessing = false;
  private lastProcessedDate: Date | null = null;

  constructor(realm: Realm) {
    this.realm = realm;
  }

  // Получить все активные recurring транзакции
  getActiveRecurring(): Realm.Results<RecurringTransaction> {
    return this.realm
      .objects<RecurringTransaction>('RecurringTransaction')
      .filtered('isActive = true AND isPaused = false')
      .sorted('nextOccurrence');
  }

  // Получить предстоящие транзакции на N дней
  getUpcoming(days: number = 7): Realm.Results<RecurringTransaction> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.realm
      .objects<RecurringTransaction>('RecurringTransaction')
      .filtered(
        'isActive = true AND isPaused = false AND nextOccurrence <= $0',
        futureDate
      )
      .sorted('nextOccurrence');
  }

  // Обработка всех запланированных транзакций
  async processScheduledTransactions(): Promise<{
    processed: number;
    failed: number;
    skipped: number;
  }> {
    if (this.isProcessing) {
      console.log('Already processing recurring transactions');
      return { processed: 0, failed: 0, skipped: 0 };
    }

    this.isProcessing = true;
    const results = { processed: 0, failed: 0, skipped: 0 };

    try {
      // Проверяем, обрабатывали ли мы сегодня
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (this.lastProcessedDate) {
        const lastProcessed = new Date(this.lastProcessedDate);
        lastProcessed.setHours(0, 0, 0, 0);
        
        if (lastProcessed.getTime() === today.getTime()) {
          console.log('Already processed today');
          this.isProcessing = false;
          return { processed: 0, failed: 0, skipped: 0 };
        }
      }

      const activeRecurring = this.getActiveRecurring();
      
      for (const recurring of activeRecurring) {
        if (recurring.shouldProcessToday()) {
          try {
            const transactionId = recurring.createTransaction(this.realm);
            if (transactionId) {
              results.processed++;
              console.log(`Processed recurring transaction: ${recurring._id}`);
            } else {
              results.skipped++;
            }
          } catch (error) {
            console.error(`Failed to process recurring ${recurring._id}:`, error);
            results.failed++;
          }
        }
      }

      // Сохраняем дату последней обработки
      this.lastProcessedDate = new Date();
      
      if (results.processed > 0) {
        console.log(`Recurring transactions processed: ${results.processed}`);
      }

    } catch (error) {
      console.error('Error processing recurring transactions:', error);
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  // Создание новой recurring транзакции
  createRecurring(data: {
    accountId: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency: string;
    category: string;
    description?: string;
    pattern: RecurringTransaction['pattern'];
    interval?: number;
    startDate: Date;
    endDate?: Date;
    toAccountId?: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  }): RecurringTransaction {
    let recurring: RecurringTransaction;
    
    this.realm.write(() => {
      // Вычисляем первое появление
      const nextOccurrence = this.calculateFirstOccurrence(
        data.startDate,
        data.pattern,
        data.interval || 1,
        data.daysOfWeek,
        data.dayOfMonth
      );

      recurring = this.realm.create<RecurringTransaction>('RecurringTransaction', {
        _id: new Realm.BSON.ObjectId(),
        accountId: new Realm.BSON.ObjectId(data.accountId),
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        description: data.description,
        pattern: data.pattern,
        interval: data.interval || 1,
        daysOfWeek: data.daysOfWeek,
        dayOfMonth: data.dayOfMonth,
        startDate: data.startDate,
        endDate: data.endDate,
        nextOccurrence,
        isActive: true,
        isPaused: false,
        toAccountId: data.toAccountId ? new Realm.BSON.ObjectId(data.toAccountId) : undefined,
        createdTransactions: [],
        skipDates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'local',
      });
    });
    
    return recurring!;
  }

  // Вычисление первого появления
  private calculateFirstOccurrence(
    startDate: Date,
    pattern: RecurringTransaction['pattern'],
    interval: number,
    daysOfWeek?: number[],
    dayOfMonth?: number
  ): Date {
    const normalizedInterval = Math.max(1, interval);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const initialDate = new Date(startDate);
    initialDate.setHours(0, 0, 0, 0);

    if (initialDate >= today) {
      return initialDate;
    }

    const tempRecurring = {
      pattern,
      interval: normalizedInterval,
      daysOfWeek,
      dayOfMonth,
      skipDates: [] as unknown as Realm.List<Date>,
      nextOccurrence: initialDate,
      calculateNextOccurrence: RecurringTransaction.prototype.calculateNextOccurrence,
    } as unknown as RecurringTransaction & {
      calculateNextOccurrence: () => Date;
    };

    let nextOccurrence = initialDate;
    let iterations = 0;
    const maxIterations = 512;

    while (nextOccurrence < today && iterations < maxIterations) {
      tempRecurring.nextOccurrence = nextOccurrence;
      nextOccurrence = tempRecurring.calculateNextOccurrence.call(tempRecurring);
      iterations += 1;
    }

    if (iterations >= maxIterations) {
      console.warn('Exceeded max iterations while calculating first occurrence');
      return today;
    }

    return nextOccurrence;
  }

  // Обновление recurring транзакции
  updateRecurring(
    id: string,
    updates: Partial<{
      amount: number;
      category: string;
      description: string;
      pattern: RecurringTransaction['pattern'];
      interval: number;
      endDate: Date;
      isPaused: boolean;
      isActive: boolean;
    }>
  ): boolean {
    try {
      const recurring = this.realm.objectForPrimaryKey<RecurringTransaction>(
        'RecurringTransaction',
        new Realm.BSON.ObjectId(id)
      );
      
      if (!recurring) return false;
      
      this.realm.write(() => {
        Object.assign(recurring, updates);
        recurring.updatedAt = new Date();
        
        // Если изменен pattern или interval, пересчитываем nextOccurrence
        if (updates.pattern || updates.interval) {
          recurring.nextOccurrence = recurring.calculateNextOccurrence();
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      return false;
    }
  }

  // Удаление recurring транзакции
  deleteRecurring(id: string, deleteCreatedTransactions = false): boolean {
    try {
      const recurring = this.realm.objectForPrimaryKey<RecurringTransaction>(
        'RecurringTransaction',
        new Realm.BSON.ObjectId(id)
      );
      
      if (!recurring) return false;
      
      this.realm.write(() => {
        // Опционально удаляем созданные транзакции
        if (deleteCreatedTransactions) {
          for (const transactionId of recurring.createdTransactions) {
            const transaction = this.realm.objectForPrimaryKey<Transaction>(
              'Transaction',
              transactionId
            );
            if (transaction) {
              this.realm.delete(transaction);
            }
          }
        }
        
        // Удаляем recurring
        this.realm.delete(recurring);
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      return false;
    }
  }

  // Пропустить следующее появление
  skipNext(id: string): boolean {
    try {
      const recurring = this.realm.objectForPrimaryKey<RecurringTransaction>(
        'RecurringTransaction',
        new Realm.BSON.ObjectId(id)
      );
      
      if (!recurring) return false;
      
      this.realm.write(() => {
        // Добавляем дату в skipDates
        recurring.skipDates.push(new Date(recurring.nextOccurrence));
        // Вычисляем следующую дату
        recurring.nextOccurrence = recurring.calculateNextOccurrence();
        recurring.updatedAt = new Date();
      });
      
      return true;
    } catch (error) {
      console.error('Error skipping recurring transaction:', error);
      return false;
    }
  }

  // Получить историю созданных транзакций
  getHistory(recurringId: string): Transaction[] {
    const recurring = this.realm.objectForPrimaryKey<RecurringTransaction>(
      'RecurringTransaction',
      new Realm.BSON.ObjectId(recurringId)
    );
    
    if (!recurring) return [];
    
    const transactions: Transaction[] = [];
    for (const transactionId of recurring.createdTransactions) {
      const transaction = this.realm.objectForPrimaryKey<Transaction>(
        'Transaction',
        transactionId
      );
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Получить статистику по recurring транзакциям
  getStatistics(): {
    total: number;
    active: number;
    paused: number;
    monthlyAmount: { income: number; expense: number };
    upcomingThisWeek: number;
  } {
    const allRecurring = this.realm.objects<RecurringTransaction>('RecurringTransaction');
    const activeRecurring = allRecurring.filtered('isActive = true AND isPaused = false');
    const pausedRecurring = allRecurring.filtered('isPaused = true');
    
    // Рассчитываем месячные суммы
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    
    for (const recurring of activeRecurring) {
      let monthlyTimes = 1;
      
      switch (recurring.pattern) {
        case 'daily':
          monthlyTimes = 30 / recurring.interval;
          break;
        case 'weekly':
          monthlyTimes = 4 / recurring.interval;
          break;
        case 'biweekly':
          monthlyTimes = 2;
          break;
        case 'monthly':
          monthlyTimes = 1 / recurring.interval;
          break;
        case 'quarterly':
          monthlyTimes = 1 / 3;
          break;
        case 'yearly':
          monthlyTimes = 1 / 12;
          break;
      }
      
      if (recurring.type === 'income') {
        monthlyIncome += recurring.amount * monthlyTimes;
      } else if (recurring.type === 'expense') {
        monthlyExpense += recurring.amount * monthlyTimes;
      }
    }
    
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const upcomingThisWeek = activeRecurring.filtered(
      'nextOccurrence <= $0',
      weekFromNow
    ).length;
    
    return {
      total: allRecurring.length,
      active: activeRecurring.length,
      paused: pausedRecurring.length,
      monthlyAmount: {
        income: Math.round(monthlyIncome),
        expense: Math.round(monthlyExpense),
      },
      upcomingThisWeek,
    };
  }
}
