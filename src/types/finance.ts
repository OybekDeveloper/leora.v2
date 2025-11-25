export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'savings' | 'investment' | 'crypto';
  balance: number;
  currency: string;
  isHidden: boolean;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  category: string;
  description: string;
  account: string;
  date: Date;
  time: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  color: string;
}

export interface Debt {
  id: string;
  type: 'owed_by_me' | 'owed_to_me';
  person: string;
  amount: number;
  currency: string;
  dueDate: Date;
  description: string;
}
