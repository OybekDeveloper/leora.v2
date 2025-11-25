export type AccountKind =
  | 'cash'
  | 'card'
  | 'savings'
  | 'usd'
  | 'crypto'
  | 'other'
  | 'custom';

export type AccountIconId =
  | 'wallet'
  | 'credit-card'
  | 'piggy-bank'
  | 'bank'
  | 'briefcase'
  | 'coins'
  | 'sparkles'
  | 'bitcoin'
  | 'shield'
  | 'trending-up';

export interface CustomAccountType {
  id: string;
  label: string;
  icon: AccountIconId;
}

export type AccountTransactionType = 'income' | 'outcome';

export interface AccountTransaction {
  id: string;
  type: AccountTransactionType;
  amount: number;
  currency?: string;
  time: string;
  description?: string;
}

export interface AccountItem {
  id: string;
  name: string;
  type: AccountKind;
  balance: number;
  currency: string;
  subtitle: string;
  iconColor: string;
  customTypeId?: string;
  customTypeLabel?: string;
  customIcon?: AccountIconId;
  progress?: number;
  goal?: number;
  usdRate?: number;
  transactions: AccountTransaction[];
  isArchived?: boolean;
}

export interface AddAccountPayload {
  name: string;
  description: string;
  amount: number;
  type: AccountKind;
  currency: string;
  customTypeId?: string;
  customTypeLabel?: string;
  customIcon?: AccountIconId;
}
