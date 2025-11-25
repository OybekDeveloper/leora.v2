import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Dot, Flame } from 'lucide-react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

interface WeeklyStats {
  tasksCompleted: number;
  totalTasks: number;
  focusHours: number;
  streak: number;
}

const MOCK_STATS: WeeklyStats = {
  tasksCompleted: 34,
  totalTasks: 42,
  focusHours: 28.5,
  streak: 7,
};

interface WeeklyReviewWidgetProps {
  stats?: WeeklyStats;
  hasData?: boolean;
  dateLabel?: string;
}

const PLACEHOLDER_STATS: WeeklyStats = {
  tasksCompleted: 0,
  totalTasks: 0,
  focusHours: 0,
  streak: 0,
};

export default function WeeklyReviewWidget({
  stats,
  hasData = true,
  dateLabel = '',
}: WeeklyReviewWidgetProps) {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const data = hasData ? (stats ?? MOCK_STATS) : PLACEHOLDER_STATS;
  const completionRate = hasData
    ? Math.round((data.tasksCompleted / Math.max(data.totalTasks, 1)) * 100)
    : null;
  const summaryText = hasData
    ? strings.widgets.weeklyReview.summary.success
        .replace('{completed}', String(data.tasksCompleted))
        .replace('{total}', String(data.totalTasks))
    : strings.widgets.weeklyReview.summary.empty;
  const resolvedLabel = dateLabel || (hasData
    ? new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date())
    : '—');

  return (
    <View style={styles.container}>
      <AdaptiveGlassView style={[styles.widget, { backgroundColor:   theme.colors.card }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
                {strings.widgets.weeklyReview.title}
              </Text>
              <Dot color={theme.colors.textSecondary} />
              <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
                {resolvedLabel}
              </Text>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.menu, { color: theme.colors.textSecondary }]}>⋯</Text>
          </TouchableOpacity>
        </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.cardItem }]}>
              <Text style={[
                styles.statValue,
                { color: hasData ? theme.colors.textPrimary : theme.colors.textMuted },
              ]}
              >
                {completionRate != null ? `${completionRate}%` : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {strings.widgets.weeklyReview.stats.completion}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.cardItem }]}>
              <Text style={[
                styles.statValue,
                { color: hasData ? theme.colors.textPrimary : theme.colors.textMuted },
              ]}
              >
                {hasData ? `${data.focusHours}h` : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {strings.widgets.weeklyReview.stats.focusTime}
              </Text>
            </View>

            <View style={[styles.statCard, styles.fullWidth, { backgroundColor: theme.colors.cardItem }]}>
              <View style={styles.streakRow}>
                <Flame size={16} color={theme.colors.warning} />
                <Text style={[
                  styles.statValue,
                  { color: hasData ? theme.colors.textPrimary : theme.colors.textMuted },
                ]}
                >
                  {hasData ? `${data.streak} ${strings.widgets.weeklyReview.streakUnit}` : '--'}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {strings.widgets.weeklyReview.stats.currentStreak}
              </Text>
            </View>
          </View>

          <Text style={[styles.summary, { color: theme.colors.textSecondary }]}>
            {summaryText}
          </Text>
      </AdaptiveGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  widget: {
    borderRadius: 16,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  menu: {
    fontSize: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  fullWidth: {
    minWidth: '100%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  summary: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
