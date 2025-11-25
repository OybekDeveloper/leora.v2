import Realm, { BSON, ObjectSchema } from 'realm';

export class Transaction extends Realm.Object<Transaction> {
  _id!: BSON.ObjectId;
  accountId!: BSON.ObjectId;
  type!: 'income' | 'expense' | 'transfer' | 'adjustment';
  amount!: number;
  currency!: string;
  category!: string;
  subcategory?: string;
  description?: string;
  date!: Date;
  
  // Для переводов
  transferGroupId?: string;
  toAccountId?: BSON.ObjectId;
  fromAmount?: number;
  toAmount?: number;
  fxRate?: number;
  fee?: number;
  
  // Мета
  tags?: string[];
  attachments?: string[];
  location?: string;
  merchant?: string;
  isRecurring!: boolean;
  recurringId?: string;
  
  // Системные
  createdAt!: Date;
  updatedAt!: Date;
  syncStatus!: 'local' | 'pending' | 'synced';
  deletedAt?: Date;

  static schema: ObjectSchema = {
    name: 'Transaction',
    primaryKey: '_id',
    properties: {
      _id: { type: 'objectId', default: () => new BSON.ObjectId() },
      accountId: 'objectId',
      type: 'string',
      amount: 'double',
      currency: 'string',
      category: 'string',
      subcategory: 'string?',
      description: 'string?',
      date: 'date',
      
      // Transfer fields
      transferGroupId: 'string?',
      toAccountId: 'objectId?',
      fromAmount: 'double?',
      toAmount: 'double?',
      fxRate: 'double?',
      fee: 'double?',
      
      // Meta
      tags: 'string[]',
      attachments: 'string[]',
      location: 'string?',
      merchant: 'string?',
      isRecurring: { type: 'bool', default: false },
      recurringId: 'string?',
      
      // System
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() },
      syncStatus: { type: 'string', default: 'local' },
      deletedAt: 'date?',
    },
  };
}