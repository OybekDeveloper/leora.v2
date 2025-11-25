// src/components/planner/goals/GoalCard.tsx
import React, { memo, useCallback, useMemo, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BookOpen,
  CalendarDays,
  Clock3,
  DollarSign,
  Heart,
  Info,
  MoreVertical,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { EdgeSwiper } from '@/components/ui/EdgeSwiper';
import GoalActionsDropdown from '@/components/planner/goals/GoalActionsDropdown';
import { useAppTheme } from '@/constants/theme';
import type { Goal } from '@/features/planner/goals/data';
import { useLocalization } from '@/localization/useLocalization';

type GoalCardProps = {
  goal: Goal;
  onPress: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onAddTask?: () => void;
  onRecover?: () => void;
  onDeleteForever?: () => void;
};

const GoalCardComponent: React.FC<GoalCardProps> = ({
  goal,
  onPress,
  onDelete,
  onEdit,
  onAddTask,
  onRecover,
  onDeleteForever,
}) => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const cardStrings = strings.plannerScreens.goals.cards.actions;
  const [menuOpen, setMenuOpen] = useState(false);

  const intercept = useCallback(
    (handler?: () => void) => (event: GestureResponderEvent) => {
      event.stopPropagation();
      handler?.();
    },
    [],
  );

  const progressPercent = useMemo(() => Math.round(goal.progress * 100), [goal.progress]);
  const renderIcon = useCallback(() => {
    const type = (goal as any).goalType ?? (goal as any).type ?? 'personal';
    switch (type) {
      case 'financial':
        return <DollarSign size={20} color={theme.colors.primary} />;
      case 'health':
        return <Heart size={20} color={theme.colors.primary} />;
      case 'education':
        return <BookOpen size={20} color={theme.colors.primary} />;
      case 'productivity':
        return <TrendingUp size={20} color={theme.colors.primary} />;
      case 'personal':
      default:
        return <Users size={20} color={theme.colors.primary} />;
    }
  }, [goal, theme.colors.primary]);

  const renderMenu = () => (
    <GoalActionsDropdown
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      actions={[
        { label: 'Open', onPress },
        onEdit ? { label: 'Edit Goal', onPress: onEdit } : null,
        onAddTask ? { label: 'Add Task', onPress: onAddTask } : null,
        goal.status === 'archived' && onRecover
          ? { label: 'Recover Goal', onPress: onRecover }
          : goal.status === 'archived' && onDeleteForever
            ? { label: 'Delete Permanently', onPress: onDeleteForever, destructive: true }
          : onDelete
            ? { label: 'Delete Goal', onPress: onDelete, destructive: true }
            : null,
      ].filter(Boolean) as any}
    />
  );

  return (
    <EdgeSwiper onSwipeOpen={() => setMenuOpen(true)} onSwipeClose={() => setMenuOpen(false)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && {
            transform: [{ scale: 0.995 }],
            opacity: 0.96,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={goal.title}
        accessibilityHint={cardStrings.openDetailsA11y}
      >
        <AdaptiveGlassView style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <View style={styles.iconHolder}>{renderIcon()}</View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                  {goal.title}
                </Text>
                <Text style={[styles.metaRow, { color: theme.colors.textSecondary }]}>
                  {(goal.goalType ?? 'goal').toUpperCase()}
                </Text>
              </View>
              <Pressable
                onPress={intercept(() => setMenuOpen((prev) => !prev))}
                style={styles.moreButton}
                hitSlop={8}
              >
                <MoreVertical size={16} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: progressPercent >= 80 ? theme.colors.success : theme.colors.secondary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>{progressPercent}%</Text>
            </View>

            <View style={styles.infoRow}>
              <Info size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                {goal.description || goal.currentAmount}
              </Text>
            </View>

            <View style={styles.datesRow}>
              <View style={styles.dateItem}>
                <CalendarDays size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                  Created {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : '—'}
                </Text>
              </View>
              <View style={styles.dateItem}>
                <Clock3 size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                  Due {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>
          </View>
          {renderMenu()}
        </AdaptiveGlassView>
      </Pressable>
    </EdgeSwiper>
  );
};

export const GoalCard = memo(GoalCardComponent);

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 0,
    overflow: 'hidden',
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  inner: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaRow: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconHolder: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  moreButton: {
    marginLeft: 8,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GoalCard;
