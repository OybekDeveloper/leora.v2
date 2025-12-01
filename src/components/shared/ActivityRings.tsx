import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme, Theme } from '@/constants/theme';
import { getProgressColor } from '@/features/progress/colorUtils';

export interface ActivityRingsProps {
  /** Budget progress 0-100, outer ring */
  budget: number;
  /** Tasks progress 0-100, middle ring */
  tasks: number;
  /** Habits/Focus progress 0-100, inner ring */
  habits: number;
  /** Overall size in pixels */
  size?: number;
  /** Stroke width of each ring */
  strokeWidth?: number;
  /** Gap between rings */
  gap?: number;
}

interface RingProps {
  cx: number;
  cy: number;
  radius: number;
  progress: number;
  strokeWidth: number;
  theme: Theme;
}

const Ring = React.memo(({ cx, cy, radius, progress, strokeWidth, theme }: RingProps) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const hasContent = clampedProgress > 0;
  const color = getProgressColor(theme, clampedProgress, hasContent);

  return (
    <>
      {/* Track (background) */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={theme.colors.border}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={0.3}
      />
      {/* Progress arc */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation={-90}
        origin={`${cx}, ${cy}`}
      />
    </>
  );
});

Ring.displayName = 'Ring';

/**
 * ActivityRings - Apple Watch style concentric progress rings
 *
 * Displays three concentric rings showing progress for:
 * - Budget (outer ring)
 * - Tasks (middle ring)
 * - Habits/Focus (inner ring)
 *
 * Each ring is colored based on progress level:
 * - 67-100%: success (green)
 * - 34-66%: warning (yellow/orange)
 * - 0-33%: danger (red)
 * - No data: border (gray)
 */
export const ActivityRings = React.memo(({
  budget,
  tasks,
  habits,
  size = 22,
  strokeWidth = 2,
  gap = 1,
}: ActivityRingsProps) => {
  const theme = useAppTheme();
  const center = size / 2;

  // Calculate radii from outer to inner
  const outerRadius = (size - strokeWidth) / 2;           // Budget (outermost)
  const middleRadius = outerRadius - strokeWidth - gap;   // Tasks
  const innerRadius = middleRadius - strokeWidth - gap;   // Habits (innermost)

  return (
    <View>
      <Svg width={size} height={size}>
        <Ring
          cx={center}
          cy={center}
          radius={outerRadius}
          progress={budget}
          strokeWidth={strokeWidth}
          theme={theme}
        />
        <Ring
          cx={center}
          cy={center}
          radius={middleRadius}
          progress={tasks}
          strokeWidth={strokeWidth}
          theme={theme}
        />
        <Ring
          cx={center}
          cy={center}
          radius={innerRadius}
          progress={habits}
          strokeWidth={strokeWidth}
          theme={theme}
        />
      </Svg>
    </View>
  );
});

ActivityRings.displayName = 'ActivityRings';

export default ActivityRings;
