// apps/mobile/src/data/models/RecurringTransaction.ts
import Realm from 'realm';
import { Account } from './Account';

export class RecurringTransaction extends Realm.Object<RecurringTransaction> {
  _id!: Realm.BSON.ObjectId;
  
  // Основные поля
  accountId!: Realm.BSON.ObjectId;
  type!: 'income' | 'expense' | 'transfer';
  amount!: number;
  currency!: string;
  category!: string;
  description?: string;
  
  // Поля для повторений
  pattern!: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  interval!: number; // Каждые N дней/недель/месяцев
  
  // Дни для повторений
  daysOfWeek?: number[]; // [1,3,5] = Пн, Ср, Пт
  dayOfMonth?: number; // 15 = 15-е число каждого месяца
  monthOfYear?: number; // 12 = Декабрь для yearly
  
  // Даты
  startDate!: Date;
  endDate?: Date; // Опционально - если не указано, то бесконечно
  nextOccurrence!: Date;
  lastProcessed?: Date;
  
  // Статус
  isActive!: boolean;
  isPaused!: boolean;
  
  // Для переводов
  toAccountId?: Realm.BSON.ObjectId;
  
  // Метаданные
  createdTransactions!: Realm.List<Realm.BSON.ObjectId>; // IDs созданных транзакций
  skipDates!: Realm.List<Date>; // Даты, которые нужно пропустить
  
  // Системные поля
  createdAt!: Date;
  updatedAt!: Date;
  syncStatus!: string;

  static schema: Realm.ObjectSchema = {
    name: 'RecurringTransaction',
    primaryKey: '_id',
    properties: {
      _id: { type: 'objectId', default: () => new Realm.BSON.ObjectId() },
      
      // Основные поля
      accountId: 'objectId',
      type: 'string',
      amount: 'double',
      currency: 'string',
      category: 'string',
      description: 'string?',
      
      // Поля для повторений
      pattern: 'string',
      interval: { type: 'int', default: 1 },
      daysOfWeek: 'int[]',
      dayOfMonth: 'int?',
      monthOfYear: 'int?',
      
      // Даты
      startDate: 'date',
      endDate: 'date?',
      nextOccurrence: 'date',
      lastProcessed: 'date?',
      
      // Статус
      isActive: { type: 'bool', default: true },
      isPaused: { type: 'bool', default: false },
      
      // Для переводов
      toAccountId: 'objectId?',
      
      // Метаданные
      createdTransactions: { type: 'list', objectType: 'objectId' },
      skipDates: { type: 'list', objectType: 'date' },
      
      // Системные поля
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() },
      syncStatus: { type: 'string', default: 'local' },
    },
  };

  // Вычисление следующей даты повторения
  calculateNextOccurrence(): Date {
    const current = new Date(this.nextOccurrence);
    
    switch (this.pattern) {
      case 'daily':
        current.setDate(current.getDate() + this.interval);
        break;
        
      case 'weekly':
        current.setDate(current.getDate() + (7 * this.interval));
        break;
        
      case 'biweekly':
        current.setDate(current.getDate() + 14);
        break;
        
      case 'monthly':
        current.setMonth(current.getMonth() + this.interval);
        // Обработка случая, когда день месяца больше чем дней в месяце
        if (this.dayOfMonth && current.getDate() !== this.dayOfMonth) {
          current.setDate(0); // Последний день предыдущего месяца
        }
        break;
        
      case 'quarterly':
        current.setMonth(current.getMonth() + 3);
        break;
        
      case 'yearly':
        current.setFullYear(current.getFullYear() + this.interval);
        break;
        
      case 'custom':
        // Для custom pattern используем daysOfWeek
        if (this.daysOfWeek && this.daysOfWeek.length > 0) {
          // Находим следующий день из списка
          let nextDay = current;
          do {
            nextDay.setDate(nextDay.getDate() + 1);
          } while (!this.daysOfWeek.includes(nextDay.getDay()));
          return nextDay;
        }
        break;
    }
    
    // Проверяем skipDates
    while (this.skipDates.some(skip => 
      skip.toDateString() === current.toDateString()
    )) {
      // Если дата в skipDates, переходим к следующей
      return this.calculateNextOccurrence.call({
        ...this,
        nextOccurrence: current
      });
    }
    
    return current;
  }

  // Проверка, нужно ли создать транзакцию сегодня
  shouldProcessToday(): boolean {
    if (!this.isActive || this.isPaused) return false;
    if (this.endDate && new Date() > this.endDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const next = new Date(this.nextOccurrence);
    next.setHours(0, 0, 0, 0);
    
    return next <= today;
  }

  // Создание транзакции из recurring
  createTransaction(realm: Realm): Realm.BSON.ObjectId | null {
    if (!this.shouldProcessToday()) return null;
    
    let transactionId: Realm.BSON.ObjectId;
    
    realm.write(() => {
      const transaction = realm.create('Transaction', {
        _id: new Realm.BSON.ObjectId(),
        accountId: this.accountId,
        type: this.type,
        amount: this.amount,
        currency: this.currency,
        category: this.category,
        description: this.description || `Повторяющийся платеж: ${this.description || this.category}`,
        date: new Date(),
        isRecurring: true,
        recurringId: this._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'local',
      });
      
      transactionId = transaction._id;
      
      // Добавляем ID в список созданных
      this.createdTransactions.push(transactionId);
      
      // Обновляем счет
      if (this.type === 'transfer' && this.toAccountId) {
        // Для переводов обновляем оба счета
        const fromAccount = realm.objectForPrimaryKey<Account>('Account', this.accountId);
        const toAccount = realm.objectForPrimaryKey<Account>('Account', this.toAccountId);
        
        if (fromAccount && toAccount) {
          fromAccount.balance -= this.amount;
          toAccount.balance += this.amount;
        }
      } else {
        // Для обычных транзакций
        const account = realm.objectForPrimaryKey<Account>('Account', this.accountId);
        if (account) {
          if (this.type === 'expense') {
            account.balance -= this.amount;
          } else if (this.type === 'income') {
            account.balance += this.amount;
          }
        }
      }
      
      // Обновляем даты
      this.lastProcessed = new Date();
      this.nextOccurrence = this.calculateNextOccurrence();
      this.updatedAt = new Date();
      
      // Проверяем, не пора ли деактивировать
      if (this.endDate && this.nextOccurrence > this.endDate) {
        this.isActive = false;
      }
    });
    
    return transactionId!;
  }
}
