import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import TransactionCardIcon from './TransactionCardIcon';
import TransactionStatusBadge from './TransactionStatusBadge';
import type { TransactionCardData } from './types';
import { formatCompactNumber } from '@/utils/formatNumber';

type TransactionCardProps = {
  data: TransactionCardData;
  index?: number;
  onPress?: () => void;
};

const formatAmount = (amount: number, currency: string): string => {
  const absAmount = Math.abs(amount);
  // Use compact format for large amounts (> 1 million)
  if (absAmount >= 1000000) {
    return `${formatCompactNumber(absAmount, 1, 1000000)} ${currency}`;
  }
  try {
    return new Intl.NumberFormat(currency === 'UZS' ? 'uz-UZ' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'UZS' ? 0 : 2,
    }).format(absAmount);
  } catch {
    return `${currency} ${absAmount.toFixed(currency === 'UZS' ? 0 : 2)}`;
  }
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const TransactionCard: React.FC<TransactionCardProps> = ({
  data,
  index = 0,
  onPress,
}) => {
  const theme = useAppTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    const config = { duration: 220, easing: Easing.linear };
    opacity.value = withDelay(index * 60, withTiming(1, config));
    translateY.value = withDelay(index * 60, withTiming(0, config));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Monoxrom summa belgisi (rang emas, faqat belgi)
  const getAmountSign = (): string => {
    switch (data.type) {
      case 'income':
        return '+';
      case 'outcome':
        return '-';
      case 'transfer':
        return '';
      case 'debt':
        return data.debtDirection === 'they_owe_me' ? '+' : '-';
      default:
        return '';
    }
  };

  // Transfer uchun tavsif
  const renderDescription = () => {
    if (data.type === 'transfer' && data.fromAccountName && data.toAccountName) {
      return (
        <View style={styles.transferRow}>
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {data.fromAccountName}
          </Text>
          <ArrowRight size={12} color={theme.colors.textMuted} />
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {data.toAccountName}
          </Text>
        </View>
      );
    }

    if (data.type === 'debt' && data.counterpartyName) {
      const directionText = data.debtDirection === 'i_owe'
        ? `You owe ${data.counterpartyName}`
        : `${data.counterpartyName} owes you`;
      return (
        <Text
          style={[styles.description, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {directionText}
        </Text>
      );
    }

    // Income/Expense uchun account nomi ko'rsatish
    if ((data.type === 'income' || data.type === 'outcome') && data.accountName) {
      return (
        <Text
          style={[styles.description, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {data.accountName}
        </Text>
      );
    }

    if (data.description) {
      return (
        <Text
          style={[styles.description, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {data.description}
        </Text>
      );
    }

    return null;
  };

  // Transfer yoki debt payment uchun konversiya ko'rsatish
  const renderConversion = () => {
    // Transfer konvertatsiyasi
    if (data.type === 'transfer' && data.toAmount && data.toCurrency && data.toCurrency !== data.currency) {
      return (
        <Text style={[styles.conversion, { color: theme.colors.textMuted }]}>
          {formatAmount(data.amount, data.currency)} → {formatAmount(data.toAmount, data.toCurrency)}
        </Text>
      );
    }

    // Debt payment konvertatsiyasi (boshqa valyutadan to'langanda)
    if (data.debtId && data.originalCurrency && data.originalAmount && data.originalCurrency !== data.currency) {
      return (
        <Text style={[styles.conversion, { color: theme.colors.textMuted }]}>
          {formatAmount(data.amount, data.currency)} = {formatAmount(data.originalAmount, data.originalCurrency)}
        </Text>
      );
    }

    // Base currency konvertatsiyasi (agar boshqa valyutada bo'lsa)
    if (data.convertedAmountToBase && data.baseCurrency && data.baseCurrency !== data.currency) {
      return (
        <Text style={[styles.conversion, { color: theme.colors.textMuted }]}>
          ≈ {formatAmount(data.convertedAmountToBase, data.baseCurrency)}
        </Text>
      );
    }

    return null;
  };

  // Valyuta P/L badge (qarz to'lovi uchun)
  const renderCurrencyPL = () => {
    if (!data.currencyPL) return null;

    const { profitLoss, isProfit } = data.currencyPL;
    const plColor = isProfit ? theme.colors.success : theme.colors.danger;
    const backgroundColor = isProfit ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';

    return (
      <View style={[styles.currencyPLBadge, { backgroundColor }]}>
        {isProfit ? (
          <TrendingUp size={10} color={plColor} />
        ) : (
          <TrendingDown size={10} color={plColor} />
        )}
        <Text style={[styles.currencyPLText, { color: plColor }]}>
          {isProfit ? '+' : '-'}{formatAmount(profitLoss, data.originalCurrency ?? data.currency)}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: theme.colors.card }]}
        onPress={onPress}
      >
        {/* Chap: Ikonka */}
        <TransactionCardIcon
          categoryId={data.categoryId}
          type={data.type}
          size={44}
        />

        {/* O'rta: Ma'lumotlar */}
        <View style={styles.content}>
          <Text
            style={[styles.name, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {data.name}
          </Text>

          {renderDescription()}

          {renderConversion()}
        </View>

        {/* O'ng: Summa va Status */}
        <View style={styles.rightSection}>
          <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
            {getAmountSign()} {formatAmount(data.amount, data.currency)}
          </Text>

          {renderCurrencyPL()}

          <TransactionStatusBadge
            status={data.status}
            debtStatus={data.debtStatus}
          />

          <Text style={[styles.date, { color: theme.colors.textMuted }]}>
            {formatDate(data.date)}
          </Text>

          <Text style={[styles.time, { color: theme.colors.textMuted }]}>
            {data.time}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  conversion: {
    fontSize: 11,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    fontSize: 11,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
  },
  currencyPLBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currencyPLText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TransactionCard;
