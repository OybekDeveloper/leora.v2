import type { Goal } from '@/domain/planner/types';

const clamp01 = (value?: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value == null) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const sumCheckIns = (goal: Goal) =>
  (goal.checkIns ?? []).reduce((sum, entry) => sum + (entry.value ?? 0), 0);

const resolveProgressTarget = (goal: Goal) => {
  if (Number.isFinite(goal.progressTargetValue)) {
    return goal.progressTargetValue as number;
  }
  const target = goal.targetValue ?? 0;
  const initial = goal.initialValue ?? 0;

  if (goal.direction === 'decrease') {
    const delta = initial - target;
    if (delta > 0) return delta;
    return target > 0 ? target : 0;
  }

  if (goal.direction === 'increase') {
    const delta = target - initial;
    if (delta > 0) return delta;
    return target > 0 ? target : 0;
  }

  return target > 0 ? target : 0;
};

export const calculateGoalProgress = (goal: Goal) => {
  const progressTargetValue = resolveProgressTarget(goal);
  const checkInTotal = sumCheckIns(goal);
  const hasCheckIns = (goal.checkIns?.length ?? 0) > 0;
  let progressValue = 0;

  if (hasCheckIns) {
    progressValue = checkInTotal;
  } else if (Number.isFinite(goal.currentValue)) {
    const measurement = goal.currentValue as number;
    if (goal.direction === 'decrease') {
      progressValue = Math.max((goal.initialValue ?? 0) - measurement, 0);
    } else if (goal.direction === 'increase') {
      progressValue = Math.max(measurement - (goal.initialValue ?? 0), 0);
    } else {
      progressValue = Math.max(measurement, 0);
    }
  }

  const progressPercent = progressTargetValue > 0 ? clamp01(progressValue / progressTargetValue) : 0;

  // Translate progressValue into the actual metric the user expects to see
  const base = goal.initialValue ?? 0;
  const displayCurrent = goal.direction === 'decrease'
    ? Math.max(base - progressValue, 0)
    : base + progressValue;
  const displayTarget = goal.targetValue ?? progressTargetValue;

  return {
    progressValue,
    progressTargetValue,
    progressPercent,
    displayCurrent,
    displayTarget,
  };
};

export const syncGoalMilestones = (goal: Goal) => {
  const { progressPercent } = calculateGoalProgress(goal);
  if (!goal.milestones?.length) return goal.milestones;

  const now = new Date().toISOString();
  return goal.milestones.map((milestone) => {
    if (milestone.completedAt) {
      return milestone;
    }
    const reached = progressPercent * 100 >= milestone.targetPercent;
    return reached ? { ...milestone, completedAt: now } : milestone;
  });
};
