// features/shared/LevelProgress.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Defs, LinearGradient as SvgLinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { Star } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { createThemedStyles, useAppTheme } from '@/constants/theme';

const LEVEL_PROGRESS_HEIGHT = 44;
const LEVEL_PROGRESS_RADIUS = 22;
const AnimatedRectSvg = Animated.createAnimatedComponent(Rect);

type LevelProgressProps = {
  level: number;
  nextLevel: number;
  currentXp: number;
  targetXp: number;
  style?: any;
  label?: string; // "500 Points to next level" kabi matnni tashqarida yoki ichida ko'rsatish uchun
};

const useStyles = createThemedStyles((theme) => ({
  shell: {
    height: LEVEL_PROGRESS_HEIGHT,
    borderRadius: LEVEL_PROGRESS_RADIUS,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  ringOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  ringInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  levelTextDim: {
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  xpGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpCurrent: { fontSize: 15, fontWeight: '700' },
  xpMax: { fontSize: 15, fontWeight: '600' },
}));

export const LevelProgress: React.FC<LevelProgressProps> = ({
  level,
  nextLevel,
  currentXp,
  targetXp,
  style,
  label,
}) => {
  const theme = useAppTheme();
  const styles = useStyles();
  const [trackWidth, setTrackWidth] = useState(0);
  const widthValue = useSharedValue(0);
  const gradientId = useMemo(() => `level-progress-${level}-${nextLevel}`, [level, nextLevel]);

  const clampedRatio = targetXp > 0 ? Math.min(Math.max(currentXp / targetXp, 0), 1) : 0;

  useEffect(() => {
    if (!trackWidth) return;
    const minWidth = clampedRatio <= 0 ? 0 : Math.max(trackWidth * clampedRatio, 10);
    widthValue.value = withTiming(Math.min(trackWidth, minWidth), { duration: 420 });
  }, [clampedRatio, trackWidth, widthValue]);

  const animatedProps = useAnimatedProps(() => ({ width: widthValue.value }));

  // theming
  const ringBorderColor = theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)';
  const leftRingBg = theme.mode === 'dark' ? 'rgba(21,22,30,0.6)' : 'rgba(226,232,240,0.62)';
  const rightRingBg = theme.mode === 'dark' ? 'rgba(21,22,30,0.6)' : 'rgba(226,232,240,0.6)';
  const innerRingColor = theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)';
  const innerRingDimColor = theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
  const levelNumberColor = theme.mode === 'dark' ? '#F8FAFC' : '#111827';
  const levelNumberDimColor = theme.mode === 'dark' ? 'rgba(248,250,252,0.65)' : 'rgba(55,65,81,0.65)';
  const trackBaseColor = theme.mode === 'dark' ? 'rgba(203,213,225,0.35)' : 'rgba(203,213,225,0.6)';
  const gradientStops =
    theme.mode === 'dark'
      ? ['#8FA399', '#3d8f76ff', '#22ad98ff']
      : ['#30ab94ff', '#45b8c0ff', '#42ba54ff'];
  const labelColor = theme.mode === 'dark' ? '#1E1F2A' : theme.colors.textPrimary;
  const xpMaxColor = theme.mode === 'dark' ? 'rgba(30,31,42,0.45)' : 'rgba(71,85,105,0.55)';

  return (
    <AdaptiveGlassView style={[{ borderRadius: LEVEL_PROGRESS_RADIUS }, style]}>
      <View
        style={[styles.shell, { backgroundColor: 'transparent' }]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {!!trackWidth && (
          <Svg width={trackWidth} height={LEVEL_PROGRESS_HEIGHT} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                {gradientStops.map((stopColor, index) => (
                  <Stop
                    key={`${stopColor}-${index}`}
                    offset={`${(index / Math.max(gradientStops.length - 1, 1)) * 100}%`}
                    stopColor={stopColor}
                  />
                ))}
              </SvgLinearGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              rx={LEVEL_PROGRESS_RADIUS}
              ry={LEVEL_PROGRESS_RADIUS}
              width={trackWidth}
              height={LEVEL_PROGRESS_HEIGHT}
              fill={trackBaseColor}
            />
            <AnimatedRectSvg
              animatedProps={animatedProps}
              x={0}
              y={0}
              rx={LEVEL_PROGRESS_RADIUS}
              ry={LEVEL_PROGRESS_RADIUS}
              height={LEVEL_PROGRESS_HEIGHT}
              fill={`url(#${gradientId})`}
            />
          </Svg>
        )}

        <View style={styles.content} pointerEvents="none">
          <View style={[styles.ringOuter, { backgroundColor: leftRingBg, borderColor: ringBorderColor }]}>
            <View style={[styles.ringInner, { backgroundColor: innerRingColor }]}>
              <Text style={[styles.levelText, { color: levelNumberColor }]}>{level}</Text>
            </View>
          </View>

          <Text style={[styles.label, { color: labelColor }]}>{label ?? `Level ${level}`}</Text>

          <View style={styles.xpGroup}>
            <Star size={16} color="#FACC15" fill="#FACC15" />
            <Text style={[styles.xpCurrent, { color: labelColor }]}>{currentXp}</Text>
            <Text style={[styles.xpMax, { color: xpMaxColor }]}>/{targetXp}</Text>
          </View>

          <View
            style={[
              styles.ringOuter,
              { backgroundColor: rightRingBg, borderColor: ringBorderColor, opacity: 0.85 },
            ]}
          >
            <View style={[styles.ringInner, { backgroundColor: innerRingDimColor }]}>
              <Text style={[styles.levelText, { color: levelNumberDimColor, fontWeight: '600' }]}>{nextLevel}</Text>
            </View>
          </View>
        </View>
      </View>
    </AdaptiveGlassView>
  );
};
