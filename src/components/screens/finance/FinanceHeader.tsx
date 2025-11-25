import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateTransferIcon, DiagramIcon, DollorEuroIcon, SearchDocIcon, SettingIcon } from '@assets/icons';
import { Theme, useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

interface FinanceHeaderProps {
  onTransferPress?: () => void;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
  onDiagramPress?: () => void;
  onCurrencyPress?: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      height: 64,
      backgroundColor: theme.colors.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerActionsRight: {
      justifyContent: 'flex-end',
    },
    headerButton: {
      padding: 4,
      borderRadius: 12,
    },
    headerTitle: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    headerTitleText: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      letterSpacing: 2,
    },
  });

const FinanceHeader: React.FC<FinanceHeaderProps> = ({
  onTransferPress,
  onSearchPress,
  onSettingsPress,
  onDiagramPress,
  onCurrencyPress,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const iconColor = theme.colors.textMuted;
  const { strings } = useLocalization();
  const headerTitle = strings.tabs.finance;

  return (
    <View style={styles.header}>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton} onPress={onCurrencyPress}>
          <DollorEuroIcon color={iconColor} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={onDiagramPress}>
          <DiagramIcon color={iconColor} size={24} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerTitle}>
        <Text style={styles.headerTitleText}>{headerTitle}</Text>
      </View>
      <View style={[styles.headerActions, styles.headerActionsRight]}>
        <TouchableOpacity style={styles.headerButton} onPress={onTransferPress}>
          <DateTransferIcon color={iconColor} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={onSearchPress}>
          <SearchDocIcon color={iconColor} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FinanceHeader;
