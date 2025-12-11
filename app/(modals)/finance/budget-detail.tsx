import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import type { FinanceCurrency } from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useAppTheme } from '@/constants/theme';
import { formatNumberWithSpaces } from '@/utils/formatNumber';
import * as Progress from 'react-native-progress';

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
  const { convertAmount, globalCurrency } = useFinanceCurrency();

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

  const budgetCurrency = useMemo(
    () =>
      budget
        ? normalizeFinanceCurrency(
            (budget.currency ?? account?.currency ?? globalCurrency) as FinanceCurrency,
          )
        : globalCurrency,
    [account?.currency, budget, globalCurrency],
  );

  const spentValue = useMemo(
    () => convertAmount(budget?.spentAmount ?? 0, budgetCurrency, globalCurrency),
    [budget?.spentAmount, budgetCurrency, convertAmount, globalCurrency],
  );
  const limitValue = useMemo(
    () => convertAmount(budget?.limitAmount ?? 0, budgetCurrency, globalCurrency),
    [budget?.limitAmount, budgetCurrency, convertAmount, globalCurrency],
  );
  const remainingValue = Math.max(limitValue - spentValue, 0);
  const balanceValue = budget?.currentBalance ?? budget?.remainingAmount ?? remainingValue;

  const formatValue = useCallback(
    (value: number) => {
      const formatted = formatNumberWithSpaces(value);
      return `${formatted} ${globalCurrency}`;
    },
    [globalCurrency],
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
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{detailStrings.balanceLabel}</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>{formatValue(balanceValue ?? remainingValue)}</Text>
          </View>
        </AdaptiveGlassView>

        <AdaptiveGlassView style={[styles.glassSurface, styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.title}</Text>
          <InfoRow
            label={detailStrings.accountLabel}
            value={account?.name ?? detailStrings.goalUnlinked}
          />
          <InfoRow label={detailStrings.categoriesLabel} value={(budget.categoryIds ?? []).join(', ') || '—'} />
          <InfoRow
            label={detailStrings.createdAt}
            value={formatDate(budget.createdAt)}
          />
          <InfoRow
            label={detailStrings.updatedAt}
            value={formatDate(budget.updatedAt)}
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

        <AdaptiveGlassView style={[styles.glassSurface, styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.valueAddTitle}</Text>
          <InfoRow
            label={detailStrings.valueAddAccountCurrency}
            value={account?.currency ?? '—'}
          />
          <InfoRow
            label={detailStrings.valueAddBudgetCurrency}
            value={budgetCurrency}
          />
          <InfoRow
            label={detailStrings.valueAddDisplayCurrency}
            value={globalCurrency}
          />
        </AdaptiveGlassView>

        <AdaptiveGlassView style={[styles.glassSurface, styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.actions.title}</Text>
          <Pressable onPress={handleEdit} style={styles.actionRow}>
            <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.actions.edit}</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(modals)/finance/budget-add-value',
                params: { budgetId: budget.id },
              })
            }
            style={styles.actionRow}
          >
            <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
              {isSpendingBudget
                ? (detailStrings.actions.recordExpense ?? 'Record expense')
                : (detailStrings.actions.addToBudget ?? 'Add to budget')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleViewGoal}
            disabled={!linkedGoal}
            style={[styles.actionRow, !linkedGoal && styles.disabledRow]}
          >
            <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>{detailStrings.actions.viewGoal}</Text>
          </Pressable>
          <Pressable onPress={handleDelete} style={[styles.actionRow, styles.dangerRow, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.actionLabel, { color: theme.colors.danger }]}>{detailStrings.actions.delete}</Text>
          </Pressable>
        </AdaptiveGlassView>
      </ScrollView>

      <View style={styles.actionButtons}>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, { borderColor: theme.colors.border }]}
          onPress={handleViewTransactions}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
            {detailStrings.actions.viewTransactions}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, { backgroundColor: theme.colors.primary }]}
          onPress={() =>
            router.push({
              pathname: '/(modals)/finance/budget-add-value',
              params: { budgetId: budget.id },
            })
          }
        >
          <Text style={styles.primaryButtonText}>
            {isSpendingBudget
              ? (detailStrings.actions.recordExpense ?? 'Record expense')
              : (detailStrings.actions.addToBudget ?? 'Add to budget')}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, { paddingBottom: insets.bottom + 8 }]}
      >
        <Text style={[styles.deleteButtonText, { color: theme.colors.danger }]}>{detailStrings.actions.delete}</Text>
      </Pressable>
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    paddingVertical: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
