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
import type { TransactionGroupData, TransactionItemData } from './types';
import TransactionItemRow from './TransactionItemRow';

type TransactionGroupProps = {
  group: TransactionGroupData;
  onTransactionPress?: (transactionId: string) => void;
};

const getTotal = (transactions: TransactionItemData[]) =>
  transactions.reduce((acc, txn) => {
    if (txn.type === 'income') {
      return acc + txn.amount;
    }
    if (txn.type === 'outcome') {
      return acc - txn.amount;
    }
    return acc;
  }, 0);

const formatTotal = (amount: number) => {
  if (amount === 0) {
    return '0';
  }
  const sign = amount > 0 ? '+' : '−';
  return `${sign}${new Intl.NumberFormat('en-US').format(Math.abs(amount))}`;
};

const TransactionGroup: React.FC<TransactionGroupProps> = ({ group, onTransactionPress }) => {
  const theme = useAppTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    const config = { duration: 260, easing: Easing.linear };
    opacity.value = withTiming(1, config);
    translateY.value = withTiming(0, config);
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const total = useMemo(() => getTotal(group.transactions), [group.transactions]);
  const totalColor =
    total > 0 ? theme.colors.success : total < 0 ? theme.colors.danger : theme.colors.textSecondary;

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
          {formatTotal(total)}
        </Text>
      </AdaptiveGlassView>

      <View
        style={[
          styles.transactionsContainer,
        ]}
      >
        {group.transactions.map((transaction, index) => (
          <TransactionItemRow
            key={transaction.id}
            item={transaction}
            index={index}
            showDivider={index < group.transactions.length - 1}
            onPress={() => onTransactionPress?.(transaction.id)}
          />
        ))}
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
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsContainer: {
    borderRadius: 22,
    paddingVertical: 8,
    overflow: 'hidden',
  },
});

export default TransactionGroup;
