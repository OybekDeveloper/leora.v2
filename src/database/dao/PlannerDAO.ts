import Realm, { BSON } from 'realm';

import type { Goal, Habit, Task, FocusSession, GoalMilestone, GoalStats, HabitCompletionStatus, GoalCheckIn, HabitCompletionEntry } from '@/domain/planner/types';
import { fromObjectId, toISODate, toObjectId } from './helpers';

const defaultUserId = 'local-user';

const hasRealmInstance = (realm: Realm | null): realm is Realm => Boolean(realm && !realm.isClosed);

const mapGoalCheckIn = (record: any): GoalCheckIn => ({
  id: fromObjectId(record.checkInId)!,
  goalId: fromObjectId(record.goalId)!,
  value: record.value ?? 0,
  note: record.note ?? undefined,
  sourceType: record.sourceType,
  sourceId: fromObjectId(record.sourceId) ?? undefined,
  dateKey: record.dateKey ?? undefined,
  createdAt: toISODate(record.createdAt)!,
});

const mapGoal = (record: any): Goal => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  title: record.title,
  description: record.description ?? undefined,
  goalType: record.goalType,
  status: record.status,
  metricType: record.metricType,
  direction: record.direction ?? 'increase',
  unit: record.unit ?? undefined,
  initialValue: record.initialValue ?? undefined,
  targetValue: record.targetValue ?? undefined,
  progressTargetValue: record.progressTargetValue ?? undefined,
  currentValue: record.currentValue ?? 0,
  financeMode: record.financeMode ?? undefined,
  currency: record.currency ?? undefined,
  linkedBudgetId: fromObjectId(record.linkedBudgetId),
  linkedHabitIds: record.linkedHabitIds?.map((id: BSON.ObjectId) => id.toHexString()) ?? [],
  linkedTaskIds: record.linkedTaskIds?.map((id: BSON.ObjectId) => id.toHexString()) ?? [],
  startDate: toISODate(record.startDate) ?? undefined,
  targetDate: toISODate(record.targetDate) ?? undefined,
  completedDate: toISODate(record.completedDate) ?? undefined,
  progressPercent: record.progressPercent ?? 0,
  stats: {
    financialProgressPercent: record.stats?.financialProgressPercent ?? undefined,
    habitsProgressPercent: record.stats?.habitsProgressPercent ?? undefined,
    tasksProgressPercent: record.stats?.tasksProgressPercent ?? undefined,
    focusMinutesLast30: record.stats?.focusMinutesLast30 ?? undefined,
  } satisfies GoalStats,
  milestones:
    record.milestones?.map(
      (milestone: any): GoalMilestone => ({
        id: fromObjectId(milestone.milestoneId)!,
        title: milestone.title,
        description: milestone.description ?? undefined,
        targetPercent: milestone.targetPercent,
        dueDate: toISODate(milestone.dueDate) ?? undefined,
        completedAt: toISODate(milestone.completedAt) ?? undefined,
      }),
    ) ?? [],
  checkIns: record.checkIns?.map(mapGoalCheckIn) ?? [],
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapHabitCompletion = (record: any) => ({
  dateKey: record.dateKey,
  status: record.status as HabitCompletionStatus,
  value: record.value ?? undefined,
});

const mapHabit = (record: any): Habit => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  title: record.title,
  description: record.description ?? undefined,
  iconId: record.iconId ?? undefined,
  habitType: record.habitType,
  status: record.status,
  goalId: fromObjectId(record.goalId),
  linkedGoalIds: record.linkedGoalIds?.map((id: BSON.ObjectId) => id.toHexString()) ?? [],
  frequency: record.frequency,
  daysOfWeek: record.daysOfWeek ?? [],
  timesPerWeek: record.timesPerWeek ?? undefined,
  timeOfDay: record.timeOfDay ?? undefined,
  completionMode: record.completionMode,
  targetPerDay: record.targetPerDay ?? undefined,
  unit: record.unit ?? undefined,
  financeRule: record.financeRule ?? undefined,
  challengeLengthDays: record.challengeLengthDays ?? undefined,
  streakCurrent: record.streakCurrent ?? 0,
  streakBest: record.streakBest ?? 0,
  completionRate30d: record.completionRate30d ?? 0,
  completionHistory: record.completionHistory?.map(mapHabitCompletion).reduce<Record<string, HabitCompletionEntry>>((acc, entry) => {
    acc[entry.dateKey] = { status: entry.status, value: entry.value };
    return acc;
  }, {}) ?? {},
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapTask = (record: any): Task => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  title: record.title,
  status: record.status,
  priority: record.priority,
  goalId: fromObjectId(record.goalId),
  habitId: fromObjectId(record.habitId),
  financeLink: record.financeLink ?? undefined,
  progressValue: record.progressValue ?? undefined,
  progressUnit: record.progressUnit ?? undefined,
  dueDate: toISODate(record.dueDate) ?? undefined,
  startDate: toISODate(record.startDate) ?? undefined,
  timeOfDay: record.timeOfDay ?? undefined,
  estimatedMinutes: record.estimatedMinutes ?? undefined,
  energyLevel: record.energyLevel ?? undefined,
  checklist:
    record.checklist?.map((item: any) => ({
      id: fromObjectId(item.itemId)!,
      title: item.title,
      completed: Boolean(item.completed),
    })) ?? [],
  dependencies:
    record.dependencies?.map((dep: any) => ({
      id: fromObjectId(dep.dependencyId)!,
      taskId: fromObjectId(dep.taskId)!,
      status: dep.status,
    })) ?? [],
  lastFocusSessionId: fromObjectId(record.lastFocusSessionId),
  focusTotalMinutes: record.focusTotalMinutes ?? 0,
  context: record.context ?? undefined,
  notes: record.notes ?? undefined,
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

const mapFocusSession = (record: any): FocusSession => ({
  id: fromObjectId(record._id)!,
  userId: record.userId ?? defaultUserId,
  taskId: fromObjectId(record.taskId),
  goalId: fromObjectId(record.goalId),
  plannedMinutes: record.plannedMinutes ?? 0,
  actualMinutes: record.actualMinutes ?? 0,
  status: record.status,
  startedAt: toISODate(record.startedAt)!,
  endedAt: toISODate(record.endedAt) ?? undefined,
  interruptionsCount: record.interruptionsCount ?? 0,
  notes: record.notes ?? undefined,
  createdAt: toISODate(record.createdAt)!,
  updatedAt: toISODate(record.updatedAt)!,
});

export class GoalDAO {
  constructor(private realm: Realm) {}

  list(): Goal[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('Goal').map(mapGoal);
  }

  create(
    input: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'milestones' | 'stats' | 'checkIns'> & {
      id?: string;
      stats?: GoalStats;
      milestones?: GoalMilestone[];
      checkIns?: GoalCheckIn[];
    },
  ): Goal {
    const now = new Date();
    let created: any;
    this.realm.write(() => {
      created = this.realm.create('Goal', {
        _id: toObjectId(input.id) ?? new BSON.ObjectId(),
        userId: input.userId ?? defaultUserId,
        title: input.title,
        description: input.description ?? null,
        goalType: input.goalType,
        status: input.status,
        metricType: input.metricType,
        direction: input.direction ?? 'increase',
        unit: input.unit ?? null,
        initialValue: input.initialValue ?? null,
        targetValue: input.targetValue ?? null,
        progressTargetValue: input.progressTargetValue ?? null,
        currentValue: input.currentValue ?? 0,
        financeMode: input.financeMode ?? null,
        currency: input.currency ?? null,
        linkedBudgetId: toObjectId(input.linkedBudgetId),
        linkedHabitIds: input.linkedHabitIds?.map(toObjectId).filter(Boolean) ?? [],
        linkedTaskIds: input.linkedTaskIds?.map(toObjectId).filter(Boolean) ?? [],
        startDate: input.startDate ? new Date(input.startDate) : null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        completedDate: input.completedDate ? new Date(input.completedDate) : null,
        progressPercent: input.progressPercent ?? 0,
        stats: {
          financialProgressPercent: input.stats?.financialProgressPercent ?? 0,
          habitsProgressPercent: input.stats?.habitsProgressPercent ?? 0,
          tasksProgressPercent: input.stats?.tasksProgressPercent ?? 0,
          focusMinutesLast30: input.stats?.focusMinutesLast30 ?? 0,
        },
        milestones:
          input.milestones?.map((milestone) => ({
            milestoneId: new BSON.ObjectId(),
            title: milestone.title,
            description: milestone.description ?? null,
            targetPercent: milestone.targetPercent,
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
            completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
          })) ?? [],
        checkIns:
          input.checkIns?.map((entry) => ({
            checkInId: toObjectId(entry.id) ?? new BSON.ObjectId(),
            goalId: toObjectId(entry.goalId) ?? new BSON.ObjectId(),
            value: entry.value,
            note: entry.note ?? null,
            sourceType: entry.sourceType,
            sourceId: toObjectId(entry.sourceId),
            dateKey: entry.dateKey ?? null,
            createdAt: entry.createdAt ? new Date(entry.createdAt) : now,
          })) ?? [],
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
      });
    });
    return mapGoal(created);
  }

  upsert(goal: Goal): Goal {
    if (!hasRealmInstance(this.realm)) {
      return goal;
    }
    const now = new Date();
    let stored: any;
    this.realm.write(() => {
      stored = this.realm.create(
        'Goal',
        {
          _id: toObjectId(goal.id) ?? new BSON.ObjectId(),
          userId: goal.userId ?? defaultUserId,
          title: goal.title,
          description: goal.description ?? null,
          goalType: goal.goalType,
          status: goal.status,
          metricType: goal.metricType,
          direction: goal.direction ?? 'increase',
          unit: goal.unit ?? null,
          initialValue: goal.initialValue ?? null,
          targetValue: goal.targetValue ?? null,
          progressTargetValue: goal.progressTargetValue ?? null,
          currentValue: goal.currentValue ?? 0,
          financeMode: goal.financeMode ?? null,
          currency: goal.currency ?? null,
          linkedBudgetId: toObjectId(goal.linkedBudgetId),
          linkedHabitIds: goal.linkedHabitIds?.map(toObjectId).filter(Boolean) ?? [],
          linkedTaskIds: goal.linkedTaskIds?.map(toObjectId).filter(Boolean) ?? [],
          startDate: goal.startDate ? new Date(goal.startDate) : null,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
          completedDate: goal.completedDate ? new Date(goal.completedDate) : null,
          progressPercent: goal.progressPercent ?? 0,
          stats: {
            financialProgressPercent: goal.stats?.financialProgressPercent ?? 0,
            habitsProgressPercent: goal.stats?.habitsProgressPercent ?? 0,
            tasksProgressPercent: goal.stats?.tasksProgressPercent ?? 0,
            focusMinutesLast30: goal.stats?.focusMinutesLast30 ?? 0,
          },
          milestones:
            goal.milestones?.map((milestone) => ({
              milestoneId: toObjectId(milestone.id) ?? new BSON.ObjectId(),
              title: milestone.title,
              description: milestone.description ?? null,
              targetPercent: milestone.targetPercent,
              dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
              completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
            })) ?? [],
          checkIns:
            goal.checkIns?.map((entry) => ({
              checkInId: toObjectId(entry.id) ?? new BSON.ObjectId(),
              goalId: toObjectId(entry.goalId) ?? new BSON.ObjectId(),
              value: entry.value,
              note: entry.note ?? null,
              sourceType: entry.sourceType,
              sourceId: toObjectId(entry.sourceId),
              dateKey: entry.dateKey ?? null,
              createdAt: entry.createdAt ? new Date(entry.createdAt) : now,
            })) ?? [],
          createdAt: goal.createdAt ? new Date(goal.createdAt) : now,
          updatedAt: goal.updatedAt ? new Date(goal.updatedAt) : now,
          syncStatus: 'local',
        },
        Realm.UpdateMode.Modified,
      );
    });
    return mapGoal(stored);
  }

  delete(id: string) {
    if (!hasRealmInstance(this.realm)) {
      return;
    }
    const target = this.realm.objectForPrimaryKey('Goal', toObjectId(id)!);
    if (!target) return;
    this.realm.write(() => {
      this.realm.delete(target);
    });
  }
}

export class HabitDAO {
  constructor(private realm: Realm) {}

  list(): Habit[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('Habit').map(mapHabit);
  }

  upsert(habit: Habit): Habit {
    if (!hasRealmInstance(this.realm)) {
      return habit;
    }
    const now = new Date();
    let stored: any;
    this.realm.write(() => {
      stored = this.realm.create(
        'Habit',
        {
          _id: toObjectId(habit.id) ?? new BSON.ObjectId(),
          userId: habit.userId ?? defaultUserId,
          title: habit.title,
          description: habit.description ?? null,
          iconId: habit.iconId ?? null,
          habitType: habit.habitType,
          status: habit.status,
          goalId: toObjectId(habit.goalId),
          linkedGoalIds: habit.linkedGoalIds?.map(toObjectId).filter(Boolean) ?? [],
          frequency: habit.frequency,
          daysOfWeek: habit.daysOfWeek ?? [],
          timesPerWeek: habit.timesPerWeek ?? null,
          timeOfDay: habit.timeOfDay ?? null,
          completionMode: habit.completionMode,
          targetPerDay: habit.targetPerDay ?? null,
          unit: habit.unit ?? null,
          financeRule: habit.financeRule ?? null,
          challengeLengthDays: habit.challengeLengthDays ?? null,
          streakCurrent: habit.streakCurrent ?? 0,
          streakBest: habit.streakBest ?? 0,
          completionRate30d: habit.completionRate30d ?? 0,
          completionHistory:
            habit.completionHistory
              ? Object.entries(habit.completionHistory).map(([dateKey, entry]) => ({
                  entryId: new BSON.ObjectId(),
                  dateKey,
                  status: typeof entry === 'string' ? entry : entry.status,
                  value: typeof entry === 'object' ? entry.value ?? null : null,
                }))
              : [],
          createdAt: habit.createdAt ? new Date(habit.createdAt) : now,
          updatedAt: habit.updatedAt ? new Date(habit.updatedAt) : now,
          syncStatus: 'local',
        },
        Realm.UpdateMode.Modified,
      );
    });
    return mapHabit(stored);
  }

  delete(id: string) {
    if (!hasRealmInstance(this.realm)) {
      return;
    }
    const target = this.realm.objectForPrimaryKey('Habit', toObjectId(id)!);
    if (!target) return;
    this.realm.write(() => this.realm.delete(target));
  }
}

export class TaskDAO {
  constructor(private realm: Realm) {}

  list(): Task[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('Task').map(mapTask);
  }

  upsert(task: Task): Task {
    if (!hasRealmInstance(this.realm)) {
      return task;
    }
    const now = new Date();
    let stored: any;
    this.realm.write(() => {
      stored = this.realm.create(
        'Task',
        {
          _id: toObjectId(task.id) ?? new BSON.ObjectId(),
          userId: task.userId ?? defaultUserId,
          title: task.title,
          status: task.status,
          priority: task.priority,
          goalId: toObjectId(task.goalId),
          habitId: toObjectId(task.habitId),
          financeLink: task.financeLink ?? null,
          progressValue: task.progressValue ?? null,
          progressUnit: task.progressUnit ?? null,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          startDate: task.startDate ? new Date(task.startDate) : null,
          timeOfDay: task.timeOfDay ?? null,
          estimatedMinutes: task.estimatedMinutes ?? null,
          energyLevel: task.energyLevel ?? null,
          checklist:
            task.checklist?.map((item) => ({
              itemId: toObjectId(item.id) ?? new BSON.ObjectId(),
              title: item.title,
              completed: Boolean(item.completed),
            })) ?? [],
          dependencies:
            task.dependencies?.map((dep) => ({
              dependencyId: toObjectId(dep.id) ?? new BSON.ObjectId(),
              taskId: toObjectId(dep.taskId) ?? new BSON.ObjectId(),
              status: dep.status,
            })) ?? [],
          lastFocusSessionId: toObjectId(task.lastFocusSessionId),
          focusTotalMinutes: task.focusTotalMinutes ?? 0,
          context: task.context ?? null,
          notes: task.notes ?? null,
          createdAt: task.createdAt ? new Date(task.createdAt) : now,
          updatedAt: task.updatedAt ? new Date(task.updatedAt) : now,
          syncStatus: 'local',
        },
        Realm.UpdateMode.Modified,
      );
    });
    return mapTask(stored);
  }

  delete(id: string) {
    if (!hasRealmInstance(this.realm)) {
      return;
    }
    const target = this.realm.objectForPrimaryKey('Task', toObjectId(id)!);
    if (!target) return;
    this.realm.write(() => this.realm.delete(target));
  }
}

export class FocusSessionDAO {
  constructor(private realm: Realm) {}

  list(): FocusSession[] {
    if (!hasRealmInstance(this.realm)) {
      return [];
    }
    return this.realm.objects('FocusSession').map(mapFocusSession);
  }
}
