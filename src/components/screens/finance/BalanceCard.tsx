// src/components/screens/finance/BalanceCard.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';

import { Colors } from '@/constants/theme';

interface BalanceCardProps {
  balance: number;
  currency: string;
  change: number;
  period: string;
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const formatUZS = (amount: number) => {
  const rate = 12650;
  return new Intl.NumberFormat('uz-UZ').format(amount * rate);
};

export default function BalanceCard({
  balance = 101017960,
  currency = 'USD',
  change = 100,
  period = '30 days',
}: BalanceCardProps) {
  const filterType: 'all' | 'liquid' | 'investment' | 'frozen' = 'liquid';
  const isPositive = change >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>TOTAL BALANCE</Text>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Text style={styles.filterText}>{filterType}</Text>
          <ChevronDown color={Colors.textSecondary} size={14} />
        </TouchableOpacity>
      </View>

      <Text style={styles.mainAmount}>{formatCurrency(balance, currency)}</Text>
      <Text style={styles.convertedAmount}>≈ {formatUZS(balance)} сум</Text>

      <View style={styles.changeRow}>
        <View style={styles.periodPill}>
          <Text style={styles.periodText}>{period}</Text>
        </View>
        <View
          style={[
            styles.changePill,
            isPositive ? styles.changePillPositive : styles.changePillNegative,
          ]}
        >
          {isPositive ? (
            <TrendingUp color={Colors.success} size={14} />
          ) : (
            <TrendingDown color={Colors.danger} size={14} />
          )}
          <Text
            style={[
              styles.changeText,
              isPositive ? styles.positiveText : styles.negativeText,
            ]}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.75}>
          <ArrowLeftRight size={16} color={Colors.textPrimary} />
          <Text style={styles.actionText}>Converter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.75}>
          <BarChart3 size={16} color={Colors.textPrimary} />
          <Text style={styles.actionText}>Rates</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical:6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  mainAmount: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  convertedAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodPill: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  periodText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changePillPositive: {
    backgroundColor: Colors.successBg,
  },
  changePillNegative: {
    backgroundColor: Colors.dangerBg,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  positiveText: {
    color: Colors.success,
  },
  negativeText: {
    color: Colors.danger,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});
