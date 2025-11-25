import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { useLocalization } from '@/localization/useLocalization';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import { useShallow } from 'zustand/react/shallow';

const FinanceStatsModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { strings } = useLocalization();
  const { accounts, transactions, debts, budgets } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      debts: state.debts,
      budgets: state.budgets,
    })),
  );

  const { convertAmount, formatCurrency, globalCurrency } = useFinanceCurrency();

  const stats = useMemo(() => {
    const totalBalance = accounts.reduce(
      (sum, account) =>
        sum + convertAmount(account.currentBalance, normalizeFinanceCurrency(account.currency), globalCurrency),
      0,
    );
    const incomeTotal = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => {
        const currency = normalizeFinanceCurrency(
          (transaction.currency ?? accounts.find((a) => a.id === transaction.accountId)?.currency) ?? globalCurrency,
        );
        return sum + convertAmount(transaction.amount, currency, globalCurrency);
      }, 0);
    const outcomeTotal = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => {
        const currency = normalizeFinanceCurrency(
          (transaction.currency ?? accounts.find((a) => a.id === transaction.accountId)?.currency) ?? globalCurrency,
        );
        return sum + convertAmount(transaction.amount, currency, globalCurrency);
      }, 0);
    const debtOutstanding = debts.reduce(
      (sum, debt) =>
        sum + convertAmount(debt.principalAmount, normalizeFinanceCurrency(debt.principalCurrency), globalCurrency),
      0,
    );
    const budgetUsage = budgets.reduce(
      (acc, budget) => {
        const spent = convertAmount(budget.spentAmount, normalizeFinanceCurrency(budget.currency), globalCurrency);
        const limit = convertAmount(budget.limitAmount, normalizeFinanceCurrency(budget.currency), globalCurrency);
        return {
          spent: acc.spent + spent,
          limit: acc.limit + limit,
        };
      },
      { spent: 0, limit: 0 },
    );

    const formatValue = (value: number) => formatCurrency(value, { fromCurrency: globalCurrency, convert: false });

    return [
      {
        label: strings.financeScreens.review.totalBalance,
        value: formatValue(totalBalance),
      },
      {
        label: strings.financeScreens.review.income,
        value: formatValue(incomeTotal),
      },
      {
        label: strings.financeScreens.review.outcome,
        value: formatValue(outcomeTotal),
      },
      {
        label: strings.financeScreens.debts.summary.balanceLabel,
        value: formatValue(debtOutstanding),
      },
      {
        label: strings.financeScreens.budgets.mainTitle,
        value:
          budgetUsage.limit > 0
            ? `${formatValue(budgetUsage.spent)} / ${formatValue(budgetUsage.limit)}`
            : formatValue(budgetUsage.spent),
      },
    ];
  }, [accounts, budgets, convertAmount, debts, formatCurrency, globalCurrency, strings.financeScreens, transactions]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Finance statistics</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.metaLabel}>{globalCurrency}</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {stats.map((item, index) => (
          <View
            key={`${item.label}-${index}`}
            style={[styles.statCard, { backgroundColor: theme.colors.card }]}
          >
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={styles.statValue}>{item.value}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinanceStatsModal;

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    headerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    metaLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    content: {
      padding: 20,
      gap: 14,
    },
    statCard: {
      borderRadius: 20,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: 6,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
  });
