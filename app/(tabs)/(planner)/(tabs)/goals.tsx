import React, { useCallback, useMemo } from 'react';
import { LayoutAnimation, SectionList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import EmptyAnimation from '@/components/shared/EmptyAnimation';
import SelectableListItem from '@/components/shared/SelectableListItem';
import { GoalCard } from '@/components/planner/goals/GoalCard';
import { createThemedStyles } from '@/constants/theme';
import { createGoalSections, type Goal, type GoalSection } from '@/features/planner/goals/data';
import { useLocalization } from '@/localization/useLocalization';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import { useShallow } from 'zustand/react/shallow';
import { startOfDay } from '@/utils/calendar';

const GoalsPage: React.FC = () => {
  const styles = useStyles();
  const router = useRouter();
  const { strings, locale } = useLocalization();
  const goalStrings = strings.plannerScreens.goals;
  const selectedDate = useSelectedDayStore((state) => state.selectedDate);
  const {
    goals: domainGoals,
    archiveGoal,
    resumeGoal,
    deleteGoalPermanently,
  } = usePlannerDomainStore(
    useShallow((state) => ({
      goals: state.goals,
      archiveGoal: state.archiveGoal,
      resumeGoal: state.resumeGoal,
      deleteGoalPermanently: state.deleteGoalPermanently,
    })),
  );

  const {
    isSelectionMode,
    entityType,
    enterSelectionMode,
    toggleSelection,
    isSelected,
  } = useSelectionStore();

  const isGoalSelectionMode = isSelectionMode && entityType === 'goal';
  const selectedDayStart = useMemo(() => startOfDay(selectedDate).getTime(), [selectedDate]);

  const activeGoals = useMemo(() =>
    domainGoals.filter((goal) => {
      if (goal.showStatus === 'archived' || goal.showStatus === 'deleted') return false;
      const createdAtDay = startOfDay(new Date(goal.createdAt)).getTime();
      return createdAtDay <= selectedDayStart;
    }),
    [domainGoals, selectedDayStart]
  );
  const deletedGoals = useMemo(() =>
    domainGoals.filter((goal) => goal.showStatus === 'archived' || goal.showStatus === 'deleted'),
    [domainGoals]
  );

  const sections = useMemo(() => {
    const activeSections = createGoalSections(goalStrings, activeGoals, locale);
    const deletedCards = createGoalSections(goalStrings, deletedGoals, locale).flatMap((section) => section.data);
    if (!deletedCards.length) {
      return activeSections;
    }
    return [
      ...activeSections,
      {
        id: 'deleted',
        title: 'Delete History',
        subtitle: 'Recover deleted goals',
        data: deletedCards,
      },
    ];
  }, [activeGoals, deletedGoals, goalStrings, locale]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: GoalSection }) => (
      <View style={styles.sectionHeaderContainer}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
          </View>
        </View>
        <View style={styles.sectionDivider} />
      </View>
    ),
    [styles],
  );

  const handleOpenGoal = useCallback(
    (goalId: string) => {
      router.push({ pathname: '/(modals)/planner/goal-details', params: { goalId } });
    },
    [router],
  );

  // Selection mode handlers
  const handleEnterSelectionMode = useCallback(
    (isHistory = false) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      enterSelectionMode('goal', isHistory);
    },
    [enterSelectionMode],
  );

  const handleToggleSelection = useCallback(
    (id: string) => {
      toggleSelection(id);
    },
    [toggleSelection],
  );

  const renderItem = useCallback(
    ({ item, section }: { item: Goal; section: GoalSection }) => {
      const isDeletedSection = section.id === 'deleted';

      const enterSelection = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        handleEnterSelectionMode(isDeletedSection);
        handleToggleSelection(item.id);
      };

      return (
        <SelectableListItem
          id={item.id}
          isSelectionMode={isGoalSelectionMode}
          isSelected={isSelected(item.id)}
          onToggleSelect={handleToggleSelection}
          onLongPress={enterSelection}
          onPress={() => handleOpenGoal(item.id)}
          style={isGoalSelectionMode ? styles.selectionModeItem : undefined}
        >
          <GoalCard
            goal={item}
            onPress={() => handleOpenGoal(item.id)}
            onLongPress={enterSelection}
            onDelete={item.status !== 'archived' ? () => archiveGoal(item.id) : undefined}
            onEdit={item.status !== 'archived' ? () => router.push(`/(modals)/planner/goal?id=${item.id}`) : undefined}
            onAddTask={item.status !== 'archived' ? () => router.push(`/(modals)/planner/task?goalId=${item.id}`) : undefined}
            onRecover={item.status === 'archived' ? () => resumeGoal(item.id) : undefined}
            onDeleteForever={item.status === 'archived' ? () => deleteGoalPermanently(item.id) : undefined}
            disableSwipe={isGoalSelectionMode}
          />
        </SelectableListItem>
      );
    },
    [archiveGoal, deleteGoalPermanently, handleOpenGoal, resumeGoal, router, isGoalSelectionMode, isSelected, handleToggleSelection, handleEnterSelectionMode, styles.selectionModeItem],
  );

  return (
    <>
      <View style={styles.screen}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: isGoalSelectionMode ? 180 : 80 }]}
          stickySectionHeadersEnabled
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={styles.pageHeader}>
              <View>
                <Text style={styles.pageTitle}>{goalStrings.header.title}</Text>
                <Text style={styles.pageSubtitle}>{goalStrings.header.subtitle}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyStateWrapper}>
              <EmptyAnimation size={180} />
              <AdaptiveGlassView style={styles.emptyStateCard}>
                <Text style={styles.emptyTitle}>{goalStrings.empty.title}</Text>
                <Text style={styles.emptySubtitle}>{goalStrings.empty.subtitle}</Text>
              </AdaptiveGlassView>
            </View>
          }
        />
      </View>

    </>
  );
};

const useStyles = createThemedStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 18,
  },
  pageHeader: {
    paddingTop: 20,
    paddingBottom: 12,
    gap: 18,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 0.4,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  sectionHeaderContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: theme.colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  sectionDivider: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
  emptyStateWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 24,
    gap: 14,
    marginTop: 16,
    backgroundColor: theme.colors.card,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  selectionModeItem: {
    paddingLeft: 36,
  },
}));

export default GoalsPage;
