// src/features/planner/goals/data.ts
import type { AppTranslations } from '@/localization/strings';
import type { Goal as PlannerDomainGoal } from '@/domain/planner/types';
import { calculateGoalProgress } from '@/utils/goalProgress';

export type GoalSummaryRow = {
  label: string;
  value: string;
};

export type GoalMilestone = {
  percent: number;
  label: string;
};

export type GoalHistoryEntry = {
  id: string;
  label: string;
  delta: string;
};

export type Goal = {
  id: string;
  title: string;
  progress: number;
  currentAmount: string;
  targetAmount: string;
  description?: string;
  goalType?: PlannerDomainGoal['goalType'];
  status?: PlannerDomainGoal['status'];
  createdAt?: string;
  targetDate?: string;
  summary: GoalSummaryRow[];
  milestones: GoalMilestone[];
  history: GoalHistoryEntry[];
  aiTip: string;
  aiTipHighlight?: string;
};

export type GoalSection = {
  id: string;
  title: string;
  subtitle: string;
  data: Goal[];
};

const clampPercent = (value?: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value as number, 0), 1);
};

const milestonePercent = (value?: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(Math.round((value as number) * 100), 0), 100);
};

const resolveSectionKey = (goal: PlannerDomainGoal): 'financial' | 'personal' => {
  if (goal.goalType === 'financial') {
    return 'financial';
  }
  return 'personal';
};

const formatMetricValue = (
  goal: PlannerDomainGoal,
  value: number | undefined,
  locale: string,
): string => {
  if (value == null) {
    return '—';
  }
  if (goal.metricType === 'amount' && goal.currency) {
    const maximumFractionDigits = goal.currency === 'UZS' ? 0 : 2;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: goal.currency,
      maximumFractionDigits,
    }).format(value);
  }
  if (goal.unit) {
    return `${Math.round(value)} ${goal.unit}`;
  }
  return `${Math.round(value)}`;
};

export const createGoalSections = (
  strings: AppTranslations['plannerScreens']['goals'],
  domainGoals: PlannerDomainGoal[] = [],
  locale: string,
): GoalSection[] => {
  if (!domainGoals.length) {
    return [];
  }
  const sectionMap = new Map<'financial' | 'personal', GoalSection>();

  domainGoals.forEach((goal) => {
    const sectionKey = resolveSectionKey(goal);
    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        id: sectionKey,
        title: strings.sections[sectionKey].title,
        subtitle: strings.sections[sectionKey].subtitle,
        data: [],
      });
    }
    const progressData = calculateGoalProgress(goal);
    const targetValue = progressData.displayTarget ?? goal.targetValue ?? 0;
    const currentValue = progressData.displayCurrent ?? goal.initialValue ?? undefined;
    const progress = clampPercent(goal.status === 'completed' ? 1 : progressData.progressPercent);
    const leftValue =
      targetValue != null && currentValue != null
        ? goal.direction === 'decrease'
          ? Math.max(currentValue - targetValue, 0)
          : Math.max(targetValue - currentValue, 0)
        : undefined;
    const paceValue =
      goal.stats?.tasksProgressPercent ??
      goal.stats?.habitsProgressPercent ??
      goal.stats?.financialProgressPercent ??
      progress;
    const prediction = goal.targetDate
      ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(
          new Date(goal.targetDate),
        )
      : strings.nextStep.empty;

    const card: Goal = {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      goalType: goal.goalType,
      status: goal.status,
      createdAt: goal.createdAt,
      targetDate: goal.targetDate,
      progress,
      currentAmount: formatMetricValue(goal, currentValue, locale),
      targetAmount: formatMetricValue(goal, targetValue || undefined, locale),
      summary: [
        {
          label: strings.cards.summaryLabels.left,
          value: formatMetricValue(goal, leftValue, locale),
        },
        {
          label: strings.cards.summaryLabels.pace,
          value: `${Math.round(clampPercent(paceValue) * 100)}%`,
        },
        {
          label: strings.cards.summaryLabels.prediction,
          value: prediction,
        },
      ],
      milestones:
        goal.milestones?.map((milestone) => ({
          percent: milestonePercent(milestone.targetPercent),
          label: milestone.title,
        })) ?? [],
      history: [],
      aiTip: strings.nextStep.title,
    };

    sectionMap.get(sectionKey)!.data.push(card);
  });

  return Array.from(sectionMap.values()).filter((section) => section.data.length > 0);
};
