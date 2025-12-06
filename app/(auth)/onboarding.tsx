import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Target,
  Wallet,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAppTheme } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  gradientColors: [string, string, string];
}

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    id: 'welcome',
    icon: <Sparkles size={64} color="#FFD700" />,
    title: 'Leora',
    subtitle: "Hayotingizni boshqaring",
    description: "Moliyaviy maqsadlaringiz, kundalik odatlaringiz va vaqtingizni bir joyda nazorat qiling",
    gradientColors: ['#1a1a2e', '#16213e', '#0f3460'],
  },
  {
    id: 'finance',
    icon: <Wallet size={64} color="#4CAF50" />,
    title: 'Moliya',
    subtitle: "Pullaringizni kuzating",
    description: "Daromad va xarajatlarni qayd qiling, budjetlar yarating, qarzlarni boshqaring va moliyaviy maqsadlarga erishing",
    gradientColors: ['#0f3460', '#1a472a', '#16213e'],
  },
  {
    id: 'planner',
    icon: <Target size={64} color="#FF6B6B" />,
    title: 'Rejalashtiruvchi',
    subtitle: "Maqsadlaringizga erishing",
    description: "Maqsadlar qo'ying, vazifalar yarating, foydali odatlar shakllantiring va o'z taraqqiyotingizni kuzating",
    gradientColors: ['#16213e', '#2d132c', '#1a1a2e'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { completeOnboarding } = useOnboardingStore();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useSharedValue(0);

  const updateCurrentPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const pageIndex = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      runOnJS(updateCurrentPage)(pageIndex);
    },
  });

  const handleNext = useCallback(() => {
    if (currentPage < ONBOARDING_PAGES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentPage + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      completeOnboarding();
      router.replace('/(auth)/login');
    }
  }, [completeOnboarding, currentPage, router]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    router.replace('/(auth)/login');
  }, [completeOnboarding, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={ONBOARDING_PAGES[currentPage].gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Skip Button */}
        <View style={styles.header}>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
          >
            <Text style={styles.skipText}>O'tkazib yuborish</Text>
          </Pressable>
        </View>

        {/* Pages */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={false}
        >
          {ONBOARDING_PAGES.map((page, index) => (
            <PageItem
              key={page.id}
              page={page}
              index={index}
              scrollX={scrollX}
            />
          ))}
        </Animated.ScrollView>

        {/* Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {/* Page Indicators */}
          <View style={styles.indicators}>
            {ONBOARDING_PAGES.map((_, index) => (
              <PageIndicator
                key={index}
                index={index}
                scrollX={scrollX}
              />
            ))}
          </View>

          {/* Next/Get Started Button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentPage === ONBOARDING_PAGES.length - 1
                  ? "Boshlash"
                  : "Davom etish"}
              </Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </SafeAreaView>
      </SafeAreaView>
    </View>
  );
}

interface PageItemProps {
  page: OnboardingPage;
  index: number;
  scrollX: Animated.SharedValue<number>;
}

function PageItem({ page, index, scrollX }: PageItemProps) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      scrollX.value,
      inputRange,
      [-15, 0, 15],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ rotate: `${rotate}deg` }, { scale }],
    };
  });

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.pageContent, animatedStyle]}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View style={styles.iconGlow}>
            {page.icon}
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>{page.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{page.subtitle}</Text>

        {/* Description */}
        <Text style={styles.description}>{page.description}</Text>
      </Animated.View>
    </View>
  );
}

interface PageIndicatorProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
}

function PageIndicator({ index, scrollX }: PageIndicatorProps) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      width: withSpring(width, { damping: 15 }),
      opacity: withTiming(opacity, { duration: 200 }),
    };
  });

  return (
    <Animated.View style={[styles.indicator, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  pageContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
