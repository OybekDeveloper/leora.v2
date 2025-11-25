import { BSON, ObjectSchema } from 'realm';

const objectId = () => new BSON.ObjectId();
const now = () => new Date();

export const GoalStatsSchema: ObjectSchema = {
  name: 'GoalStats',
  embedded: true,
  properties: {
    financialProgressPercent: 'double?',
    habitsProgressPercent: 'double?',
    tasksProgressPercent: 'double?',
    focusMinutesLast30: 'double?',
  },
};

export const GoalMilestoneSchema: ObjectSchema = {
  name: 'GoalMilestone',
  embedded: true,
  properties: {
    milestoneId: { type: 'objectId', default: objectId },
    title: 'string',
    description: 'string?',
    targetPercent: 'double',
    dueDate: 'date?',
    completedAt: 'date?',
  },
};

export const GoalCheckInSchema: ObjectSchema = {
  name: 'GoalCheckIn',
  embedded: true,
  properties: {
    checkInId: { type: 'objectId', default: objectId },
    goalId: 'objectId',
    value: 'double',
    note: 'string?',
    sourceType: 'string',
    sourceId: 'objectId?',
    dateKey: 'string?',
    createdAt: { type: 'date', default: now },
  },
};

export const GoalSchema: ObjectSchema = {
  name: 'Goal',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    title: 'string',
    description: 'string?',
  goalType: 'string',
  status: 'string',
  metricType: 'string',
  direction: { type: 'string', default: 'increase' },
  unit: 'string?',
  initialValue: 'double?',
  targetValue: 'double?',
  progressTargetValue: 'double?',
  currentValue: { type: 'double', default: 0 },
    financeMode: 'string?',
    currency: 'string?',
    linkedBudgetId: 'objectId?',
    linkedDebtId: 'objectId?',
    linkedHabitIds: 'objectId[]',
    linkedTaskIds: 'objectId[]',
    financeContributionIds: 'string[]',
    startDate: 'date?',
    targetDate: 'date?',
    completedDate: 'date?',
    progressPercent: { type: 'double', default: 0 },
    stats: 'GoalStats',
    milestones: { type: 'list', objectType: 'GoalMilestone' },
    checkIns: { type: 'list', objectType: 'GoalCheckIn' },
    idempotencyKey: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const HabitFinanceRuleSchema: ObjectSchema = {
  name: 'HabitFinanceRule',
  embedded: true,
  properties: {
    rule: 'string',
    categories: 'string[]',
    thresholdAmount: 'double?',
    currency: 'string?',
  },
};

export const HabitCompletionSchema: ObjectSchema = {
  name: 'HabitCompletion',
  embedded: true,
  properties: {
    entryId: { type: 'objectId', default: objectId },
    dateKey: 'string',
    status: 'string',
    value: 'double?',
  },
};

export const HabitSchema: ObjectSchema = {
  name: 'Habit',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    title: 'string',
    description: 'string?',
    iconId: 'string?',
    habitType: 'string',
    status: 'string',
    goalId: 'objectId?',
    linkedGoalIds: 'objectId[]',
    frequency: 'string',
    daysOfWeek: 'int[]',
    timesPerWeek: 'int?',
    timeOfDay: 'string?',
    completionMode: 'string',
    targetPerDay: 'double?',
    unit: 'string?',
    financeRule: 'HabitFinanceRule?',
    challengeLengthDays: 'int?',
    streakCurrent: { type: 'int', default: 0 },
    streakBest: { type: 'int', default: 0 },
    completionRate30d: { type: 'double', default: 0 },
    completionHistory: { type: 'list', objectType: 'HabitCompletion' },
    idempotencyKey: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const TaskChecklistItemSchema: ObjectSchema = {
  name: 'TaskChecklistItem',
  embedded: true,
  properties: {
    itemId: { type: 'objectId', default: objectId },
    title: 'string',
    completed: { type: 'bool', default: false },
  },
};

export const TaskDependencySchema: ObjectSchema = {
  name: 'TaskDependency',
  embedded: true,
  properties: {
    dependencyId: { type: 'objectId', default: objectId },
    taskId: 'objectId',
    status: 'string',
  },
};

export const TaskSchema: ObjectSchema = {
  name: 'Task',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    title: 'string',
    status: 'string',
    priority: 'string',
    goalId: 'objectId?',
    habitId: 'objectId?',
    financeLink: 'string?',
    progressValue: 'double?',
    progressUnit: 'string?',
    dueDate: 'date?',
    startDate: 'date?',
    timeOfDay: 'string?',
    estimatedMinutes: 'int?',
    energyLevel: 'int?',
    checklist: { type: 'list', objectType: 'TaskChecklistItem' },
    dependencies: { type: 'list', objectType: 'TaskDependency' },
    lastFocusSessionId: 'objectId?',
    focusTotalMinutes: { type: 'int', default: 0 },
    context: 'string?',
    notes: 'string?',
    idempotencyKey: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const FocusSessionSchema: ObjectSchema = {
  name: 'FocusSession',
  primaryKey: '_id',
  properties: {
    _id: { type: 'objectId', default: objectId },
    userId: 'string',
    taskId: 'objectId?',
    goalId: 'objectId?',
    plannedMinutes: 'int',
    actualMinutes: { type: 'int', default: 0 },
    status: 'string',
    startedAt: 'date',
    endedAt: 'date?',
    interruptionsCount: { type: 'int', default: 0 },
    notes: 'string?',
    idempotencyKey: 'string?',
    createdAt: { type: 'date', default: now },
    updatedAt: { type: 'date', default: now },
    syncStatus: { type: 'string', default: 'local' },
  },
};

export const plannerSchemas = [
  GoalStatsSchema,
  GoalMilestoneSchema,
  GoalCheckInSchema,
  GoalSchema,
  HabitFinanceRuleSchema,
  HabitCompletionSchema,
  HabitSchema,
  TaskChecklistItemSchema,
  TaskDependencySchema,
  TaskSchema,
  FocusSessionSchema,
];
