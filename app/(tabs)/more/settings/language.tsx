import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Globe } from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useSettingsStore, type SupportedLanguage } from '@/stores/useSettingsStore';
import { useLocalization } from '@/localization/useLocalization';

type LanguageOption = {
  value: SupportedLanguage;
  label: string;
  nativeLabel: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { value: 'uz', label: 'Uzbek', nativeLabel: 'Oʻzbekcha' },
  { value: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { value: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
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
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.highlight,
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
      backgroundColor:
        theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    codePill: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.overlaySoft,
    },
    codeText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    checkBadge: {
      width: 28,
      height: 28,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
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

const LanguageSettingsScreen: React.FC = () => {
  const appTheme = useAppTheme();
  const { strings } = useLocalization();
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
  const rippleColor =
    appTheme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)';

  const selectedLanguage = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const handleSelect = useCallback(
    (value: SupportedLanguage) => {
      setLanguage(value);
    },
    [setLanguage],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{strings.language.sectionTitle}</Text>
        <View style={styles.card}>
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = option.value === selectedLanguage;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                android_ripple={{ color: rippleColor }}
                style={styles.pressableWrapper}
              >
                <AdaptiveGlassView
                  style={[
                    styles.optionCard,
                    selected && styles.optionSelected,
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View style={styles.iconBadge}>
                      <Globe color={appTheme.colors.iconText} size={18} />
                    </View>
                    <View style={styles.optionTexts}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDescription}>{option.nativeLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.optionRight}>
                    <View style={styles.codePill}>
                      <Text style={styles.codeText}>{option.value.toUpperCase()}</Text>
                    </View>
                    {selected ? (
                      <View style={styles.checkBadge}>
                        <Check size={16} color={appTheme.colors.onPrimary} />
                      </View>
                    ) : null}
                  </View>
                </AdaptiveGlassView>
              </Pressable>
            );
          })}
        </View>

        <AdaptiveGlassView style={styles.helperCard}>
          <Text style={styles.helperTitle}>{strings.language.helperTitle}</Text>
          <Text style={styles.helperText}>
            {strings.language.helperDescription}
          </Text>
        </AdaptiveGlassView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LanguageSettingsScreen;
