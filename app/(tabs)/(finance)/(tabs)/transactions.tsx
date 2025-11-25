import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import TransactionGroup from '@/components/screens/finance/transactions/TransactionGroup';
import type { TransactionGroupData } from '@/components/screens/finance/transactions/types';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Transaction as LegacyTransaction } from '@/types/store.types';
import type { Transaction as DomainTransaction } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';
import { type FilterState, useTransactionFilterStore } from '@/stores/useTransactionFilterStore';

const BASE_CURRENCY = 'UZS';

type LegacyTransactionType = 'income' | 'outcome' | 'transfer';

const toLegacyTransactionType = (type: DomainTransaction['type']): LegacyTransactionType =>
  type === 'expense' ? 'outcome' : type;

const mapDomainTransactionToLegacy = (transaction: DomainTransaction): LegacyTransaction[] => {
  const legacyType = toLegacyTransactionType(transaction.type);
  const fallbackAccount = transaction.accountId ?? transaction.fromAccountId ?? 'local-account';
  const baseRecord = {
    type: legacyType,
    category: transaction.categoryId,
    toAccountId: transaction.toAccountId,
    note: transaction.description,
    description: transaction.description,
    date: new Date(transaction.date),
    createdAt: new Date(transaction.createdAt),
    updatedAt: new Date(transaction.updatedAt),
    goalId: transaction.goalId,
    goalName: transaction.goalName,
    goalType: transaction.goalType,
    budgetId: transaction.budgetId,
    debtId: transaction.debtId,
    relatedBudgetId: transaction.relatedBudgetId ?? transaction.budgetId,
    relatedDebtId: transaction.relatedDebtId ?? transaction.debtId,
    plannedAmount: transaction.plannedAmount ?? transaction.amount,
    paidAmount: transaction.paidAmount ?? transaction.amount,
    sourceTransactionId: transaction.id,
  } as const;

  if (legacyType !== 'transfer') {
    return [
      {
        ...baseRecord,
        id: transaction.id,
        amount: transaction.amount,
        accountId: fallbackAccount,
        currency: transaction.currency,
      },
    ];
  }

  const fromAccountId = transaction.accountId ?? transaction.fromAccountId ?? fallbackAccount;
  const toAccountId = transaction.toAccountId ?? fallbackAccount;
  const incomingAmount = transaction.toAmount ?? transaction.amount;
  const incomingCurrency = transaction.toCurrency ?? transaction.currency;

  return [
    {
      ...baseRecord,
      id: `${transaction.id}-from`,
      amount: transaction.amount,
      accountId: fromAccountId,
      currency: transaction.currency,
      transferDirection: 'outgoing',
    },
    {
      ...baseRecord,
      id: `${transaction.id}-to`,
      amount: incomingAmount,
      accountId: toAccountId,
      currency: incomingCurrency,
      transferDirection: 'incoming',
    },
  ];
};

const matchesFilters = (transaction: LegacyTransaction, filters: FilterState) => {
  const date = new Date(transaction.date);
  if (filters.type !== 'all') {
    if (filters.type === 'debt') {
      if (!transaction.relatedDebtId) {
        return false;
      }
    } else if (transaction.type !== filters.type) {
      return false;
    }
  }
  if (filters.category !== 'all' && transaction.category !== filters.category) {
    return false;
  }
  if (filters.account !== 'all' && transaction.accountId !== filters.account) {
    return false;
  }
  const min = parseFloat(filters.minAmount);
  if (!Number.isNaN(min) && transaction.amount < min) {
    return false;
  }
  const max = parseFloat(filters.maxAmount);
  if (!Number.isNaN(max) && transaction.amount > max) {
    return false;
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    if (date < from) {
      return false;
    }
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    if (date > to) {
      return false;
    }
  }
  return true;
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const todayKey = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (date.toDateString() === todayKey) return `Today ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const TransactionsPage: React.FC = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const transactionsStrings = strings.financeScreens.transactions;
  const { accounts, transactions: domainTransactions } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
    })),
  );
  const transactions = useMemo<LegacyTransaction[]>(
    () => domainTransactions.flatMap(mapDomainTransactionToLegacy),
    [domainTransactions],
  );
  const filters = useTransactionFilterStore((state) => state.filters);

  const openFilters = useCallback(() => {
    router.push('/(modals)/finance/transaction-filter');
  }, [router]);

  const handleTransactionPress = useCallback((transactionId: string) => {
    router.push({
      pathname: '/(modals)/finance/transaction-detail',
      params: { id: transactionId },
    });
  }, [router]);

  const groupedTransactions = useMemo(() => {
    const accountMap = new Map(accounts.map((account) => [account.id, account.name]));
    const filtered = transactions.filter((transaction) => matchesFilters(transaction, filters));
    const groups = new Map<string, TransactionGroupData & { timestamp: number }>();

    filtered
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((transaction) => {
        const date = new Date(transaction.date);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const key = dayStart.getTime().toString();
        const label = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(date);

        if (!groups.has(key)) {
          groups.set(key, {
            id: key,
            label,
            dateLabel: label,
            timestamp: dayStart.getTime(),
            transactions: [],
          } as TransactionGroupData & { timestamp: number });
        }

        const group = groups.get(key)!;
        group.transactions.push({
          id: transaction.id,
          category: transaction.category ?? 'General',
          description: transaction.note ?? transaction.description ?? '-',
          account: accountMap.get(transaction.accountId) ?? 'Unknown account',
          time: formatRelativeTime(date),
          amount: transaction.amount,
          currency: transaction.currency ?? BASE_CURRENCY,
          type: transaction.type,
          transferDirection: transaction.transferDirection,
        });
      });

    return Array.from(groups.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(({ timestamp, ...rest }) => rest);
  }, [accounts, filters, transactions]);


  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          {transactionsStrings.header}
        </Text>

        <Pressable
          onPress={openFilters}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            pressed && styles.pressedOpacity,
          ]}
        >
          <SlidersHorizontal size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {groupedTransactions.map((group) => (
        <TransactionGroup
          key={group.id}
          group={group}
          onTransactionPress={handleTransactionPress}
        />
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

export default TransactionsPage;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedOpacity: {
    opacity: 0.85,
  },
  bottomSpacer: {
    height: 40,
  },
});
