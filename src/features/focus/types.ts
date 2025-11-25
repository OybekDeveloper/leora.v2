export type TechniqueKey = 'pomodoro' | 'blocs' | 'free';

export type TechniqueConfig = {
  key: TechniqueKey;
  label: string;
  summary: string;
  workMinutes: number;
  breakMinutes: number;
};

export const TECHNIQUES: readonly TechniqueConfig[] = [
  { key: 'pomodoro', label: 'Pomodoro', summary: '25m + 5m', workMinutes: 25, breakMinutes: 5 },
  { key: 'blocs', label: 'Blocs', summary: '50m + 10m', workMinutes: 50, breakMinutes: 10 },
  { key: 'free', label: 'Free timer', summary: '∞', workMinutes: 60, breakMinutes: 0 },
] as const;

export const TOGGLE_OPTIONS = [
  { id: 'notifications', label: 'Turn off notification', icon: 'bell-off' },
  { id: 'backgroundMusic', label: 'Background music', icon: 'music' },
  { id: 'appBlock', label: 'App block', icon: 'cellphone-lock' },
  { id: 'dynamicIsland', label: 'Dynamic Island', icon: 'cellphone' },
] as const;

export const MOTIVATION_OPTIONS = [
  { id: 'progress', label: 'Show progress' },
  { id: 'sound', label: 'Completion sound' },
  { id: 'vibration', label: 'Vibration' },
  { id: 'music', label: 'Music for concentration' },
] as const;

export const LOCK_OPTIONS = [
  { id: 'notifications', label: 'Notifications' },
  { id: 'social', label: 'Lock social networks' },
  { id: 'apps', label: 'Lock all apps' },
  { id: 'autoReply', label: 'Auto-reply to messages' },
] as const;

export const PRESET_MINUTES = [5, 10, 15, 25] as const;

export type ToggleId = (typeof TOGGLE_OPTIONS)[number]['id'];
export type MotivationId = (typeof MOTIVATION_OPTIONS)[number]['id'];
export type LockId = (typeof LOCK_OPTIONS)[number]['id'];

export const DEFAULT_TOGGLES: Record<ToggleId, boolean> = {
  notifications: true,
  backgroundMusic: true,
  appBlock: true,
  dynamicIsland: true,
};

export const DEFAULT_MOTIVATION: Record<MotivationId, boolean> = {
  progress: true,
  sound: true,
  vibration: false,
  music: true,
};

export const DEFAULT_LOCKS: Record<LockId, boolean> = {
  notifications: true,
  social: true,
  apps: false,
  autoReply: true,
};

export type FocusStats = {
  focusSeconds: number;
  sessionsCompleted: number;
  sessionsSkipped: number;
};
