import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

interface SpendingCategory {
  label: string;
  amount: number;
}

interface SpendingSummaryWidgetProps {
  categories?: SpendingCategory[];
  total?: number;
  hasData?: boolean;
  dateLabel?: string;
}

const DEFAULT_CATEGORIES = [
  { key: 'food', amount: 245 },
  { key: 'transport', amount: 120 },
  { key: 'shopping', amount: 98 },
] as const;

export default function SpendingSummaryWidget({
  categories,
  total,
  hasData = true,
  dateLabel = '',
}: SpendingSummaryWidgetProps) {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const list = useMemo(() => {
    if (hasData) {
      if (categories) {
        return categories;
      }
      return DEFAULT_CATEGORIES.map((item) => ({
        label: strings.widgets.spendingSummary.categories[item.key],
        amount: item.amount,
      }));
    }
    return strings.widgets.spendingSummary.placeholders.map((label, index) => ({
      label,
      amount: 0,
    }));
  }, [categories, hasData, strings]);
  const totalSpent = hasData
    ? total ?? list.reduce((sum, item) => sum + item.amount, 0)
    : 0;
  const resolvedDateLabel = dateLabel || (hasData
    ? new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date())
    : '—');

  return (
    <View style={styles.container}>
      <AdaptiveGlassView style={[styles.card, { backgroundColor:   theme.colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {strings.widgets.spendingSummary.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {resolvedDateLabel}
          </Text>
        </View>

        <View style={styles.body}>
          {list.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.rowValue, { color: hasData ? theme.colors.textSecondary : theme.colors.textMuted }]}>
                {hasData ? `-$${item.amount}` : '--'}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>
            {strings.widgets.spendingSummary.total}
          </Text>
          <Text style={[styles.footerValue, { color: hasData ? theme.colors.textPrimary : theme.colors.textMuted }]}>
            {hasData ? `-$${totalSpent}` : '--'}
          </Text>
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
  body: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 13,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
