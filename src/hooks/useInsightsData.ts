import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type DayPartKey,
  type IndicatorKey,
  type OverviewComponentKey,
  type OverviewQuickWinKey,
  type WeeklyDayKey,
  type SavingKey,
  type OverviewChangeGroupKey,
} from '@/localization/insightsContent';
import { useInsightsContent } from '@/localization/useInsightsContent';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import {
  type FinanceCurrency,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { useInsightsStore } from '@/stores/useInsightsStore';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import { useLocalization } from '@/localization/useLocalization';
import { requestDailyInsights } from '@/services/ai/insightsService';
import { startOfDay } from '@/utils/calendar';
import type {
  Insight,
  InsightCardEntity,
  InsightLevel,
  InsightKind,
  InsightCategory,
} from '@/types/insights';
import { useShallow } from 'zustand/react/shallow';

const WEEK_KEYS: WeeklyDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_PART_KEYS: DayPartKey[] = ['morning', 'day', 'evening', 'night'];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const getWeekdayKey = (date: Date): WeeklyDayKey => WEEK_KEYS[(date.getDay() + 6) % 7]!;

const getDayPartKey = (date: Date): DayPartKey => {
  const hours = date.getHours();
  if (hours < 11) {
    return 'morning';
  }
  if (hours < 17) {
    return 'day';
  }
  if (hours < 22) {
    return 'evening';
  }
  return 'night';
};

type ComponentScoreMap = Partial<Record<OverviewComponentKey, { score: number; progress: number }>>;
type IndicatorScoreMap = Partial<Record<IndicatorKey, { score: number; metric: string }>>;
type WeeklyPatternMap = Partial<Record<WeeklyDayKey, number>>;
type DayPatternMap = Partial<Record<DayPartKey, number>>;
type SavingsMap = Partial<Record<SavingKey, { impactValue: number }>>;
type QuickWinMap = Partial<Record<OverviewQuickWinKey, { impact: string; meta: string }>>;
type ChangeSignalMap = Partial<Record<OverviewChangeGroupKey, string[]>>;

export type InsightCard = InsightCardEntity;

const toneMap: Record<InsightLevel, InsightCard['tone']> = {
  info: 'friend',
  warning: 'polite',
  critical: 'strict',
  celebration: 'friend',
};

const priorityMap: Record<InsightLevel, number> = {
  critical: 10,
  warning: 7,
  celebration: 6,
  info: 5,
};

const categoryMap: Record<InsightKind, InsightCategory> = {
  finance: 'finance',
  planner: 'productivity',
  habit: 'productivity',
  focus: 'productivity',
  combined: 'overview',
  wisdom: 'wisdom',
};

const mapInsightToCard = (insight: Insight): InsightCardEntity => {
  const primaryAction = insight.actions?.[0];
  return {
    id: insight.id,
    title: insight.title,
    body: insight.body,
    tone: toneMap[insight.level],
    category: categoryMap[insight.kind],
    priority: priorityMap[insight.level],
    createdAt: insight.createdAt,
    cta: {
      label: primaryAction?.label ?? 'Открыть',
      action: primaryAction?.action ?? 'open_history',
      targetId: (primaryAction?.payload?.targetId as string | undefined) ?? undefined,
      note: typeof primaryAction?.payload?.note === 'string' ? primaryAction.payload.note : undefined,
    },
    payload: insight.payload,
  };
};

export const useInsightsData = () => {
  const { transactions, debts, budgets, accounts } = useFinanceDomainStore(
    useShallow((state) => ({
      transactions: state.transactions,
      debts: state.debts,
      budgets: state.budgets,
      accounts: state.accounts,
    })),
  );
  const plannerTasks = usePlannerDomainStore((state) => state.tasks);
  const convertAmount = useFinancePreferencesStore((state) => state.convertAmount);
  const globalCurrency = useFinancePreferencesStore((state) => state.globalCurrency);
  const { locale } = useLocalization();
  const content = useInsightsContent();
  const { insights, lastFetchedAt } = useInsightsStore(
    useShallow((state) => ({
      insights: state.insights,
      lastFetchedAt: state.lastFetchedAt,
    })),
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const iso = startOfDay(new Date()).toISOString();
    if (lastFetchedAt === iso) {
      return;
    }
    let isMounted = true;
    setAiLoading(true);
    requestDailyInsights(new Date())
      .catch((error) => {
        if (!isMounted) return;
        setAiError(error instanceof Error ? error.message : 'AiGateway error');
      })
      .finally(() => {
        if (!isMounted) return;
        setAiLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [lastFetchedAt]);

  const refreshAiInsights = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      await requestDailyInsights(new Date(), { force: true });
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AiGateway error');
    } finally {
      setAiLoading(false);
    }
  }, []);

  const summary = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const budgetViews = budgets.map((budget) => {
      const limit = budget.limitAmount ?? 0;
      const spent = budget.spentAmount ?? 0;
      const state = limit > 0 && spent > limit ? 'exceeding' : 'within';
      return {
        id: budget.id,
        name: budget.name,
        limit,
        spent,
        state,
      };
    });
    const tasks = plannerTasks.map((task) => ({
      id: task.id,
      priority: (task.priority ?? 'medium') as 'low' | 'medium' | 'high',
      completed: task.status === 'completed',
    }));

    const currencyFormatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: globalCurrency,
      maximumFractionDigits: globalCurrency === 'UZS' ? 0 : 2,
    });
    const formatCurrency = (value: number) => currencyFormatter.format(value);
    const toGlobal = (amount: number, currency?: string) =>
      convertAmount(amount, normalizeFinanceCurrency(currency as FinanceCurrency), globalCurrency);

    const outcomeTx = transactions.filter((txn) => txn.type === 'expense');
    const incomeTx = transactions.filter((txn) => txn.type === 'income');
    const recentOutcome = outcomeTx.filter((txn) => new Date(txn.date) >= thirtyDaysAgo);
    const recentIncome = incomeTx.filter((txn) => new Date(txn.date) >= thirtyDaysAgo);

    const outcomeLast30 = recentOutcome.reduce((sum, txn) => sum + toGlobal(txn.amount, txn.currency), 0);
    const incomeLast30 = recentIncome.reduce((sum, txn) => sum + toGlobal(txn.amount, txn.currency), 0);

    const accountTotals = accounts.reduce(
      (acc, account) => {
        const value = toGlobal(account.currentBalance, account.currency);
        acc.total += value;
        if (account.accountType === 'savings') {
          acc.savings += value;
        }
        if (account.currency?.toUpperCase() === 'USD') {
          acc.usd += value;
        }
        if (account.accountType === 'cash' || account.accountType === 'card') {
          acc.cash += value;
        }
        return acc;
      },
      { total: 0, savings: 0, cash: 0, usd: 0 },
    );

    const outstandingDebt = debts.reduce(
      (sum, debt) => sum + toGlobal(debt.principalAmount, debt.principalCurrency),
      0,
    );

    const budgetsOverLimit = budgetViews.filter((budget) => budget.spent > budget.limit).length;
    const goalScore = budgetViews.length
      ? clamp01(1 - budgetsOverLimit / budgetViews.length)
      : 0.75;

    const liquidityScore = clamp01(accountTotals.cash / Math.max(outcomeLast30 || 1, 1));
    const savingsScore = clamp01(accountTotals.savings / Math.max(accountTotals.total || 1, 1));
    const debtScore = clamp01(1 - outstandingDebt / Math.max(accountTotals.total + outstandingDebt || 1, 1));
    const capitalScore = clamp01((accountTotals.total - outstandingDebt) / Math.max(accountTotals.total || 1, 1));

    const componentScores: ComponentScoreMap = {
      financial: { score: +(liquidityScore * 10).toFixed(1), progress: liquidityScore },
      productivity: {
        score: +(clamp01(incomeLast30 > 0 ? incomeLast30 / (outcomeLast30 + 1) : 0.6) * 10).toFixed(1),
        progress: clamp01(incomeLast30 > 0 ? incomeLast30 / (outcomeLast30 + incomeLast30) : 0.5),
      },
      balance: {
        score: +(clamp01((accountTotals.cash + accountTotals.savings) / Math.max(outstandingDebt + accountTotals.total, 1)) * 10).toFixed(1),
        progress: clamp01(accountTotals.savings / Math.max(accountTotals.total, 1)),
      },
      goals: { score: +(goalScore * 10).toFixed(1), progress: goalScore },
      discipline: {
        score: +(
          clamp01(
            1 -
              Math.min(
                5,
                (tasks.filter((task) => !task.completed).length || 0) /
                  Math.max(tasks.length || 1, 1),
              ),
          ) *
          10
        ).toFixed(1),
        progress: clamp01(tasks.length ? tasks.filter((task) => task.completed).length / tasks.length : 0.6),
      },
    };

    const weeklyTotals = new Map<WeeklyDayKey, number>();
    const dayPartTotals = new Map<DayPartKey, number>();
    let nightSpending = 0;
    let totalRecentSpending = 0;
    recentOutcome.forEach((txn) => {
      const txnDate = new Date(txn.date);
      if (txnDate < sevenDaysAgo) {
        return;
      }
      const value = toGlobal(txn.amount, txn.currency);
      const weekday = getWeekdayKey(txnDate);
      weeklyTotals.set(weekday, (weeklyTotals.get(weekday) ?? 0) + value);
      const part = getDayPartKey(txnDate);
      dayPartTotals.set(part, (dayPartTotals.get(part) ?? 0) + value);
      totalRecentSpending += value;
      if (part === 'night') {
        nightSpending += value;
      }
    });

    const weeklyPattern: WeeklyPatternMap = {};
    WEEK_KEYS.forEach((key) => {
      weeklyPattern[key] =
        totalRecentSpending > 0 ? (weeklyTotals.get(key) ?? 0) / totalRecentSpending : 1 / WEEK_KEYS.length;
    });

    const dayPattern: DayPatternMap = {};
    DAY_PART_KEYS.forEach((key) => {
      dayPattern[key] =
        totalRecentSpending > 0 ? (dayPartTotals.get(key) ?? 0) / totalRecentSpending : 1 / DAY_PART_KEYS.length;
    });

    const indicatorScores: IndicatorScoreMap = {
      liquidity: { score: liquidityScore, metric: formatCurrency(accountTotals.cash) },
      savings: { score: savingsScore, metric: formatCurrency(accountTotals.savings) },
      debt: { score: debtScore, metric: outstandingDebt ? formatCurrency(outstandingDebt) : content.finance.indicators.debt.metric },
      capital: { score: capitalScore, metric: formatCurrency(accountTotals.total) },
      goals: { score: goalScore, metric: `${Math.round(goalScore * 100)}%` },
    };

    const savingsMap: SavingsMap = {};
    budgetViews.forEach((budget) => {
      const over = Math.max(0, budget.spent - budget.limit);
      if (!over) {
        return;
      }
      if (budget.name.toLowerCase().includes('subscription')) {
        savingsMap.subscriptions = { impactValue: (savingsMap.subscriptions?.impactValue ?? 0) + over };
      } else if (budget.name.toLowerCase().includes('food')) {
        savingsMap.food = { impactValue: (savingsMap.food?.impactValue ?? 0) + over };
      } else if (budget.name.toLowerCase().includes('transport')) {
        savingsMap.transport = { impactValue: (savingsMap.transport?.impactValue ?? 0) + over };
      } else if (budget.name.toLowerCase().includes('coffee')) {
        savingsMap.coffee = { impactValue: (savingsMap.coffee?.impactValue ?? 0) + over };
      }
    });

    const quickWinMap: QuickWinMap = {
      tasks: {
        impact: `${tasks.filter((task) => task.priority === 'high').length} high-priority`,
        meta: `${tasks.filter((task) => !task.completed).length} open`,
      },
      coffee: {
        impact: formatCurrency(savingsMap.coffee?.impactValue ?? 0),
        meta: content.overview.quickWins.items.coffee.meta,
      },
      meditation: {
        impact: content.overview.quickWins.items.meditation.impact,
        meta: content.overview.quickWins.items.meditation.meta,
      },
      reading: {
        impact: content.overview.quickWins.items.reading.impact,
        meta: content.overview.quickWins.items.reading.meta,
      },
    };

    const changeSignals: ChangeSignalMap = {
      upgrades: budgetViews
        .filter((budget) => budget.state === 'within')
        .map((budget) => {
          const remaining = budget.limit > 0 ? Math.round((1 - budget.spent / budget.limit) * 100) : 100;
          return `${budget.name}: ${remaining}% free`;
        }),
      attention: budgetViews
        .filter((budget) => budget.state === 'exceeding')
        .map((budget) => `${budget.name}: ${formatCurrency(budget.spent - budget.limit)} over`),
    };

    const cards: InsightCard[] = [];
    const nightShare = totalRecentSpending > 0 ? nightSpending / totalRecentSpending : 0;
    if (nightShare > 0.35 && content.scenarios?.nightSpending) {
      const scenario = content.scenarios.nightSpending;
      cards.push({
        id: 'night-spending',
        title: scenario.title,
        body: scenario.tones.friend.replace('{percent}', `${Math.round(nightShare * 100)}%`),
        tone: 'friend',
        category: 'finance',
        priority: 4,
        createdAt: new Date().toISOString(),
        cta: { label: scenario.cta, action: 'review_budget' },
        push: scenario.push,
        explain: scenario.explain,
      });
    }

    const lastExpense = outcomeTx[0] ? new Date(outcomeTx[0].date) : null;
    const daysSinceLastExpense = lastExpense
      ? Math.floor((now.getTime() - lastExpense.getTime()) / (24 * 60 * 60 * 1000))
      : 10;
    if (daysSinceLastExpense >= 2 && content.scenarios?.missingExpense) {
      const scenario = content.scenarios.missingExpense;
      cards.push({
        id: 'missing-expense',
        title: scenario.title,
        body: scenario.tones.polite.replace('{days}', `${daysSinceLastExpense}`),
        tone: 'polite',
        category: 'finance',
        priority: 3,
        createdAt: new Date().toISOString(),
        cta: { label: scenario.cta, action: 'quick_add' },
        push: scenario.push,
        explain: scenario.explain.replace('{days}', `${daysSinceLastExpense}`),
      });
    }

    const usdDebt = debts.find((debt) => {
      if (!debt.dueDate) {
        return false;
      }
      const diff =
        new Date(debt.dueDate).setHours(0, 0, 0, 0) -
        now.setHours(0, 0, 0, 0);
      return (
        Math.round(diff / (24 * 60 * 60 * 1000)) <= 3 &&
        normalizeFinanceCurrency(debt.principalCurrency as FinanceCurrency) === 'USD'
      );
    });
    if (usdDebt && content.scenarios?.usdPayment) {
      const scenario = content.scenarios.usdPayment;
      const debitNeeded = toGlobal(usdDebt.principalAmount, usdDebt.principalCurrency);
      if (accountTotals.usd < debitNeeded) {
        cards.push({
          id: `usd-payment-${usdDebt.id}`,
          title: scenario.title,
          body: scenario.tones.strict.replace(
            '{amount}',
            formatCurrency(debitNeeded - accountTotals.usd),
          ),
          tone: 'strict',
          category: 'finance',
          priority: 5,
          createdAt: new Date().toISOString(),
          cta: { label: scenario.cta, action: 'open_exchange' },
          push: scenario.push,
          explain: scenario.explain.replace(
            '{balance}',
            formatCurrency(accountTotals.usd),
          ),
        });
      }
    }

    const dueTomorrow = debts.find((debt) => {
      if (!debt.dueDate) {
        return false;
      }
      const due = new Date(debt.dueDate);
      const diffDays = Math.round(
        (due.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) /
          (24 * 60 * 60 * 1000),
      );
      return diffDays === 1;
    });
    if (dueTomorrow && content.scenarios?.debtDueTomorrow) {
      const scenario = content.scenarios.debtDueTomorrow;
      cards.push({
        id: `debt-due-${dueTomorrow.id}`,
        title: scenario.title,
        body: scenario.tones.friend.replace('{name}', dueTomorrow.counterpartyName),
        tone: 'friend',
        category: 'finance',
        priority: 6,
        createdAt: new Date().toISOString(),
        cta: { label: scenario.cta, action: 'open_debt', targetId: dueTomorrow.id },
        payload: { debtId: dueTomorrow.id },
        push: scenario.push,
        explain: scenario.explain.replace(
          '{amount}',
          formatCurrency(toGlobal(dueTomorrow.principalAmount, dueTomorrow.principalCurrency)),
        ),
      });
    }

    const healthScore = +(
      ((liquidityScore + savingsScore + debtScore + capitalScore + goalScore) / 5) *
      10
    ).toFixed(1);

    return {
      overviewData: {
        score: healthScore,
        components: componentScores,
        quickWins: quickWinMap,
        changeSignals,
      },
      financeData: {
        healthScore,
        indicators: indicatorScores,
        weeklyPattern,
        dayPattern,
        savings: savingsMap,
        formatCurrency,
      },
      cards,
    };
  }, [
    accounts,
    budgets,
    content,
    convertAmount,
    debts,
    globalCurrency,
    locale,
    plannerTasks,
    transactions,
    insights,
  ]);

  const { overviewData, financeData, cards: fallbackCards } = summary;

  const aiCards = useMemo(() => {
    const dailyInsights = insights.filter((insight) => insight.scope === 'daily');
    return dailyInsights.map(mapInsightToCard);
  }, [insights]);

  const cards = aiCards.length > 0 ? aiCards : fallbackCards;

  return {
    overviewData,
    financeData,
    cards,
    isAiLoading: aiLoading,
    aiError,
    refreshAiInsights,
  };
};

export default useInsightsData;
