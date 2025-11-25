import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

type CashFlowDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

interface CashFlowDay {
  key?: CashFlowDayKey;
  label: string;
  income: number;
  expense: number;
}

interface CashFlowWidgetProps {
  days?: CashFlowDay[];
  hasData?: boolean;
  dateLabel?: string;
}

const DEFAULT_TIMELINE: { key: CashFlowDayKey; income: number; expense: number }[] = [
  { key: 'mon', income: 220, expense: 180 },
  { key: 'tue', income: 180, expense: 210 },
  { key: 'wed', income: 260, expense: 190 },
  { key: 'thu', income: 150, expense: 170 },
  { key: 'fri', income: 200, expense: 140 },
] as const;

const PLACEHOLDER_KEYS: CashFlowDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export default function CashFlowWidget({
  days,
  hasData = true,
  dateLabel = '',
}: CashFlowWidgetProps) {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();

  const timeline = useMemo(() => {
    if (hasData) {
      if (days) {
        return days;
      }
      return DEFAULT_TIMELINE.map((item) => ({
        label: strings.widgets.cashFlow.days[item.key],
        income: item.income,
        expense: item.expense,
      }));
    }
    return PLACEHOLDER_KEYS.map((key) => ({
      label: strings.widgets.cashFlow.days[key],
      income: 0,
      expense: 0,
    }));
  }, [days, hasData, strings]);
  const totalIncome = hasData ? timeline.reduce((sum, day) => sum + day.income, 0) : 0;
  const totalExpense = hasData ? timeline.reduce((sum, day) => sum + day.expense, 0) : 0;
  const net = totalIncome - totalExpense;
  const resolvedDateLabel = dateLabel || (hasData
    ? new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date())
    : '—');

  return (
    <View style={styles.container}>
      <AdaptiveGlassView style={[styles.card, {
        backgroundColor: theme.colors.card,
      }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {strings.widgets.cashFlow.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {resolvedDateLabel}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryItem, { backgroundColor: theme.colors.cardItem, borderColor: theme.colors.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            {strings.widgets.cashFlow.summary.income}
          </Text>
            <Text style={[
              styles.summaryValue,
              { color: hasData ? theme.colors.textPrimary : theme.colors.textMuted },
            ]}
            >
              {hasData ? `$${totalIncome}` : '--'}
            </Text>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: theme.colors.cardItem, borderColor: theme.colors.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              {strings.widgets.cashFlow.summary.expenses}
            </Text>
            <Text style={[
              styles.summaryValue,
              { color: hasData ? theme.colors.textSecondary : theme.colors.textMuted },
            ]}
            >
              {hasData ? `$${totalExpense}` : '--'}
            </Text>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: theme.colors.cardItem, borderColor: theme.colors.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              {strings.widgets.cashFlow.summary.net}
            </Text>
            <Text style={[
              styles.summaryValue,
              {
                color: hasData
                  ? net >= 0 ? theme.colors.textPrimary : theme.colors.textSecondary
                  : theme.colors.textMuted,
              },
            ]}
            >
              {hasData ? `$${net}` : '--'}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          {timeline.map((day) => (
            <View key={day.label} style={styles.tableRow}>
              <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>{day.label}</Text>
              <Text style={[styles.tableValue, { color: hasData ? theme.colors.textPrimary : theme.colors.textMuted }]}>
                {hasData ? `+$${day.income}` : '--'}
              </Text>
              <Text style={[styles.tableValue, { color: hasData ? theme.colors.textSecondary : theme.colors.textMuted }]}>
                {hasData ? `-$${day.expense}` : '--'}
              </Text>
            </View>
          ))}
        </View>
      </AdaptiveGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  table: {
    gap: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayLabel: {
    flex: 1,
    fontSize: 13,
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
