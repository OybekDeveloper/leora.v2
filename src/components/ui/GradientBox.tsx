import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GradientBox({ children, style }: { children?: React.ReactNode, style?: object }) {
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={['#2F9EF1', '#7257CD']}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

