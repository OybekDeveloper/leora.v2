import { addDays, startOfDay } from '@/utils/calendar';
import type { AddTaskPayload, PlannerTask, PlannerTaskSection, PlannerTaskStatus, TaskEnergyLevel, TaskPriorityLevel } from '@/types/planner';
import type { Task, TaskStatus, TaskChecklistItem } from '@/domain/planner/types';
import type { PlannerHistoryItem } from '@/stores/usePlannerDomainStore';
import type { AppTranslations } from '@/localization/strings';

export type PlannerTaskCard = PlannerTask & { historyId?: string };

const minutesToLabel = (minutes?: number) => {
  if (minutes == null) {
    return '45 min';
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes} min`;
};

const deriveSectionFromTimestamp = (iso?: string, fallback?: number | null): PlannerTaskSection => {
  const ts = iso ? new Date(iso).getTime() : fallback ?? null;
  if (!ts) {
    return 'morning';
  }
  const hour = new Date(ts).getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const formatStartTime = (task: Task) => {
  if (task.timeOfDay) {
    return task.timeOfDay;
  }
  if (task.dueDate) {
    const date = new Date(task.dueDate);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  return 'Anytime';
};

const mapStatusToPlannerStatus = (status: TaskStatus): PlannerTaskStatus => {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'in_progress':
      return 'in_progress';
    case 'archived':
    case 'canceled':
    case 'deleted':
    case 'moved':
      return 'archived';
    default:
      return 'active';
  }
};

const mapEnergy = (level?: 1 | 2 | 3): 1 | 2 | 3 => {
  if (level === 1 || level === 3) {
    return level;
  }
  return 2;
};

export const mapDomainTaskToPlannerTask = (
  task: Task,
  options?: { expandedMap?: Record<string, boolean>; historyId?: string; deletedAt?: number | null },
): PlannerTaskCard => {
  const expandedMap = options?.expandedMap ?? {};
  const dueAtTs = task.dueDate ? new Date(task.dueDate).getTime() : options?.deletedAt ?? null;
  const needFocus = task.needFocus ?? Boolean(task.focusTotalMinutes && task.focusTotalMinutes > 0);
  return {
    id: task.id,
    title: task.title,
    desc: task.notes,
    start: formatStartTime(task),
    duration: minutesToLabel(task.estimatedMinutes),
    context: task.context ?? '@inbox',
    energy: mapEnergy(task.energyLevel),
    projectHeart: task.focusTotalMinutes != null ? task.focusTotalMinutes > 0 : false,
    section: deriveSectionFromTimestamp(task.dueDate, dueAtTs),
    status: mapStatusToPlannerStatus(task.status),
    goalId: task.goalId ?? undefined,
    linkedHabitId: task.habitId ?? undefined,
    milestoneId: undefined,
    aiNote: undefined,
    afterWork: false,
    costUZS: undefined,
    expanded: !!expandedMap[task.id],
    createdAt: new Date(task.createdAt).getTime(),
    updatedAt: new Date(task.updatedAt).getTime(),
    dueAt: dueAtTs,
    deletedAt: options?.deletedAt ?? null,
    focusMeta: task.lastFocusSessionId
      ? {
          isActive: task.status === 'in_progress',
          lastSessionEndedAt: task.lastFocusSessionId ? new Date(task.updatedAt).getTime() : undefined,
        }
      : undefined,
    metadata: needFocus ? { needFocus } : undefined,
    historyId: options?.historyId,
  };
};

export const mapHistoryEntryToPlannerTask = (
  entry: PlannerHistoryItem,
  expandedMap: Record<string, boolean>,
): PlannerTaskCard => {
  const taskSnapshot = entry.snapshot ?? {
    id: entry.taskId,
    title: entry.title,
    status: entry.status as TaskStatus,
    userId: 'local-user',
    priority: 'medium',
    createdAt: entry.timestamp,
    updatedAt: entry.timestamp,
  };
  const deletedAt = entry.action === 'deleted' ? new Date(entry.timestamp).getTime() : null;
  return mapDomainTaskToPlannerTask(taskSnapshot, { expandedMap, historyId: entry.historyId, deletedAt });
};

export const computeDueAtFromPayload = (payload: AddTaskPayload): number | null => {
  try {
    const now = new Date();
    let date = new Date(now);

    if (payload.dateMode === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    } else if (payload.dateMode === 'pick' && payload.date) {
      const parsed = new Date(payload.date);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    if (payload.time) {
      const [hours, minutes] = payload.time.split(':').map(Number);
      if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
        date.setHours(hours, minutes, 0, 0);
        return date.getTime();
      }
    }

    date.setHours(23, 59, 0, 0);
    return date.getTime();
  } catch {
    return null;
  }
};

const deriveTimeFromTask = (task: Task): string | undefined => {
  if (task.timeOfDay) {
    return task.timeOfDay;
  }
  if (task.dueDate) {
    const date = new Date(task.dueDate);
    if (!Number.isNaN(date.getTime())) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
  return undefined;
};

const numberToEnergy = (value?: number): TaskEnergyLevel => {
  if (value === 1) return 'low';
  if (value === 3) return 'high';
  return 'medium';
};

const deriveDateModeFromDueAt = (dueDate?: string): { mode: AddTaskDateMode; iso?: string } => {
  if (!dueDate) {
    return { mode: 'today', iso: undefined };
  }
  const due = new Date(dueDate);
  const today = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(new Date(today), 1));
  const dueDay = startOfDay(due);
  if (dueDay.getTime() === today.getTime()) {
    return { mode: 'today', iso: due.toISOString() };
  }
  if (dueDay.getTime() === tomorrow.getTime()) {
    return { mode: 'tomorrow', iso: due.toISOString() };
  }
  return { mode: 'pick', iso: due.toISOString() };
};

const deriveCategoryFromContext = (context?: string): PlannerTaskCategoryId => {
  switch (context) {
    case '@home':
      return 'personal';
    case '@health':
      return 'health';
    case '@learning':
      return 'learning';
    case '@city':
      return 'errands';
    default:
      return 'work';
  }
};

const mapPriorityToDomain = (priority?: TaskPriorityLevel): Task['priority'] => {
  if (priority === 'low' || priority === 'high') {
    return priority;
  }
  return 'medium';
};

const buildChecklistFromPayload = (payload: AddTaskPayload): TaskChecklistItem[] | undefined => {
  if (!payload.subtasks?.length) {
    return undefined;
  }
  return payload.subtasks.map((title, index) => ({
    id: `subtask-${index}-${Date.now()}`,
    title,
    completed: false,
  }));
};

export const buildDomainTaskInputFromPayload = (
  payload: AddTaskPayload,
  taskStrings: AppTranslations['plannerScreens']['tasks'],
): Partial<Task> => {
  const dueAt = computeDueAtFromPayload(payload);
  const iso = dueAt ? new Date(dueAt).toISOString() : undefined;
  const estimatedMinutes = payload.needFocus ? 50 : 30;
  return {
    title: payload.title || taskStrings.defaults.newTaskTitle,
    dueDate: iso,
    startDate: iso,
    timeOfDay: payload.time,
    estimatedMinutes,
    context: payload.context,
    notes: payload.description,
    energyLevel: payload.energy === 'high' ? 3 : payload.energy === 'low' ? 1 : 2,
    priority: mapPriorityToDomain(payload.priority),
    checklist: buildChecklistFromPayload(payload),
    goalId: payload.goalId,
    needFocus: payload.needFocus,
  };
};

export const buildPayloadFromTask = (
  task: Task,
  taskStrings: AppTranslations['plannerScreens']['tasks'],
): AddTaskPayload => {
  const { mode, iso } = deriveDateModeFromDueAt(task.dueDate);
  return {
    title: task.title,
    dateMode: mode,
    date: iso,
    time: deriveTimeFromTask(task),
    description: task.notes,
    project: undefined,
    context: task.context || taskStrings.defaults.defaultContext,
    energy: numberToEnergy(task.energyLevel),
    priority: task.priority ?? 'medium',
    categoryId: deriveCategoryFromContext(task.context),
    goalId: task.goalId,
    reminderEnabled: false,
    remindBeforeMin: 15,
    repeatEnabled: false,
    repeatRule: 'Everyday',
    needFocus: task.needFocus ?? Boolean(task.focusTotalMinutes && task.focusTotalMinutes > 0),
    subtasks: task.checklist?.map((item) => item.title) ?? [],
  };
};
