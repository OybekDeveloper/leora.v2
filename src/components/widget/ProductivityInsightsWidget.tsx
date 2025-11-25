import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

type ProductivityMetric = {
  label: string;
  value: string;
  suffix?: string;
};

type ProductivityTrendPoint = {
  label: string;
  value: number;
};

interface ProductivityInsightsWidgetProps {
  metrics?: ProductivityMetric[];
  trend?: ProductivityTrendPoint[];
  trendDelta?: number;
  hasData?: boolean;
  dateLabel?: string;
}

const DEFAULT_METRICS = [
  { key: 'focusScore', value: '82', suffix: '/100' },
  { key: 'tasksCompleted', value: '14', suffix: '/18' },
  { key: 'deepWork', value: '6.5', suffix: 'h' },
] as const;

const MOCK_TREND: ProductivityTrendPoint[] = [
  { label: 'Mon', value: 68 },
  { label: 'Tue', value: 74 },
  { label: 'Wed', value: 80 },
  { label: 'Thu', value: 85 },
  { label: 'Fri', value: 89 },
];

const PLACEHOLDER_METRICS = DEFAULT_METRICS.map((item) => ({ key: item.key, value: '--' }));

const TREND_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;

export default function ProductivityInsightsWidget({
  metrics,
  trend,
  trendDelta,
  hasData = true,
  dateLabel = '',
}: ProductivityInsightsWidgetProps) {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const metricList = hasData
    ? (metrics ?? DEFAULT_METRICS.map((item) => ({
        label: strings.widgets.productivityInsights.metrics[item.key],
        value: item.value,
        suffix: item.suffix,
      })))
    : PLACEHOLDER_METRICS.map((item) => ({
        label: strings.widgets.productivityInsights.metrics[item.key],
        value: '--',
      }));
  const trendPoints = useMemo(() => {
    if (hasData) {
      if (trend) {
        return trend;
      }
      return MOCK_TREND.map((point, index) => ({
        ...point,
        label: strings.widgets.productivityInsights.days[TREND_DAY_KEYS[index]],
      }));
    }
    return TREND_DAY_KEYS.map((key) => ({
      label: strings.widgets.productivityInsights.days[key],
      value: 0,
    }));
  }, [hasData, strings.widgets.productivityInsights.days, trend]);
  const delta = hasData ? trendDelta : undefined;
  const hintColor = hasData
    ? (delta ?? 0) >= 0 ? theme.colors.textSecondary : theme.colors.danger
    : theme.colors.textMuted;
  const hintLabel = hasData
    ? `${delta && delta >= 0 ? '+' : ''}${delta ?? 0} ${strings.widgets.productivityInsights.vsLastWeek}`
    : strings.widgets.productivityInsights.noTrend;
  const resolvedDateLabel = dateLabel || (hasData
    ? new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date())
    : '—');

  return (
    <View style={styles.container}>
      <AdaptiveGlassView style={[styles.card, { backgroundColor:  theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {strings.widgets.productivityInsights.title}
        </Text>
        <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
          {resolvedDateLabel}
        </Text>

        <View style={styles.metricsRow}>
          {metricList.map((metric) => (
            <View key={metric.label} style={[styles.metric, {
              backgroundColor: theme.colors.cardItem,
              borderColor: theme.colors.border
            }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{metric.label}</Text>
              <Text style={[styles.metricValue, { color: hasData ? theme.colors.textPrimary : theme.colors.textMuted }]}>
                {metric.value}
                {metric.suffix && hasData && (
                  <Text style={[styles.metricSuffix, { color: theme.colors.textSecondary }]}>
                    {metric.suffix}
                  </Text>
                )}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.trendHeader}>
          <Text style={[styles.trendTitle, { color: theme.colors.textPrimary }]}>
            {strings.widgets.productivityInsights.trendTitle}
          </Text>
          <Text style={[styles.trendHint, { color: hintColor }]}>{hintLabel}</Text>
        </View>

        <View style={styles.trendBars}>
          {trendPoints.map((point) => (
            <View key={point.label} style={styles.trendItem}>
              <View style={[styles.trendBarContainer, {
                backgroundColor: "transparent",
                borderColor: theme.colors.textSecondary
              }]}>
                <View style={[styles.trendBar, {
                  height: `${Math.max(6, Math.min(point.value, 100))}%`,
                  backgroundColor: hasData ? theme.colors.textSecondary : `${theme.colors.textSecondary}30`
                }]} />
              </View>
              <Text style={[styles.trendLabel, { color: theme.colors.textSecondary }]}>{point.label}</Text>
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
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metric: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricSuffix: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendHint: {
    fontSize: 12,
  },
  trendBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarContainer: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
  },
  trendBar: {
    width: '100%',
    borderRadius: 8,
  },
  trendLabel: {
    marginTop: 6,
    fontSize: 12,
  },
});
