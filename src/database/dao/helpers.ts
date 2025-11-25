import { BSON } from 'realm';

const isHexObjectId = (input: string) => /^[0-9a-fA-F]{24}$/.test(input.trim());

export const toObjectId = (value?: string | BSON.ObjectId | null) => {
  if (!value) {
    return null;
  }
  if (value instanceof BSON.ObjectId) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!isHexObjectId(trimmed)) {
      return null;
    }
    try {
      return new BSON.ObjectId(trimmed);
    } catch {
      return null;
    }
  }
  return null;
};

export const fromObjectId = (value?: BSON.ObjectId | null) => value?.toHexString();

export const toISODate = (value?: Date | null) => value?.toISOString();

export const nowISO = () => new Date().toISOString();
