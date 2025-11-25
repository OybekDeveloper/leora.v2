import Realm, { BSON, ObjectSchema } from 'realm';

export class Budget extends Realm.Object<Budget> {
  _id!: BSON.ObjectId;
  name!: string;
  category!: string;
  amount!: number;
  currency!: string;
  period!: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate!: Date;
  endDate?: Date;
  spent!: number;
  alertThreshold!: number; // процент для предупреждения (default 80)
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: ObjectSchema = {
    name: 'Budget',
    primaryKey: '_id',
    properties: {
      _id: { type: 'objectId', default: () => new BSON.ObjectId() },
      name: 'string',
      category: 'string',
      amount: 'double',
      currency: 'string',
      period: 'string',
      startDate: 'date',
      endDate: 'date?',
      spent: { type: 'double', default: 0 },
      alertThreshold: { type: 'double', default: 80 },
      isActive: { type: 'bool', default: true },
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() },
    },
  };
}