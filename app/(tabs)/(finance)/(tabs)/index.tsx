// app/(tabs)/(finance)/(tabs)/index.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Clock,
  Wallet,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { PieChart } from 'react-native-chart-kit';
import * as Progress from 'react-native-progress';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';

import { useAppTheme } from '@/constants/theme';
import { Table, TableColumn } from '@/components/ui/Table';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Transaction as FinanceTransaction } from '@/domain/finance/types';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import { useShallow } from 'zustand/react/shallow';
import {
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';

const { width: screenWidth } = Dimensions.get('window');

const CATEGORY_COLORS = ['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EAB308'];

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const todayKey = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const shortTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (date.toDateString() === todayKey) {
    return `Today ${shortTime}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${shortTime}`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const describeDueDate = (target?: Date) => {
  if (!target) {
    return 'No period';
  }
  const today = new Date();
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Due today';
  if (diffDays > 0) return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`;
};

interface RecentTransactionRow {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  isIncome: boolean;
  time: string;
}

type EventIcon = 'wallet' | 'clock' | 'alert';

interface FinanceEvent {
  id: string;
  icon: EventIcon;
  title: string;
  description: string;
  time: string;
}

interface PieDatum {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface FinanceSummaryView {
  balanceGlobal: number;
  balanceBase: number;
  incomeCard: { amount: number; change: number };
  outcomeCard: { amount: number; change: number };
  progress: { used: number; percentage: number };
  pie: PieDatum[];
  recentTransactions: RecentTransactionRow[];
  events: FinanceEvent[];
}

export default function FinanceReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    selectedAccountIds?: string;
    balanceCurrency?: FinanceCurrency;
  }>();

  const theme = useAppTheme();
  const { strings } = useLocalization();
  const reviewStrings = strings.financeScreens.review;
  const styles = createStyles(theme);
  const { accounts, transactions, debts, budgets } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      debts: state.debts,
      budgets: state.budgets,
    })),
  );
  const { baseCurrency: financePreferencesBaseCurrency } = useFinancePreferencesStore(
    useShallow((state) => ({
      baseCurrency: state.baseCurrency,
    })),
  );
  const {
    convertAmount,
    formatCurrency: formatFinanceCurrency,
    globalCurrency,
    baseCurrency,
  } = useFinanceCurrency();

  // Parse params from account-filter modal
  const selectedAccountIds = useMemo(
    () => (params.selectedAccountIds ? params.selectedAccountIds.split(',').filter(Boolean) : []),
    [params.selectedAccountIds],
  );
  const [balanceCurrency, setBalanceCurrency] = useState<FinanceCurrency>(
    (params.balanceCurrency as FinanceCurrency) || globalCurrency,
  );

  useEffect(() => {
    if (params.balanceCurrency) {
      setBalanceCurrency(params.balanceCurrency as FinanceCurrency);
    } else {
      setBalanceCurrency(globalCurrency);
    }
  }, [globalCurrency, params.balanceCurrency]);
  const convertToBalanceCurrency = useCallback(
    (value: number) => {
      if (balanceCurrency === globalCurrency) {
        return value;
      }
      return convertAmount(value, globalCurrency as FinanceCurrency, balanceCurrency);
    },
    [balanceCurrency, convertAmount, globalCurrency],
  );
  const formatBalanceValue = useCallback(
    (value: number) =>
      formatFinanceCurrency(convertToBalanceCurrency(value), {
        fromCurrency: balanceCurrency,
        convert: false,
      }),
    [balanceCurrency, convertToBalanceCurrency, formatFinanceCurrency],
  );

  const filteredAccounts = useMemo(
    () => (selectedAccountIds.length ? accounts.filter((account) => selectedAccountIds.includes(account.id)) : accounts),
    [accounts, selectedAccountIds],
  );
  const filteredAccountIds = useMemo(() => new Set(filteredAccounts.map((account) => account.id)), [filteredAccounts]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Modal navigation handlers
  const handleOpenFxOverride = useCallback(() => {
    router.push('/(modals)/finance/fx-override');
  }, [router]);

  const handleOpenAccountFilter = useCallback(() => {
    router.push({
      pathname: '/(modals)/finance/account-filter',
      params: {
        selectedAccountIds: selectedAccountIds.join(','),
        balanceCurrency,
      },
    });
  }, [router, selectedAccountIds, balanceCurrency]);

  const handleOpenMonitoring = useCallback(() => {
    router.push('/(modals)/finance/transaction-monitor');
  }, [router]);

  const summary = useMemo<FinanceSummaryView>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const accountCurrencyMap = new Map(
      filteredAccounts.map((account) => [account.id, normalizeFinanceCurrency(account.currency)]),
    );
    const accountNameMap = new Map(filteredAccounts.map((account) => [account.id, account.name]));
    const resolveTransactionCurrency = (transaction: typeof transactions[number]) =>
      transaction.currency
        ? normalizeFinanceCurrency(transaction.currency)
        : transaction.accountId
        ? accountCurrencyMap.get(transaction.accountId) ?? 'USD'
        : 'USD';

    const includesSelectedAccount = (transaction: typeof transactions[number]) => {
      const candidates = [transaction.accountId, transaction.fromAccountId, transaction.toAccountId].filter(
        Boolean,
      ) as string[];
      if (!candidates.length) {
        return filteredAccounts.length === accounts.length;
      }
      return candidates.some((id) => filteredAccountIds.has(id));
    };

    const filterByDate = (month: number, year: number) =>
      transactions.filter((transaction) => {
        const date = new Date(transaction.date);
        return date.getMonth() === month && date.getFullYear() === year && includesSelectedAccount(transaction);
      });

    const currentMonthTransactions = filterByDate(currentMonth, currentYear);
    const previousMonthTransactions = filterByDate(previousMonth, previousYear);

    const sumByType = (list: typeof transactions, type: FinanceTransaction['type']) =>
      list
        .filter((transaction) => transaction.type === type)
        .reduce(
          (sum, item) =>
            sum + convertAmount(item.amount, resolveTransactionCurrency(item), globalCurrency),
          0,
        );

    const incomeCurrent = sumByType(currentMonthTransactions, 'income');
    const incomePrev = sumByType(previousMonthTransactions, 'income');
    const outcomeCurrent = sumByType(currentMonthTransactions, 'expense');
    const outcomePrev = sumByType(previousMonthTransactions, 'expense');

    const calcChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Number((((current - prev) / prev) * 100).toFixed(1));
    };

    const totalBalanceGlobal = filteredAccounts.reduce(
      (sum, account) =>
        sum + convertAmount(account.currentBalance, normalizeFinanceCurrency(account.currency), globalCurrency),
      0,
    );
    const totalBalanceBase = filteredAccounts.reduce(
      (sum, account) =>
        sum + convertAmount(account.currentBalance, normalizeFinanceCurrency(account.currency), baseCurrency),
      0,
    );

    const enrichedBudgets = budgets.map((budget) => {
      const state = budget.limitAmount > 0 && budget.spentAmount > budget.limitAmount ? 'exceeding' : 'within';
      return {
        ...budget,
        state,
      };
    });

    const budgetsTotals = enrichedBudgets.reduce(
      (acc, budget) => {
        const limitValue = convertAmount(budget.limitAmount, normalizeFinanceCurrency(budget.currency), globalCurrency);
        const spentValue = convertAmount(budget.spentAmount, normalizeFinanceCurrency(budget.currency), globalCurrency);
        acc.limit += limitValue;
        acc.spent += spentValue;
        return acc;
      },
      { limit: 0, spent: 0 },
    );

    const progressPercentage = budgetsTotals.limit
      ? Math.min(Math.round((budgetsTotals.spent / budgetsTotals.limit) * 100), 125)
      : 0;
    const progressUsedGlobal = budgetsTotals.spent || outcomeCurrent;

    const recentTransactions: RecentTransactionRow[] = transactions
      .filter((transaction) => transaction.type !== 'transfer')
      .filter(includesSelectedAccount)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((transaction) => {
        const currency = resolveTransactionCurrency(transaction);
        const convertedAmount = convertAmount(transaction.amount, currency, globalCurrency);
        const accountRef =
          transaction.accountId ??
          transaction.fromAccountId ??
          transaction.toAccountId ??
          (accounts[0]?.id ?? '');
        return {
          id: transaction.id,
          title:
            transaction.description ??
            transaction.categoryId ??
            (transaction.type === 'income' ? 'Income' : 'Expense'),
          subtitle: accountNameMap.get(accountRef) ?? 'Unknown account',
          amount: convertedAmount,
          isIncome: transaction.type === 'income',
          time: formatRelativeTime(new Date(transaction.date)),
        };
      });

    const categoryTotals = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce<Record<string, number>>((acc, transaction) => {
        const key = transaction.categoryId ?? transaction.description ?? 'Other';
        const currency = resolveTransactionCurrency(transaction);
        const converted = convertAmount(transaction.amount, currency, globalCurrency);
        acc[key] = (acc[key] ?? 0) + converted;
        return acc;
      }, {});

    const expenseChartData = Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      population: value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 13,
    }));

    const formatValue = (value: number) =>
      formatFinanceCurrency(value, { fromCurrency: globalCurrency, convert: false });

    const upcomingDebts: FinanceEvent[] = debts
      .filter((debt) => debt.status !== 'paid')
      .sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 3)
      .map((debt) => {
        const converted = formatValue(
          convertAmount(debt.principalAmount, normalizeFinanceCurrency(debt.principalCurrency), globalCurrency),
        );
        const description = debt.description ? `${converted} • ${debt.description}` : converted;
        return {
          id: debt.id,
          icon: debt.direction === 'they_owe_me' ? 'wallet' : 'alert',
          title: debt.direction === 'they_owe_me' ? `${debt.counterpartyName} owes you` : `You owe ${debt.counterpartyName}`,
          description,
          time: describeDueDate(debt.dueDate ? new Date(debt.dueDate) : undefined),
        };
      });

    const fallbackEvents: FinanceEvent[] = enrichedBudgets
      .filter((budget) => budget.state !== 'within')
      .slice(0, 2)
      .map((budget) => {
        const spent = formatValue(convertAmount(budget.spentAmount, normalizeFinanceCurrency(budget.currency), globalCurrency));
        const limit = formatValue(convertAmount(budget.limitAmount, normalizeFinanceCurrency(budget.currency), globalCurrency));
        return {
          id: budget.id,
          icon: (budget.state === 'exceeding' ? 'alert' : 'clock') as EventIcon,
          title: budget.name,
          description: `${spent} / ${limit}`,
          time: budget.state === 'exceeding' ? 'Limit exceeded' : 'On track',
        };
      });

    return {
      balanceGlobal: totalBalanceGlobal,
      balanceBase: totalBalanceBase,
      incomeCard: { amount: incomeCurrent, change: calcChange(incomeCurrent, incomePrev) },
      outcomeCard: { amount: outcomeCurrent, change: calcChange(outcomeCurrent, outcomePrev) },
      progress: { used: progressUsedGlobal, percentage: progressPercentage },
      pie: expenseChartData.length
        ? expenseChartData
        : CATEGORY_COLORS.map((color, index) => ({
            name: `Category ${index + 1}`,
            population: 1,
            color,
            legendFontColor: theme.colors.textSecondary,
            legendFontSize: 13,
          })),
      recentTransactions,
      events: upcomingDebts.length ? upcomingDebts : fallbackEvents,
    };
  }, [
    accounts,
    baseCurrency,
    budgets,
    convertAmount,
    debts,
    formatFinanceCurrency,
    globalCurrency,
    theme.colors.textSecondary,
    transactions,
    filteredAccounts,
    filteredAccountIds,
  ]);

  const transactionColumns: TableColumn<RecentTransactionRow>[] = [
    {
      key: 'title',
      title: reviewStrings.table.type,
      flex: 2,
      align: 'left',
      renderText: (item) => item.title,
    },
    {
      key: 'amount',
      title: reviewStrings.table.amount,
      flex: 3,
      align: 'right',
          render: (item) => (
            <Text
              style={[
                styles.transactionAmount,
                { color: item.isIncome ? theme.colors.success : theme.colors.danger },
              ]}
            >
              {item.isIncome ? '+' : '−'}
              {formatBalanceValue(item.amount)}
            </Text>
          ),
    },
    {
      key: 'time',
      title: reviewStrings.table.date,
      flex: 2,
      align: 'right',
      renderText: (item) => item.time,
      style: styles.transactionTime,
    },
  ];

  const getEventIcon = (iconType: 'wallet' | 'clock' | 'alert') => {
    const iconProps = { size: 20, color: theme.colors.iconText };
    switch (iconType) {
      case 'wallet':
        return <Wallet {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      case 'alert':
        return <AlertCircle {...iconProps} />;
    }
  };

  const pieChartData = summary.pie;


  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: () => theme.colors.textPrimary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
        {/* 1. Balance Section */}
        <View style={styles.balanceSection}>
          {/* Main Balance Card */}
          <Pressable onLongPress={handleOpenMonitoring} delayLongPress={350}>
            <AdaptiveGlassView style={[styles.glassSurface, styles.mainBalanceCard]}>
            <View style={styles.balanceHeaderRow}>
              <Text style={styles.balanceLabel}>{reviewStrings.totalBalance}</Text>
              <Pressable
                style={({ pressed }) => [styles.balanceFilterButton, pressed && styles.pressed]}
                onPress={handleOpenAccountFilter}
              >
                <Text style={[styles.balanceFilterLabel, { color: theme.colors.textSecondary }]}>
                  {selectedAccountIds.length
                    ? reviewStrings.accountFilterSelected.replace('{count}', String(selectedAccountIds.length))
                    : reviewStrings.accountFilterAll}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.balanceAmount}>{formatBalanceValue(summary.balanceGlobal)}</Text>
            <Text style={styles.balanceConverted}>
              Base ·{' '}
              {formatFinanceCurrency(summary.balanceBase, { fromCurrency: baseCurrency, convert: false })}
            </Text>
            </AdaptiveGlassView>
          </Pressable>

          {/* Income & Outcome Cards */}
          <View style={styles.inOutRow}>
            {/* Income Card */}
            <AdaptiveGlassView style={[styles.glassSurface, styles.inOutCard]}>
              <View style={styles.inOutHeader}>
                <Text style={styles.inOutLabel}>{reviewStrings.income}</Text>
                <TrendingUp size={16} color={theme.colors.success} />
              </View>
              <Text style={[styles.inOutAmount, { color: theme.colors.success }]}>
                {formatBalanceValue(summary.incomeCard.amount)}
              </Text>
              <Text style={styles.inOutChange}>
                {summary.incomeCard.change >= 0 ? '+' : ''}
                {summary.incomeCard.change}%
              </Text>
            </AdaptiveGlassView>

            {/* Outcome Card */}
            <AdaptiveGlassView style={[styles.glassSurface, styles.inOutCard]}>
              <View style={styles.inOutHeader}>
                <Text style={styles.inOutLabel}>{reviewStrings.outcome}</Text>
                <TrendingDown size={16} color={theme.colors.danger} />
              </View>
              <Text style={[styles.inOutAmount, { color: theme.colors.danger }]}>
                {formatBalanceValue(summary.outcomeCard.amount)}
              </Text>
              <Text style={styles.inOutChange}>
                {summary.outcomeCard.change >= 0 ? '+' : ''}
                {summary.outcomeCard.change}%
              </Text>
            </AdaptiveGlassView>
          </View>
        </View>

        {/* FX Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{reviewStrings.fxQuick.title}</Text>
          <Pressable
            onPress={handleOpenFxOverride}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <AdaptiveGlassView style={[styles.glassSurface, styles.fxQuickCard]}>
              <Text style={[styles.fxActionLabel, { color: theme.colors.textPrimary }]}>
                {reviewStrings.fxQuick.overrideButton}
              </Text>
              <Text style={[styles.fxActionDescription, { color: theme.colors.textSecondary }]}>
                {reviewStrings.fxQuick.overrideHint.replace('{base}', financePreferencesBaseCurrency)}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>

        {/* 2. Monthly Progress Indicator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{reviewStrings.monthBalance}</Text>
          <View style={styles.progressWrapper}>
            <Progress.Bar
              progress={summary.progress.percentage / 100}
              width={screenWidth - 32}
              height={16}
              color={theme.colors.textSecondary}
              unfilledColor={theme.colors.surfaceElevated}
              borderWidth={0}
              borderRadius={999}
              animated={true}
              animationType="spring"
              animationConfig={{ bounciness: 8 }}
            />
            <View style={styles.progressLabelsRow}>
              <AdaptiveGlassView style={[styles.glassSurface, styles.progressLabelItem]}>
                <Text style={styles.progressLabel}>{reviewStrings.used}</Text>
                <Text style={styles.progressValue}>
                  –{formatBalanceValue(summary.progress.used)}
                </Text>
              </AdaptiveGlassView>
              <AdaptiveGlassView style={[styles.glassSurface, styles.progressLabelItem, styles.progressLabelRight]}>
                <Text style={styles.progressLabel}>{reviewStrings.progress}</Text>
                <Text style={[styles.progressValue, { color: theme.colors.textSecondary }]}>
                  {summary.progress.percentage}%
                </Text>
              </AdaptiveGlassView>
            </View>
          </View>
        </View>

        {/* 3. Expense Structure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{reviewStrings.expenseStructure}</Text>
          <AdaptiveGlassView style={[styles.glassSurface, styles.expenseContainer]}>
            <PieChart
              data={pieChartData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute={false}
              hasLegend={true}
              style={styles.pieChart}
            />
          </AdaptiveGlassView>
        </View>

        {/* 4. Expense History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{reviewStrings.recentTransactions}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>{reviewStrings.seeAll}</Text>
            </TouchableOpacity>
          </View>

            <Table
              data={summary.recentTransactions}
              columns={transactionColumns}
              showHeader={true}
              keyExtractor={(item) => item.id}
            />
        </View>

        {/* 5. Important Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{reviewStrings.importantEvents}</Text>
          <View style={styles.eventsList}>
            {summary.events.map((event) => (
              <AdaptiveGlassView key={event.id} style={[styles.glassSurface, styles.eventCard]}>
                <View style={styles.eventIconContainer}>{getEventIcon(event.icon)}</View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                </View>
                <Text style={styles.eventTime}>{event.time}</Text>
              </AdaptiveGlassView>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.View>
      </ScrollView>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    glassSurface: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
      backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    },
    pressed: {
      opacity: 0.85,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },

    // Balance Section
    balanceSection: {
      marginBottom: 24,
    },
    mainBalanceCard: {
      backgroundColor:theme.colors.card,
      borderRadius: 20,
      padding: 24,
      marginBottom: 12,
    },
    balanceHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    balanceLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    balanceAmount: {
      fontSize: 36,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      letterSpacing: -1,
    },
    balanceFilterButton: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    balanceFilterLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    balanceConverted: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      opacity: 0.7,
      marginTop: 4,
    },
    inOutRow: {
      flexDirection: 'row',
      gap: 12,
    },
    inOutCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      backgroundColor:theme.colors.card,
    },
    inOutHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    inOutLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      letterSpacing: 0.3,
    },
    inOutAmount: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    inOutChange: {
      fontSize: 11,
      color: theme.colors.textMuted,
      fontWeight: '500',
    },

    // Section styles
    section: {
      marginBottom: 24,
    },
    fxQuickCard: {
      borderRadius: 18,
      padding: 16,
      gap: 14,
    },
    fxActionLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    fxActionDescription: {
      fontSize: 12,
      lineHeight: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    seeAllButton: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },

    // Progress Bar
    progressWrapper: {
      gap: 12,
    },
    progressLabelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    progressLabelItem: {
      flex: 1,
      borderRadius: 12,
      padding: 12,
    },
    progressLabelRight: {
      alignItems: 'flex-end',
    },
    progressLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    progressValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      letterSpacing: -0.2,
    },

    // Expense Structure
    expenseContainer: {
      alignItems: 'center',
      borderRadius: 16,
      padding: 16,
    },
    pieChart: {
      borderRadius: 16,
    },

    // Transactions (styles used by Table component)
    tableContainer: {
      borderRadius: 16,
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: '700',
    },
    transactionTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },

    // Events
    eventsList: {
      gap: 12,
    },
    eventCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 14,
      gap: 12,
    },
    eventIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.icon,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventContent: {
      flex: 1,
      gap: 4,
    },
    eventTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    eventDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    eventTime: {
      fontSize: 11,
      color: theme.colors.textMuted,
      fontWeight: '500',
    },

    bottomSpacer: {
      height: 100,
    },
  });
