import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';

import { useAppTheme, type Theme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import {
  FINANCE_REGION_PRESETS,
  type FinanceRegion,
  useFinancePreferencesStore,
} from '@/stores/useFinancePreferencesStore';
import { useShallow } from 'zustand/react/shallow';

export default function SelectRegionScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { strings } = useLocalization();
  const profileStrings = strings.profile;
  const commonStrings = (strings as any).common ?? {};
  const closeLabel = commonStrings.close ?? 'Close';
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { region, setRegion } = useFinancePreferencesStore(
    useShallow((state) => ({
      region: state.region,
      setRegion: state.setRegion,
    })),
  );

  const handleSelectRegion = (regionId: FinanceRegion) => {
    setRegion(regionId, { syncDisplayCurrency: false });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{profileStrings.finance.regionSheetTitle}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeText}>{closeLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {FINANCE_REGION_PRESETS.map((preset) => {
          const isActive = preset.id === region;
          return (
            <Pressable
              key={preset.id}
              onPress={() => handleSelectRegion(preset.id as FinanceRegion)}
              style={({ pressed }) => [
                styles.regionRow,
                isActive && styles.regionRowActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.regionTitle}>{preset.label}</Text>
              {isActive && (
                <View style={styles.checkIcon}>
                  <Check size={18} color={theme.colors.primary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    content: {
      padding: 16,
      gap: 10,
    },
    regionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    regionRowActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
    },
    regionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    checkIcon: {
      marginLeft: 12,
    },
    pressed: {
      opacity: 0.8,
    },
  });
