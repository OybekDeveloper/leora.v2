import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme } from '@/constants/theme';
import { getProgressColor } from '@/features/progress/colorUtils';

export interface ProgressDotsProps {
  /** Task progress 0-100 */
  tasks: number;
  /** Budget progress 0-100 */
  budget: number;
  /** Habit progress 0-100 */
  habits: number;
}

const DOT_SIZE = 7;
const STROKE_WIDTH = 1.5;
const GAP = 4;

interface DotProps {
  progress: number;
}

const Dot = React.memo(({ progress }: DotProps) => {
  const theme = useAppTheme();
  const center = DOT_SIZE / 2;
  const radius = (DOT_SIZE - STROKE_WIDTH) / 2;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const hasContent = clampedProgress > 0;
  const color = getProgressColor(theme, clampedProgress, hasContent);

  return (
    <Svg width={DOT_SIZE} height={DOT_SIZE}>
      {/* Track (background) */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={theme.colors.border}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        opacity={0.3}
      />
      {/* Progress arc */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation={-90}
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
});

Dot.displayName = 'Dot';

/**
 * ProgressDots - 3 small progress circles for calendar days
 *
 * Displays 3 small dots showing progress for:
 * - Tasks (left)
 * - Budget (center)
 * - Habits (right)
 *
 * Each dot is colored based on progress level:
 * - 67-100%: success (green)
 * - 34-66%: warning (yellow/orange)
 * - 0-33%: danger (red)
 * - No data: border (gray)
 */
export const ProgressDots = React.memo(({ tasks, budget, habits }: ProgressDotsProps) => {
  return (
    <View style={styles.container}>
      <Dot progress={tasks} />
      <Dot progress={budget} />
      <Dot progress={habits} />
    </View>
  );
});

ProgressDots.displayName = 'ProgressDots';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP,
  },
});

export default ProgressDots;
