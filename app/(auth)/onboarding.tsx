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
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  withTiming,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import {
  ChevronRight,
  Sun,
  Moon,
  PieChart,
  HandCoins,
  TrendingUp,
  Wallet,
  Target,
  CheckSquare,
  Flame,
  Timer,
  Sparkles,
  Mic,
  Bell,
  Lightbulb,
} from 'lucide-react-native';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAppTheme, type Theme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettingsStore, type SupportedLanguage } from '@/stores/useSettingsStore';
import { OnboardingMockup, type MockupStrings } from '@/components/onboarding';
import { ONBOARDING_PAGES, type OnboardingPageConfig } from '@/data/onboardingPages';
import { CompactLanguageSelector } from '@/components/shared/CompactLanguageSelector';

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

// Icon components mapping
const ICON_COMPONENTS: Record<string, React.FC<{ size: number; color: string }>> = {
  PieChart,
  HandCoins,
  TrendingUp,
  Wallet,
  Target,
  CheckSquare,
  Flame,
  Timer,
  Sparkles,
  Mic,
  Bell,
  Lightbulb,
};

interface OnboardingPage {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  config: OnboardingPageConfig;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const appTheme = useAppTheme();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const language = useSettingsStore((state) => state.language) as SupportedLanguage;
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const strings = ONBOARDING_STRINGS[language] || ONBOARDING_STRINGS.en;
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);

  const { completeOnboarding, getCurrentPageIndices } = useOnboardingStore();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useSharedValue(0);

  // Haftalik rotatsiya asosida 3 ta sahifa olish
  const pageIndices = useMemo(() => getCurrentPageIndices(), [getCurrentPageIndices]);

  const pages: OnboardingPage[] = useMemo(() => {
    return pageIndices.map((pageIndex) => {
      const config = ONBOARDING_PAGES[pageIndex];
      const pageStrings = strings.pages[pageIndex];
      const IconComponent = ICON_COMPONENTS[config.icon];

      return {
        id: config.id,
        icon: IconComponent ? <IconComponent size={48} color={appTheme.colors.textSecondary} /> : null,
        title: pageStrings?.title || config.id,
        subtitle: pageStrings?.subtitle || '',
        description: pageStrings?.description || '',
        config,
      };
    });
  }, [pageIndices, strings.pages, appTheme.colors.textSecondary]);

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

  // Kategoriya badge rangi - monoxrom theme ranglar
  const getCategoryColor = () => {
    return appTheme.colors.textSecondary;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'finance':
        return language === 'uz' ? 'Moliya' : language === 'ru' ? 'Финансы' : 'Finance';
      case 'planner':
        return language === 'uz' ? 'Rejalashtirish' : language === 'ru' ? 'Планировщик' : 'Planner';
      case 'insight':
        return language === 'uz' ? 'AI Insight' : language === 'ru' ? 'AI Инсайты' : 'AI Insight';
      default:
        return category;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Language, Theme Toggle and Skip */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Language Selector */}
            <CompactLanguageSelector
              value={language}
              onChange={setLanguage}
            />

            {/* Theme Toggle */}
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
          </View>

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
              getCategoryColor={getCategoryColor}
              getCategoryLabel={getCategoryLabel}
              mockupStrings={strings.mockup as MockupStrings}
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
                theme={appTheme}
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
            <View style={styles.nextButtonInner}>
              <Text style={styles.nextButtonText}>
                {currentPage === pages.length - 1
                  ? strings.getStarted
                  : strings.continue}
              </Text>
              <ChevronRight size={20} color={appTheme.colors.textPrimary} />
            </View>
          </Pressable>
        </SafeAreaView>
      </SafeAreaView>
    </View>
  );
}

interface PageItemProps {
  page: OnboardingPage;
  index: number;
  scrollX: SharedValue<number>;
  theme: Theme;
  getCategoryColor: (category: string) => string;
  getCategoryLabel: (category: string) => string;
  mockupStrings: MockupStrings;
}

function PageItem({
  page,
  index,
  scrollX,
  theme,
  getCategoryColor,
  getCategoryLabel,
  mockupStrings,
}: PageItemProps) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const timingConfig = { duration: 250, easing: Easing.out(Easing.cubic) };

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [20, 0, 20],
      Extrapolation.CLAMP
    );

    return {
      opacity: withTiming(opacity, timingConfig),
      transform: [{ translateY: withTiming(translateY, timingConfig) }],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.85, 1, 0.85],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: withTiming(scale, timingConfig) }],
    };
  });

  const styles = useMemo(() => createPageStyles(theme), [theme]);
  const categoryColor = getCategoryColor(page.config.category);

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.pageContent, animatedStyle]}>
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {getCategoryLabel(page.config.category)}
          </Text>
        </View>

        {/* Icon */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View style={styles.iconGlow}>
            {page.icon}
          </View>
        </Animated.View>

        {/* Mockup */}
        <OnboardingMockup
          type={page.config.mockupType}
          theme={theme}
          scrollX={scrollX}
          pageIndex={index}
          screenWidth={SCREEN_WIDTH}
          strings={mockupStrings}
        />

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
  scrollX: SharedValue<number>;
  theme: Theme;
}

function PageIndicator({ index, scrollX, theme }: PageIndicatorProps) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const timingConfig = { duration: 250, easing: Easing.out(Easing.cubic) };

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
      width: withTiming(width, timingConfig),
      opacity: withTiming(opacity, timingConfig),
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.textSecondary,
        },
        animatedStyle,
      ]}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      paddingBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.cardItem,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.colors.cardItem,
    },
    skipText: {
      color: theme.colors.textSecondary,
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
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    nextButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    nextButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      paddingHorizontal: 32,
      gap: 8,
    },
    nextButtonText: {
      color: theme.colors.textPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
  });

const createPageStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      width: SCREEN_WIDTH,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    pageContent: {
      alignItems: 'center',
      width: '100%',
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 16,
    },
    categoryDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    iconContainer: {
      marginBottom: 8,
    },
    iconGlow: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.cardItem,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 10,
    },
    description: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 16,
    },
  });
