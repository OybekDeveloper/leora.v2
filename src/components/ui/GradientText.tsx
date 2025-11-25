import React from 'react';
import { Text, StyleSheet, TextStyle, ColorValue, ViewStyle, StyleProp } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type GradientTuple = readonly [ColorValue, ColorValue, ...ColorValue[]];

type Props = {
  children: string;
  colors?: GradientTuple;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: TextStyle | TextStyle[];
  containerStyle?: StyleProp<ViewStyle>;
};

const DEFAULT_COLORS = ['#2F9EF1', '#7257CD'] as const; // <-- tuple!

export default function GradientText({
  children,
  colors = DEFAULT_COLORS,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  containerStyle,
}: Props) {
  return (
    <MaskedView
      style={containerStyle}
      maskElement={<Text style={[styles.text, style]}>{children}</Text>}
    >
      <LinearGradient start={start} end={end} colors={colors}>
        <Text style={[styles.text, style, styles.hidden]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: { fontWeight: '700' },
  hidden: { opacity: 0 },
});
