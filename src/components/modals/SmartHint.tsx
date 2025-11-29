import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react-native';
import { LightIcon } from '../../../assets/icons';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';

type SmartHintProps = {
  type?: 'tip' | 'success' | 'warning' | 'info';
  message: string;
};

export const SmartHint: React.FC<SmartHintProps> = ({ type = 'tip', message }) => {
  const theme = useAppTheme();

  const getIcon = () => {
    const iconSize = 18;
    switch (type) {
      case 'tip':
        return <LightIcon size={iconSize} color={theme.colors.warning} />;
      case 'success':
        return <CheckCircle2 size={iconSize} color={theme.colors.success} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={theme.colors.warning} />;
      case 'info':
        return <Info size={iconSize} color={theme.colors.textSecondary} />;
      default:
        return <LightIcon size={iconSize} color={theme.colors.warning} />;
    }
  };

  return (
    <AdaptiveGlassView style={styles.container}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
    </AdaptiveGlassView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
});
