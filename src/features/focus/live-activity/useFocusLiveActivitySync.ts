import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';

import type {
  ActivityUpdateEvent,
  LiveActivityConfig,
  LiveActivityState,
} from 'expo-live-activity';

import { useFocusSettingsStore } from '../useFocusSettingsStore';
import { type FocusTimerState, useFocusTimerStore } from '../useFocusTimerStore';
import { formatTimer } from '../utils';

const APP_NAME = 'LEORA';
const ANDROID_CHANNEL_ID = 'focus-progress';
const ANDROID_NOTIFICATION_ID = 'focus-mode-progress';

type NotificationsModule = typeof import('expo-notifications');
type LiveActivityModule = {
  startActivity?: (state: LiveActivityState, config?: LiveActivityConfig) => string | undefined;
  updateActivity?: (id: string, state: LiveActivityState) => void;
  stopActivity?: (id: string, state: LiveActivityState) => void;
  addActivityUpdatesListener?: (
    listener: (event: ActivityUpdateEvent) => void,
  ) => { remove?: () => void } | void;
};

let Notifications: NotificationsModule | null = null;
let LiveActivity: LiveActivityModule | null = null;

const shouldLoadNotifications = Platform.OS !== 'android' || Constants.appOwnership !== 'expo';
const shouldLoadLiveActivity = Platform.OS === 'ios' && Constants.appOwnership !== 'expo';

if (shouldLoadNotifications) {
  try {
    Notifications = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn(
      '[focus-live-activity] expo-notifications unavailable; falling back to no-op notifications.',
      error,
    );
  }
} else if (__DEV__) {
  console.info(
    '[focus-live-activity] expo-notifications disabled in Expo Go; notifications will be no-op.',
  );
}

if (shouldLoadLiveActivity) {
  try {
    LiveActivity = require('expo-live-activity') as LiveActivityModule;
  } catch (error) {
    console.warn(
      '[focus-live-activity] expo-live-activity unavailable; Live Activities will be disabled.',
      error,
    );
  }
} else if (__DEV__ && Platform.OS === 'ios') {
  console.info(
    '[focus-live-activity] Live Activities disabled in Expo Go; use a dev build to test.',
  );
}

type LiveActivityEndReason = 'completed' | 'cancelled' | 'disabled';

const resolveEndReason = (elapsedSeconds: number, totalSeconds: number): LiveActivityEndReason => {
  if (totalSeconds > 0 && elapsedSeconds >= totalSeconds) return 'completed';
  return 'cancelled';
};

/**
 * Synchronises the focus timer state with the native Live Activity (ActivityKit).
 * The hook is a no-op on non-iOS platforms.
 */
export const useFocusLiveActivitySync = ({ taskName }: { taskName: string }) => {
  const dynamicIslandPreference = useFocusSettingsStore((state) => state.toggles.dynamicIsland);
  const dynamicIslandEnabled = dynamicIslandPreference ?? true;
  const notificationsEnabled = useFocusSettingsStore((state) => state.toggles.notifications);
  const breakMinutes = useFocusSettingsStore((state) => state.breakMinutes);
  const sessionsUntilBigBreak = useFocusSettingsStore((state) => state.sessionsUntilBigBreak);
  const stats = useFocusSettingsStore((state) => state.stats);
  const isSoundEnabled = useFocusSettingsStore((state) => state.motivation.sound);

  const timerState = useFocusTimerStore((state) => state.timerState);
  const elapsedSeconds = useFocusTimerStore((state) => state.elapsedSeconds);
  const totalSeconds = useFocusTimerStore((state) => state.totalSeconds);

  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');

  const hasActiveActivityRef = useRef(false);
  const startInFlightRef = useRef(false);
  const previousStateRef = useRef<FocusTimerState>('ready');
  const activityIdRef = useRef<string | null>(null);
  const androidPayloadKeyRef = useRef<string | null>(null);
  const androidNotificationVisibleRef = useRef(false);
  const androidPermissionRequestedRef = useRef(false);
  const androidChannelRegisteredRef = useRef(false);

  const sessionIndex = useMemo(() => Math.max(1, stats.sessionsCompleted + 1), [stats.sessionsCompleted]);
  const sessionCount = useMemo(() => Math.max(1, sessionsUntilBigBreak), [sessionsUntilBigBreak]);
  const breakAfterSeconds = useMemo(() => Math.max(0, Math.round(breakMinutes * 60)), [breakMinutes]);
  const isMuted = useMemo(() => !isSoundEnabled, [isSoundEnabled]);

  const isLiveActivitySupported = useMemo(
    () => Platform.OS === 'ios' && typeof LiveActivity?.startActivity === 'function',
    [],
  );

  const liveActivityConfig = useMemo<LiveActivityConfig>(
    () => ({
      backgroundColor: '#111214',
      titleColor: '#FFFFFF',
      subtitleColor: '#ADB1C2',
      progressViewTint: '#16A34A',
      progressViewLabelColor: '#FFFFFF',
      timerType: 'digital',
      padding: {
        top: 18,
        bottom: 16,
        horizontal: 18,
      },
      deepLinkUrl: '/focus-mode',
    }),
    [],
  );

  useEffect(() => {
    const listener = AppState.addEventListener('change', (nextState) => {
      setIsForeground(nextState === 'active');
    });

    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (!isLiveActivitySupported || !LiveActivity?.addActivityUpdatesListener) return;

    let subscription: { remove?: () => void } | void;
    try {
      subscription = LiveActivity?.addActivityUpdatesListener?.((event) => {
        if (!event) return;
        if (!activityIdRef.current) return;
        if (event.activityID !== activityIdRef.current) return;

        if (event.activityState === 'ended' || event.activityState === 'dismissed') {
          hasActiveActivityRef.current = false;
          activityIdRef.current = null;
        }
      });
    } catch (error) {
      console.warn('[focus-live-activity] Failed to attach Live Activity listener.', error);
      return;
    }

    return () => {
      subscription?.remove?.();
    };
  }, [isLiveActivitySupported]);

  useEffect(() => {
    if (!isLiveActivitySupported) return;

    const totalDuration = Math.max(totalSeconds, 0);
    const clampedElapsed = Math.max(0, Math.min(elapsedSeconds, totalDuration > 0 ? totalDuration : elapsedSeconds));
    const remainingSeconds = Math.max(totalDuration - clampedElapsed, 0);
    const progressRatio = totalDuration > 0 ? Math.min(clampedElapsed / totalDuration, 1) : 0;
    const sessionLabel = `Session ${sessionIndex}/${sessionCount}`;
    const breakLabel = breakAfterSeconds > 0 ? `Break after ${formatTimer(breakAfterSeconds)}` : null;
    const remainingLabel = totalDuration > 0 ? `${formatTimer(remainingSeconds)} left` : null;
    const totalLabel = totalDuration > 0 ? `Total ${formatTimer(totalDuration)}` : null;
    const timestampNow = Date.now();
    const projectedEndDate = remainingSeconds > 0 ? timestampNow + remainingSeconds * 1000 : null;

    const createLiveActivityState = (status: FocusTimerState | LiveActivityEndReason): LiveActivityState => {
      let statusLabel: string;
      let progressBar: LiveActivityState['progressBar'];

      switch (status) {
        case 'running':
          statusLabel = 'In progress';
          progressBar = projectedEndDate ? { date: projectedEndDate } : { progress: progressRatio };
          break;
        case 'paused':
          statusLabel = 'Paused';
          progressBar = { progress: progressRatio };
          break;
        case 'ready':
          statusLabel = progressRatio >= 1 ? 'Session complete' : 'Session stopped';
          progressBar = { progress: progressRatio };
          break;
        case 'completed':
          statusLabel = 'Session complete';
          progressBar = { progress: 1 };
          break;
        case 'cancelled':
          statusLabel = 'Session stopped';
          progressBar = { progress: progressRatio };
          break;
        case 'disabled':
          statusLabel = 'Dynamic Island disabled';
          progressBar = totalDuration > 0 ? { progress: progressRatio } : undefined;
          break;
        default:
          statusLabel = 'In progress';
          progressBar = projectedEndDate ? { date: projectedEndDate } : { progress: progressRatio };
          break;
      }

      const subtitleSegments = [statusLabel];
      if (remainingLabel) subtitleSegments.push(remainingLabel);
      subtitleSegments.push(sessionLabel);
      if (totalLabel) subtitleSegments.push(totalLabel);
      if (breakLabel) subtitleSegments.push(breakLabel);
      if (isMuted) subtitleSegments.push('Muted');

      return {
        title: taskName || APP_NAME,
        subtitle: subtitleSegments.join(' • '),
        progressBar,
      };
    };

    const stopActivity = (reason: LiveActivityEndReason) => {
      if (!activityIdRef.current) return;
      const finalState = createLiveActivityState(reason);
      try {
        LiveActivity?.stopActivity?.(activityIdRef.current, finalState);
      } catch (error) {
        console.warn('[focus-live-activity] Failed to stop Live Activity', error);
      }
      activityIdRef.current = null;
      hasActiveActivityRef.current = false;
    };

    if (!dynamicIslandEnabled) {
      stopActivity('disabled');
      previousStateRef.current = timerState;
      return;
    }

    if (totalDuration <= 0) {
      stopActivity('cancelled');
      previousStateRef.current = timerState;
      return;
    }

    const isTimerActive = timerState === 'running' || timerState === 'paused';

    if (!isTimerActive) {
      if (hasActiveActivityRef.current && previousStateRef.current !== 'ready') {
        const reason = resolveEndReason(clampedElapsed, totalDuration);
        stopActivity(reason);
      }
      previousStateRef.current = timerState;
      return;
    }

    const currentState = createLiveActivityState(timerState);

    if (!hasActiveActivityRef.current && !startInFlightRef.current) {
      startInFlightRef.current = true;

      try {
        const activityId = LiveActivity?.startActivity?.(currentState, liveActivityConfig);

        if (typeof activityId === 'string' && activityId.length > 0) {
          hasActiveActivityRef.current = true;
          activityIdRef.current = activityId;
        } else {
          hasActiveActivityRef.current = false;
          activityIdRef.current = null;
        }
      } catch (error) {
        console.warn('[focus-live-activity] Failed to start Live Activity', error);
        hasActiveActivityRef.current = false;
        activityIdRef.current = null;
      } finally {
        startInFlightRef.current = false;
      }
    } else if (hasActiveActivityRef.current && activityIdRef.current) {
      try {
        LiveActivity?.updateActivity?.(activityIdRef.current, currentState);
      } catch (error) {
        console.warn('[focus-live-activity] Failed to update Live Activity', error);
      }
    }

    previousStateRef.current = timerState;
  }, [
    isLiveActivitySupported,
    dynamicIslandEnabled,
    timerState,
    elapsedSeconds,
    totalSeconds,
    sessionIndex,
    sessionCount,
    breakAfterSeconds,
    isMuted,
    taskName,
    liveActivityConfig,
  ]);

  useEffect(() => {
    return () => {
      if (!isLiveActivitySupported) return;
      if (!activityIdRef.current) return;

      LiveActivity?.stopActivity?.(activityIdRef.current, {
        title: taskName || APP_NAME,
        subtitle: 'Session stopped',
      });

      hasActiveActivityRef.current = false;
      activityIdRef.current = null;
    };
  }, [isLiveActivitySupported, taskName]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const notifications = Notifications;
    if (!notifications) return;
    if (androidChannelRegisteredRef.current) return;
    androidChannelRegisteredRef.current = true;
    notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Focus Progress',
      importance: notifications.AndroidImportance.MAX,
      lockscreenVisibility: notifications.AndroidNotificationVisibility.PUBLIC,
      sound: null,
      showBadge: false,
    }).catch(() => {
      androidChannelRegisteredRef.current = false;
    });
  }, []);

  const dismissAndroidNotification = useCallback(() => {
    if (Platform.OS !== 'android') return;
    const notifications = Notifications;
    if (!notifications) return;
    if (!androidNotificationVisibleRef.current) return;
    notifications.dismissNotificationAsync(ANDROID_NOTIFICATION_ID).catch(() => undefined);
    androidNotificationVisibleRef.current = false;
    androidPayloadKeyRef.current = null;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const notifications = Notifications;
    if (!notifications) return;
    if (!notificationsEnabled) {
      dismissAndroidNotification();
      return;
    }
    if (androidPermissionRequestedRef.current) return;
    androidPermissionRequestedRef.current = true;
    let cancelled = false;
    (async () => {
      const settings = await notifications.getPermissionsAsync();
      if (cancelled) return;
      if (!settings.granted) {
        await notifications.requestPermissionsAsync();
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [notificationsEnabled, dismissAndroidNotification]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const notifications = Notifications;
    if (!notifications) return;

    const shouldShow =
      notificationsEnabled &&
      !isForeground &&
      (timerState === 'running' || timerState === 'paused') &&
      totalSeconds > 0;

    if (!shouldShow) {
      dismissAndroidNotification();
      return;
    }

    const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
    const statusLabel = timerState === 'paused' ? 'Paused' : 'In progress';
    const sessionLabel = `Session ${sessionIndex}/${sessionCount}`;
    const baseSegments = [`${formatTimer(remainingSeconds)} left`, sessionLabel];
    if (breakAfterSeconds > 0) {
      baseSegments.push(`Break after ${formatTimer(breakAfterSeconds)}`);
    }
    const body = `${taskName} • ${baseSegments.join(' • ')}`;
    const payloadKey = `${statusLabel}-${body}-${elapsedSeconds}-${totalSeconds}`;

    if (androidPayloadKeyRef.current === payloadKey) {
      return;
    }
    androidPayloadKeyRef.current = payloadKey;

    (async () => {
      await notifications.dismissNotificationAsync(ANDROID_NOTIFICATION_ID).catch(() => undefined);
      await notifications.scheduleNotificationAsync({
        identifier: ANDROID_NOTIFICATION_ID,
        content: {
          title: 'Focus Mode',
          subtitle: statusLabel,
          body,
          data: { scope: 'focus-session' },
          sticky: true,
          autoDismiss: false,
          priority: notifications.AndroidNotificationPriority.MAX,
        },
        trigger: { channelId: ANDROID_CHANNEL_ID },
      });
      androidNotificationVisibleRef.current = true;
    })().catch(() => undefined);

    return () => {
      // noop cleanup for async fire-and-forget
    };
  }, [
    notificationsEnabled,
    timerState,
    isForeground,
    totalSeconds,
    elapsedSeconds,
    sessionIndex,
    sessionCount,
    breakAfterSeconds,
    taskName,
    dismissAndroidNotification,
  ]);

  useEffect(() => {
    return () => {
      dismissAndroidNotification();
    };
  }, [dismissAndroidNotification]);
};

export default useFocusLiveActivitySync;
