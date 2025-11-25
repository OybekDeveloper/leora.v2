import { useMemo } from 'react';
import {
  ColorSchemeName,
  Platform,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useTheme as useThemePreference } from '@/contexts/ThemeContext';

// === Brand Color Tokens (formerly Colors.ts) ===
export const Colors = {
  // === Основные цвета бренда ===
  primary: '#59595F',      // Яркий синий
  white: "#fff",

  secondary: '#7c3aed',     // Фиолетовый акцент
  secondaryLight: '#8b5cf6',
  secondaryDark: '#6d28d9',

  // === Темная тема (Dark/AMOLED) ===
  background: '#25252B',    // Почти черный фон
  backgroundElevated: '#0f0f10',

  surface: '#31313A',       // Карточки первого уровня
  surfaceElevated: '#1c1c21', // Приподнятые карточки
  surfaceHighlight: '#030304ff', // Hover/Active состояния

  // === Текст с правильной иерархией ===
  textPrimary: '#ffffff',   // Основной текст
  textSecondary: '#94969c', // Вторичный текст
  textTertiary: '#5f6168',  // Подписи и хинты
  textDisabled: '#3a3a42',  // Неактивный текст

  // === Статусы (успех/ошибка/предупреждение) ===
  success: '#10b981',       // Зеленый для доходов
  successLight: '#34d399',
  successDark: '#059669',
  successBg: '#10b98110',

  danger: '#ef4444',        // Красный для расходов
  dangerLight: '#f87171',
  dangerDark: '#dc2626',
  dangerBg: '#ef444410',

  warning: '#f59e0b',       // Оранжевый для алертов
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  warningBg: '#f59e0b10',

  info: '#3b82f6',          // Синий для информации
  infoBg: '#3b82f610',

  // === Финансы ===
  income: '#10b981',        // Зеленый для доходов
  expense: '#ef4444',       // Красный для расходов
  transfer: '#3b82f6',      // Синий для переводов
  adjustment: '#8b5cf6',    // Фиолетовый для корректировок

  // === KPI кольца (по спеке) ===
  ringLow: '#10b981',       // <60% - зеленый
  ringMid: '#f59e0b',       // 60-90% - желтый
  ringHigh: '#ef4444',      // >90% - красный

  // === Границы и разделители ===
  border: '#34343D',        // Основная граница
  borderLight: '#27272a',   // Светлая граница
  borderFocus: '#2563eb',   // Граница при фокусе

  // === Tab bar (premium) ===
  tabBarBg: '#0a0a0b',
  tabBarBorder: '#1f1f23',
  tabBarActive: '#ffffff',
  tabBarInactive: '#5f6168',

  // === Градиенты для премиального UI ===
  gradients: {
    primary: ['#2563eb', '#3b82f6'],
    success: ['#10b981', '#34d399'],
    danger: ['#ef4444', '#f87171'],
    premium: ['#7c3aed', '#8b5cf6', '#a78bfa'],
    dark: ['#16161a', '#1c1c21'],
    card: ['#1c1c21', '#16161a'],
  },

  // === Прозрачности для оверлеев ===
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    heavy: 'rgba(0, 0, 0, 0.7)',
  },

  // === Тени для elevation (iOS стиль) ===
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
  },
} as const;

export const DesignTokens = {
  typography: {
    titleXL: {
      fontSize: 32,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    titleL: {
      fontSize: 24,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      lineHeight: 32,
    },
    titleM: {
      fontSize: 20,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
      lineHeight: 28,
    },
    titleS: {
      fontSize: 18,
      fontWeight: '600' as const,
      letterSpacing: -0.1,
      lineHeight: 24,
    },
    bodyL: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyM: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    bodyS: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    caption: {
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    label: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
      damping: 15,
      stiffness: 100,
    },
  },
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
    fab: 100,
    fabMenu: 99,
    backdrop: 98,
  },
} as const;

export type ThemeMode = 'light' | 'dark';

export interface FontFamilies {
  sans: string;
  serif: string;
  rounded: string;
  mono: string;
}

const baseFonts: FontFamilies = {
  sans: 'normal',
  serif: 'serif',
  rounded: 'normal',
  mono: 'monospace',
};

const iosFonts: FontFamilies = {
  sans: 'system-ui',
  serif: 'ui-serif',
  rounded: 'ui-rounded',
  mono: 'ui-monospace',
};

const webFonts: FontFamilies = {
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
  mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};

export const Fonts: FontFamilies =
  Platform.select<FontFamilies>({
    ios: iosFonts,
    android: baseFonts,
    native: baseFonts,
    default: baseFonts,
    web: webFonts,
  }) ?? baseFonts;

export interface ThemeColors {
  background: string;
  glassTinColor: string,
  backgroundMuted: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  card: string;
  cardItem: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  border: string;
  borderMuted: string;
  shadowColor: string;
  overlaySoft: string;
  overlayStrong: string;
  backdrop: string;
  highlight: string;
  gradientScrim: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  onSecondary: string;
  success: string;
  successBg: string;
  onSuccess: string;
  warning: string;
  warningBg: string;
  onWarning: string;
  danger: string;
  dangerBg: string;
  onDanger: string;
  info: string;
  infoBg: string;
  onInfo: string;
  textTertiary: string;
  white: string,
  textLock: string;
  backgroundLock: string;
  icon: string;
  iconText: string;
  iconTextSecondary: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof DesignTokens.spacing;
  radius: typeof DesignTokens.radius;
  typography: typeof DesignTokens.typography;
  shadows: typeof Colors.shadows;
  gradients: typeof Colors.gradients;
  fonts: FontFamilies;
}

const sharedPalette = {
  primary: Colors.primary,
  secondary: Colors.secondary,
  secondaryLight: Colors.secondaryLight,
  secondaryDark: Colors.secondaryDark,
  success: Colors.success,
  successBg: Colors.successBg,
  warning: Colors.warning,
  warningBg: Colors.warningBg,
  danger: Colors.danger,
  dangerBg: Colors.dangerBg,
  info: Colors.info,
  infoBg: Colors.infoBg,
  white: Colors.white,
};

const lightColors: ThemeColors = {
  ...sharedPalette,
  glassTinColor: "#fff",
  background: '#F2F2F2',
  backgroundMuted: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF2F6',
  surfaceMuted: '#DFE5EC',
  card: '#FFFFFF',
  cardItem: '#F6F6F8',
  textPrimary: '#0F172A',
  textSecondary: '#475467',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',
  border: '#DFE5EC',
  borderMuted: '#EEF2F6',
  shadowColor: 'rgba(15,23,42,0.12)',
  overlaySoft: 'rgba(15,23,42,0.05)',
  overlayStrong: 'rgba(15,23,42,0.16)',
  backdrop: '#FFFFFF',
  highlight: Colors.primary + '18',
  gradientScrim: 'rgba(255,255,255,0.86)',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  success: sharedPalette.success,
  successBg: sharedPalette.successBg,
  onSuccess: '#FFFFFF',
  warning: sharedPalette.warning,
  warningBg: sharedPalette.warningBg,
  onWarning: '#111827',
  danger: sharedPalette.danger,
  dangerBg: sharedPalette.dangerBg,
  onDanger: '#FFFFFF',
  info: sharedPalette.info,
  infoBg: sharedPalette.infoBg,
  onInfo: '#FFFFFF',
  primary: sharedPalette.primary,
  secondary: sharedPalette.secondary,
  secondaryLight: sharedPalette.secondaryLight,
  secondaryDark: sharedPalette.secondaryDark,
  textTertiary: "#0F172A",
  textLock: "#000",
  backgroundLock: "#fff",
  icon: "#404046",
  iconText: "#FFFFFF",
  iconTextSecondary: "#000000"
};

const darkColors: ThemeColors = {
  ...sharedPalette,
  glassTinColor: "393941ff",
  background: '#25252B',
  backgroundMuted: Colors.backgroundElevated,
  surface: '#252530',
  surfaceElevated: '#1F1F28',
  surfaceMuted: Colors.surfaceHighlight,
  card: '#31313A',
  cardItem: '#404049ff',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A8',
  textMuted: '#6B6B75',
  textDisabled: Colors.textDisabled,
  border: '#2E2E38',
  borderMuted: Colors.borderLight,
  shadowColor: 'rgba(0,0,0,0.55)',
  overlaySoft: Colors.overlay.light,
  overlayStrong: Colors.overlay.medium,
  backdrop: Colors.overlay.heavy,
  highlight: Colors.primary + '26',
  gradientScrim: 'rgba(5,5,7,0.7)',
  onPrimary: '#0B0B0D',
  onSecondary: Colors.background,
  success: sharedPalette.success,
  successBg: sharedPalette.successBg,
  onSuccess: Colors.background,
  warning: sharedPalette.warning,
  warningBg: sharedPalette.warningBg,
  onWarning: Colors.background,
  danger: sharedPalette.danger,
  dangerBg: sharedPalette.dangerBg,
  onDanger: Colors.background,
  info: sharedPalette.info,
  infoBg: sharedPalette.infoBg,
  onInfo: Colors.background,
  primary: sharedPalette.primary,
  secondary: sharedPalette.secondary,
  secondaryLight: sharedPalette.secondaryLight,
  secondaryDark: sharedPalette.secondaryDark,
  textTertiary: "#FFFFFF",
  textLock: "#fff",
  backgroundLock: "#000",
  icon: "#404046",
  iconText: "#A6A6B9",
  iconTextSecondary: "#A6A6B9"

};

const sharedThemeFields: Omit<Theme, 'mode' | 'colors'> = {
  spacing: DesignTokens.spacing,
  radius: DesignTokens.radius,
  typography: DesignTokens.typography,
  shadows: Colors.shadows,
  gradients: Colors.gradients,
  fonts: Fonts,
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  ...sharedThemeFields,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  ...sharedThemeFields,
};

const THEMES: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

export const resolveTheme = (scheme: ColorSchemeName | ThemeMode | null | undefined): Theme => {
  if (scheme === 'light') return THEMES.light;
  return THEMES.dark;
};

export const getTheme = (mode: ThemeMode): Theme => THEMES[mode];

export const useAppTheme = (override?: ThemeMode): Theme => {
  const { theme: contextTheme } = useThemePreference();
  const scheme = useColorScheme();
  const resolvedMode = override ?? (contextTheme ?? (scheme === 'light' ? 'light' : 'dark'));
  return THEMES[resolvedMode];
};

export const useThemeColors = (override?: ThemeMode): ThemeColors =>
  useAppTheme(override).colors;

export const createThemedStyles = <T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  stylesCreator: (theme: Theme) => T,
) => {
  return () => {
    const theme = useAppTheme();
    return useMemo(() => StyleSheet.create(stylesCreator(theme)), [theme]);
  };
};
