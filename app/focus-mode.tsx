import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  AppState,
  AppStateStatus,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme, useThemeColors } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFocusTimerStore } from '@/features/focus/useFocusTimerStore';
import { useFocusSettingsStore } from '@/features/focus/useFocusSettingsStore';
import { TECHNIQUES, TOGGLE_OPTIONS, TechniqueConfig } from '@/features/focus/types';
import { formatTimer } from '@/features/focus/utils';
import { usePlannerFocusBridge } from '@/features/planner/useFocusTaskBridge';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { mapDomainTaskToPlannerTask } from '@/features/planner/taskAdapters';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useModalStore } from '@/stores/useModalStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RADIUS = 120;
const STROKE_WIDTH = 16;
const INNER_RADIUS = RADIUS - STROKE_WIDTH / 2;
const INNER_DISK_RADIUS = RADIUS - STROKE_WIDTH;
const CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS;
const TIMER_SIZE = (RADIUS + STROKE_WIDTH) * 2;
const CX = RADIUS + STROKE_WIDTH;
const CY = RADIUS + STROKE_WIDTH;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatClock = (date?: Date) => (date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—:—');
const formatFocusTime = (seconds: number) => {
  if (seconds <= 0) return '0 m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (!h) return `${m} m`;
  if (!m) return `${h} h`;
  return `${h} h ${m} m`;
};

const FocusToggle = ({
  label,
  icon,
  value,
  onToggle,
  colors,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) => {
  const progress = useSharedValue(value ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 220 });
  }, [progress, value]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.97]) }],
  }));
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surfaceElevated, colors.primary]
    ),
  }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, 22], Extrapolation.CLAMP) }],
  }));

  return (
    <AnimatedPressable
      onPress={onToggle}
      onPressIn={() => (press.value = withSpring(1))}
      onPressOut={() => (press.value = withSpring(0))}
      style={containerStyle}
    >
      <AdaptiveGlassView style={[styles.glassSurface, styles.toggleCard]}>
        <View style={styles.toggleLeft}>
          <AdaptiveGlassView style={[styles.glassSurface, styles.iconTile]}>
            <MaterialCommunityIcons name={icon} size={18} color={colors.textSecondary} />
          </AdaptiveGlassView>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>{label}</Text>
        </View>
        <Animated.View style={[styles.switchTrack, trackStyle]}>
          <Animated.View style={[styles.switchKnob, { backgroundColor: colors.white }, knobStyle]} />
        </Animated.View>
      </AdaptiveGlassView>
    </AnimatedPressable>
  );
};

const TimerRing = ({
  progress,
  colors,
}: {
  progress: SharedValue<number>;
  colors: ReturnType<typeof useThemeColors>;
}) => {
  const animatedProps = useAnimatedProps(() => {
    const p = Math.min(Math.max(progress.value, 0), 1);
    return { strokeDashoffset: CIRCUMFERENCE * (1 - p) };
  });

  return (
    <View style={styles.timerWrapper}>
      <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
        <Defs>
          <RadialGradient id="dialGrad" cx="50%" cy="45%" r="65%">
            <Stop offset="0%" stopColor={colors.surface} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.surfaceElevated} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Circle fill="url(#dialGrad)" cx={CX} cy={CY} r={INNER_DISK_RADIUS} />
        <G rotation={-90} originX={CX} originY={CY}>
          <Circle
            stroke={colors.border}
            fill="transparent"
            cx={CX}
            cy={CY}
            r={INNER_RADIUS}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
          />
          <AnimatedCircle
            stroke={colors.primary}
            fill="transparent"
            cx={CX}
            cy={CY}
            r={INNER_RADIUS}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <View style={styles.dialNotchContainer} pointerEvents="none">
        <View style={[styles.dialNotch, { backgroundColor: colors.overlaySoft }]} />
      </View>
    </View>
  );
};

export default function FocusModeScreen() {
  const colors = useThemeColors();
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const { strings } = useLocalization();
  const focusStrings = strings.plannerScreens.tasks.focus;
  const focusedTaskId = usePlannerFocusBridge((state) => state.focusedTaskId);
  const startFocusForTask = usePlannerFocusBridge((state) => state.startFocusForTask);
  const completeFocusedTask = usePlannerFocusBridge((state) => state.completeFocusedTask);
  const domainTasks = usePlannerDomainStore((state) => state.tasks);
  const domainGoals = usePlannerDomainStore((state) => state.goals);
  const goalTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    domainGoals.forEach((goal) => {
      map[goal.id] = goal.title;
    });
    return map;
  }, [domainGoals]);
  const focusTask = useMemo(() => {
    const target = domainTasks.find((task) => task.id === focusedTaskId);
    return target ? mapDomainTaskToPlannerTask(target, {}) : undefined;
  }, [domainTasks, focusedTaskId]);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const { timerState, elapsedSeconds, totalSeconds, start, pause, resume, reset, syncElapsed, startedAt } = useFocusTimerStore((state) => state);

  const toggles = useFocusSettingsStore((state) => state.toggles);
  const techniqueKey = useFocusSettingsStore((state) => state.techniqueKey);
  const workMinutes = useFocusSettingsStore((state) => state.workMinutes);
  const stats = useFocusSettingsStore((state) => state.stats);
  const toggleSetting = useFocusSettingsStore((state) => state.toggleSetting);
  const setWorkMinutes = useFocusSettingsStore((state) => state.setWorkMinutes);
  const recordSession = useFocusSettingsStore((state) => state.recordSession);
  const technique: TechniqueConfig = useMemo(
    () => TECHNIQUES.find((item) => item.key === techniqueKey) ?? TECHNIQUES[0],
    [techniqueKey],
  );

  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [editMin, setEditMin] = useState('25');
  const [editSec, setEditSec] = useState('00');

  const elapsedShared = useSharedValue(elapsedSeconds);
  const totalShared = useSharedValue(totalSeconds);
  const progress = useDerivedValue(() => (totalShared.value <= 0 ? 0 : Math.min(Math.max(elapsedShared.value / totalShared.value, 0), 1)));

  const productivity = useMemo(() => {
    const totalSessions = stats.sessionsCompleted + stats.sessionsSkipped;
    return totalSessions === 0 ? 0 : Math.round((stats.sessionsCompleted / totalSessions) * 100);
  }, [stats.sessionsCompleted, stats.sessionsSkipped]);

  const handleSessionComplete = useCallback(
    (completed: boolean) => {
      const focusSeconds = Math.min(elapsedSeconds, totalSeconds);
      recordSession(focusSeconds, completed);
      setIsEditingDuration(false);
      reset();
    },
    [elapsedSeconds, recordSession, reset, totalSeconds],
  );
  const promptFocusCompletion = useCallback(() => {
    if (!focusTask) return;
    Alert.alert(
      focusStrings.finishTitle.replace('{task}', focusTask.title),
      focusStrings.finishMessage,
      [
        { text: focusStrings.keep, style: 'cancel' },
        { text: focusStrings.move, onPress: () => completeFocusedTask('move') },
        { text: focusStrings.done, onPress: () => completeFocusedTask('done') },
      ],
    );
  }, [completeFocusedTask, focusStrings, focusTask]);
  const finalizeFocus = useCallback(
    (completed: boolean) => {
      handleSessionComplete(completed);
      if (focusTask) {
        promptFocusCompletion();
      }
    },
    [focusTask, handleSessionComplete, promptFocusCompletion],
  );

  useEffect(() => {
    if (timerState === 'ready') {
      reset(workMinutes * 60);
    }
  }, [reset, timerState, workMinutes]);
  useEffect(() => {
    const targetTaskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
    if (targetTaskId && !focusedTaskId) {
      startFocusForTask(targetTaskId);
    }
  }, [focusedTaskId, params.taskId, startFocusForTask]);

  useEffect(() => {
    elapsedShared.value = withTiming(elapsedSeconds, { duration: 240 });
  }, [elapsedSeconds, elapsedShared]);
  useEffect(() => {
    totalShared.value = totalSeconds;
  }, [totalSeconds, totalShared]);

  useEffect(() => {
    if (timerState !== 'running') return;
    const id = setInterval(() => syncElapsed(), 1000);
    return () => clearInterval(id);
  }, [syncElapsed, timerState]);

  useEffect(() => {
    if (timerState !== 'running') return;
    if (totalSeconds <= 0) return;
    if (elapsedSeconds < totalSeconds) return;
    finalizeFocus(true);
  }, [elapsedSeconds, finalizeFocus, timerState, totalSeconds]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === nextState) return;
      appStateRef.current = nextState;
      if (nextState === 'active') {
        syncElapsed();
      }
    });
    return () => subscription.remove();
  }, [syncElapsed]);

  const startTimer = useCallback(() => start(), [start]);
  const pauseTimer = useCallback(() => pause(), [pause]);
  const resumeTimer = useCallback(() => resume(), [resume]);
  const handleReset = useCallback(() => {
    if (timerState === 'ready') return;
    Alert.alert(
      'Reset Timer?',
      'This will reset your timer and discard current progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            handleSessionComplete(false);
          }
        },
      ],
    );
  }, [handleSessionComplete, timerState]);

  const startTime = useMemo(() => (startedAt ? new Date(startedAt) : undefined), [startedAt]);
  const endTime = useMemo(() => (startTime ? new Date(startTime.getTime() + totalSeconds * 1000) : undefined), [startTime, totalSeconds]);
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const isFinishDisabled = timerState === 'ready';
  const isResetDisabled = timerState === 'ready';

  const enterEditMode = useCallback(() => {
    if (timerState === 'running') return;
    const total = totalSeconds;
    setEditMin(String(Math.floor(total / 60)));
    setEditSec(String(total % 60).padStart(2, '0'));
    setIsEditingDuration(true);
  }, [timerState, totalSeconds]);

  const saveEditedDuration = useCallback(() => {
    const m = clamp(parseInt(editMin || '0', 10) || 0, 0, 24 * 60);
    const s = clamp(parseInt(editSec || '0', 10) || 0, 0, 59);
    const total = clamp(m * 60 + s, 1, 24 * 60 * 60);
    setWorkMinutes(Math.max(1, Math.round(total / 60)));
    reset(total);
    setIsEditingDuration(false);
  }, [editMin, editSec, reset, setWorkMinutes]);

  const primaryAction = useMemo(() => {
    if (isEditingDuration) return { icon: 'check', action: saveEditedDuration };
    if (timerState === 'ready') return { icon: 'play', action: startTimer };
    if (timerState === 'running') return { icon: 'pause', action: pauseTimer };
    return { icon: 'play', action: resumeTimer };
  }, [isEditingDuration, pauseTimer, resumeTimer, saveEditedDuration, startTimer, timerState]);

  const finishLabelColor = isFinishDisabled ? colors.textDisabled : colors.textPrimary;
  const resetLabelColor = isResetDisabled ? colors.textDisabled : colors.textPrimary;

  const openSettings = useModalStore((state) => state.openFocusSettingsModal);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleFinish = useCallback(() => {
    if (timerState === 'ready') return;
    const achieved = totalSeconds > 0 && elapsedSeconds >= totalSeconds;
    finalizeFocus(achieved);
  }, [elapsedSeconds, finalizeFocus, timerState, totalSeconds]);

  const isDarkMode = theme.mode === 'dark';
  const timerTextColor = isDarkMode ? colors.white : colors.textPrimary;
  const editInputBorderColor = isDarkMode ? 'rgba(255,255,255,0.24)' : colors.border;
  const timerActionBackground = colors.primary;
  const timerActionIconColor = colors.onPrimary;

  return (
    <>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'right', 'left']}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.flex}>
          <View style={styles.flex}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [styles.pressed, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <AdaptiveGlassView style={[styles.glassSurface, styles.headerIcon, styles.headerBack]}>
                    <Feather name="chevron-left" size={18} color={colors.textSecondary} />
                  </AdaptiveGlassView>
                </Pressable>
                <AdaptiveGlassView style={[styles.glassSurface, styles.headerIcon]}>
                  {toggles.appBlock || toggles.notifications ? (
                    <MaterialCommunityIcons name="lock" size={18} color={colors.textSecondary} />
                  ) : (
                    <MaterialCommunityIcons name="lock-open-variant" size={18} color={colors.textSecondary} />
                  )}
                </AdaptiveGlassView>
              </View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>FOCUS MODE</Text>
              <Pressable onPress={openSettings} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <AdaptiveGlassView style={[styles.glassSurface, styles.headerIcon]}>
                  <Feather name="settings" size={18} color={colors.textSecondary} />
                </AdaptiveGlassView>
              </Pressable>
            </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {focusTask && (
              <AdaptiveGlassView style={[styles.glassSurface, styles.focusedTaskCard]}>
                <Text style={[styles.focusedTaskLabel, { color: colors.textSecondary }]}>{focusStrings.cardLabel}</Text>
                <Text style={[styles.focusedTaskTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {focusTask.title}
                </Text>
                {focusTask.goalId && (
                  <Text style={[styles.focusedTaskMeta, { color: colors.textTertiary }]}>
                    {focusStrings.goalTag.replace(
                      '{goal}',
                      goalTitleMap[focusTask.goalId] ?? focusTask.goalId,
                    )}
                  </Text>
                )}
              </AdaptiveGlassView>
            )}
            <View style={styles.hero}>
              <Text style={[styles.sessionTitle, { color: colors.textSecondary }]}>{technique.label}</Text>
              <View style={styles.timerContainer}>
                <TimerRing progress={progress} colors={colors} />
                <View style={styles.timerContent}>
                  {!isEditingDuration && (
                    <Text style={[styles.statusInside, { color: colors.textSecondary }]}>
                      {timerState === 'running' ? 'In progress' : timerState === 'paused' ? 'Paused' : 'Ready'}
                    </Text>
                  )}
                  {!isEditingDuration ? (
                    <Pressable onPress={enterEditMode} disabled={timerState === 'running'}>
                      <Text
                        style={[
                          styles.timerValue,
                          {
                            color: timerTextColor,
                            ...(isDarkMode
                              ? {
                                  textShadowColor: '#000',
                                  textShadowOffset: { width: 0, height: 2 },
                                  textShadowRadius: 6,
                                }
                              : null),
                          },
                        ]}
                      >
                        {formatTimer(remainingSeconds)}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.editTimerRow}>
                      <TextInput
                        value={editMin}
                        onChangeText={(t) => setEditMin(t.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={3}
                        autoFocus
                        style={[styles.editTimerInput, { color: timerTextColor, borderColor: editInputBorderColor }]}
                        placeholder="00"
                        placeholderTextColor={colors.textTertiary}
                      />
                      <Text style={[styles.editTimerColon, { color: timerTextColor }]}>:</Text>
                      <TextInput
                        value={editSec}
                        onChangeText={(t) => setEditSec(t.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={[styles.editTimerInput, { color: timerTextColor, borderColor: editInputBorderColor }]}
                        placeholder="00"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                  )}

                  <View style={styles.timerMetaRow}>
                    <View style={styles.timerMetaCol}>
                      {startTime ? (
                        <Text style={[styles.timerMetaValue, { color: colors.textPrimary }]}>{formatClock(startTime)}</Text>
                      ) : (
                        <View style={[styles.dashedLine, { borderColor: colors.textTertiary }]} />
                      )}
                      <Text style={[styles.timerMetaTitle, { color: colors.textSecondary }]}>Start</Text>
                    </View>
                    <View style={styles.timerMetaCol}>
                      {startTime ? (
                        <Text style={[styles.timerMetaValue, { color: colors.textPrimary }]}>{formatClock(endTime)}</Text>
                      ) : (
                        <View style={[styles.dashedLine, { borderColor: colors.textTertiary }]} />
                      )}
                      <Text style={[styles.timerMetaTitle, { color: colors.textSecondary }]}>End</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={primaryAction.action}
                    style={[styles.timerAction, { backgroundColor: timerActionBackground }]}
                  >
                    <Feather name={primaryAction.icon as any} size={28} color={timerActionIconColor} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.togglesSection}>
              {TOGGLE_OPTIONS.map((opt) => (
                <React.Fragment key={opt.id}>
                  <FocusToggle
                    icon={opt.icon}
                    label={opt.label}
                    value={!!toggles[opt.id]}
                    onToggle={() => toggleSetting(opt.id)}
                    colors={colors}
                  />
                </React.Fragment>
              ))}
            </View>

            <AdaptiveGlassView style={[styles.glassSurface, styles.statisticsCard]}>
              <Text style={[styles.statisticsTitle, { color: colors.textSecondary }]}>Today's statistics</Text>
              <View style={styles.statisticsRow}>
                <Text style={[styles.statisticsLabel, { color: colors.textSecondary }]}>Focus time:</Text>
                <Text style={[styles.statisticsValue, { color: colors.textPrimary }]}>{formatFocusTime(stats.focusSeconds)}</Text>
              </View>
              <View style={styles.statisticsRow}>
                <Text style={[styles.statisticsLabel, { color: colors.textSecondary }]}>Sessions completed:</Text>
                <Text style={[styles.statisticsValue, { color: colors.textPrimary }]}>{stats.sessionsCompleted}</Text>
              </View>
              <View style={styles.statisticsRow}>
                <Text style={[styles.statisticsLabel, { color: colors.textSecondary }]}>Productivity:</Text>
                <Text style={[styles.statisticsValue, { color: colors.textPrimary }]}>{productivity} %</Text>
              </View>
            </AdaptiveGlassView>
          </ScrollView>

          <View style={styles.bottomButtons}>
            <Pressable
              onPress={handleReset}
              disabled={isResetDisabled}
              style={({ pressed }) => [
                styles.bottomButton,
                styles.bottomButtonGhost,
                pressed && !isResetDisabled && styles.pressed,
              ]}
            >
              <AdaptiveGlassView
                style={[
                  styles.glassSurface,
                  styles.bottomButtonInner,
                  { opacity: isResetDisabled ? 0.4 : 1 },
                ]}
              >
                <Text style={[styles.bottomButtonText, { color: resetLabelColor }]}>Reset</Text>
              </AdaptiveGlassView>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              disabled={isFinishDisabled}
              style={({ pressed }) => [
                styles.bottomButton,
                styles.bottomButtonGhost,
                pressed && !isFinishDisabled && styles.pressed,
              ]}
            >
              <AdaptiveGlassView
                style={[
                  styles.glassSurface,
                  styles.bottomButtonInner,
                  { opacity: isFinishDisabled ? 0.4 : 1 },
                ]}
              >
                <Text style={[styles.bottomButtonText, { color: finishLabelColor }]}>Finish</Text>
              </AdaptiveGlassView>
            </Pressable>
            <Pressable onPress={openSettings} style={styles.bottomButtonTextOnly}>
              <Text style={[styles.bottomButtonText, { color: colors.textPrimary }]}>Settings</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerBack: { width: 40 },
  headerTitle: { fontSize: 13, letterSpacing: 2, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 18, paddingBottom: 32, flexGrow: 1 },
  focusedTaskCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  focusedTaskLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  focusedTaskTitle: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  focusedTaskMeta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  hero: { alignItems: 'center', gap: 14, marginTop: 12 },
  sessionTitle: { fontSize: 14, letterSpacing: 1, textAlign: 'center' },
  timerContainer: { alignItems: 'center' },
  timerWrapper: { position: 'relative', width: TIMER_SIZE, height: TIMER_SIZE },
  dialNotchContainer: { position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' },
  dialNotch: { width: 52, height: 16, borderRadius: 10, opacity: 0.85 },
  timerContent: { position: 'absolute', top: (RADIUS + STROKE_WIDTH) * 0.55, left: 0, right: 0, alignItems: 'center' },
  statusInside: { fontSize: 13, marginBottom: 6, letterSpacing: 0.3 },
  timerValue: { fontSize: 48, fontWeight: '600', letterSpacing: 2 },
  editTimerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 2 },
  editTimerInput: { width: 64, textAlign: 'center', fontSize: 44, fontWeight: '600', borderBottomWidth: 1, paddingVertical: 2 },
  editTimerColon: { fontSize: 40, fontWeight: '600' },
  timerMetaRow: { flexDirection: 'row', gap: 42, marginTop: 8 },
  timerMetaCol: { alignItems: 'center' },
  dashedLine: { width: 54, borderBottomWidth: StyleSheet.hairlineWidth * 2, borderStyle: 'dashed', marginBottom: 6, opacity: 0.7 },
  timerMetaTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  timerMetaValue: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  timerAction: { marginTop: 18, width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  togglesSection: { marginTop: 22, gap: 12 },
  toggleCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    paddingVertical: 12,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: '500' },
  switchTrack: { width: 48, height: 26, borderRadius: 14, padding: 2, justifyContent: 'center' },
  switchKnob: { width: 22, height: 22, borderRadius: 11 },
  statisticsCard: { marginTop: 24, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 18, gap: 10 },
  statisticsTitle: { fontSize: 13, letterSpacing: 1 },
  statisticsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statisticsLabel: { fontSize: 13 },
  statisticsValue: { fontSize: 15, fontWeight: '600' },
  bottomButtons: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 26, paddingTop: 18, gap: 14 },
  bottomButton: { flex: 1, borderRadius: 14 },
  bottomButtonGhost: {},
  bottomButtonInner: {
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14,
    borderRadius: 14,
  },
  bottomButtonTextOnly: { paddingVertical: 14, paddingHorizontal: 8 },
  bottomButtonText: { fontSize: 15, fontWeight: '600' },
  pressed: {
    opacity: 0.7,
  },
});
