import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/constants/theme';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { getProgressColor } from '@/features/progress/colorUtils';
import { useSelectedDayStore } from '@/stores/selectedDayStore';
import { useLocalization } from '@/localization/useLocalization';
import type { ProgressData } from '@/types/home';

interface Props {
  scrollY: SharedValue<number>;
  data?: ProgressData | null;
  isLoading?: boolean;
  selectedDate: Date;
}

type MetricKey = keyof ProgressData;

export default function ProgressIndicators({
  scrollY,
  data,
  isLoading = false,
  selectedDate,
}: Props) {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const setSelectedDay = useSelectedDayStore((state) => state.setSelectedDate);
  const SCROLL_THRESHOLD = 100;
  const hasData = Boolean(data);

  const containerStyle = useAnimatedStyle(() => {
    const collapse = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const height = 180 - collapse * 120;

    return { height };
  });

  const circleContainerStyle = useAnimatedStyle(() => {
    const collapse = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = 1 - collapse * 0.792;
    const translateX = -10 * collapse;
    const translateY = 90 * collapse;

    return {
      transform: [{ scale }, { translateX }, { translateY }],
    };
  });

  const percentStyle = useAnimatedStyle(() => {
    const hideProgress = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      Extrapolation.CLAMP
    );
    const opacity = 1 - hideProgress;
    const scale = 1 - hideProgress * 0.22;

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const rightShift = interpolate(
      scrollY.value,
      [0, 60],
      [0, 1],
      Extrapolation.CLAMP
    );
    const verticalShift = interpolate(
      scrollY.value,
      [50, SCROLL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateX = 45 * rightShift;
    const translateY = -44 * verticalShift;

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    const collapse = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const paddingRight = 55 * collapse;

    return {
      paddingRight,
    };
  });

  const progressItems = useMemo(
    () => [
      { key: 'tasks' as const, label: strings.home.progress.tasks, value: data?.tasks ?? 0 },
      { key: 'budget' as const, label: strings.home.progress.budget, value: data?.budget ?? 0 },
      { key: 'focus' as const, label: strings.home.progress.habit, value: data?.focus ?? 0 },
    ],
    [data, strings.home.progress.budget, strings.home.progress.habit, strings.home.progress.tasks],
  );

  const metricRoutes = useMemo<Record<MetricKey, string>>(
    () => ({
      tasks: '/(tabs)/(planner)/(tabs)',
      budget: '/(tabs)/(finance)/(tabs)/budgets',
      focus: '/(tabs)/(planner)/(tabs)/habits',
    }),
    [],
  );

  const handleNavigate = useCallback(
    (key: MetricKey) => {
      const target = metricRoutes[key];
      if (!target) return;
      setSelectedDay(selectedDate);
      router.push({
        pathname: target,
        params: {
          date: selectedDate.toISOString(),
        },
      });
    },
    [metricRoutes, router, selectedDate, setSelectedDay],
  );

  const styles = createStyles(theme);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.innerContainer, progressAnimatedStyle]}>
        {progressItems.map((item) => {
          const progressValue = hasData ? item.value : 0;
          const circleColor = getProgressColor(theme, item.value, hasData);
          const valueText = hasData ? `${Math.round(item.value)}%` : '--%';
          const valueColor = hasData ? theme.colors.textPrimary : theme.colors.textSecondary;
          const labelColor = hasData ? theme.colors.textSecondary : theme.colors.textTertiary;

          const trackColor = theme.mode === 'light' ? theme.colors.cardItem : theme.colors.card;

          return (
            <Pressable
              key={item.key}
              style={styles.itemWrapper}
              onPress={() => handleNavigate(item.key)}
              android_ripple={{ color: `${theme.colors.primary}22`, borderless: true }}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} ${strings.home.progress.progressSuffix}`}
            >
              <Animated.View style={[styles.circleContainer, circleContainerStyle]}>
                <CircularProgress
                  progress={progressValue}
                  color={circleColor}
                  trackColor={trackColor}
                />

                <Animated.Text style={[styles.percentText, percentStyle, { color: valueColor }]}>
                  {isLoading ? '--%' : valueText}
                </Animated.Text>
              </Animated.View>

              <Animated.Text style={[styles.labelText, labelStyle, { color: labelColor }]}>
                {item.label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 99,
    justifyContent: 'center',
    paddingTop: 20,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  itemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  percentText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
  },
});
