// src/data/models/Debt.ts
import Realm, { BSON, ObjectSchema } from 'realm';

export class Debt extends Realm.Object<Debt> {
  _id!: BSON.ObjectId;
  type!: 'owed_by_me' | 'owed_to_me';
  person!: string;
  amount!: number;
  currency!: string;
  originalAmount!: number;
  description!: string;
  category?: string;
  dueDate?: Date;
  interestRate?: number;
  status!: 'pending' | 'partial' | 'paid' | 'forgiven' | 'defaulted';
  payments!: DebtPayment[];
  reminders?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastSent?: Date;
  };
  notes?: string;
  attachments?: string[];
  createdAt!: Date;
  updatedAt!: Date;
  settledAt?: Date;

  static schema: ObjectSchema = {
    name: 'Debt',
    primaryKey: '_id',
    properties: {
      _id: { type: 'objectId', default: () => new BSON.ObjectId() },
      type: 'string',
      person: 'string',
      amount: 'double',
      currency: 'string',
      originalAmount: 'double',
      description: 'string',
      category: 'string?',
      dueDate: 'date?',
      interestRate: 'double?',
      status: { type: 'string', default: 'pending' },
      payments: 'DebtPayment[]',
      reminders: 'mixed?',
      notes: 'string?',
      attachments: 'string[]',
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() },
      settledAt: 'date?',
    },
  };
}

export class DebtPayment extends Realm.Object {
  _id!: BSON.ObjectId;
  amount!: number;
  currency!: string;
  date!: Date;
  transactionId?: BSON.ObjectId;
  notes?: string;

  static schema: ObjectSchema = {
    name: 'DebtPayment',
    embedded: true,
    properties: {
      _id: { type: 'objectId', default: () => new BSON.ObjectId() },
      amount: 'double',
      currency: 'string',
      date: 'date',
      transactionId: 'objectId?',
      notes: 'string?',
    },
  };
}