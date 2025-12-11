import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import EmptyState from '@/components/shared/EmptyState';
import TransactionGroup from '@/components/screens/finance/transactions/TransactionGroup';
import type {
  TransactionCardData,
  TransactionCardGroupData,
  TransactionCardType,
  TransactionStatus,
} from '@/components/screens/finance/transactions/types';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Transaction as DomainTransaction, Account, Debt } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';
import { type FilterState, useTransactionFilterStore } from '@/stores/useTransactionFilterStore';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { FxService } from '@/services/fx/FxService';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import { useFinanceDateStore } from '@/stores/useFinanceDateStore';
import { toISODateKey } from '@/utils/calendar';

const BASE_CURRENCY = 'UZS';

// Domain type ni UI type ga aylantirish
const toCardType = (type: DomainTransaction['type'], hasDebt: boolean): TransactionCardType => {
  if (hasDebt) return 'debt';
  if (type === 'expense') return 'outcome';
  return type;
};

// ShowStatus ni TransactionStatus ga aylantirish
const toTransactionStatus = (showStatus?: string): TransactionStatus => {
  if (showStatus === 'deleted' || showStatus === 'archived') return 'canceled';
  return 'confirmed';
};

// Transaction nomini aniqlash
const getTransactionName = (
  transaction: DomainTransaction,
  type: TransactionCardType,
  debt?: Debt
): string => {
  // Agar transaction da nom bo'lsa
  if (transaction.name) return transaction.name;

  // Debt uchun
  if (type === 'debt' && debt) {
    return debt.direction === 'i_owe' ? 'Debt payment' : 'Debt collection';
  }

  // Transfer uchun
  if (type === 'transfer') return 'Transfer to card';

  // Income/Expense uchun kategoriya nomi
  if (transaction.categoryId) return transaction.categoryId;

  // Default
  return type === 'income' ? 'Income' : 'Expense';
};

// Vaqtni formatlash
const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

// Domain Transaction ni TransactionCardData ga aylantirish
const mapToCardData = (
  transaction: DomainTransaction,
  accounts: Account[],
  debts: Debt[]
): TransactionCardData => {
  const date = new Date(transaction.date);
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  // Debt bilan bog'liqmi?
  const relatedDebt = transaction.relatedDebtId
    ? debts.find((d) => d.id === transaction.relatedDebtId)
    : undefined;

  const cardType = toCardType(transaction.type, !!relatedDebt);
  const accountId = transaction.accountId ?? transaction.fromAccountId ?? '';

  // Transfer uchun account nomlari
  let fromAccountName: string | undefined;
  let toAccountName: string | undefined;

  if (transaction.type === 'transfer') {
    const fromId = transaction.accountId ?? transaction.fromAccountId;
    const toId = transaction.toAccountId;
    fromAccountName = fromId ? accountMap.get(fromId) ?? 'Unknown' : undefined;
    toAccountName = toId ? accountMap.get(toId) ?? 'Unknown' : undefined;
  }

  return {
    id: transaction.id,
    sourceId: transaction.id,
    type: cardType,

    // Asosiy ma'lumotlar
    name: getTransactionName(transaction, cardType, relatedDebt),
    description: transaction.description,
    categoryId: transaction.categoryId,

    // Summa
    amount: transaction.amount,
    currency: transaction.currency ?? BASE_CURRENCY,

    // Base currency amount (for display in user's preferred currency)
    convertedAmountToBase: transaction.convertedAmountToBase,
    baseCurrency: transaction.baseCurrency,

    // Transfer uchun
    fromAccountName,
    toAccountName,
    toAmount: transaction.toAmount,
    toCurrency: transaction.toCurrency,

    // Debt uchun
    debtDirection: relatedDebt?.direction,
    counterpartyName: relatedDebt?.counterpartyName,
    debtStatus: relatedDebt?.status,

    // Debt payment konvertatsiya (boshqa valyutadan to'langanda)
    originalCurrency: transaction.originalCurrency,
    originalAmount: transaction.originalAmount,

    // Valyuta P/L hisoblash (qarz to'lovi uchun)
    currencyPL: (() => {
      if (!relatedDebt?.repaymentCurrency || relatedDebt.repaymentCurrency === relatedDebt.principalCurrency) {
        return undefined;
      }
      const startRate = relatedDebt.repaymentRateOnStart ?? 1;
      const currentRate = FxService.getInstance().getRate(
        normalizeFinanceCurrency(relatedDebt.principalCurrency),
        normalizeFinanceCurrency(relatedDebt.repaymentCurrency)
      ) ?? startRate;

      if (Math.abs(currentRate - startRate) < 0.0001) return undefined;

      const paymentAmount = transaction.amount;
      const rateDifference = currentRate - startRate;
      const profitLossInRepaymentCurrency = paymentAmount * rateDifference;
      const profitLoss = currentRate > 0 ? profitLossInRepaymentCurrency / currentRate : 0;

      // Foyda/zarar yo'nalishi
      const isProfit = relatedDebt.direction === 'they_owe_me' ? rateDifference >= 0 : rateDifference <= 0;

      return {
        startRate,
        currentRate,
        profitLoss: Math.abs(profitLoss),
        isProfit,
      };
    })(),

    // Meta
    transactionId: transaction.id,
    accountName: accountMap.get(accountId) ?? 'Unknown account',
    date,
    time: formatTime(date),
    status: toTransactionStatus(transaction.showStatus),

    // Bog'lanishlar
    goalName: transaction.goalName,
    debtId: transaction.relatedDebtId ?? transaction.debtId,
  };
};

// Filtrlarni tekshirish
const matchesFilters = (transaction: TransactionCardData, filters: FilterState): boolean => {
  const date = transaction.date;

  // Type filter
  if (filters.type !== 'all') {
    if (filters.type === 'debt') {
      if (transaction.type !== 'debt') return false;
    } else if (filters.type === 'income' && transaction.type !== 'income') {
      return false;
    } else if (filters.type === 'outcome' && transaction.type !== 'outcome') {
      return false;
    } else if (filters.type === 'transfer' && transaction.type !== 'transfer') {
      return false;
    }
  }

  // Category filter
  if (filters.category !== 'all' && transaction.categoryId !== filters.category) {
    return false;
  }

  // Account filter
  if (filters.account !== 'all') {
    // Account name bo'yicha filtrlash (ID yo'q)
    // Bu yerda account ID kerak bo'ladi
  }

  // Amount filters
  const min = parseFloat(filters.minAmount);
  if (!Number.isNaN(min) && transaction.amount < min) {
    return false;
  }
  const max = parseFloat(filters.maxAmount);
  if (!Number.isNaN(max) && transaction.amount > max) {
    return false;
  }

  // Date filters
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    if (date < from) return false;
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    if (date > to) return false;
  }

  return true;
};

const TransactionsPage: React.FC = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const transactionsStrings = strings.financeScreens.transactions;
  const { accounts, transactions: domainTransactions, debts } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      debts: state.debts,
    })),
  );
  // Use globalCurrency from useFinanceCurrency hook (same as index.tsx)
  const { globalCurrency } = useFinanceCurrency();

  // Finance date store dan tanlangan sanani olish
  const selectedDate = useFinanceDateStore((state) => state.selectedDate);

  // Domain transactions ni CardData ga aylantirish va sanaga qarab filter qilish
  const cardTransactions = useMemo<TransactionCardData[]>(() => {
    // Avval sanaga qarab filter qilish
    const dateFiltered = selectedDate
      ? domainTransactions.filter((txn) => {
          const txnDateKey = toISODateKey(new Date(txn.date));
          const selectedDateKey = toISODateKey(selectedDate);
          return txnDateKey === selectedDateKey;
        })
      : domainTransactions;

    return dateFiltered.map((txn) => mapToCardData(txn, accounts, debts));
  }, [domainTransactions, accounts, debts, selectedDate]);

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
    const filtered = cardTransactions.filter((txn) => matchesFilters(txn, filters));
    const groups = new Map<string, TransactionCardGroupData & { timestamp: number }>();

    filtered
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .forEach((transaction) => {
        const date = transaction.date;
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
          });
        }

        const group = groups.get(key)!;
        group.transactions.push(transaction);
      });

    return Array.from(groups.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(({ timestamp, ...rest }) => rest);
  }, [cardTransactions, filters]);

  const isEmpty = groupedTransactions.length === 0;

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

      {isEmpty ? (
        <EmptyState
          title={transactionsStrings.empty.title}
          subtitle={transactionsStrings.empty.subtitle}
        />
      ) : (
        groupedTransactions.map((group) => (
          <TransactionGroup
            key={group.id}
            group={group}
            onTransactionPress={handleTransactionPress}
            useCardView
            displayCurrency={globalCurrency}
          />
        ))
      )}

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
