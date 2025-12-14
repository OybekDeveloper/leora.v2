import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useAppTheme } from '@/constants/theme';
import * as Progress from 'react-native-progress';
import { FINANCE_CATEGORIES } from '@/constants/financeCategories';
import { useLocalizedCategories } from '@/hooks/useLocalizedCategories';

type InfoRowProps = { label: string; value: string };

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{value}</Text>
    </View>
  );
};

const resolveBudgetState = (limit: number, spent: number): 'exceeding' | 'warning' | 'within' | 'fixed' => {
  if (limit <= 0) return 'fixed';
  if (spent > limit) return 'exceeding';
  if (spent >= limit * 0.9) return 'warning';
  return 'within';
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString();
  }
};

const BudgetDetail = () => {
  const insets = useSafeAreaInsets();
  const { strings } = useLocalization();
  const detailStrings = strings.financeScreens.budgets.detail;
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ budgetId?: string; id?: string }>();

  const { budgets, accounts } = useFinanceDomainStore(
    useShallow((state) => ({
      budgets: state.budgets,
      accounts: state.accounts,
    })),
  );
  const archiveBudget = useFinanceDomainStore((state) => state.archiveBudget);
  const { goals } = usePlannerDomainStore(
    useShallow((state) => ({
      goals: state.goals,
    })),
  );
  const { globalCurrency, formatAccountAmount } = useFinanceCurrency();
  const { getLocalizedCategoryName } = useLocalizedCategories();

  const budgetId = params.budgetId ?? params.id;

  const budget = useMemo(
    () => budgets.find((item) => item.id === budgetId),
    [budgetId, budgets],
  );

  useEffect(() => {
    if (!budget) {
      router.back();
    }
  }, [budget, router]);

  const account = useMemo(() => {
    if (!budget?.accountId) return undefined;
    return accounts.find((acc) => acc.id === budget.accountId);
  }, [accounts, budget?.accountId]);

  const linkedGoal = useMemo(
    () => (budget?.linkedGoalId ? goals.find((goal) => goal.id === budget.linkedGoalId) : undefined),
    [budget?.linkedGoalId, goals],
  );

  // Get category details for display
  const budgetCategories = useMemo(() => {
    if (!budget?.categoryIds?.length) return [];
    return budget.categoryIds.map((catName) => {
      const found = FINANCE_CATEGORIES.find((c) => c.name === catName);
      return {
        name: catName,
        localizedName: getLocalizedCategoryName(catName),
        icon: found?.icon,
        colorToken: found?.colorToken ?? 'textSecondary',
      };
    });
  }, [budget?.categoryIds, getLocalizedCategoryName]);

  const budgetCurrency = useMemo(
    () =>
      budget
        ? normalizeFinanceCurrency(
            (budget.currency ?? account?.currency ?? globalCurrency) as FinanceCurrency,
          )
        : globalCurrency,
    [account?.currency, budget, globalCurrency],
  );

  const spentValue = useMemo(() => budget?.spentAmount ?? 0, [budget?.spentAmount]);
  const limitValue = useMemo(() => budget?.limitAmount ?? 0, [budget?.limitAmount]);
  const remainingValue = limitValue - spentValue;

  const formatValue = useCallback(
    (value: number) => formatAccountAmount(value, budgetCurrency as FinanceCurrency),
    [budgetCurrency, formatAccountAmount],
  );

  // Determine if this is a spending or saving budget
  const isSpendingBudget = budget?.transactionType !== 'income';

  // Progress foizi hisoblash
  const progressPercentage = useMemo(() => {
    if (limitValue <= 0) return 0;
    return Math.min((spentValue / limitValue) * 100, 100);
  }, [limitValue, spentValue]);

  const progressColor = useMemo(() => {
    if (progressPercentage >= 100) return theme.colors.danger;
    if (progressPercentage >= 90) return '#F59E0B'; // warning orange
    return theme.colors.success;
  }, [progressPercentage, theme.colors.danger, theme.colors.success]);

  const statusLabel = useMemo(() => {
    const state = resolveBudgetState(limitValue, spentValue);
    return strings.financeScreens.budgets.states[state];
  }, [limitValue, spentValue, strings.financeScreens.budgets.states]);

  const handleEdit = useCallback(() => {
    if (!budget) return;
    router.push({ pathname: '/(modals)/finance/budget', params: { id: budget.id } });
  }, [budget, router]);

  const handleDelete = useCallback(() => {
    if (!budget) return;
    Alert.alert(
      detailStrings.actions.confirmDeleteTitle,
      detailStrings.actions.confirmDeleteMessage,
      [
        { text: detailStrings.actions.confirmDeleteCancel, style: 'cancel' },
        {
          text: detailStrings.actions.confirmDeleteConfirm,
          style: 'destructive',
          onPress: () => {
            archiveBudget(budget.id);
            router.back();
          },
        },
      ],
    );
  }, [archiveBudget, budget, detailStrings.actions, router]);

  const handleViewGoal = useCallback(() => {
    if (!linkedGoal) return;
    router.push({ pathname: '/(modals)/planner/goal-details', params: { goalId: linkedGoal.id } });
  }, [linkedGoal, router]);

  const handleViewTransactions = useCallback(() => {
    // Close modal context and navigate directly to transactions tab
    router.replace('/(tabs)/(finance)/(tabs)/transactions');
  }, [router]);

  if (!budget) {
    return null;
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{detailStrings.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
            {strings.common.close}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>{budget.name}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {detailStrings.currencyLabel}: {budgetCurrency} · {detailStrings.status}: {statusLabel}
          </Text>
        </View>

        <AdaptiveGlassView style={[styles.glassSurface, styles.card, styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                {isSpendingBudget ? detailStrings.spentLabel : (detailStrings.contributedLabel ?? 'Contributed')}
              </Text>
              <Text style={[styles.progressPercent, { color: progressColor }]}>
                {progressPercentage.toFixed(0)}%
              </Text>
            </View>
            <Progress.Bar
              progress={progressPercentage / 100}
              width={null}
              height={10}
              color={progressColor}
              unfilledColor={theme.colors.surfaceElevated}
              borderWidth={0}
              borderRadius={5}
              animated={true}
            />
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              {isSpendingBudget ? detailStrings.limitLabel : (detailStrings.targetLabel ?? 'Target')}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>{formatValue(limitValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              {isSpendingBudget ? detailStrings.spentLabel : (detailStrings.contributedLabel ?? 'Contributed')}
            </Text>
            <Text style={[styles.summaryValue, { color: progressColor }]}>{formatValue(spentValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{detailStrings.remainingLabel}</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>{formatValue(remainingValue)}</Text>
          </View>

          {/* Add Value Button - Prominent placement */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(modals)/finance/budget-add-value',
                params: { budgetId: budget.id },
              })
            }
            style={({ pressed }) => [
              styles.addValueButton,
              pressed && styles.pressed,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addValueButtonText}>
              {isSpendingBudget
                ? (detailStrings.actions?.recordExpense ?? 'Record expense')
                : (detailStrings.actions?.addToBudget ?? 'Add to budget')}
            </Text>
          </Pressable>
        </AdaptiveGlassView>

        {/* Categories Section */}
        {budgetCategories.length > 0 && (
          <AdaptiveGlassView style={[styles.glassSurface, styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>
              {detailStrings.categoriesLabel}
            </Text>
            <View style={styles.categoriesContainer}>
              {budgetCategories.map((cat) => {
                const IconComponent = cat.icon;
                const iconColor = theme.colors[cat.colorToken] ?? theme.colors.textSecondary;
                return (
                  <View
                    key={cat.name}
                    style={[styles.categoryChip, { backgroundColor: `${iconColor}15` }]}
                  >
                    {IconComponent && <IconComponent size={16} color={iconColor} />}
                    <Text style={[styles.categoryChipText, { color: theme.colors.textPrimary }]}>
                      {cat.localizedName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </AdaptiveGlassView>
        )}

        <AdaptiveGlassView style={[styles.glassSurface, styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.title}</Text>
          <InfoRow
            label={detailStrings.accountLabel}
            value={account?.name ?? detailStrings.goalUnlinked}
          />
          <InfoRow
            label={(detailStrings as any).periodLabel ?? 'Period'}
            value={budget.startDate && budget.endDate
              ? `${formatDate(budget.startDate)} - ${formatDate(budget.endDate)}`
              : '—'}
          />
          <InfoRow
            label={detailStrings.notifyLabel}
            value={budget.notifyOnExceed ? strings.more.values.enabled : strings.more.values.disabled}
          />
          <InfoRow
            label={detailStrings.linkedGoal}
            value={linkedGoal?.title ?? detailStrings.goalUnlinked}
          />
        </AdaptiveGlassView>

        {/* Actions Section */}
        <AdaptiveGlassView style={[styles.glassSurface, styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.actions.title}</Text>
          <Pressable onPress={handleEdit} style={styles.actionRow}>
            <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.actions.edit}</Text>
          </Pressable>
          <Pressable onPress={handleViewTransactions} style={styles.actionRow}>
            <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
              {detailStrings.actions.viewTransactions}
            </Text>
          </Pressable>
          {linkedGoal && (
            <Pressable onPress={handleViewGoal} style={styles.actionRow}>
              <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.actions.viewGoal}</Text>
            </Pressable>
          )}
          <Pressable onPress={handleDelete} style={[styles.actionRow, styles.dangerRow, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.actionLabel, { color: theme.colors.danger }]}>{detailStrings.actions.delete}</Text>
          </Pressable>
        </AdaptiveGlassView>

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>
          {detailStrings.categoriesLabel}: {budgetCategories.map(c => c.localizedName).join(', ') || '—'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BudgetDetail;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 18,
  },
  section: {
    gap: 6,
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  subtitle: {
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  summaryCard: {
    gap: 12,
  },
  progressContainer: {
    gap: 8,
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  actionRow: {
    paddingVertical: 10,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabledRow: {
    opacity: 0.5,
  },
  dangerRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addValueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  addValueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});
