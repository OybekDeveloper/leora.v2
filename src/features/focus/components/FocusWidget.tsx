import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/constants/theme';
import { useFocusTimerStore } from '@/features/focus/useFocusTimerStore';
import { useFocusSettingsStore } from '@/features/focus/useFocusSettingsStore';
import { formatTimer } from '@/features/focus/utils';

export default function FocusWidget() {
  const colors = useThemeColors();
  const { timerState, elapsedSeconds, totalSeconds, start, pause, resume } = useFocusTimerStore((state) => ({
    timerState: state.timerState,
    elapsedSeconds: state.elapsedSeconds,
    totalSeconds: state.totalSeconds,
    start: state.start,
    pause: state.pause,
    resume: state.resume,
  }));
  const techniqueLabel = useFocusSettingsStore((state) => state.techniqueKey);

  const remaining = Math.max(totalSeconds - elapsedSeconds, 0);
  const { ctaLabel, handler } = useMemo((): { ctaLabel: string; handler: () => void } => {
    if (timerState === 'running') return { ctaLabel: 'Pause', handler: () => pause() };
    if (timerState === 'paused') return { ctaLabel: 'Resume', handler: () => resume() };
    return { ctaLabel: 'Start focus', handler: () => start() };
  }, [pause, resume, start, timerState]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.row}> 
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Focus Mode</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Technique: {techniqueLabel}</Text>
        </View>
        <View style={[styles.timerBadge, { backgroundColor: colors.primary }]}> 
          <Text style={[styles.timerText, { color: colors.onPrimary }]}>{formatTimer(remaining)}</Text>
        </View>
      </View>
      <Pressable onPress={handler} style={[styles.ctaButton, { backgroundColor: colors.surfaceElevated }]}> 
        <Text style={[styles.ctaText, { color: colors.textPrimary }]}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  timerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
