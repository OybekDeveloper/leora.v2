// components/GlassEffectContainer.tsx
import React from 'react';
import { GlassContainer } from 'expo-glass-effect';
import { ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  spacing?: number;
};

/**
 * A reusable container for grouping multiple GlassView components.
 * Provides proper spacing and glass blending between child views.
 */
export default function GlassEffectContainer({
  children,
  style,
  spacing = 8,
}: Props) {
  return (
    <GlassContainer spacing={spacing} style={style}>
      {children}
    </GlassContainer>
  );
}
