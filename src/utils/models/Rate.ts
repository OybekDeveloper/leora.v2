import Realm, { BSON, ObjectSchema } from 'realm';

export class Rate extends Realm.Object<Rate> {
  _id!: BSON.ObjectId;
  currency!: string;
  rateToUSD!: number;
  effectiveFrom!: Date;
  source!: 'manual' | 'api' | 'bank';
  createdAt!: Date;
  updatedAt!: Date;

  static schema: ObjectSchema = {
    name: 'Rate',
    primaryKey: '_id',
    properties: {
      _id: { type: 'objectId', default: () => new BSON.ObjectId() },
      currency: 'string',
      rateToUSD: 'double',
      effectiveFrom: 'date',
      source: 'string',
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() },
    },
  };
}