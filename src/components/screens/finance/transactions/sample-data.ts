import { TransactionGroupData } from './types';

export const SAMPLE_TRANSACTION_GROUPS: TransactionGroupData[] = [
  {
    id: 'today',
    label: 'Today, 6 January',
    dateLabel: 'Today, 6 January',
    transactions: [
      {
        id: 'txn-1',
        category: 'Products',
        description: 'Korzinka',
        account: 'Plastik 1 ****4589',
        time: '10:05',
        amount: -188_000,
        type: 'outcome',
      },
      {
        id: 'txn-2',
        category: 'Transport',
        description: 'Yandex Taxi',
        account: 'Cash',
        time: '14:00',
        amount: -120_000,
        type: 'outcome',
      },
      {
        id: 'txn-3',
        category: 'Coffee',
        description: 'Coffee House',
        account: 'Cash',
        time: '18:45',
        amount: -80_000,
        type: 'outcome',
      },
    ],
  },
  {
    id: 'yesterday',
    label: 'Yesterday, 5 January',
    dateLabel: 'Yesterday, 5 January',
    transactions: [
      {
        id: 'txn-4',
        category: 'Salary',
        description: 'OOO “TECHCORP”',
        account: 'Plastik 1 ****4589',
        time: '09:05',
        amount: 8_420_000,
        type: 'income',
      },
    ],
  },
  {
    id: 'earlier',
    label: '23 Dec 2025',
    dateLabel: '23 Dec 2025',
    transactions: [
      {
        id: 'txn-6',
        category: 'Invoice',
        description: 'Upwork Payout',
        account: 'USD Balance',
        time: '19:00',
        amount: 3_250_000,
        type: 'income',
      },
      {
        id: 'txn-7',
        category: 'Products',
        description: 'Makro',
        account: 'Plastik 1 ****4589',
        time: '21:45',
        amount: -132_000,
        type: 'outcome',
      },
    ],
  },
];
