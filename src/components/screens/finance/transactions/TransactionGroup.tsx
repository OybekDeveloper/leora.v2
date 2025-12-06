import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import type { TransactionGroupData, TransactionItemData, TransactionCardGroupData, TransactionCardData } from './types';
import TransactionItemRow from './TransactionItemRow';
import TransactionCard from './TransactionCard';
import { useFinancePreferencesStore, type FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { formatCompactNumber } from '@/utils/formatNumber';

type TransactionGroupProps = {
  group: TransactionGroupData | TransactionCardGroupData;
  onTransactionPress?: (transactionId: string) => void;
  useCardView?: boolean;
  displayCurrency?: FinanceCurrency; // Optional: override display currency
};

// Calculate total in base currency
const getTotal = (transactions: (TransactionItemData | TransactionCardData)[]) =>
  transactions.reduce((acc, txn) => {
    // Use convertedAmountToBase if available (for TransactionCardData), otherwise use amount
    const cardData = txn as TransactionCardData;
    const amountInBase = cardData.convertedAmountToBase ?? txn.amount;

    if (txn.type === 'income') {
      return acc + amountInBase;
    }
    if (txn.type === 'outcome') {
      return acc - amountInBase;
    }
    return acc;
  }, 0);

const TransactionGroup: React.FC<TransactionGroupProps> = ({
  group,
  onTransactionPress,
  useCardView = false,
  displayCurrency,
}) => {
  const theme = useAppTheme();
  const { globalCurrency, baseCurrency, formatCurrency, convertAmount } = useFinancePreferencesStore();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  // Use displayCurrency prop if provided, otherwise fall back to globalCurrency
  const targetCurrency = displayCurrency ?? globalCurrency;

  useEffect(() => {
    const config = { duration: 260, easing: Easing.linear };
    opacity.value = withTiming(1, config);
    translateY.value = withTiming(0, config);
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Calculate total in base currency first, then convert to target currency for display
  const totalInBase = useMemo(() => getTotal(group.transactions), [group.transactions]);
  const total = useMemo(() => {
    if (baseCurrency === targetCurrency) return totalInBase;
    return convertAmount(totalInBase, baseCurrency, targetCurrency);
  }, [totalInBase, baseCurrency, targetCurrency, convertAmount]);

  const totalColor =
    total > 0 ? theme.colors.success : total < 0 ? theme.colors.danger : theme.colors.textSecondary;

  // Format total with sign and currency in targetCurrency (compact for large numbers)
  const formattedTotal = useMemo(() => {
    if (total === 0) {
      return formatCurrency(0, { fromCurrency: targetCurrency });
    }
    const sign = total > 0 ? '+' : '';
    const absTotal = Math.abs(total);
    // Use compact format for large numbers (> 1 million)
    if (absTotal >= 1000000) {
      return `${sign}${formatCompactNumber(total, 1, 1000000)} ${targetCurrency}`;
    }
    return `${sign}${formatCurrency(total, { fromCurrency: targetCurrency })}`;
  }, [total, formatCurrency, targetCurrency]);

  const isCardData = (txn: TransactionItemData | TransactionCardData): txn is TransactionCardData => {
    return 'sourceId' in txn;
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <AdaptiveGlassView
        style={[
          styles.groupHeader,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card
          },
        ]}
      >
        <Text style={[styles.groupLabel, { color: theme.colors.textPrimary }]}>{group.label}</Text>
        <Text style={[styles.groupTotal, { color: totalColor }]}>
          {formattedTotal}
        </Text>
      </AdaptiveGlassView>

      <View style={styles.transactionsContainer}>
        {group.transactions.map((transaction, index) => {
          if (useCardView && isCardData(transaction)) {
            return (
              <TransactionCard
                key={transaction.id}
                data={transaction}
                index={index}
                onPress={() => onTransactionPress?.(transaction.sourceId)}
              />
            );
          }

          // Eski TransactionItemRow uchun fallback
          const itemData = transaction as TransactionItemData;
          return (
            <TransactionItemRow
              key={itemData.id}
              item={itemData}
              index={index}
              showDivider={index < group.transactions.length - 1}
              onPress={() => onTransactionPress?.(itemData.id)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  groupHeader: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  groupTotal: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 0,
    textAlign: 'right',
  },
  transactionsContainer: {
    borderRadius: 22,
    paddingVertical: 8,
    overflow: 'hidden',
  },
});

export default TransactionGroup;
