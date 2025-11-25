import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

interface WellnessMetric {
  label: string;
  value: number;
}

interface WellnessOverviewWidgetProps {
  metrics?: WellnessMetric[];
  statusMessage?: string;
  hasData?: boolean;
  dateLabel?: string;
}

const METRIC_KEYS = ['energy', 'mood', 'sleep'] as const;

export default function WellnessOverviewWidget({
  metrics,
  statusMessage,
  hasData = true,
  dateLabel = '',
}: WellnessOverviewWidgetProps) {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const metricList = useMemo(() => {
    if (hasData) {
      if (metrics) {
        return metrics;
      }
      return METRIC_KEYS.map((key, index) => ({
        label: strings.widgets.wellnessOverview.metrics[key],
        value: [76, 82, 71][index],
      }));
    }
    return METRIC_KEYS.map((key) => ({
      label: strings.widgets.wellnessOverview.metrics[key],
      value: 0,
    }));
  }, [hasData, metrics, strings]);
  const footerText = hasData
    ? statusMessage ?? strings.widgets.wellnessOverview.messages.balanced
    : strings.widgets.wellnessOverview.messages.logPrompt;
  const valueColor = hasData ? theme.colors.textSecondary : theme.colors.textMuted;
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
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {strings.widgets.wellnessOverview.title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {resolvedDateLabel}
        </Text>

        <View style={styles.scores}>
          {metricList.map((item) => (
            <View key={item.label} style={[styles.scoreCard, {
              backgroundColor: theme.colors.cardItem,
              borderColor: theme.colors.border
            }]}>
              <Text style={[styles.scoreValue, { color: valueColor }]}>
                {hasData ? item.value : '--'}
              </Text>
              <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.footer, {
          backgroundColor: theme.colors.cardItem,
          borderColor: theme.colors.border
        }]}>
          <View style={[styles.footerIndicator, {
            backgroundColor: hasData ? theme.colors.textSecondary : theme.colors.textMuted,
          }]} />
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>{footerText}</Text>
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
  subtitle: {
    fontSize: 13,
  },
  scores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  footerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 13,
    flex: 1,
  },
});
