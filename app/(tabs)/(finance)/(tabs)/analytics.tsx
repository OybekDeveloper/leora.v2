// app/(tabs)/(finance)/(tabs)/analytics.tsx
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CalendarRange,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Lightbulb,
} from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import type { Transaction as FinanceTransaction } from '@/domain/finance/types';

const percentageDelta = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const percentageDeltaOrNull = (current: number, previous: number) => {
  if (Math.abs(previous) < 1) {
    return null;
  }
  return percentageDelta(current, previous);
};

const formatMonthLabel = (locale: string, month: number, year: number) =>
  new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month, 1));


export default function AnalyticsTab() {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const analyticsStrings = strings.financeScreens.analytics;
  const { transactions, budgets, debts, accounts } = useFinanceDomainStore(
    useShallow((state) => ({
      transactions: state.transactions,
      budgets: state.budgets,
      debts: state.debts,
      accounts: state.accounts,
    })),
  );
  const {
    convertAmount,
    formatCurrency: formatFinanceCurrency,
    globalCurrency,
  } = useFinanceCurrency();

  const formatAmount = (value: number, options?: Intl.NumberFormatOptions) =>
    formatFinanceCurrency(value, { fromCurrency: globalCurrency, convert: false, ...options });

  const analyticsData = useMemo(() => {
    const accountCurrencyMap = new Map(
      accounts.map((account) => [account.id, normalizeFinanceCurrency(account.currency as FinanceCurrency)]),
    );

    const resolveTransactionCurrency = (transaction: FinanceTransaction): FinanceCurrency => {
      if (transaction.currency) {
        return normalizeFinanceCurrency(transaction.currency as FinanceCurrency);
      }
      const accountCurrency =
        (transaction.accountId ? accountCurrencyMap.get(transaction.accountId) : undefined) ?? globalCurrency;
      return accountCurrency;
    };

    const convertTransaction = (transaction: FinanceTransaction) =>
      convertAmount(transaction.amount, resolveTransactionCurrency(transaction), globalCurrency);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const filterBy = (month: number, year: number) =>
      transactions.filter((transaction) => {
        const date = new Date(transaction.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });

    const currentMonthTransactions = filterBy(currentMonth, currentYear);
    const previousMonthTransactions = filterBy(previousMonth, previousYear);

    const sumByType = (list: FinanceTransaction[], type: FinanceTransaction['type']) =>
      list
        .filter((transaction) => transaction.type === type)
        .reduce((sum, transaction) => sum + convertTransaction(transaction), 0);

    const currentIncome = sumByType(currentMonthTransactions, 'income');
    const previousIncome = sumByType(previousMonthTransactions, 'income');
    const currentExpenses = sumByType(currentMonthTransactions, 'expense');
    const previousExpenses = sumByType(previousMonthTransactions, 'expense');
    const savingsCurrent = currentIncome - currentExpenses;
    const savingsPrevious = previousIncome - previousExpenses;

    const dayTotals = currentMonthTransactions.reduce<Record<string, number>>((acc, transaction) => {
      if (transaction.type !== 'expense') {
        return acc;
      }
      const date = new Date(transaction.date);
      const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      acc[key] = (acc[key] ?? 0) + convertTransaction(transaction);
      return acc;
    }, {});

    const peakEntry = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    const peak = {
      value: peakEntry ? peakEntry[1] : 0,
      extra: peakEntry ? new Date(peakEntry[0]).toLocaleDateString(locale) : '-',
    };

    const averageExpense = currentMonthTransactions.length
      ? currentExpenses / Math.max(Object.keys(dayTotals).length, 1)
      : 0;

    const categoryTotals = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce<Record<string, number>>((acc, transaction) => {
        const key = transaction.categoryId ?? 'Other';
        acc[key] = (acc[key] ?? 0) + convertTransaction(transaction);
        return acc;
      }, {});

    const totalOutcomeForShare = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount], index) => ({
        id: `${name}-${index}`,
        name,
        amount,
        share: totalOutcomeForShare ? `${Math.round((amount / totalOutcomeForShare) * 100)}%` : '0%',
      }));

    const overBudget = budgets.find(
      (budget) => budget.limitAmount > 0 && budget.spentAmount > budget.limitAmount,
    );
    const dueDebt = debts
      .filter((debt) => debt.status === 'active')
      .sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })[0];

    const insights = [
      topCategories[0]
        ? {
            id: 'top-category',
            title: `${topCategories[0].name} takes the lead`,
            detail: 'Try capping this category for the week.',
          }
        : null,
      overBudget
        ? {
            id: 'budget-alert',
            title: `${overBudget.name} exceeded limit`,
            detail: 'Adjust the limit or slow down spending.',
          }
        : null,
      dueDebt
        ? {
            id: 'debt-due',
            title: `Debt with ${dueDebt.counterpartyName} due soon`,
            detail: 'Send a reminder or plan repayment.',
          }
        : null,
    ].filter(Boolean) as { id: string; title: string; detail: string }[];

    const comparisonRows = [
      {
        id: 'inc' as const,
        previous: previousIncome,
        current: currentIncome,
        direction: currentIncome >= previousIncome ? 'up' : 'down',
      },
      {
        id: 'out' as const,
        previous: previousExpenses,
        current: currentExpenses,
        direction: currentExpenses <= previousExpenses ? 'up' : 'down',
      },
      {
        id: 'sav' as const,
        previous: savingsPrevious,
        current: savingsCurrent,
        direction: savingsCurrent >= savingsPrevious ? 'up' : 'down',
      },
    ].map((row) => ({
      ...row,
      delta: percentageDeltaOrNull(row.current, row.previous),
    }));

    return {
      peak,
      average: averageExpense,
      trend: percentageDelta(currentExpenses, previousExpenses),
      comparison: {
        period: {
          from: formatMonthLabel(locale, previousMonth, previousYear),
          to: formatMonthLabel(locale, currentMonth, currentYear),
        },
        rows: comparisonRows,
      },
      topCategories,
      insights,
    };
  }, [accounts, budgets, convertAmount, debts, globalCurrency, locale, transactions]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.colors.textSecondary }]}>
          {analyticsStrings.header}
        </Text>

        <View style={[
          styles.monthPill,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
        ]}>
          <Text style={[styles.monthText, { color: theme.colors.textSecondary }]}>
            {analyticsData.comparison.period.to}
          </Text>
          <ChevronDown size={14} color={theme.colors.textSecondary} />
          <CalendarRange size={16} color={theme.colors.textSecondary} />
        </View>
      </View>

      {/* Expense dynamics */}
      <AdaptiveGlassView style={[styles.glassSurface, styles.glassCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {analyticsStrings.expenseDynamics}
        </Text>

        <View style={styles.statsRow}>
          {/* Peak */}
          <View style={styles.statsCol}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              {analyticsStrings.stats.peak}:
            </Text>
            <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
              {formatAmount(analyticsData.peak.value)}
            </Text>
            <Text style={[styles.metaSub, { color: theme.colors.textMuted }]}>{analyticsData.peak.extra}</Text>
          </View>

          {/* Average */}
          <View style={styles.statsCol}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              {analyticsStrings.stats.average}:
            </Text>
            <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
              {formatAmount(analyticsData.average)}
            </Text>
            <Text style={[styles.metaSub, { color: theme.colors.textMuted }]}>per day</Text>
          </View>

          {/* Trend */}
          <View style={styles.statsCol}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              {analyticsStrings.stats.trend}:
            </Text>
            <View style={styles.trendChip}>
              {analyticsData.trend >= 0 ? (
                <TrendingUp size={14} color={theme.colors.success} />
              ) : (
                <TrendingDown size={14} color={theme.colors.danger} />
              )}
              <Text
                style={[
                  styles.trendText,
                  { color: analyticsData.trend >= 0 ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {analyticsData.trend >= 0 ? '+' : ''}
                {analyticsData.trend}%
              </Text>
            </View>
          </View>
        </View>
      </AdaptiveGlassView>

      {/* Comparison with the previous month */}
      <AdaptiveGlassView style={[styles.glassSurface, styles.glassCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {analyticsStrings.comparison}
        </Text>

        <View style={styles.periodRow}>
          <Text style={[styles.periodText, { color: theme.colors.textSecondary }]}>{analyticsData.comparison.period.from}</Text>
          <ArrowRight size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.periodText, { color: theme.colors.textSecondary }]}>{analyticsData.comparison.period.to}</Text>
        </View>

        <View>
          {analyticsData.comparison.rows.map((row) => {
            const label =
              row.id === 'inc'
                ? analyticsStrings.comparisonRows.income
                : row.id === 'out'
                  ? analyticsStrings.comparisonRows.outcome
                  : analyticsStrings.comparisonRows.savings;
            const formattedFrom = row.previous > 0 ? formatAmount(row.previous) : '—';
            const formattedTo = row.current > 0 ? formatAmount(row.current) : '—';
            const hasDelta = row.delta !== null;
            const isUp = row.direction === 'up';
            const successBg = theme.mode === 'dark' ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)';
            const dangerBg = theme.mode === 'dark' ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.12)';
            const pillBackground = hasDelta ? (isUp ? successBg : dangerBg) : theme.colors.card;
            const pillTextColor = hasDelta
              ? isUp
                ? theme.colors.success
                : theme.colors.danger
              : theme.colors.textSecondary;
            const deltaLabel =
              row.delta === null ? '—' : `${row.delta >= 0 ? '+' : ''}${row.delta}%`;

            return (
              <View key={row.id} style={styles.compRow}>
                <Text style={[styles.compLabel, { color: theme.colors.textSecondary }]}>{label}</Text>

                <View style={styles.compMid}>
                  <Text style={[styles.compValue, { color: theme.colors.textPrimary }]}>{formattedFrom}</Text>
                  <ArrowRight size={14} color={theme.colors.textMuted} />
                  <Text style={[styles.compValue, { color: theme.colors.textPrimary }]}>{formattedTo}</Text>
                </View>

                <View
                  style={[
                    styles.deltaPill,
                    {
                      backgroundColor: pillBackground,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {hasDelta ? (
                    <>
                      {isUp ? (
                        <TrendingUp size={12} color={pillTextColor} />
                      ) : (
                        <TrendingDown size={12} color={pillTextColor} />
                      )}
                      <Text style={[styles.deltaText, { color: pillTextColor }]}>{deltaLabel}</Text>
                    </>
                  ) : (
                    <Text style={[styles.deltaText, { color: pillTextColor }]}>{deltaLabel}</Text>
                  )}
                </View>
              </View>
            );
          })}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        </View>
      </AdaptiveGlassView>

      {/* Top 5 categories of expenses */}
      <AdaptiveGlassView style={[styles.glassSurface, styles.glassCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {analyticsStrings.topExpenses}
        </Text>

        <View style={styles.categoryList}>
          {analyticsData.topCategories.map((item, index) => (
            <View key={item.id} style={styles.categoryRow}>
              <View style={styles.categoryLeft}>
                <Text style={[styles.categoryIndex, { color: theme.colors.textSecondary }]}>
                  {index + 1}.
                </Text>
                <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>
                  {item.name}
                </Text>
              </View>

              <Text style={[styles.categoryRight, { color: theme.colors.textSecondary }]}>
                {formatAmount(item.amount)}{' '}
                <Text style={{ color: theme.colors.textMuted }}>({item.share})</Text>
              </Text>
            </View>
          ))}
        </View>
      </AdaptiveGlassView>

      {/* AI Insights */}
      <Text style={[styles.sectionHeaderStandalone, { color: theme.colors.textSecondary }]}>
        {analyticsStrings.aiInsights}
      </Text>

      {analyticsData.insights.map((insight) => (
        <AdaptiveGlassView
          key={insight.id}
          style={[
            styles.glassSurface,
            styles.insightCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.bulbCircle, { backgroundColor: theme.colors.icon }]}>
            <Lightbulb size={18} color={theme.colors.iconText} />
          </View>

          <View style={styles.insightCopy}>
            <Text style={[styles.insightTitle, { color: theme.colors.textPrimary }]}>
              {insight.title}
            </Text>
            <Text style={[styles.insightDetail, { color: theme.colors.textSecondary }]}>
              {insight.detail}
            </Text>
          </View>
        </AdaptiveGlassView>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// -------------------------
// Styles
// -------------------------
const styles = StyleSheet.create({
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 14,
  },

  // Header
  headerRow: {
    paddingTop: 16,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Generic glass section
  glassCard: {
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.8,
  },

  // Expense dynamics
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsCol: {
    flex: 1,
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    opacity: 0.9,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Comparison
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  compLabel: {
    width: 82,
    fontSize: 14,
    fontWeight: '500',
  },
  compMid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginTop: 8,
  },

  // Categories
  categoryList: { gap: 4 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryIndex: {
    width: 18,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryRight: {
    fontSize: 13,
    fontWeight: '500',
  },

  // AI insights
  sectionHeaderStandalone: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 6,
    opacity: 0.8,
  },
  insightCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulbCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCopy: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightDetail: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
});
