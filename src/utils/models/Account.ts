import Realm, { BSON, ObjectSchema } from 'realm';

export class Account extends Realm.Object<Account> {
  _id!: BSON.ObjectId;
  name!: string;
  currency!: string;
  balance!: number;
  type!: 'cash' | 'card' | 'savings' | 'investment' | 'debt';
  isPrimary!: boolean;
  icon?: string;
  color?: string;
  isArchived!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  syncStatus!: 'local' | 'pending' | 'synced';

  static schema: ObjectSchema = {
    name: 'Account',
    primaryKey: '_id',
    properties: {
      _id: { type: 'objectId', default: () => new BSON.ObjectId() },
      name: 'string',
      currency: 'string',
      balance: { type: 'double', default: 0 },
      type: 'string',
      isPrimary: { type: 'bool', default: false },
      icon: 'string?',
      color: 'string?',
      isArchived: { type: 'bool', default: false },
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() },
      syncStatus: { type: 'string', default: 'local' },
    },
  };
}