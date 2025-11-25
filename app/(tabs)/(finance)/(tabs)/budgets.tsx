import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AlertCircle, Check } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import { startOfDay } from '@/utils/calendar';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinancePreferencesStore } from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'expo-router';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';

type BudgetState = 'exceeding' | 'within' | 'fixed';

type CategoryBudget = {
  id: string;
  name: string;
  spent: number;
  limit: number;
  state: BudgetState;
  currency: string;
  originalCurrency?: FinanceCurrency;
  accountName: string;
  categories: string[];
  notifyOnExceed: boolean;
};

const PROGRESS_HEIGHT = 32;
const PROGRESS_RADIUS = 18;
const resolveBudgetState = (limit: number, spent: number): BudgetState => {
  if (limit <= 0) {
    return 'fixed';
  }
  if (spent > limit) {
    return 'exceeding';
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
};

const AnimatedProgressBar: React.FC<ProgressBarProps> = ({ percentage, appearance }) => {
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
  labels: Record<BudgetState, string>
): ProgressAppearance => {
  switch (state) {
    case 'exceeding':
      return {
        fillColor: '#FF6B6B',
        label: labels.exceeding,
        icon: 'alert',
        textColor: '#FFFFFF',
      };
    case 'fixed':
      return {
        fillColor: '#51CF66',
        label: labels.fixed,
        icon: 'check',
        textColor: '#FFFFFF',
      };
    default:
      return {
        fillColor: 'rgba(255,255,255,0.4)',
        label: labels.within,
        icon: 'check',
        textColor: '#FFFFFF',
      };
  }
};

const MainBudgetProgress: React.FC<{
  budget: { current: number; total: number };
  labels: Record<BudgetState, string>;
  formatValue: (value: number) => string;
}> = ({ budget, labels, formatValue }) => {
  const percentage =
    budget.total === 0 ? 0 : Math.min((budget.current / budget.total) * 100, 125);
  const appearance = useMemo(() => buildProgressAppearance('within', labels), [labels]);

  return (
    <View style={styles.mainSection}>
      <View style={styles.mainAmountsRow}>
        <Text style={styles.mainAmount}>{formatValue(budget.current)}</Text>
        <Text style={styles.mainAmount}>/ {formatValue(budget.total)}</Text>
      </View>

      <AnimatedProgressBar percentage={percentage} appearance={appearance} />
    </View>
  );
};

interface CategoryBudgetCardProps {
  category: CategoryBudget;
  index: number;
  labels: Record<BudgetState, string>;
  actionLabel: string;
  onManage?: (budgetId: string) => void;
  onOpen?: (budgetId: string) => void;
  formatValue: (value: number) => string;
}

const CategoryBudgetCard: React.FC<CategoryBudgetCardProps> = ({
  category,
  index,
  labels,
  actionLabel,
  onManage,
  onOpen,
  formatValue,
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
    () => buildProgressAppearance(category.state, labels),
    [category.state, labels]
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

          <AnimatedProgressBar percentage={progress} appearance={appearance} />
          <Text style={styles.remainingLabel}>
            {appearance.label === labels.exceeding
              ? `${labels.exceeding}: ${formatValue(category.spent - category.limit)}`
              : `${labels.within}: ${formatValue(remainingAmount)}`}
          </Text>
        </AdaptiveGlassView>
      </Animated.View>
    </Pressable>
  );
};

const BudgetsScreen: React.FC = () => {
  const { strings, locale } = useLocalization();
  const budgetsStrings = strings.financeScreens.budgets;
  const router = useRouter();
  const { convertAmount, formatCurrency: formatFinanceCurrency, globalCurrency } = useFinanceCurrency();

  const selectedDate = useSelectedDayStore((state) => state.selectedDate);
  const normalizedSelectedDate = useMemo(
    () => startOfDay(selectedDate ?? new Date()),
    [selectedDate],
  );
  const baseCurrency = useFinancePreferencesStore((state) => state.baseCurrency);
  const { budgets: domainBudgets, accounts: domainAccounts } = useFinanceDomainStore(
    useShallow((state) => ({
      budgets: state.budgets,
      accounts: state.accounts,
    })),
  );

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
    const total = domainBudgets.reduce(
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
    const categories = domainBudgets.map((budget) => {
      const account = budget.accountId ? accountMap.get(budget.accountId) : undefined;
      const resolvedCurrency = normalizeFinanceCurrency(
        (budget.currency ?? account?.currency ?? baseCurrency) as FinanceCurrency,
      );
      const spent = convertAmount(budget.spentAmount, resolvedCurrency, globalCurrency);
      const limit = convertAmount(budget.limitAmount, resolvedCurrency, globalCurrency);
      const state = resolveBudgetState(limit, spent);
      return {
        id: budget.id,
        name: budget.name,
        spent,
        limit,
        state,
        currency: globalCurrency,
        originalCurrency: resolvedCurrency,
        accountName: account?.name ?? strings.financeScreens.accounts.header,
        categories: budget.categoryIds ?? [],
        notifyOnExceed: Boolean(budget.notifyOnExceed),
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.dateCaption}>{selectedDateLabel}</Text>
      <Text style={styles.sectionHeading}>{budgetsStrings.mainTitle}</Text>

      <MainBudgetProgress
        budget={aggregate.main}
        labels={budgetsStrings.states}
        formatValue={formatValue}
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

      <View style={styles.categoriesList}>
        {aggregate.categories.map((category, index) => (
          <CategoryBudgetCard
            key={category.id}
            category={category}
            index={index}
            labels={budgetsStrings.states}
            actionLabel={manageLabel}
            onManage={handleManageBudget}
            onOpen={handleOpenDetailBudget}
            formatValue={formatValue}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default BudgetsScreen;

const styles = StyleSheet.create({
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
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
  dateCaption: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#7E8B9A',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: '#7E8B9A',
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
    color: '#7E8B9A',
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
    color: '#FFFFFF',
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
    color: '#7E8B9A',
  },
  categoryActionButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryAction: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: '#7E8B9A',
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
    color: '#7E8B9A',
  },
  remainingLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    color: '#7E8B9A',
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: '#7E8B9A',
  },
  section: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7E8B9A',
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
    color: '#FFFFFF',
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
    color: '#7E8B9A',
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
    color: '#9E9E9E',
  },
  periodChipLabelActive: {
    color: '#FFFFFF',
  },
  rangeSummary: {
    marginTop: 6,
    fontSize: 12,
    color: '#7E8B9A',
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
    color: '#7E8B9A',
  },
  rangeValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rangeError: {
    marginTop: 6,
    fontSize: 12,
    color: '#F87171',
  },
  typeContainer: {
    borderRadius: 16,
  },
  typeOption: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    color: '#FFFFFF',
  },
  notificationSubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7E8B9A',
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
    color: '#7E8B9A',
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
    color: '#FF6B6B',
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
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerDoneText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
