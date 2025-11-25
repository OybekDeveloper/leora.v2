import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';

type SmartHintProps = {
  type?: 'tip' | 'success' | 'warning' | 'info';
  icon?: string;
  message: string;
};

export const SmartHint: React.FC<SmartHintProps> = ({ type = 'tip', icon, message }) => {
  const defaultIcons = {
    tip: '💡',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const displayIcon = icon || defaultIcons[type];

  return (
    <AdaptiveGlassView style={styles.container}>
      <Text style={styles.icon}>{displayIcon}</Text>
      <Text style={styles.message}>{message}</Text>
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
  icon: {
    fontSize: 18,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#7E8B9A',
    fontWeight: '400',
  },
});
