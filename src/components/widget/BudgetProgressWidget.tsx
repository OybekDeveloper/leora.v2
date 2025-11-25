import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

interface BudgetItem {
  label: string;
  used: number;
  total: number;
}

interface BudgetProgressWidgetProps {
  budgets?: BudgetItem[];
  hasData?: boolean;
  dateLabel?: string;
}

const DEFAULT_KEYS = [
  { key: 'housing', used: 820, total: 1000 },
  { key: 'groceries', used: 310, total: 400 },
  { key: 'entertainment', used: 140, total: 250 },
] as const;

const PLACEHOLDER_KEYS: ('empty' | 'add')[] = ['empty', 'add'];

export default function BudgetProgressWidget({
  budgets,
  hasData = true,
  dateLabel = '',
}: BudgetProgressWidgetProps) {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();

  const list = useMemo(() => {
    if (hasData) {
      if (budgets) {
        return budgets;
      }
      return DEFAULT_KEYS.map((item) => ({
        label: strings.widgets.budgetProgress.defaults[item.key],
        used: item.used,
        total: item.total,
      }));
    }
    return PLACEHOLDER_KEYS.map((key) => ({
      label: strings.widgets.budgetProgress.placeholders[key],
      used: 0,
      total: 0,
    }));
  }, [budgets, hasData, strings]);

  const resolvedDateLabel = dateLabel || (hasData
    ? new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date())
    : '—');

  return (
    <View style={styles.container}>
      <AdaptiveGlassView
        style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {strings.widgets.budgetProgress.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {resolvedDateLabel}
          </Text>
        </View>
        <View style={styles.list}>
          {list.map((item) => {
            const progress = item.total > 0 ? item.used / item.total : 0;
            return (
              <View key={item.label} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.rowValue, { color: hasData ? theme.colors.textPrimary : theme.colors.textMuted }]}>
                    {hasData ? `$${item.used} / $${item.total}` : '--'}
                  </Text>
                </View>
                <View style={[styles.progressBackground, { backgroundColor: theme.colors.background }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: hasData ? `${Math.min(progress * 100, 100)}%` : '6%',
                        backgroundColor: hasData ? theme.colors.textSecondary : `${theme.colors.textSecondary}30`,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
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
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  list: {
    gap: 14,
  },
  row: {
    gap: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBackground: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
});
