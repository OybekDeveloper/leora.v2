// app/(tabs)/(planner)/(tabs)/_layout.tsx
import { createMaterialTopTabNavigator, MaterialTopTabBar } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { Alert, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, useMemo } from 'react';
import { X, Trash2, Archive, RotateCcw } from 'lucide-react-native';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useShallow } from 'zustand/react/shallow';

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

  // Planner domain store for batch operations
  const {
    batchDeleteGoals,
    batchDeleteGoalsPermanently,
    resumeGoal,
    batchDeleteHabits,
    batchResumeHabits,
    batchDeleteHabitsPermanently,
    batchDeleteTasks,
    batchRestoreTasks,
    batchDeleteTasksPermanently,
  } = usePlannerDomainStore(
    useShallow((state) => ({
      batchDeleteGoals: state.batchDeleteGoals,
      batchDeleteGoalsPermanently: state.batchDeleteGoalsPermanently,
      resumeGoal: state.resumeGoal,
      batchDeleteHabits: state.batchDeleteHabits,
      batchResumeHabits: state.batchResumeHabits,
      batchDeleteHabitsPermanently: state.batchDeleteHabitsPermanently,
      batchDeleteTasks: state.batchDeleteTasks,
      batchRestoreTasks: state.batchRestoreTasks,
      batchDeleteTasksPermanently: state.batchDeleteTasksPermanently,
    })),
  );

  const handleExitSelectionMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    exitSelectionMode();
  }, [exitSelectionMode]);

  const handleBatchArchive = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (entityType === 'goal') {
      batchDeleteGoals(selectedIds);
    } else if (entityType === 'habit') {
      batchDeleteHabits(selectedIds);
    } else if (entityType === 'task') {
      batchDeleteTasks(selectedIds);
    }
    exitSelectionMode();
  }, [entityType, selectedIds, batchDeleteGoals, batchDeleteHabits, batchDeleteTasks, exitSelectionMode]);

  const handleBatchDelete = useCallback(() => {
    Alert.alert(
      `Delete ${selectedIds.length} item(s)`,
      'Are you sure you want to delete selected items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            if (entityType === 'goal') {
              batchDeleteGoalsPermanently(selectedIds);
            } else if (entityType === 'habit') {
              batchDeleteHabitsPermanently(selectedIds);
            } else if (entityType === 'task') {
              batchDeleteTasksPermanently(selectedIds);
            }
            exitSelectionMode();
          },
        },
      ]
    );
  }, [entityType, selectedIds, batchDeleteGoalsPermanently, batchDeleteHabitsPermanently, batchDeleteTasksPermanently, exitSelectionMode]);

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
  );
};

export default PlannerTabsLayout;
