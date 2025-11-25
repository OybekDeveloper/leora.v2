import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, MonitorCog, Moon, Sun } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettingsStore } from '@/stores/useSettingsStore';

type ThemeOption = {
  value: 'dark' | 'light' | 'auto';
  label: string;
  description: string;
  icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'dark',
    label: 'Dark',
    description: 'Deep contrast for OLED and night sessions.',
    icon: Moon,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Bright surfaces for daylight clarity.',
    icon: Sun,
  },
  {
    value: 'auto',
    label: 'System',
    description: 'Match your device’s appearance automatically.',
    icon: MonitorCog,
  },
];

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
      color: theme.colors.textMuted,
      fontSize: 13,
      letterSpacing: 0.5,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    card: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    pressableWrapper: {
      borderRadius: theme.radius.xl,
      overflow: 'hidden',
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md + 2,
      borderRadius: theme.radius.xl,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    optionSelected: {
      borderColor: theme.colors.textSecondary,
      backgroundColor: theme.colors.card,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
      backgroundColor: theme.colors.cardItem,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    optionTexts: {
      flexShrink: 1,
    },
    optionLabel: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    optionDescription: {
      color: theme.colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    optionRight: {
      width: 28,
      height: 28,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
    },
    optionRightSelected: {
      backgroundColor: theme.colors.cardItem,
      borderColor: theme.colors.cardItem,
    },
    optionRightPlaceholder: {
      borderColor: theme.colors.border,
    },
    helperCard: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardItem,
    },
    helperTitle: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    helperText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
  });

const ThemeSettingsScreen: React.FC = () => {
  const appTheme = useAppTheme();
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
  const colorScheme = useColorScheme();

  const currentTheme = useSettingsStore((state) => state.theme);
  const setStoredTheme = useSettingsStore((state) => state.setTheme);
  const { setTheme: setContextTheme } = useTheme();
  const rippleColor =
    appTheme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)';

  const handleSelect = useCallback(
    (value: ThemeOption['value']) => {
      setStoredTheme(value);
      if (value === 'auto') {
        const resolved = colorScheme === 'light' ? 'light' : 'dark';
        setContextTheme(resolved);
      } else {
        setContextTheme(value);
      }
    },
    [colorScheme, setContextTheme, setStoredTheme],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          {THEME_OPTIONS.map((option) => {
            const selected = currentTheme === option.value;
            const Icon = option.icon;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                android_ripple={{ color: rippleColor }}
              >
                <AdaptiveGlassView
                  style={[
                    styles.optionCard,
                    selected && styles.optionSelected,
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View style={styles.iconBadge}>
                      <Icon color={appTheme.colors.iconText} size={18} />
                    </View>
                    <View style={styles.optionTexts}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.optionRight,
                      selected ? styles.optionRightSelected : styles.optionRightPlaceholder,
                    ]}
                  >
                    {selected ? <Check size={16} color={appTheme.colors.textSecondary} /> : null}
                  </View>
                </AdaptiveGlassView>
              </Pressable>
            );
          })}
        </View>

        <AdaptiveGlassView style={styles.helperCard}>
          <Text style={styles.helperTitle}>Heads up</Text>
          <Text style={styles.helperText}>
            Switching to System mode will follow your device appearance automatically. Dark reduces
            eye strain at night, while Light keeps cards bright for daytime viewing.
          </Text>
        </AdaptiveGlassView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ThemeSettingsScreen;
