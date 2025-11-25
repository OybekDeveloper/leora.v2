// src/components/widget/FocusSessionsWidget.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Dot, Timer } from 'lucide-react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

interface FocusSession {
  id: string;
  task: string;
  duration: number;
  completed: boolean;
}

const MOCK_SESSIONS: FocusSession[] = [
  { id: '1', task: 'Deep Work', duration: 25, completed: true },
  { id: '2', task: 'Email Processing', duration: 25, completed: true },
  { id: '3', task: 'Project Planning', duration: 25, completed: false },
];

const PLACEHOLDER_KEYS: ('none' | 'free')[] = ['none', 'free'];

interface FocusSessionsWidgetProps {
  sessions?: FocusSession[];
  summary?: {
    completed: number;
    totalMinutes: number;
    nextSessionMinutes?: number | null;
  };
  hasData?: boolean;
  dateLabel?: string;
}

export default function FocusSessionsWidget({
  sessions,
  summary,
  hasData = true,
  dateLabel = '',
}: FocusSessionsWidgetProps) {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const placeholderSessions = PLACEHOLDER_KEYS.map((key, index) => ({
    id: `placeholder-${index}`,
    task: strings.widgets.focusSessions.placeholders[key],
    duration: 0,
    completed: false,
  }));
  const list = hasData ? (sessions ?? MOCK_SESSIONS) : placeholderSessions;
  const completedCount = hasData
    ? summary?.completed ?? list.filter((item) => item.completed).length
    : 0;
  const totalMinutes = hasData
    ? summary?.totalMinutes ?? list.reduce((minutes, item) => minutes + item.duration, 0)
    : 0;
  const nextSessionMinutes = hasData
    ? summary?.nextSessionMinutes ?? list.find((item) => !item.completed)?.duration ?? null
    : null;
  const primaryLabelColor = hasData ? theme.colors.textPrimary : theme.colors.textMuted;
  const secondaryLabelColor = hasData ? theme.colors.textSecondary : theme.colors.textMuted;

  const resolvedDateLabel = dateLabel || strings.home.header.todayLabel;

  return (
    <View style={styles.container}>
      <AdaptiveGlassView style={[styles.widget, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
              {strings.widgets.focusSessions.title}
            </Text>
            <Dot color={theme.colors.textSecondary} />
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{resolvedDateLabel}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.menu, { color: theme.colors.textSecondary }]}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: primaryLabelColor }]}>
              {hasData ? completedCount : '--'}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryLabelColor }]}>
              {strings.widgets.focusSessions.stats.completed}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: primaryLabelColor }]}>
              {hasData ? `${totalMinutes}m` : '--'}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryLabelColor }]}>
              {strings.widgets.focusSessions.stats.totalTime}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: primaryLabelColor }]}>
              {hasData
                ? nextSessionMinutes != null
                  ? `${nextSessionMinutes}m`
                  : '—'
                : '--'}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryLabelColor }]}>
              {strings.widgets.focusSessions.stats.nextSession}
            </Text>
          </View>
        </View>

        <View style={styles.sessionsContainer}>
          {list.map((session) => (
            <View
              key={session.id}
              style={[styles.sessionItem, { borderBottomColor: theme.colors.border }]}
            >
              <Timer size={20} color={session.completed ? theme.colors.textSecondary : theme.colors.textPrimary} />
              <Text style={[
                styles.sessionTask,
                {
                  color: hasData ? theme.colors.textPrimary : theme.colors.textMuted,
                },
                session.completed && hasData && { textDecorationLine: 'line-through', color: theme.colors.textMuted }
              ]}>
                {session.task}
              </Text>
              <Text style={[styles.sessionDuration, { color: secondaryLabelColor }]}>
                {hasData ? `${session.duration}m` : '--'}
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
    marginBottom: 12,
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sessionsContainer: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  sessionTask: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '500',
  },
});
