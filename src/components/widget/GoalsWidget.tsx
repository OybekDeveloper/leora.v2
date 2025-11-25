import type { Goal } from '@/types/home';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type DimensionValue } from 'react-native';
import { Dot } from 'lucide-react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

interface GoalsWidgetProps {
  goals?: Goal[];
  onMenuPress?: () => void;
  hasData?: boolean;
  dateLabel?: string;
}

interface GoalItemProps {
  goal: Goal;
  hasData: boolean;
  placeholderText: string;
}

const MOCK_GOALS: Goal[] = [
  {
    id: '1',
    title: 'Buy a car',
    progress: 82,
    current: 4100000,
    target: 5000000,
    unit: 'UZS',
    category: 'financial',
  },
  {
    id: '2',
    title: 'Read 24 books',
    progress: 45,
    current: 11,
    target: 24,
    unit: 'books',
    category: 'personal',
  },
  {
    id: '3',
    title: 'Learn Spanish',
    progress: 30,
    current: 30,
    target: 100,
    unit: '%',
    category: 'personal',
  },
];

const GoalItem = ({ goal, hasData, placeholderText }: GoalItemProps) => {
  const theme = useAppTheme();
  const width: DimensionValue = hasData ? `${goal.progress}%` : '6%';
  const barColor = hasData ? theme.colors.textSecondary : `${theme.colors.textSecondary}26`;
  const titleColor = hasData ? theme.colors.textPrimary : theme.colors.textMuted;
  const metaColor = hasData ? theme.colors.textSecondary : theme.colors.textMuted;

  return (
    <View style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <Text style={[styles.goalTitle, { color: titleColor }]}>{goal.title}</Text>
        <Text style={[styles.goalProgress, { color: metaColor }]}>{hasData ? `${goal.progress}%` : '--'}</Text>
      </View>

      <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.progressBar, { width, backgroundColor: barColor }]} />
      </View>

  <Text style={[styles.goalTarget, { color: theme.colors.textMuted }]}>
    {hasData
      ? `${goal.current.toLocaleString()} / ${goal.target.toLocaleString()} ${goal.unit}`
      : placeholderText}
  </Text>
</View>
  );
};

const PLACEHOLDER_KEYS = ['first', 'second'] as const;

export default function GoalsWidget({
  goals = MOCK_GOALS,
  onMenuPress,
  hasData = true,
  dateLabel = '',
}: GoalsWidgetProps) {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const placeholderGoals = useMemo(
    () =>
      PLACEHOLDER_KEYS.map((key, index) => ({
        id: `placeholder-goal-${index}`,
        title: strings.widgets.goals.placeholders[index],
        progress: 0,
        current: 0,
        target: 0,
        unit: '',
        category: 'personal' as Goal['category'],
      })),
    [strings],
  );
  const displayedGoals = hasData ? goals : placeholderGoals;
  const resolvedLabel = dateLabel || (hasData
    ? new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date())
    : '—');

  return (
    <View style={styles.container}>
      <AdaptiveGlassView style={[styles.widget, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
              {strings.widgets.goals.title}
            </Text>
            <Dot color={theme.colors.textSecondary} />
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{resolvedLabel}</Text>
          </View>
          <TouchableOpacity onPress={onMenuPress} activeOpacity={0.7}>
            <Text style={[styles.menu, { color: theme.colors.textSecondary }]}>⋯</Text>
          </TouchableOpacity>
        </View> 

        {displayedGoals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            hasData={hasData}
            placeholderText={strings.widgets.goals.placeholderText}
          />
        ))}
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
  titleContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  menu: {
    fontSize: 20,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '400',
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  goalTarget: {
    fontSize: 12,
  },
});
