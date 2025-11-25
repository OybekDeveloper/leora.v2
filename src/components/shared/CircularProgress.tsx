import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';

export interface CircularProgressProps {
  progress: number;
  color: string;
  trackColor: string;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularProgress = React.memo(
  ({
    progress,
    color,
    trackColor,
    size = 96,
    strokeWidth = 7,
    animationDuration = 800,
  }: CircularProgressProps) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProps = useAnimatedProps(() => {
      const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
      return {
        strokeDashoffset: withTiming(strokeDashoffset, {
          duration: animationDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      };
    }, [clampedProgress, circumference, animationDuration]);

    return (
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
          animatedProps={animatedProps}
        />
      </Svg>
    );
  },
);

CircularProgress.displayName = 'CircularProgress';

export default CircularProgress;

