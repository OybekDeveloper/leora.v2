import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Globe, Check, ChevronDown } from 'lucide-react-native';

import { LANGUAGE_OPTIONS, type LanguageOption } from '@/constants/languageOptions';
import type { SupportedLanguage } from '@/stores/useSettingsStore';
import { useAppTheme, type Theme } from '@/constants/theme';

interface CompactLanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
}

/**
 * Compact language selector with Globe icon and language code (UZ, EN, RU, etc.)
 * Designed for header placement in auth screens
 */
export const CompactLanguageSelector: React.FC<CompactLanguageSelectorProps> = ({
  value,
  onChange,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isFocused, setIsFocused] = useState(false);

  // Get language code in uppercase (en -> EN, uz -> UZ, etc.)
  const languageCode = value.toUpperCase();

  return (
    <Dropdown
      data={LANGUAGE_OPTIONS}
      labelField="label"
      valueField="value"
      value={value}
      onChange={(item: LanguageOption) => {
        onChange(item.value);
        setIsFocused(false);
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[styles.dropdown, isFocused && styles.dropdownFocused]}
      containerStyle={styles.dropdownContainer}
      renderLeftIcon={() => (
        <View style={styles.leftIconContainer}>
          <Globe size={18} color={theme.colors.textPrimary} />
          <Text style={styles.languageCode}>{languageCode}</Text>
        </View>
      )}
      renderItem={(item: LanguageOption) => {
        const active = item.value === value;
        return (
          <View style={[styles.dropdownItem, active && styles.dropdownItemActive]}>
            <Text style={styles.itemCode}>{item.value.toUpperCase()}</Text>
            <Text style={[styles.dropdownItemLabel, active && styles.dropdownItemLabelActive]}>
              {item.label}
            </Text>
            {active && <Check size={16} color={theme.colors.textPrimary} />}
          </View>
        );
      }}
      renderRightIcon={() => (
        <ChevronDown size={14} color={theme.colors.textSecondary} />
      )}
      activeColor={theme.colors.cardItem}
      selectedTextStyle={styles.selectedText}
      placeholderStyle={styles.selectedText}
    />
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    dropdown: {
      minWidth: 90,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.cardItem,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownFocused: {
      backgroundColor: theme.colors.card,
    },
    dropdownContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: 4,
      width: 180,
    },
    leftIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    languageCode: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    selectedText: {
      display: 'none',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 8,
    },
    dropdownItemActive: {
      backgroundColor: theme.colors.cardItem,
    },
    itemCode: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
      width: 22,
    },
    dropdownItemLabel: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    dropdownItemLabelActive: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
  });

export default CompactLanguageSelector;
