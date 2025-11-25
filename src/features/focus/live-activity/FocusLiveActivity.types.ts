export type FocusLiveActivityEndReason = 'completed' | 'cancelled' | 'disabled';

export type FocusLiveActivityStartPayload = {
  appName: string;
  taskName: string;
  sessionIndex: number;
  sessionCount: number;
  totalSeconds: number;
  elapsedSeconds: number;
  breakAfterSeconds: number;
  isMuted: boolean;
};

export type FocusLiveActivityUpdatePayload = {
  taskName: string;
  sessionIndex: number;
  sessionCount: number;
  totalSeconds: number;
  elapsedSeconds: number;
  breakAfterSeconds: number;
  isMuted: boolean;
  isPaused: boolean;
};
