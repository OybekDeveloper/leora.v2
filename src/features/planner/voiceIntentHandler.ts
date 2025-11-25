import { addDays, startOfDay } from '@/utils/calendar';
import { usePlannerFocusBridge } from '@/features/planner/useFocusTaskBridge';
import {
  PlannerVoiceGoal,
  PlannerVoiceHabit,
  usePlannerVoiceActionStore,
} from '@/features/planner/useVoiceActionLog';
import { plannerService } from '@/features/planner/services/plannerService';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

type PlannerVoiceResult = {
  success: boolean;
  message: string;
};

type ParsedCommand =
  | { kind: 'task'; title: string; date: Date }
  | { kind: 'habit'; title: string; schedule?: string }
  | { kind: 'goal'; title: string; deadlineLabel?: string }
  | { kind: 'focus'; title: string; duration?: number };

const MONTH_MAP: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const extractQuoted = (input: string) => {
  const match = input.match(/["“”](.+?)["“”]/);
  if (match) return match[1];
  const afterKeywords = input.match(/task\s+(.+)/i);
  if (afterKeywords) return afterKeywords[1];
  return undefined;
};

const parseDateFromCommand = (lower: string) => {
  const now = startOfDay(new Date());
  if (lower.includes('tomorrow')) {
    return addDays(now, 1);
  }
  if (lower.includes('next week')) {
    return addDays(now, 7);
  }
  const monthMatch = lower.match(/by\s+([a-z]+)/);
  if (monthMatch) {
    const month = MONTH_MAP[monthMatch[1] ?? ''];
    if (month != null) {
      return new Date(now.getFullYear(), month, 1);
    }
  }
  return now;
};

const parseTimeFromCommand = (lower: string, date: Date) => {
  const timeMatch = lower.match(/(\d{1,2})(?::|\.| )(\\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    const hour = Number(timeMatch[1]);
    const minutes = timeMatch[2] ? Number(timeMatch[2]) : 0;
    let parsedHour = hour;
    const suffix = timeMatch[3]?.toLowerCase();
    if (suffix === 'pm' && parsedHour < 12) parsedHour += 12;
    if (suffix === 'am' && parsedHour === 12) parsedHour = 0;
    date.setHours(parsedHour, minutes, 0, 0);
  } else {
    date.setHours(14, 0, 0, 0);
  }
};

const parseCommand = (command: string): ParsedCommand | null => {
  const lower = command.toLowerCase();
  if (lower.includes('add task') || lower.includes('create task') || lower.includes('schedule task')) {
    const title = extractQuoted(command) ?? 'Voice task';
    const date = parseDateFromCommand(lower);
    parseTimeFromCommand(lower, date);
    return { kind: 'task', title, date };
  }
  if (lower.includes('add habit') || lower.includes('create habit')) {
    const title = extractQuoted(command) ?? 'Voice habit';
    const schedule = lower.includes('morning')
      ? 'morning'
      : lower.includes('evening')
      ? 'evening'
      : undefined;
    return { kind: 'habit', title, schedule };
  }
  if (lower.includes('add goal') || lower.includes('create goal')) {
    const title = extractQuoted(command) ?? 'Voice goal';
    const deadlineMatch = command.match(/by\s+([a-zA-Z0-9 ]+)/);
    return { kind: 'goal', title, deadlineLabel: deadlineMatch?.[1]?.trim() };
  }
  if (lower.includes('focus') || lower.includes('pomodoro')) {
    const title = extractQuoted(command) ?? command.replace(/focus/gi, '').trim();
    return { kind: 'focus', title, duration: lower.includes('25') ? 25 : undefined };
  }
  return null;
};

export const executePlannerVoiceIntent = (command: string): PlannerVoiceResult => {
  const parsed = parseCommand(command);
  if (!parsed) {
    return { success: false, message: 'No planner intent detected' };
  }

  if (parsed.kind === 'task') {
    plannerService.createTaskFromVoice({
      title: parsed.title,
      date: parsed.date,
      durationLabel: '45 min',
      context: '@voice',
    });
    return { success: true, message: `Task "${parsed.title}" scheduled` };
  }

  if (parsed.kind === 'habit') {
    const entry: PlannerVoiceHabit = {
      id: `habit-${Date.now()}`,
      title: parsed.title,
      schedule: parsed.schedule,
    };
    plannerService.createHabitFromVoice(parsed.title, parsed.schedule);
    usePlannerVoiceActionStore.getState().logHabit(entry);
    return { success: true, message: `Habit "${parsed.title}" logged` };
  }

  if (parsed.kind === 'goal') {
    const entry: PlannerVoiceGoal = {
      id: `goal-${Date.now()}`,
      title: parsed.title,
      deadlineLabel: parsed.deadlineLabel,
    };
    plannerService.createGoalFromVoice(parsed.title, parsed.deadlineLabel);
    usePlannerVoiceActionStore.getState().logGoal(entry);
    return { success: true, message: `Goal "${parsed.title}" captured` };
  }

  if (parsed.kind === 'focus') {
    const domainTasks = usePlannerDomainStore.getState().tasks;
    const target = domainTasks.find((task) =>
      task.title.toLowerCase().includes(parsed.title.toLowerCase()),
    );
    if (target) {
      usePlannerFocusBridge.getState().startFocusForTask(target.id);
      return { success: true, message: `Focus started on "${target.title}"` };
    }
    // Create quick task if no match
    const quickTaskDate = addDays(startOfDay(new Date()), 0);
    parseTimeFromCommand(parsed.title.toLowerCase(), quickTaskDate);
    const created = plannerService.createTaskFromVoice({
      title: parsed.title || 'Focus task',
      date: quickTaskDate,
      durationLabel: parsed.duration ? `${parsed.duration} min` : '25 min',
      context: '@voice',
    });
    usePlannerFocusBridge.getState().startFocusForTask(created.id);
    return { success: true, message: `Focus session prepared for "${parsed.title}"` };
  }

  return { success: false, message: 'Intent not supported' };
};
