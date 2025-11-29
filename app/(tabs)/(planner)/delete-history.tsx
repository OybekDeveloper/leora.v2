// app/(tabs)/(planner)/delete-history.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2, RotateCcw } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import EmptyAnimation from '@/components/shared/EmptyAnimation';
import SelectableListItem from '@/components/shared/SelectableListItem';
import SelectionToolbar from '@/components/shared/SelectionToolbar';
import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useSelectionStore, type SelectableEntityType } from '@/stores/useSelectionStore';
import { useShallow } from 'zustand/react/shallow';

type TabType = 'tasks' | 'goals' | 'habits';

export default function DeleteHistoryPage() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');

  const {
    taskHistory,
    goalHistory,
    habitHistory,
    restoreTaskFromHistory,
    removeHistoryEntry,
    restoreGoalFromHistory,
    removeGoalHistoryEntry,
    restoreHabitFromHistory,
    removeHabitHistoryEntry,
    batchRestoreTasks,
    batchDeleteTasksPermanently,
    batchRestoreGoals,
    batchDeleteGoalsPermanently,
    batchRestoreHabits,
    batchDeleteHabitsPermanently,
    clearAllTaskHistory,
    clearAllGoalHistory,
    clearAllHabitHistory,
  } = usePlannerDomainStore(
    useShallow((state) => ({
      taskHistory: state.taskHistory,
      goalHistory: state.goalHistory,
      habitHistory: state.habitHistory,
      restoreTaskFromHistory: state.restoreTaskFromHistory,
      removeHistoryEntry: state.removeHistoryEntry,
      restoreGoalFromHistory: state.restoreGoalFromHistory,
      removeGoalHistoryEntry: state.removeGoalHistoryEntry,
      restoreHabitFromHistory: state.restoreHabitFromHistory,
      removeHabitHistoryEntry: state.removeHabitHistoryEntry,
      batchRestoreTasks: state.batchRestoreTasks,
      batchDeleteTasksPermanently: state.batchDeleteTasksPermanently,
      batchRestoreGoals: state.batchRestoreGoals,
      batchDeleteGoalsPermanently: state.batchDeleteGoalsPermanently,
      batchRestoreHabits: state.batchRestoreHabits,
      batchDeleteHabitsPermanently: state.batchDeleteHabitsPermanently,
      clearAllTaskHistory: state.clearAllTaskHistory,
      clearAllGoalHistory: state.clearAllGoalHistory,
      clearAllHabitHistory: state.clearAllHabitHistory,
    })),
  );

  // Selection mode
  const {
    isSelectionMode,
    selectedIds,
    entityType,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    selectAll,
    isSelected,
  } = useSelectionStore();

  const entityTypeMap: Record<TabType, SelectableEntityType> = {
    tasks: 'task',
    goals: 'goal',
    habits: 'habit',
  };

  const isCurrentTabSelectionMode = isSelectionMode && entityType === entityTypeMap[activeTab];

  // Get items for current tab
  const currentItems = useMemo(() => {
    switch (activeTab) {
      case 'tasks':
        return taskHistory.map((item) => ({
          id: item.historyId,
          title: item.title,
          subtitle: `Deleted ${new Date(item.timestamp).toLocaleDateString()}`,
          type: 'task' as const,
        }));
      case 'goals':
        return goalHistory.map((item) => ({
          id: item.historyId,
          title: item.title,
          subtitle: `Deleted ${new Date(item.timestamp).toLocaleDateString()}`,
          type: 'goal' as const,
        }));
      case 'habits':
        return habitHistory.map((item) => ({
          id: item.historyId,
          title: item.title,
          subtitle: `Deleted ${new Date(item.timestamp).toLocaleDateString()}`,
          type: 'habit' as const,
        }));
    }
  }, [activeTab, taskHistory, goalHistory, habitHistory]);

  const allItemIds = useMemo(() => currentItems.map((item) => item.id), [currentItems]);

  const counts = useMemo(
    () => ({
      tasks: taskHistory.length,
      goals: goalHistory.length,
      habits: habitHistory.length,
    }),
    [taskHistory, goalHistory, habitHistory],
  );

  // Handlers
  const handleEnterSelectionMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    enterSelectionMode(entityTypeMap[activeTab], true);
  }, [activeTab, enterSelectionMode]);

  const handleExitSelectionMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    exitSelectionMode();
  }, [exitSelectionMode]);

  const handleToggleSelection = useCallback(
    (id: string) => {
      toggleSelection(id);
    },
    [toggleSelection],
  );

  const handleSelectAll = useCallback(() => {
    selectAll(allItemIds);
  }, [selectAll, allItemIds]);

  const handleRestore = useCallback(
    (id: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      switch (activeTab) {
        case 'tasks':
          restoreTaskFromHistory(id);
          break;
        case 'goals':
          restoreGoalFromHistory(id);
          break;
        case 'habits':
          restoreHabitFromHistory(id);
          break;
      }
    },
    [activeTab, restoreTaskFromHistory, restoreGoalFromHistory, restoreHabitFromHistory],
  );

  const handleDeletePermanently = useCallback(
    (id: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      switch (activeTab) {
        case 'tasks':
          removeHistoryEntry(id);
          break;
        case 'goals':
          removeGoalHistoryEntry(id);
          break;
        case 'habits':
          removeHabitHistoryEntry(id);
          break;
      }
    },
    [activeTab, removeHistoryEntry, removeGoalHistoryEntry, removeHabitHistoryEntry],
  );

  const handleBatchRestore = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    switch (activeTab) {
      case 'tasks':
        batchRestoreTasks(selectedIds);
        break;
      case 'goals':
        batchRestoreGoals(selectedIds);
        break;
      case 'habits':
        batchRestoreHabits(selectedIds);
        break;
    }
    exitSelectionMode();
  }, [activeTab, selectedIds, batchRestoreTasks, batchRestoreGoals, batchRestoreHabits, exitSelectionMode]);

  const handleBatchDelete = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    switch (activeTab) {
      case 'tasks':
        batchDeleteTasksPermanently(selectedIds);
        break;
      case 'goals':
        batchDeleteGoalsPermanently(selectedIds);
        break;
      case 'habits':
        batchDeleteHabitsPermanently(selectedIds);
        break;
    }
    exitSelectionMode();
  }, [activeTab, selectedIds, batchDeleteTasksPermanently, batchDeleteGoalsPermanently, batchDeleteHabitsPermanently, exitSelectionMode]);

  const handleClearAll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    switch (activeTab) {
      case 'tasks':
        clearAllTaskHistory();
        break;
      case 'goals':
        clearAllGoalHistory();
        break;
      case 'habits':
        clearAllHabitHistory();
        break;
    }
  }, [activeTab, clearAllTaskHistory, clearAllGoalHistory, clearAllHabitHistory]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      if (isSelectionMode) {
        exitSelectionMode();
      }
      setActiveTab(tab);
    },
    [isSelectionMode, exitSelectionMode],
  );

  return (
    <>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <ChevronLeft size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Delete History</Text>
          {currentItems.length > 0 && (
            <Pressable onPress={handleClearAll} style={styles.clearButton} hitSlop={8}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['tasks', 'goals', 'habits'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => handleTabChange(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {counts[tab] > 0 && (
                <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                    {counts[tab]}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: isCurrentTabSelectionMode ? 180 : 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {currentItems.length === 0 ? (
            <View style={styles.emptyStateWrapper}>
              <EmptyAnimation size={160} />
              <AdaptiveGlassView style={styles.emptyStateCard}>
                <Text style={styles.emptyTitle}>No deleted {activeTab}</Text>
                <Text style={styles.emptySubtitle}>
                  Items you delete will appear here for recovery
                </Text>
              </AdaptiveGlassView>
            </View>
          ) : (
            <View style={[{ gap: 10 }, isCurrentTabSelectionMode && styles.selectionModeContainer]}>
              {currentItems.map((item) => (
                <SelectableListItem
                  key={item.id}
                  id={item.id}
                  isSelectionMode={isCurrentTabSelectionMode}
                  isSelected={isSelected(item.id)}
                  onToggleSelect={handleToggleSelection}
                  onLongPress={handleEnterSelectionMode}
                >
                  <HistoryItemCard
                    title={item.title}
                    subtitle={item.subtitle}
                    onRestore={() => handleRestore(item.id)}
                    onDelete={() => handleDeletePermanently(item.id)}
                  />
                </SelectableListItem>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Selection Toolbar */}
      <SelectionToolbar
        visible={isCurrentTabSelectionMode}
        selectedCount={selectedIds.length}
        totalCount={allItemIds.length}
        onSelectAll={handleSelectAll}
        onDelete={handleBatchDelete}
        onRestore={handleBatchRestore}
        onCancel={handleExitSelectionMode}
        isHistoryMode
      />
    </>
  );
}

// History Item Card Component
function HistoryItemCard({
  title,
  subtitle,
  onRestore,
  onDelete,
}: {
  title: string;
  subtitle: string;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const styles = useStyles();
  const theme = useAppTheme();

  return (
    <AdaptiveGlassView style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            onPress={onRestore}
            style={[styles.actionButton, styles.restoreButton]}
            hitSlop={4}
          >
            <RotateCcw size={18} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={[styles.actionButton, styles.deleteButton]}
            hitSlop={4}
          >
            <Trash2 size={18} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    </AdaptiveGlassView>
  );
}

const useStyles = createThemedStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${theme.colors.danger}15`,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.danger,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceMuted,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: theme.colors.border,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: theme.colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  emptyStateWrapper: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: 24,
    gap: 10,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectionModeContainer: {
    paddingLeft: 36,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButton: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  deleteButton: {
    backgroundColor: `${theme.colors.danger}15`,
  },
}));
