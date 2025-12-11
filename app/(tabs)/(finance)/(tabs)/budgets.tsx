import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AlertCircle, Check } from 'lucide-react-native';

import { FlashList as FlashListBase } from '@shopify/flash-list';

// Cast FlashList to avoid TypeScript generic inference issues
const FlashList = FlashListBase as any;
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import EmptyState from '@/components/shared/EmptyState';
import SelectableListItem from '@/components/shared/SelectableListItem';
import SelectionToolbar from '@/components/shared/SelectionToolbar';
import UndoSnackbar from '@/components/shared/UndoSnackbar';
import { useFinanceDateStore } from '@/stores/useFinanceDateStore';
import { useUndoDeleteStore } from '@/stores/useUndoDeleteStore';
import { toISODateKey } from '@/utils/calendar';
import type { Budget } from '@/domain/finance/types';
import { startOfDay } from '@/utils/calendar';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'expo-router';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { useAppTheme, type Theme } from '@/constants/theme';

type BudgetState = 'exceeding' | 'warning' | 'within' | 'fixed';

interface CategoryBudget {
  id: string;
  label: string;
  name: string;
  spent: number;
  limit: number;
  state: BudgetState;
  currency: string;
  originalCurrency?: FinanceCurrency;
  accountName: string;
  categories: string[];
  notifyOnExceed: boolean;
  budgetKind: 'spending' | 'saving';
}

const PROGRESS_HEIGHT = 32;
const PROGRESS_RADIUS = 18;
const resolveBudgetState = (limit: number, spent: number): BudgetState => {
  if (limit <= 0) {
    return 'fixed';
  }
  if (spent > limit) {
    return 'exceeding';
  }
  if (spent >= limit * 0.9) {
    return 'warning';
  }
  return 'within';
};

type ProgressAppearance = {
  fillColor: string;
  label: string;
  icon: 'alert' | 'check';
  textColor: string;
};

type ProgressBarProps = {
  percentage: number;
  appearance: ProgressAppearance;
  styles: ReturnType<typeof createStyles>;
};

const AnimatedProgressBar: React.FC<ProgressBarProps> = ({ percentage, appearance, styles }) => {
  const widthValue = useSharedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const clampedPercentage = Math.max(0, Math.min(percentage, 125));

  useEffect(() => {
    if (!trackWidth) return;

    const ratio = Math.min(clampedPercentage / 100, 1);
    const targetWidth = trackWidth * ratio;
    const minWidth = clampedPercentage > 0 ? Math.min(trackWidth, 120) : 0;
    widthValue.value = withTiming(Math.min(trackWidth, Math.max(targetWidth, minWidth)), {
      duration: 360,
    });
  }, [clampedPercentage, trackWidth, widthValue]);

  const fillStyle = useAnimatedStyle(() => ({
    width: widthValue.value,
  }));

  const iconColor = appearance.textColor;

  return (
    <View
      style={styles.progressShellWrapper}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      <AdaptiveGlassView style={[styles.glassSurface, styles.progressShell]}>
        <Animated.View
          style={[styles.progressFill, fillStyle, { backgroundColor: appearance.fillColor }]}
        />

        <View style={styles.progressOverlay} pointerEvents="none">
          <View style={styles.progressLabelGroup}>
            {appearance.icon === 'alert' ? (
              <AlertCircle size={16} color={iconColor} />
            ) : (
              <Check size={16} color={iconColor} />
            )}
            <Text style={[styles.progressLabel, { color: appearance.textColor }]}>
              {appearance.label}
            </Text>
          </View>
          <Text style={[styles.progressLabel, { color: appearance.textColor }]}>
            {Math.round(clampedPercentage)}%
          </Text>
        </View>
      </AdaptiveGlassView>
    </View>
  );
};

const buildProgressAppearance = (
  state: BudgetState,
  labels: Record<BudgetState, string>,
  theme: Theme
): ProgressAppearance => {
  const isDark = theme.mode === 'dark';
  switch (state) {
    case 'exceeding':
      return {
        fillColor: theme.colors.danger,
        label: labels.exceeding,
        icon: 'alert',
        textColor: '#FFFFFF',
      };
    case 'warning':
      return {
        fillColor: theme.colors.warning,
        label: labels.warning,
        icon: 'alert',
        textColor: '#FFFFFF',
      };
    case 'fixed':
      return {
        fillColor: theme.colors.success,
        label: labels.fixed,
        icon: 'check',
        textColor: '#FFFFFF',
      };
    default:
      return {
        fillColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)',
        label: labels.within,
        icon: 'check',
        textColor: isDark ? '#FFFFFF' : theme.colors.textPrimary,
      };
  }
};

const MainBudgetProgress: React.FC<{
  budget: { current: number; total: number };
  labels: Record<BudgetState, string>;
  formatValue: (value: number) => string;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
}> = ({ budget, labels, formatValue, theme, styles }) => {
  const percentage =
    budget.total === 0 ? 0 : Math.min((budget.current / budget.total) * 100, 125);
  const appearance = useMemo(() => buildProgressAppearance('within', labels, theme), [labels, theme]);

  return (
    <View style={styles.mainSection}>
      <View style={styles.mainAmountsRow}>
        <Text style={styles.mainAmount}>{formatValue(budget.current)}</Text>
        <Text style={styles.mainAmount}>/ {formatValue(budget.total)}</Text>
      </View>

      <AnimatedProgressBar percentage={percentage} appearance={appearance} styles={styles} />
    </View>
  );
};

interface CategoryBudgetCardProps {
  category: CategoryBudget;
  index: number;
  labels: Record<BudgetState, string>;
  actionLabel: string;
  savedLabel: string;
  onManage?: (budgetId: string) => void;
  onOpen?: (budgetId: string) => void;
  formatValue: (value: number) => string;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
}

const CategoryBudgetCard: React.FC<CategoryBudgetCardProps> = ({
  category,
  index,
  labels,
  actionLabel,
  savedLabel,
  onManage,
  onOpen,
  formatValue,
  theme,
  styles,
}) => {
  const fade = useSharedValue(0);
  const translateY = useSharedValue(12);

  const progress = useMemo(() => {
    if (category.limit === 0) return 0;
    return Math.min((category.spent / category.limit) * 100, 125);
  }, [category.limit, category.spent]);

  useEffect(() => {
    const delayMs = index * 80;
    const timer = setTimeout(() => {
      fade.value = withTiming(1, { duration: 280 });
      translateY.value = withTiming(0, { duration: 280 });
    }, delayMs);
    return () => clearTimeout(timer);
  }, [fade, index, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: translateY.value }],
  }));

  const appearance = useMemo(
    () => buildProgressAppearance(category.state, labels, theme),
    [category.state, labels, theme]
  );

  const categoriesSummary = category.categories.join(', ');
  const remainingAmount = Math.max(category.limit - category.spent, 0);

  return (
    <Pressable onPress={() => onOpen?.(category.id)}>
      <Animated.View style={[styles.categoryBlock, animatedStyle]}>
        <AdaptiveGlassView style={[styles.glassSurface, styles.categoryCard]}>
          <View style={styles.categoryHeaderRow}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <Pressable
              style={({ pressed }) => [styles.categoryActionButton, pressed && styles.pressed]}
              onPress={() => onManage?.(category.id)}
            >
              <Text style={styles.categoryAction}>{actionLabel}</Text>
            </Pressable>
          </View>
          <Text style={styles.categorySubtitle}>
            {category.accountName}
            {categoriesSummary ? ` · ${categoriesSummary}` : ''}
          </Text>

          <View style={styles.categoryAmountsRow}>
            <Text style={styles.categoryAmount}>
              {formatValue(category.spent)}
            </Text>
            <Text style={styles.categoryAmount}>
              / {formatValue(category.limit)}
            </Text>
          </View>

          <AnimatedProgressBar percentage={progress} appearance={appearance} styles={styles} />
          <Text style={styles.remainingLabel}>
            {category.budgetKind === 'saving'
              ? `${savedLabel}: ${formatValue(category.spent)}`
              : appearance.label === labels.exceeding
                ? `${labels.exceeding}: ${formatValue(category.spent - category.limit)}`
                : `${labels.within}: ${formatValue(remainingAmount)}`}
          </Text>
        </AdaptiveGlassView>
      </Animated.View>
    </Pressable>
  );
};

const BudgetsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { strings, locale } = useLocalization();
  const budgetsStrings = strings.financeScreens.budgets;
  const router = useRouter();
  const { convertAmount, formatCurrency: formatFinanceCurrency, globalCurrency } = useFinanceCurrency();

  // Finance date store dan tanlangan sanani olish
  const selectedDate = useFinanceDateStore((state) => state.selectedDate);
  const normalizedSelectedDate = useMemo(
    () => startOfDay(selectedDate ?? new Date()),
    [selectedDate],
  );
  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);

  // Undo delete store
  const { scheduleDeletion, pendingDeletion } = useUndoDeleteStore();

  const {
    budgets: domainBudgets,
    accounts: domainAccounts,
    batchSoftDeleteBudgets,
    batchUndoDeleteBudgets,
    batchDeleteBudgetsPermanently,
  } = useFinanceDomainStore(
    useShallow((state) => ({
      budgets: state.budgets,
      accounts: state.accounts,
      batchSoftDeleteBudgets: state.batchSoftDeleteBudgets,
      batchUndoDeleteBudgets: state.batchUndoDeleteBudgets,
      batchDeleteBudgetsPermanently: state.batchDeleteBudgetsPermanently,
    })),
  );

  // Selection mode
  const {
    isSelectionMode,
    entityType,
    selectedIds,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    getSelectedCount,
  } = useSelectionStore();

  const isBudgetSelectionMode = isSelectionMode && entityType === 'budget';

  const accountMap = useMemo(
    () => new Map(domainAccounts.map((account) => [account.id, account])),
    [domainAccounts],
  );

  const formatValue = useCallback(
    (value: number) =>
      formatFinanceCurrency(value, {
        fromCurrency: globalCurrency,
        convert: false,
      }),
    [formatFinanceCurrency, globalCurrency],
  );

  const aggregate = useMemo(() => {
    // Filter out archived budgets
    let activeBudgets = domainBudgets.filter((b) => !b.isArchived);

    // Sanaga qarab filter qilish: startDate <= selectedDate <= endDate
    if (selectedDate) {
      const selectedKey = toISODateKey(selectedDate);
      activeBudgets = activeBudgets.filter((budget) => {
        // Agar sana yo'q bo'lsa, ko'rsatamiz
        if (!budget.startDate && !budget.endDate) return true;
        const startKey = budget.startDate ? toISODateKey(new Date(budget.startDate)) : null;
        const endKey = budget.endDate ? toISODateKey(new Date(budget.endDate)) : null;
        // Faqat startDate bor
        if (startKey && !endKey) return selectedKey >= startKey;
        // Faqat endDate bor
        if (!startKey && endKey) return selectedKey <= endKey;
        // Ikkalasi ham bor
        if (startKey && endKey) return selectedKey >= startKey && selectedKey <= endKey;
        return true;
      });
    }

    const total = activeBudgets.reduce(
      (acc, budget) => {
        const account = budget.accountId ? accountMap.get(budget.accountId) : undefined;
        const resolvedCurrency = normalizeFinanceCurrency(
          (budget.currency ?? account?.currency ?? baseCurrency) as FinanceCurrency,
        );
        const spent = convertAmount(budget.spentAmount, resolvedCurrency, globalCurrency);
        const limit = convertAmount(budget.limitAmount, resolvedCurrency, globalCurrency);
        acc.current += spent;
        acc.total += limit;
        return acc;
      },
      { current: 0, total: 0 },
    );
    const categories = activeBudgets.map((budget) => {
      const account = budget.accountId ? accountMap.get(budget.accountId) : undefined;
      const resolvedCurrency = normalizeFinanceCurrency(
        (budget.currency ?? account?.currency ?? baseCurrency) as FinanceCurrency,
      );
      const spent = convertAmount(budget.spentAmount, resolvedCurrency, globalCurrency);
      const limit = convertAmount(budget.limitAmount, resolvedCurrency, globalCurrency);
      const state = resolveBudgetState(limit, spent);
      return {
        id: budget.id,
        label: budget.name, // Required by FloatListItem
        name: budget.name,
        spent,
        limit,
        state,
        currency: globalCurrency,
        originalCurrency: resolvedCurrency,
        accountName: account?.name ?? strings.financeScreens.accounts.header,
        categories: budget.categoryIds ?? [],
        notifyOnExceed: Boolean(budget.notifyOnExceed),
        budgetKind: (budget.transactionType === 'income' ? 'saving' : 'spending') as 'spending' | 'saving',
      };
    });
    return {
      main: {
        current: total.current,
        total: total.total,
      },
      categories,
    };
  }, [
    accountMap,
    baseCurrency,
    convertAmount,
    domainBudgets,
    globalCurrency,
    strings.financeScreens.accounts.header,
  ]);

  const selectedDateLabel = useMemo(() => {
    const today = startOfDay(new Date());
    if (normalizedSelectedDate.getTime() === today.getTime()) {
      return budgetsStrings.today;
    }
    const formatted = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(normalizedSelectedDate);
    return budgetsStrings.dateTemplate.replace('{date}', formatted);
  }, [budgetsStrings, locale, normalizedSelectedDate]);

  const manageLabel = strings.financeScreens.accounts.actions.edit;

  const handleManageBudget = useCallback(
    (budgetId: string) => {
      router.push({ pathname: '/(modals)/finance/budget', params: { id: budgetId } });
    },
    [router],
  );

  const handleOpenCreateBudget = useCallback(() => {
    router.push('/(modals)/finance/budget');
  }, [router]);

  const handleOpenDetailBudget = useCallback(
    (budgetId: string) => {
      router.push({ pathname: '/(modals)/finance/budget-detail', params: { budgetId } });
    },
    [router],
  );

  // Selection mode handlers
  const activeBudgetIds = useMemo(
    () => aggregate.categories.map((cat) => cat.id),
    [aggregate.categories]
  );

  const handleEnterSelectionMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    enterSelectionMode('budget');
  }, [enterSelectionMode]);

  const handleToggleSelection = useCallback(
    (id: string) => {
      toggleSelection(id);
    },
    [toggleSelection]
  );

  const handleSelectAll = useCallback(() => {
    const allSelected = selectedIds.length === activeBudgetIds.length;
    if (allSelected) {
      deselectAll();
    } else {
      selectAll(activeBudgetIds);
    }
  }, [selectedIds.length, activeBudgetIds, selectAll, deselectAll]);

  // Telegram-style delete with undo - soft delete immediately, permanent delete after timeout
  const handleArchiveSelected = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const idsToDelete = [...selectedIds]; // Capture IDs before exiting selection mode
    const snapshots = batchSoftDeleteBudgets(idsToDelete);

    // Schedule permanent deletion with undo option
    scheduleDeletion(
      'budget',
      snapshots,
      idsToDelete,
      () => {
        // This runs after timeout - permanently delete
        batchDeleteBudgetsPermanently(idsToDelete);
      },
      5 // 5 seconds timeout
    );

    exitSelectionMode();
  }, [selectedIds, batchSoftDeleteBudgets, batchDeleteBudgetsPermanently, scheduleDeletion, exitSelectionMode]);

  // Handle undo - restore budgets from snapshots
  const handleUndo = useCallback(() => {
    if (!pendingDeletion || pendingDeletion.entityType !== 'budget') return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    batchUndoDeleteBudgets(pendingDeletion.items as Budget[]);
  }, [pendingDeletion, batchUndoDeleteBudgets]);

  // For permanent delete, use the old flow with confirmation
  const handleDeleteSelected = useCallback(() => {
    const detailStrings = strings.financeScreens.budgets.detail;
    Alert.alert(
      detailStrings.actions.confirmDeleteTitle,
      detailStrings.actions.confirmDeleteMessage,
      [
        { text: detailStrings.actions.confirmDeleteCancel, style: 'cancel' },
        {
          text: detailStrings.actions.confirmDeleteConfirm,
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            batchDeleteBudgetsPermanently(selectedIds);
            exitSelectionMode();
          },
        },
      ],
    );
  }, [selectedIds, batchDeleteBudgetsPermanently, exitSelectionMode, strings]);

  const handleCancelSelection = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    exitSelectionMode();
  }, [exitSelectionMode]);

  const isEmpty = aggregate.categories.length === 0;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isBudgetSelectionMode ? 200 : 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateCaption}>{selectedDateLabel}</Text>
        <Text style={styles.sectionHeading}>{budgetsStrings.mainTitle}</Text>

        <MainBudgetProgress
          budget={aggregate.main}
          labels={budgetsStrings.states}
          formatValue={formatValue}
          theme={theme}
          styles={styles}
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{budgetsStrings.categoriesTitle}</Text>
          <Pressable
            style={({ pressed }) => [styles.addCategoryButton, pressed && styles.pressed]}
            onPress={handleOpenCreateBudget}
          >
            <AdaptiveGlassView style={[styles.glassSurface, styles.addCategoryButtonInner]}>
              <Text style={styles.addCategoryText}>{budgetsStrings.setLimit}</Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>

        {isEmpty ? (
          <EmptyState
            title={budgetsStrings.empty.title}
            subtitle={budgetsStrings.empty.subtitle}
          />
        ) : (
          <View style={styles.budgetListContainer}>
            <FlashList
              data={aggregate.categories}
              estimatedItemSize={180}
              keyExtractor={(item: CategoryBudget) => item.id}
              ItemSeparatorComponent={() => <View style={styles.verticalSeparator} />}
              renderItem={({ item: category, index }: { item: CategoryBudget; index: number }) => {
                const enterSelection = () => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  handleEnterSelectionMode();
                  handleToggleSelection(category.id);
                };

                return (
                  <SelectableListItem
                    id={category.id}
                    isSelectionMode={isBudgetSelectionMode}
                    isSelected={isSelected(category.id)}
                    onToggleSelect={handleToggleSelection}
                    onLongPress={enterSelection}
                    onPress={() => handleOpenDetailBudget(category.id)}
                    style={isBudgetSelectionMode ? styles.selectionModeItem : undefined}
                  >
                    <CategoryBudgetCard
                      category={category}
                      index={index}
                      labels={budgetsStrings.states}
                      actionLabel={manageLabel}
                      savedLabel={budgetsStrings.detail.savedLabel ?? 'Saved'}
                      onManage={isBudgetSelectionMode ? undefined : handleManageBudget}
                      onOpen={isBudgetSelectionMode ? undefined : handleOpenDetailBudget}
                      formatValue={formatValue}
                      theme={theme}
                      styles={styles}
                    />
                  </SelectableListItem>
                );
              }}
            />
          </View>
        )}
      </ScrollView>

      <SelectionToolbar
        visible={isBudgetSelectionMode}
        selectedCount={getSelectedCount()}
        totalCount={activeBudgetIds.length}
        onSelectAll={handleSelectAll}
        onArchive={handleArchiveSelected}
        onDelete={handleDeleteSelected}
        onCancel={handleCancelSelection}
        isHistoryMode={false}
      />

      {/* Telegram-style undo snackbar */}
      <UndoSnackbar onUndo={handleUndo} />
    </>
  );
};

export default BudgetsScreen;

const createStyles = (theme: Theme) => StyleSheet.create({
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
    backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 120,
    gap: 18,
  },
  budgetListContainer: {
    flex: 1,
    minHeight: 200,
  },
  verticalSeparator: {
    height: 12,
  },
  dateCaption: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: theme.colors.textSecondary,
  },
  mainSection: {
    gap: 12,
  },
  mainAmountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  mainAmount: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: theme.colors.textSecondary,
  },
  progressShellWrapper: {
    height: PROGRESS_HEIGHT,
    borderRadius: PROGRESS_RADIUS,
    overflow: 'hidden',
    width: '100%',
  },
  progressShell: {
    flex: 1,
    height: PROGRESS_HEIGHT,
    borderRadius: PROGRESS_RADIUS,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: PROGRESS_RADIUS,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  progressLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  sectionHeaderRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addCategoryButton: {
    borderRadius: 16,
  },
  addCategoryButtonInner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: theme.colors.textPrimary,
  },
  categoriesList: {
    gap: 12,
  },
  categoryBlock: {
    marginBottom: 8,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categorySubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  categoryActionButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  categoryAction: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: theme.colors.textSecondary,
  },
  categoryAmountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: theme.colors.textSecondary,
  },
  remainingLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    color: theme.colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
  selectionModeItem: {
    paddingLeft: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.textPrimary,
  },
  accountScroll: {
    gap: 12,
    paddingVertical: 10,
  },
  accountChip: {
    minWidth: 120,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accountChipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountChipSubtext: {
    fontSize: 11,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  periodChipsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    flexWrap: 'wrap',
  },
  periodChip: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  periodChipActive: {
    borderColor: 'rgba(124,101,255,0.8)',
    backgroundColor: 'rgba(124,101,255,0.18)',
  },
  periodChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  periodChipLabelActive: {
    color: theme.colors.textPrimary,
  },
  rangeSummary: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  customRangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rangeButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 140,
  },
  rangeButtonLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  rangeValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  rangeError: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.danger,
  },
  typeContainer: {
    borderRadius: 16,
  },
  typeOption: {
    borderBottomColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  },
  typeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  categoryChipScroll: {
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryChipCard: {
    width: 90,
    height: 90,
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryChipLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  notificationRow: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.textPrimary,
  },
  notificationSubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
  },
  primaryButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.danger,
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 24,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerCard: {
    width: '100%',
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  pickerDoneButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerDoneText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
