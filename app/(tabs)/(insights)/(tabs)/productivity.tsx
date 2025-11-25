import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Briefcase, Clock, HeartPulse, Layers, Sun } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import type { Theme } from '@/constants/theme';
import { useAppTheme } from '@/constants/theme';
import {
  ContextKey,
  FocusMetricKey,
  ProductivityPeakKey,
  TaskTypeKey,
  TimeDistributionKey,
} from '@/localization/insightsContent';
import { useInsightsContent } from '@/localization/useInsightsContent';

type TimeDistribution = {
  key: TimeDistributionKey;
  label: string;
  hours: number;
  percent: number;
  progress: number;
};

type ProductivityPeak = {
  key: ProductivityPeakKey;
  label: string;
  range: string;
  efficiency: number;
  note: string;
};

type FocusMetric = {
  key: FocusMetricKey;
  label: string;
  value: string;
};

type TaskStat = {
  key: TaskTypeKey;
  label: string;
  completed: number;
  duration: string;
};

type ContextStat = {
  key: ContextKey;
  context: string;
  completion: number;
};

const TIME_DISTRIBUTION_BASE: {
  key: TimeDistributionKey;
  hours: number;
  percent: number;
  progress: number;
}[] = [
  { key: 'work', hours: 25, percent: 27, progress: 0.75 },
  { key: 'sleep', hours: 49, percent: 29, progress: 0.9 },
  { key: 'personal', hours: 35, percent: 21, progress: 0.68 },
  { key: 'transport', hours: 10, percent: 6, progress: 0.32 },
  { key: 'house', hours: 12, percent: 7, progress: 0.38 },
  { key: 'dev', hours: 8, percent: 5, progress: 0.28 },
  { key: 'rest', hours: 9, percent: 5, progress: 0.3 },
];

const PRODUCTIVITY_PEAKS_BASE: {
  key: ProductivityPeakKey;
  range: string;
  efficiency: number;
}[] = [
  { key: 'peak1', range: '10:00-12:00', efficiency: 85 },
  { key: 'peak2', range: '15:00-17:00', efficiency: 72 },
  { key: 'low', range: '13:00-14:00', efficiency: 58 },
];

const FOCUS_METRIC_KEYS: FocusMetricKey[] = ['avg', 'best', 'worst', 'interrupt'];

const TASK_STATS_BASE: { key: TaskTypeKey; completed: number; duration: string }[] = [
  { key: 'creative', completed: 65, duration: '2.5h' },
  { key: 'routine', completed: 95, duration: '15m' },
  { key: 'communication', completed: 88, duration: '30m' },
  { key: 'planning', completed: 55, duration: '1h' },
];

const CONTEXT_STATS_BASE: { key: ContextKey; completion: number }[] = [
  { key: 'work', completion: 92 },
  { key: 'home', completion: 78 },
  { key: 'outside', completion: 54 },
];

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl + 32,
      gap: theme.spacing.xxl,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: 8,
    },
    timeLabel: {
      width: 90,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    progressTrack: {
      flex: 1,
      height: 14,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.08)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(226,232,240,0.4)'
          : 'rgba(71,85,105,0.3)',
    },
    timeMeta: {
      width: 90,
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    timePercent: {
      width: 52,
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    peaksCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor:theme.colors.card,
    },
    peakRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    peakLabel: {
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    peakNote: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    efficiency: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      width: 110,
      textAlign: 'right',
    },
    focusCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor:theme.colors.card,
    },
    focusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    focusLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    focusValue: {
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    statsCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      backgroundColor:theme.colors.card,
    },
    statsHeader: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    statLabel: {
      width: 110,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    statValue: {
      fontSize: 12,
      color: theme.colors.textPrimary,
      width: 80,
      textAlign: 'right',
    },
    contextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: 6,
    },
    contextLabel: {
      width: 70,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    recommendationList: {
      gap: 6,
    },
    recommendationText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    footerButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.08)',
    },
    footerText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
  });

const ProductivityTab: React.FC = () => {
  const theme = useAppTheme();
  const { productivity } = useInsightsContent();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const timeDistribution = useMemo<TimeDistribution[]>(
    () =>
      TIME_DISTRIBUTION_BASE.map((item) => ({
        ...item,
        label: productivity.timeDistribution[item.key],
      })),
    [productivity.timeDistribution],
  );

  const peaks = useMemo<ProductivityPeak[]>(
    () =>
      PRODUCTIVITY_PEAKS_BASE.map((item) => ({
        key: item.key,
        label: productivity.peaks[item.key].label,
        note: productivity.peaks[item.key].note,
        range: item.range,
        efficiency: item.efficiency,
      })),
    [productivity.peaks],
  );

  const focusMetrics = useMemo<FocusMetric[]>(
    () =>
      FOCUS_METRIC_KEYS.map((key) => ({
        key,
        label: productivity.focusMetrics[key],
        value: productivity.focusMetricValues[key],
      })),
    [productivity.focusMetrics, productivity.focusMetricValues],
  );

  const taskStats = useMemo<TaskStat[]>(
    () =>
      TASK_STATS_BASE.map((item) => ({
        key: item.key,
        label: productivity.taskTypes[item.key],
        completed: item.completed,
        duration: item.duration,
      })),
    [productivity.taskTypes],
  );

  const contextStats = useMemo<ContextStat[]>(
    () =>
      CONTEXT_STATS_BASE.map((item) => ({
        key: item.key,
        context: productivity.contexts[item.key],
        completion: item.completion,
      })),
    [productivity.contexts],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{productivity.sections.analyst}</Text>
        <View style={styles.divider} />

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
            <Layers size={16} color={theme.colors.textSecondary} />
            <Text style={styles.subtitle}>{productivity.subtitles.distribution}</Text>
          </View>
          {timeDistribution.map((item) => (
            <View key={item.key} style={styles.timeRow}>
              <Text style={styles.timeLabel}>{item.label}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
              </View>
              <Text style={styles.timeMeta}>{item.hours}h</Text>
              <Text style={styles.timePercent}>({item.percent}%)</Text>
            </View>
          ))}
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <Clock size={16} color={theme.colors.textSecondary} />
            <Text style={styles.subtitle}>{productivity.subtitles.peaks}</Text>
          </View>
          <View style={styles.peaksCard}>
            <Text style={styles.subtitle}>{productivity.subtitles.chart}</Text>
            {peaks.map((peak) => (
              <View key={peak.key} style={styles.peakRow}>
                <Text style={styles.peakLabel}>{peak.label}:</Text>
                <Text style={styles.peakNote}>{peak.range}</Text>
                <Text style={styles.efficiency}>{peak.efficiency}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <HeartPulse size={16} color={theme.colors.textSecondary} />
            <Text style={styles.subtitle}>{productivity.subtitles.focusMetrics}</Text>
          </View>
          <View style={styles.focusCard}>
            {focusMetrics.map((metric) => (
              <View key={metric.key} style={styles.focusRow}>
                <Text style={styles.focusLabel}>{metric.label}</Text>
                <Text style={styles.focusValue}>{metric.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <Sun size={16} color={theme.colors.textSecondary} />
            <Text style={styles.subtitle}>{productivity.subtitles.recommendation}</Text>
          </View>
          <View style={styles.recommendationList}>
            {productivity.recommendations.map((text, index) => (
              <Text key={`${text}-${index}`} style={styles.recommendationText}>
                • {text}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{productivity.sections.tasks}</Text>
        <View style={styles.divider} />

        <AdaptiveGlassView style={styles.statsCard}>
          <Text style={styles.statsHeader}>{productivity.subtitles.stats}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{productivity.stats.completed}</Text>
            <Text style={styles.statValue}>85% (102/120)</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{productivity.stats.onTime}</Text>
            <Text style={styles.statValue}>73%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{productivity.stats.postponed}</Text>
            <Text style={styles.statValue}>18</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{productivity.stats.deleted}</Text>
            <Text style={styles.statValue}>5</Text>
          </View>
        </AdaptiveGlassView>

        <View style={styles.statsCard}>
          <Text style={styles.statsHeader}>{productivity.stats.byType}</Text>
          {taskStats.map((task) => (
            <View key={task.key} style={{ gap: theme.spacing.xs }}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{task.label}:</Text>
                <Text style={styles.statValue}>{task.duration}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${task.completed}%` }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsHeader}>{productivity.stats.byContext}</Text>
          {contextStats.map((context) => (
            <View key={context.key} style={styles.contextRow}>
              <Text style={styles.contextLabel}>{context.context}:</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${context.completion}%` }]} />
              </View>
              <Text style={styles.timePercent}>{context.completion}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsHeader}>{productivity.stats.procrastination}</Text>
          {productivity.procrastination.map((text, index) => (
            <Text key={`${text}-${index}`} style={styles.recommendationText}>
              • {text}
            </Text>
          ))}
        </View>

        <View style={styles.footerButton}>
          <Briefcase size={14} color={theme.colors.textSecondary} />
          <Text style={styles.footerText}>{productivity.footerButton}</Text>
          <ArrowRight size={14} color={theme.colors.textSecondary} />
        </View>
      </View>
    </ScrollView>
  );
};

export default ProductivityTab;
