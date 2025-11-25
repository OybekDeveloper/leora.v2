// apps/mobile/src/components/LeoraSplashScreen.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LeoraSplashScreenProps {
  onAnimationComplete?: () => void;
  ready?: boolean;
}

const LOADING_TEXTS = [
  'Initializing System',
  'Loading Resources',
  'Preparing Interface',
  'Finalizing Setup',
  'Ready to Launch',
];

const LOGO_SOURCE = require('@assets/images/icon.png');

// Цветовая палитра LEORA
const COLORS = {
  leoraBlack: '#000000',
  leoraWhite: '#ffffff',
  neutral50: '#fafafa',
  neutral100: '#f4f4f5',
  neutral200: '#e4e4e7',
  neutral300: '#d1d1d6',
  neutral400: '#a1a1aa',
  neutral500: '#71717a',
  neutral600: '#52525b',
  neutral700: '#3f3f46',
  neutral800: '#27272a',
  neutral850: '#1f1f23',
  neutral900: '#18181b',
  neutral925: '#121214',
  neutral950: '#09090b',
};

// Компонент частицы
const Particle = ({ delay, left }: { delay: number; left: string }) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(delay * 1000),
        Animated.loop(
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -100,
              duration: 8000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 1,
                duration: 6400,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
          ])
        ),
      ]).start();
    };

    animate();
  }, [delay, translateY, opacity]);

  const animatedStyle: Animated.WithAnimatedValue<ViewStyle> = {
    left: left as any,
    opacity,
    transform: [{ translateY }],
  };

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
      ]}
    />
  );
};

export default function LeoraSplashScreen({ onAnimationComplete, ready = false }: LeoraSplashScreenProps) {
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [introComplete, setIntroComplete] = useState(false);
  const textIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const exitStartedRef = useRef(false);
  
  // Анимации
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(30)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.8)).current;
  const gridOpacity = useRef(new Animated.Value(0.1)).current;
  const introTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Запуск всех анимаций
    const startAnimations = () => {
      // Анимация сетки
      Animated.loop(
        Animated.sequence([
          Animated.timing(gridOpacity, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(gridOpacity, {
            toValue: 0.1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Анимация заголовка
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Анимация логотипа
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Анимация текста LEORA
      Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Анимация подзаголовка
      Animated.sequence([
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslateY, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Анимация загрузки
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Анимация прогресс-бара
      Animated.sequence([
        Animated.delay(2500),
        Animated.timing(progressWidth, {
          toValue: 100,
          duration: 3000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();

      // Анимация свечения
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimations();

    // Изменение текста загрузки
    let textIndex = 0;
    textIntervalRef.current = setInterval(() => {
      textIndex++;
      if (textIndex < LOADING_TEXTS.length) {
        setLoadingText(LOADING_TEXTS[textIndex]);
      }
    }, 1000);
    introTimerRef.current = setTimeout(() => {
      setIntroComplete(true);
    }, 4800);

    return () => {
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current);
        introTimerRef.current = null;
      }
      if (textIntervalRef.current) {
        clearInterval(textIntervalRef.current);
        textIntervalRef.current = null;
      }
    };
  }, [
    fadeAnim,
    gridOpacity,
    headerOpacity,
    headerTranslateY,
    logoOpacity,
    logoScale,
    logoTranslateY,
    textOpacity,
    textTranslateY,
    taglineOpacity,
    taglineTranslateY,
    loadingOpacity,
    progressWidth,
    glowOpacity,
  ]);

  useEffect(() => {
    if (!ready || !introComplete || exitStartedRef.current) {
      return;
    }

    exitStartedRef.current = true;

    if (introTimerRef.current) {
      clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
    if (textIntervalRef.current) {
      clearInterval(textIntervalRef.current);
      textIntervalRef.current = null;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onAnimationComplete?.();
    });
  }, [ready, introComplete, fadeAnim, onAnimationComplete]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        },
      ]}
    >
      {/* Фоновая сетка */}
      <Animated.View style={[styles.gridBackground, { opacity: gridOpacity }]}>
        {Array.from({ length: Math.ceil(height / 60) }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineHorizontal, { top: i * 60 }]} />
        ))}
        {Array.from({ length: Math.ceil(width / 60) }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineVertical, { left: i * 60 }]} />
        ))}
      </Animated.View>

      {/* Радиальный градиент */}
      <LinearGradient
        colors={[COLORS.leoraBlack, COLORS.leoraBlack, COLORS.leoraBlack]}
        style={styles.gradientOverlay}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Частицы */}
      <Particle delay={0} left="10%" />
      <Particle delay={2} left="20%" />
      <Particle delay={4} left="30%" />
      <Particle delay={1} left="40%" />
      <Particle delay={3} left="50%" />
      <Particle delay={5} left="60%" />
      <Particle delay={1.5} left="70%" />
      <Particle delay={3.5} left="80%" />
      <Particle delay={0.5} left="90%" />

      {/* Логотип и текст */}
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          {/* Логотип */}
          <Animated.View
            style={[
              styles.logoMain,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { translateY: logoTranslateY },
                ],
              },
            ]}
          >
            <Animated.Image
              source={LOGO_SOURCE}
              resizeMode="contain"
              style={[styles.logoImage, { opacity: glowOpacity }]}
            />
          </Animated.View>

          {/* Текст LEORA с тонким шрифтом */}
          <Animated.Text
            style={[
              styles.brandText,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            LEORA
          </Animated.Text>
        </View>

        {/* Подзаголовок */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          Order in Tasks & Money
        </Animated.Text>
      </View>

      {/* Индикатор загрузки */}
      <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
        {/* Прогресс-бар */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.neutral400, COLORS.neutral200]}
              style={styles.gradientFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        
        {/* Текст загрузки */}
        <Text style={styles.loadingText}>{loadingText}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.leoraBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: COLORS.neutral925,
  },
  gridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: COLORS.neutral925,
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: COLORS.neutral700,
    borderRadius: 1,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: width > 400 ? 13 : 11,
    fontWeight: '300',
    color: COLORS.neutral500,
    letterSpacing: width > 400 ? 3 : 2,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMain: {
    width: 120,
    height: 120,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.leoraWhite,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  brandText: {
    fontSize: width > 400 ? 56 : 48,
    fontWeight: '200', // Изменено с '900' на '200' для тонкого шрифта
    color: COLORS.leoraWhite,
    letterSpacing: width > 400 ? 12 : 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-thin',
    marginBottom: 12,
    marginLeft:20
  },
  tagline: {
    fontSize: width > 400 ? 16 : 14,
    fontWeight: '300',
    color: COLORS.neutral500,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: Math.min(300, width * 0.8),
    height: 2,
    backgroundColor: COLORS.neutral900,
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '300',
    color: COLORS.neutral600,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
