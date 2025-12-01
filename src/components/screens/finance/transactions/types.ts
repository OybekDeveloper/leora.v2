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

// ===== Yangi TransactionCard uchun tiplar =====

export type TransactionCardType = 'income' | 'outcome' | 'transfer' | 'debt';
export type TransactionStatus = 'confirmed' | 'pending' | 'canceled';
export type DebtDirection = 'i_owe' | 'they_owe_me';
export type DebtStatus = 'active' | 'paid' | 'overdue' | 'canceled';

export type TransactionCardData = {
  id: string;
  sourceId: string;
  type: TransactionCardType;

  // Asosiy ma'lumotlar
  name: string;
  description?: string;
  categoryId?: string;

  // Summa
  amount: number;
  currency: string;

  // Transfer uchun
  fromAccountName?: string;
  toAccountName?: string;
  toAmount?: number;
  toCurrency?: string;

  // Debt uchun
  debtDirection?: DebtDirection;
  counterpartyName?: string;
  debtStatus?: DebtStatus;

  // Debt payment konvertatsiya uchun (boshqa valyutadan to'langanda)
  originalCurrency?: string; // Qarz valyutasi (masalan USD)
  originalAmount?: number; // Qarz valyutasidagi summa (masalan 10 USD)

  // Meta
  transactionId: string;
  accountName: string;
  date: Date;
  time: string;
  status: TransactionStatus;

  // Bog'lanishlar
  goalName?: string;
  budgetName?: string;
  debtId?: string;
};

export type TransactionCardGroupData = {
  id: string;
  label: string;
  dateLabel: string;
  transactions: TransactionCardData[];
};
