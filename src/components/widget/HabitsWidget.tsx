import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BookOpen, Brain, CheckCircle2, Dot, Dumbbell, Flame } from 'lucide-react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const MOCK_HABITS: Habit[] = [
  { id: '1', name: 'Morning Workout', streak: 12, completed: false, icon: Dumbbell },
  { id: '2', name: 'Meditation', streak: 21, completed: true, icon: Brain },
  { id: '3', name: 'Read 30 min', streak: 8, completed: false, icon: BookOpen },
];

interface HabitsWidgetProps {
  habits?: Habit[];
  hasData?: boolean;
  dateLabel?: string;
}

const PLACEHOLDER_ICONS = [Dumbbell, Brain];

export default function HabitsWidget({
  habits: incomingHabits = MOCK_HABITS,
  hasData = true,
  dateLabel = '',
}: HabitsWidgetProps) {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const [habits, setHabits] = useState<Habit[]>(incomingHabits);

  useEffect(() => {
    if (hasData) {
      setHabits(incomingHabits);
    } else {
      setHabits([]);
    }
  }, [hasData, incomingHabits]);

  const toggleHabit = (id: string) => {
    if (!hasData) {
      return;
    }
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
  };

  const placeholderHabits = useMemo(
    () =>
      strings.widgets.habits.placeholders.map((name, index) => ({
        id: `placeholder-${index}`,
        name,
        streak: 0,
        completed: false,
        icon: PLACEHOLDER_ICONS[index] ?? Dumbbell,
      })),
    [strings],
  );
  const displayedHabits = hasData ? habits : placeholderHabits;
  const resolvedDateLabel = dateLabel || strings.home.header.todayLabel;

  return (
    <View style={styles.container}>
      <AdaptiveGlassView style={[styles.widget,{backgroundColor: theme.colors.card}]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
              {strings.widgets.habits.title}
            </Text>
            <Dot color={theme.colors.textSecondary} />
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{resolvedDateLabel}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.menu, { color: theme.colors.textSecondary }]}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.habitsContainer}>
          {displayedHabits.map((habit) => {
            const Icon = habit.icon;
            const isPlaceholder = !hasData;
            return (
              <TouchableOpacity
                key={habit.id}
                style={[styles.habitItem, { borderBottomColor: theme.colors.border }]}
                onPress={hasData ? () => toggleHabit(habit.id) : undefined}
                activeOpacity={hasData ? 0.7 : 1}
              >
                <View style={[styles.habitIconBadge, { backgroundColor: theme.colors.cardItem }]}>
                  <Icon size={18} color={isPlaceholder ? theme.colors.textMuted : theme.colors.textPrimary} />
                </View>
                <View style={styles.habitContent}>
                  <Text style={[
                    styles.habitName,
                    { color: isPlaceholder ? theme.colors.textMuted : theme.colors.textPrimary },
                    habit.completed && hasData && { textDecorationLine: 'line-through', color: theme.colors.textMuted }
                  ]}>
                    {habit.name}
                  </Text>
                  <View style={styles.habitMeta}>
                    <Flame size={14} color={theme.colors.warning} />
                    <Text style={[
                      styles.habitStreak,
                      { color: isPlaceholder ? theme.colors.textMuted : theme.colors.textSecondary },
                    ]}
                    >
                      {hasData
                        ? `${habit.streak} ${strings.widgets.habits.streakLabel}`
                        : strings.widgets.habits.noStreak}
                    </Text>
                  </View>
                </View>
                <CheckCircle2
                  size={20}
                  color={habit.completed && hasData ? theme.colors.textPrimary : theme.colors.textSecondary}
                  fill={habit.completed && hasData ? "transparent" : 'transparent'}
                />
              </TouchableOpacity>
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
  habitsContainer: {
    gap: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  habitIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitContent: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '400',
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  habitStreak: {
    fontSize: 12,
  },
});
