import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/theme';

export default function GradientBox({ children, style }: { children?: React.ReactNode, style?: object }) {
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={Colors.brandGradient}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
