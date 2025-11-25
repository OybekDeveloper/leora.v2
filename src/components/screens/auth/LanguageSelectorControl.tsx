import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Feather } from '@expo/vector-icons';

import { LANGUAGE_OPTIONS, type LanguageOption } from '@/constants/languageOptions';
import type { SupportedLanguage } from '@/stores/useSettingsStore';
import { useAppTheme } from '@/constants/theme';

interface LanguageSelectorControlProps {
  label: string;
  helper?: string;
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
  containerStyle?: any;
}

export const LanguageSelectorControl: React.FC<LanguageSelectorControlProps> = ({
  label,
  helper,
  value,
  onChange,
  containerStyle,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isFocused, setIsFocused] = useState(false);

  const currentOption = useMemo(
    () => LANGUAGE_OPTIONS.find((option) => option.value === value),
    [value],
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.textColumn}>
        <Text style={styles.label}>{label}</Text>
      </View>

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
        renderLeftIcon={() => <Text style={styles.flag}>{currentOption?.flag ?? '🌐'}</Text>}
        renderItem={(item: LanguageOption) => {
          const active = item.value === value;
          return (
            <View style={[styles.dropdownItem, active && styles.dropdownItemActive]}>
              <Text style={styles.flag}>{item.flag}</Text>
              <Text style={[styles.dropdownItemLabel, active && styles.dropdownItemLabelActive]}>
                {item.label}
              </Text>
              {active && <Feather name="check" size={16} color={theme.colors.textPrimary} />}
            </View>
          );
        }}
        renderRightIcon={() => (
          <Feather
            name="chevron-down"
            size={16}
            color={isFocused ? theme.colors.textPrimary : theme.colors.textSecondary}
          />
        )}
        activeColor={theme.colors.cardItem}
        selectedTextStyle={styles.value}
      />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    textColumn: {
      flex: 1,
    },
    label: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
    helper: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    dropdown: {
      flexBasis: '55%',
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    dropdownFocused: {
      borderColor: theme.colors.border,
    },
    dropdownContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    flag: {
      fontSize: 18,
    },
    value: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 12,
      borderRadius: theme.radius.md,
    },
    dropdownItemActive: {
      backgroundColor: theme.colors.cardItem,
    },
    dropdownItemLabel: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 15,
      fontWeight: '500',
    },
    dropdownItemLabelActive: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
  });
