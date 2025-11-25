export interface Task {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
  current: number;
  target: number;
  unit: string;
  category: 'financial' | 'personal' | 'professional' | 'health';
}

export interface ProgressData {
  tasks: number;
  budget: number;
  focus: number;
}

export type HomeDataStatus = 'success' | 'warning' | 'danger' | 'muted';

export type CalendarIndicatorsMap = Record<string, HomeDataStatus[]>;
export type CalendarEventType = 'tasks' | 'habits' | 'goals' | 'finance';
export type CalendarEventMap = Record<string, Partial<Record<CalendarEventType, number>>>;

export interface FABActionType {
  id: string;
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}

export interface UserGreeting {
  name: string;
  greeting: string;
  date: string;
}
