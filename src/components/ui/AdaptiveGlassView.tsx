// src/components/ui/AdaptiveGlassView.tsx
import React from 'react';
import { StyleSheet, ViewStyle, View, Platform, StyleProp } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useAppTheme } from '@/constants/theme';

interface AdaptiveGlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AdaptiveGlassView: React.FC<AdaptiveGlassViewProps> = ({
  children,
  style,
}) => {
  const theme = useAppTheme();
  const borderWidth = Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1;
  const glassBackground =
    theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.08)';
  const baseStyle = [
    styles.container,
    {
      borderWidth,
      borderColor: theme.colors.border,
      backgroundColor: glassBackground,
    },
    style,
  ];

  // For Android, use a semi-transparent background with theme colors
  if (Platform.OS === 'android') {
    return (
      <View style={baseStyle}>
        {children}
      </View>
    );
  }

  // For iOS, use expo-glass-effect with dynamic tint
  // Dark theme uses 'regular' style, light theme uses 'clear' style
  const glassStyle = 'clear';

  return (
    <GlassView
      tintColor={theme.colors.background}
      isInteractive
      glassEffectStyle={glassStyle}
      style={baseStyle}
    >
      {children}
    </GlassView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});
