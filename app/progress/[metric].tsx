import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Info } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { getSnapshotForDate } from '@/data/homeDashboardData';
import UniversalWidget from '@/components/widget/UniversalWidget';
import type { WidgetType } from '@/config/widgetConfig';
import { PROGRESS_METRIC_COPY, type ProgressMetricKey } from '@/features/progress/progressContent';
import { getProgressBucket, getProgressColor } from '@/features/progress/colorUtils';

const CTA_ROUTES: Record<ProgressMetricKey, string> = {
  tasks: '/(tabs)/planner',
  budget: '/(tabs)/finance',
  focus: '/focus-mode',
};

const DETAIL_DESCRIPTORS: Record<
ProgressMetricKey,
{
  helpers: [string, string, string];
  high: [string, string, string];
  mid: [string, string, string];
  low: [string, string, string];
}
> = {
  tasks: {
    helpers: ['Vs. last 7 days', 'Streak health', 'Focus availability'],
    high: [
      'You are clearing the plan faster than usual.',
      'Momentum streak is intact. Keep logging wins.',
      'Energy looks strong enough for another deep block.',
    ],
    mid: [
      'Tracking close to the average pace.',
      'A few items rolled over. Rebalance priorities.',
      'Schedule a short reset block before adding more.',
    ],
    low: [
      'Behind on key deliverables for the day.',
      'Momentum streak broke. Protect time for essentials.',
      'Energy reserves are thin. Reduce the task load.',
    ],
  },
  budget: {
    helpers: ['Month-to-date', 'Essential coverage', 'Cash buffer'],
    high: [
      'Spending is below the projected burn.',
      'Needs are funded, and room remains for nice-to-haves.',
      'Runway is expanding this week.',
    ],
    mid: [
      'Budget is roughly on pace with the plan.',
      'Core bills are covered, but optional spend is tight.',
      'Runway is stable if no large surprises drop in.',
    ],
    low: [
      'Several envelopes are exceeding their limit.',
      'Pause non-essential purchases to recover buffer.',
      'Runway is shrinking. Review recurring expenses.',
    ],
  },
  focus: {
    helpers: ['Deep work ratio', 'Context switching', 'Recovery signal'],
    high: [
      'A healthy share of the day is deep work.',
      'Interruptions are minimal. Keep that boundary.',
      'Recovery markers look great for another push.',
    ],
    mid: [
      'Plenty of output, but interruptions spiked.',
      'Shorter sessions are fragmenting the work.',
      'Plan a reset walk or hydration break.',
    ],
    low: [
      'Deep work time is falling behind plan.',
      'Context switching is draining readiness.',
      'A larger recharge block is needed before the next sprint.',
    ],
  },
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function getMetricKey(raw?: string): ProgressMetricKey {
  if (raw === 'budget' || raw === 'focus' || raw === 'tasks') {
    return raw;
  }
  return 'tasks';
}

export default function ProgressDetailScreen() {
  const params = useLocalSearchParams<{ metric?: string; date?: string }>();
  const router = useRouter();
  const theme = useAppTheme();

  const metricKey = getMetricKey(params.metric);
  const copy = PROGRESS_METRIC_COPY[metricKey];

  const selectedDate = useMemo(() => {
    if (!params.date) return new Date();
    const parsed = new Date(params.date);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [params.date]);

  const snapshot = getSnapshotForDate(selectedDate);
  const metricValue = snapshot?.progress?.[metricKey] ?? 0;
  const hasData = snapshot?.progress?.[metricKey] != null;
  const bucket = getProgressBucket(hasData ? metricValue : null);
  const accentColor = getProgressColor(theme, metricValue, hasData);
  const descriptorSet = DETAIL_DESCRIPTORS[metricKey][bucket];
  const helpers = DETAIL_DESCRIPTORS[metricKey].helpers;

  const breakdown = copy.detailLabels.map((label, index) => ({
    label,
    message: descriptorSet[index],
    helper: helpers[index],
  }));

  const widgetEntries = useMemo(() => {
    if (!snapshot) return [];
    return Object.entries(snapshot.widgets ?? {}) as [WidgetType, { hasData?: boolean; props?: Record<string, unknown> }][];
  }, [snapshot]);

  const dateLabel = useMemo(() => dateFormatter.format(selectedDate), [selectedDate]);

  const statusLabel = useMemo(() => {
    switch (bucket) {
      case 'high':
        return 'Thriving';
      case 'mid':
        return 'Holding steady';
      default:
        return 'Needs attention';
    }
  }, [bucket]);

  const handleOpenInfo = () => {
    router.push({
      pathname: '/progress/[metric]/info',
      params: { metric: metricKey, date: selectedDate.toISOString() },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleCta = () => {
    const target = CTA_ROUTES[metricKey];
    router.push(target as any);
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack} accessibilityRole="button">
          <ChevronLeft color={theme.colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{copy.title}</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleOpenInfo}
          accessibilityRole="button"
        >
          <Info color={theme.colors.textPrimary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: accentColor,
              borderWidth: StyleSheet.hairlineWidth,
            },
          ]}
        >
          <Text style={[styles.heroLabel, { color: theme.colors.textSecondary }]}>{dateLabel}</Text>
          <View style={styles.heroCircle}>
            <CircularProgress
              progress={metricValue}
              color={accentColor}
              trackColor={theme.mode === 'dark' ? theme.colors.surface : theme.colors.cardItem}
              size={180}
              strokeWidth={10}
            />
            <View style={styles.heroCenter}>
              <Text style={[styles.heroValue, { color: theme.colors.textPrimary }]}>
                {hasData ? `${Math.round(metricValue)}%` : '--%'}
              </Text>
              <Text style={[styles.heroStatus, { color: accentColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            {copy.subtitle}
          </Text>
        </View>

        <View style={[styles.bannerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.bannerTextBlock}>
            <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>
              {copy.banner.title}
            </Text>
            <Text style={[styles.bannerDescription, { color: theme.colors.textSecondary }]}>
              {copy.banner.description}
            </Text>
            <Text style={[styles.bannerHelper, { color: theme.colors.textMuted }]}>
              {copy.banner.helper}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.bannerButton,
              {
                backgroundColor: accentColor,
                opacity: hasData ? 1 : 0.5,
              },
            ]}
            onPress={handleCta}
            disabled={!hasData}
          >
            <Text style={styles.bannerButtonText}>{copy.banner.cta}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.detailCard, { backgroundColor: theme.colors.card }]}>
          {breakdown.map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <View>
                <Text style={[styles.detailLabel, { color: theme.colors.textPrimary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.detailHelper, { color: theme.colors.textSecondary }]}>
                  {item.helper}
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: accentColor }]}>
                {item.message}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.widgetsSection}>
          <Text style={[styles.widgetsTitle, { color: theme.colors.textPrimary }]}>
            Widgets for {dateLabel}
          </Text>
          {widgetEntries.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                No data available
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Log activity for this day to unlock detailed insights.
              </Text>
            </View>
          ) : (
            widgetEntries.map(([widgetId, payload]) => (
              <UniversalWidget
                key={widgetId}
                widgetId={widgetId}
                dataState={payload}
                isLoading={!hasData}
                dateLabel={dateLabel}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    iconButton: {
      height: 40,
      width: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 48,
    },
    heroCard: {
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      marginBottom: 16,
    },
    heroLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
    },
    heroCircle: {
      marginVertical: 16,
    },
    heroCenter: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroValue: {
      fontSize: 36,
      fontWeight: '700',
    },
    heroStatus: {
      fontSize: 14,
      marginTop: 4,
    },
    heroSubtitle: {
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 20,
    },
    bannerCard: {
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
    },
    bannerTextBlock: {
      marginBottom: 12,
    },
    bannerTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    bannerDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 6,
    },
    bannerHelper: {
      fontSize: 12,
    },
    bannerButton: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    bannerButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 13,
      letterSpacing: 0.2,
    },
    detailCard: {
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      gap: 16,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2,
    },
    detailHelper: {
      fontSize: 12,
    },
    detailValue: {
      fontSize: 13,
      textAlign: 'right',
      flex: 1,
    },
    widgetsSection: {
      marginTop: 8,
    },
    widgetsTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },
    emptyState: {
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
