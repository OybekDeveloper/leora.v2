export type TransactionType = 'income' | 'outcome' | 'transfer';

export type TransactionItemData = {
  id: string;
  category: string;
  description: string;
  account: string;
  time: string;
  amount: number;
  currency: string;
  type: TransactionType;
  transferDirection?: 'incoming' | 'outgoing';
};

export type TransactionGroupData = {
  id: string;
  label: string;
  dateLabel: string;
  transactions: TransactionItemData[];
};
