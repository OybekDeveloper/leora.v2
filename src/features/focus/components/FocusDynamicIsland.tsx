import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { useThemeColors } from '@/constants/theme';
import { useFocusSettingsStore } from '@/features/focus/useFocusSettingsStore';
import { useFocusTimerStore } from '@/features/focus/useFocusTimerStore';
import { formatTimer } from '@/features/focus/utils';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function FocusDynamicIsland() {
  const colors = useThemeColors();
  const isEnabled = useFocusSettingsStore((state) => state.toggles.dynamicIsland);
  const timerState = useFocusTimerStore((state) => state.timerState);
  const elapsedSeconds = useFocusTimerStore((state) => state.elapsedSeconds);
  const totalSeconds = useFocusTimerStore((state) => state.totalSeconds);

  const visibleValue = useSharedValue(0);

  useEffect(() => {
    const shouldShow = Platform.OS === 'ios' && isEnabled && timerState !== 'ready';
    visibleValue.value = withTiming(shouldShow ? 1 : 0, { duration: 280 });
  }, [isEnabled, timerState, visibleValue]);

  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const progress = useDerivedValue(() => (totalSeconds > 0 ? remainingSeconds / totalSeconds : 0));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(visibleValue.value > 0 ? 1 : 0.8) }],
    opacity: visibleValue.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: withTiming(1 - progress.value, { duration: 250 }) }],
  }));

  if (Platform.OS !== 'ios') return null;

  return (
    <AnimatedView pointerEvents="none" style={[styles.wrapper, containerStyle]}>
      <View style={[styles.island, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Focus Mode</Text>
          <Text style={[styles.timer, { color: colors.textPrimary }]}>{formatTimer(remainingSeconds)}</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.overlaySoft }]}>
          <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: colors.primary }]} />
        </View>
      </View>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  island: {
    width: 188,
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timer: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    flex: 1,
    transform: [{ scaleX: 0 }],
  },
});
