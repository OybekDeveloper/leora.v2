import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react-native';

import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAppTheme, type Theme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettingsStore, type SupportedLanguage } from '@/stores/useSettingsStore';

// Lokalizatsiya fayllari
import enOnboarding from '@/localization/onboarding/en.json';
import uzOnboarding from '@/localization/onboarding/uz.json';
import ruOnboarding from '@/localization/onboarding/ru.json';
import arOnboarding from '@/localization/onboarding/ar.json';
import trOnboarding from '@/localization/onboarding/tr.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OnboardingStrings = typeof enOnboarding;

const ONBOARDING_STRINGS: Record<SupportedLanguage, OnboardingStrings> = {
  en: enOnboarding,
  uz: uzOnboarding,
  ru: ruOnboarding,
  ar: arOnboarding,
  tr: trOnboarding,
};

interface OnboardingPage {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}

const PAGE_ICONS = [
  (color: string) => <Sparkles size={64} color={color} />,
  (color: string) => <Wallet size={64} color={color} />,
  (color: string) => <Target size={64} color={color} />,
];

const ICON_COLORS = ['#FFD700', '#4CAF50', '#FF6B6B'];

export default function OnboardingScreen() {
  const router = useRouter();
  const appTheme = useAppTheme();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const language = useSettingsStore((state) => state.language) as SupportedLanguage;
  const strings = ONBOARDING_STRINGS[language] || ONBOARDING_STRINGS.en;
  const styles = useMemo(() => createStyles(appTheme, isDark), [appTheme, isDark]);

  const { completeOnboarding } = useOnboardingStore();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useSharedValue(0);

  const pages: OnboardingPage[] = useMemo(() => {
    return strings.pages.map((page, index) => ({
      id: page.id,
      title: page.title,
      subtitle: page.subtitle,
      description: page.description,
      icon: PAGE_ICONS[index](ICON_COLORS[index]),
    }));
  }, [strings.pages]);

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
    if (currentPage < pages.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentPage + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      completeOnboarding();
      router.replace('/(auth)/login');
    }
  }, [completeOnboarding, currentPage, pages.length, router]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    router.replace('/(auth)/login');
  }, [completeOnboarding, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#1a1a2e', '#16213e', '#0f3460']
          : ['#f8fafc', '#e2e8f0', '#cbd5e1']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Skip and Theme Toggle */}
        <View style={styles.header}>
          <Pressable
            onPress={toggleTheme}
            style={({ pressed }) => [styles.themeToggle, pressed && styles.pressed]}
          >
            {isDark ? (
              <Sun size={20} color={appTheme.colors.textPrimary} />
            ) : (
              <Moon size={20} color={appTheme.colors.textPrimary} />
            )}
          </Pressable>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
          >
            <Text style={styles.skipText}>{strings.skip}</Text>
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
          {pages.map((page, index) => (
            <PageItem
              key={page.id}
              page={page}
              index={index}
              scrollX={scrollX}
              theme={appTheme}
              isDark={isDark}
            />
          ))}
        </Animated.ScrollView>

        {/* Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {/* Page Indicators */}
          <View style={styles.indicators}>
            {pages.map((_, index) => (
              <PageIndicator
                key={index}
                index={index}
                scrollX={scrollX}
                isDark={isDark}
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
                {currentPage === pages.length - 1
                  ? strings.getStarted
                  : strings.continue}
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
  theme: Theme;
  isDark: boolean;
}

function PageItem({ page, index, scrollX, theme, isDark }: PageItemProps) {
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

  const styles = useMemo(() => createPageStyles(theme, isDark), [theme, isDark]);

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
  isDark: boolean;
}

function PageIndicator({ index, scrollX, isDark }: PageIndicatorProps) {
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
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: isDark ? '#FFFFFF' : '#1e293b',
        },
        animatedStyle,
      ]}
    />
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a2e' : '#f8fafc',
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    skipText: {
      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      fontSize: 14,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.7,
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

const createPageStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
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
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: isDark ? '#fff' : '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 30,
    },
    title: {
      fontSize: 42,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1e293b',
      textAlign: 'center',
      marginBottom: 12,
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: 22,
      fontWeight: '600',
      color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
      textAlign: 'center',
      marginBottom: 20,
    },
    description: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(30, 41, 59, 0.6)',
      textAlign: 'center',
      lineHeight: 26,
      paddingHorizontal: 8,
    },
  });
