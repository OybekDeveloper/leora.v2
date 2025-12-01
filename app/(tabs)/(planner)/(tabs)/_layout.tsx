// app/(tabs)/(planner)/(tabs)/_layout.tsx
import { createMaterialTopTabNavigator, MaterialTopTabBar } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, useMemo } from 'react';
import { X, Trash2, Archive, RotateCcw } from 'lucide-react-native';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useUndoDeleteStore } from '@/stores/useUndoDeleteStore';
import UndoSnackbar from '@/components/shared/UndoSnackbar';
import { useShallow } from 'zustand/react/shallow';
import type { Goal, Habit, Task } from '@/domain/planner/types';

const { Navigator } = createMaterialTopTabNavigator();
export const PlannerTopTabs = withLayoutContext(Navigator);

const PlannerTabsLayout = () => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const tabTitles = strings.plannerScreens.tabs;

  // Selection store
  const {
    isSelectionMode,
    selectedIds,
    entityType,
    isHistoryMode,
    exitSelectionMode,
  } = useSelectionStore();

  // Undo delete store
  const { scheduleDeletion, pendingDeletion } = useUndoDeleteStore();

  // Planner domain store for batch operations
  const {
    batchDeleteGoalsPermanently,
    batchSoftDeleteGoals,
    batchUndoDeleteGoals,
    resumeGoal,
    batchResumeHabits,
    batchDeleteHabitsPermanently,
    batchSoftDeleteHabits,
    batchUndoDeleteHabits,
    batchRestoreTasks,
    batchDeleteTasksPermanently,
    batchSoftDeleteTasks,
    batchUndoDeleteTasks,
  } = usePlannerDomainStore(
    useShallow((state) => ({
      batchDeleteGoalsPermanently: state.batchDeleteGoalsPermanently,
      batchSoftDeleteGoals: state.batchSoftDeleteGoals,
      batchUndoDeleteGoals: state.batchUndoDeleteGoals,
      resumeGoal: state.resumeGoal,
      batchResumeHabits: state.batchResumeHabits,
      batchDeleteHabitsPermanently: state.batchDeleteHabitsPermanently,
      batchSoftDeleteHabits: state.batchSoftDeleteHabits,
      batchUndoDeleteHabits: state.batchUndoDeleteHabits,
      batchRestoreTasks: state.batchRestoreTasks,
      batchDeleteTasksPermanently: state.batchDeleteTasksPermanently,
      batchSoftDeleteTasks: state.batchSoftDeleteTasks,
      batchUndoDeleteTasks: state.batchUndoDeleteTasks,
    })),
  );

  const handleExitSelectionMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    exitSelectionMode();
  }, [exitSelectionMode]);

  // Archive - moves items to archive/history without scheduling permanent deletion
  // Items can be restored from the delete history section
  const handleBatchArchive = useCallback(() => {
    if (selectedIds.length === 0) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const idsToArchive = [...selectedIds];

    if (entityType === 'goal') {
      batchSoftDeleteGoals(idsToArchive);
    } else if (entityType === 'habit') {
      batchSoftDeleteHabits(idsToArchive);
    } else if (entityType === 'task') {
      batchSoftDeleteTasks(idsToArchive);
    }

    // Archive does NOT schedule permanent deletion - items go to history and stay there
    exitSelectionMode();
  }, [
    entityType,
    selectedIds,
    batchSoftDeleteGoals,
    batchSoftDeleteHabits,
    batchSoftDeleteTasks,
    exitSelectionMode,
  ]);

  // Handle undo - restore items from snapshots
  const handleUndo = useCallback(() => {
    if (!pendingDeletion) return;

    const { entityType: deletedEntityType, items } = pendingDeletion;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (deletedEntityType === 'goal') {
      batchUndoDeleteGoals(items as Goal[]);
    } else if (deletedEntityType === 'habit') {
      batchUndoDeleteHabits(items as Habit[]);
    } else if (deletedEntityType === 'task') {
      batchUndoDeleteTasks(items as Task[]);
    }
  }, [pendingDeletion, batchUndoDeleteGoals, batchUndoDeleteHabits, batchUndoDeleteTasks]);

  // Delete - two-step flow: soft delete immediately with undo, permanent delete after timeout
  // In history mode, permanently delete immediately (items are already archived)
  const handleBatchDelete = useCallback(() => {
    if (selectedIds.length === 0) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const idsToDelete = [...selectedIds];

    if (isHistoryMode) {
      // In history mode, items are already archived - permanently delete them
      if (entityType === 'goal') {
        batchDeleteGoalsPermanently(idsToDelete);
      } else if (entityType === 'habit') {
        batchDeleteHabitsPermanently(idsToDelete);
      } else if (entityType === 'task') {
        batchDeleteTasksPermanently(idsToDelete);
      }
      exitSelectionMode();
      return;
    }

    // In normal mode: soft delete with undo option
    let snapshots: unknown[] = [];
    let undoEntityType: 'goal' | 'habit' | 'task' = 'task';

    if (entityType === 'goal') {
      undoEntityType = 'goal';
      snapshots = batchSoftDeleteGoals(idsToDelete);
    } else if (entityType === 'habit') {
      undoEntityType = 'habit';
      snapshots = batchSoftDeleteHabits(idsToDelete);
    } else if (entityType === 'task') {
      undoEntityType = 'task';
      snapshots = batchSoftDeleteTasks(idsToDelete);
    }

    // Schedule permanent deletion with undo option
    scheduleDeletion(
      undoEntityType,
      snapshots,
      idsToDelete,
      () => {
        // This runs after timeout - permanently delete
        if (undoEntityType === 'goal') {
          batchDeleteGoalsPermanently(idsToDelete);
        } else if (undoEntityType === 'habit') {
          batchDeleteHabitsPermanently(idsToDelete);
        } else if (undoEntityType === 'task') {
          batchDeleteTasksPermanently(idsToDelete);
        }
      },
      5 // 5 seconds timeout
    );

    exitSelectionMode();
  }, [
    entityType,
    selectedIds,
    isHistoryMode,
    batchSoftDeleteGoals,
    batchSoftDeleteHabits,
    batchSoftDeleteTasks,
    batchDeleteGoalsPermanently,
    batchDeleteHabitsPermanently,
    batchDeleteTasksPermanently,
    scheduleDeletion,
    exitSelectionMode,
  ]);

  const handleBatchRestore = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (entityType === 'goal') {
      // Goals are selected by goalId, so use resumeGoal for each
      selectedIds.forEach((id) => resumeGoal(id));
    } else if (entityType === 'habit') {
      // Habits are selected by habitId, so use batchResumeHabits
      batchResumeHabits(selectedIds);
    } else if (entityType === 'task') {
      // Tasks in history are selected by historyId, so use batchRestoreTasks
      batchRestoreTasks(selectedIds);
    }
    exitSelectionMode();
  }, [entityType, selectedIds, resumeGoal, batchResumeHabits, batchRestoreTasks, exitSelectionMode]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.background,
        },
        tabBar: {
          backgroundColor: theme.colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        indicator: {
          backgroundColor: theme.colors.textTertiary,
          height: 2,
          borderRadius: 1,
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
          textTransform: 'none',
        },
        // Selection header styles
        selectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 48,
          paddingHorizontal: 8,
          backgroundColor: theme.colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        iconButton: {
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 22,
        },
        counter: {
          fontSize: 18,
          fontWeight: '600',
          color: theme.colors.textPrimary,
          flex: 1,
          marginLeft: 8,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        disabled: {
          opacity: 0.4,
        },
      }),
    [theme],
  );

  // Render selection header when in selection mode
  const renderSelectionHeader = () => (
    <View style={styles.selectionHeader}>
      {/* Left: X button to exit */}
      <Pressable
        onPress={handleExitSelectionMode}
        style={styles.iconButton}
        hitSlop={12}
      >
        <X size={24} color={theme.colors.textPrimary} />
      </Pressable>

      {/* Center: Counter */}
      <Text style={styles.counter}>{selectedIds.length}</Text>

      {/* Right: Action icons */}
      <View style={styles.actions}>
        {/* Archive (only in normal mode) */}
        {!isHistoryMode && (
          <Pressable
            onPress={handleBatchArchive}
            disabled={selectedIds.length === 0}
            style={[styles.iconButton, selectedIds.length === 0 && styles.disabled]}
            hitSlop={8}
          >
            <Archive size={22} color={theme.colors.textPrimary} />
          </Pressable>
        )}

        {/* Restore (only in history mode) */}
        {isHistoryMode && (
          <Pressable
            onPress={handleBatchRestore}
            disabled={selectedIds.length === 0}
            style={[styles.iconButton, selectedIds.length === 0 && styles.disabled]}
            hitSlop={8}
          >
            <RotateCcw size={22} color={theme.colors.primary} />
          </Pressable>
        )}

        {/* Delete */}
        <Pressable
          onPress={handleBatchDelete}
          disabled={selectedIds.length === 0}
          style={[styles.iconButton, selectedIds.length === 0 && styles.disabled]}
          hitSlop={8}
        >
          <Trash2 size={22} color={theme.colors.danger} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <PlannerTopTabs
        style={styles.container}
        screenOptions={{
          tabBarStyle: isSelectionMode ? { display: 'none' } : styles.tabBar,
          tabBarIndicatorStyle: styles.indicator,
          tabBarLabelStyle: styles.label,
          tabBarActiveTintColor: theme.colors.textPrimary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarScrollEnabled: false,
          // Disable tab swiping when selection mode is active
          swipeEnabled: !isSelectionMode,
        }}
        tabBar={(props) => (
          isSelectionMode ? renderSelectionHeader() : <MaterialTopTabBar {...props} />
        )}
      >
        <PlannerTopTabs.Screen name="index" options={{ title: tabTitles.tasks }} />
        <PlannerTopTabs.Screen name="goals" options={{ title: tabTitles.goals }} />
        <PlannerTopTabs.Screen name="habits" options={{ title: tabTitles.habits }} />
      </PlannerTopTabs>

      {/* Telegram-style undo snackbar */}
      <UndoSnackbar onUndo={handleUndo} />
    </>
  );
};

export default PlannerTabsLayout;
