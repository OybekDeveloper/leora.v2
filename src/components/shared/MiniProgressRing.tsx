import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme } from '@/constants/theme';
import { getProgressColor } from '@/features/progress/colorUtils';

export interface MiniProgressRingProps {
  /** Progress value 0-100 */
  progress: number;
  /** Overall size in pixels */
  size?: number;
  /** Stroke width of the ring */
  strokeWidth?: number;
}

/**
 * MiniProgressRing - Single circular progress ring for calendar days
 *
 * Displays a single ring showing combined daily progress.
 * Color is based on progress level (same as ProgressIndicator):
 * - 67-100%: success (green)
 * - 34-66%: warning (yellow/orange)
 * - 0-33%: danger (red)
 * - No data: border (gray)
 */
export const MiniProgressRing = React.memo(({
  progress,
  size = 20,
  strokeWidth = 2.5,
}: MiniProgressRingProps) => {
  const theme = useAppTheme();
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const hasContent = clampedProgress > 0;
  const color = getProgressColor(theme, clampedProgress, hasContent);

  return (
    <View>
      <Svg width={size} height={size}>
        {/* Track (background) */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.3}
        />
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
    </View>
  );
});

MiniProgressRing.displayName = 'MiniProgressRing';

export default MiniProgressRing;
