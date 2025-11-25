import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedSoundWavesProps {
  isActive: boolean;
}

export const AnimatedSoundWaves: React.FC<AnimatedSoundWavesProps> = ({ isActive }) => {
  const waveAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    if (!isActive) return;

    const animations = waveAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            delay: i * 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach(anim => anim.start());
    return () => animations.forEach(anim => anim.stop());
  }, [isActive]);

  return (
    <Svg width={320} height={320} style={StyleSheet.absoluteFill}>
      {waveAnims.map((anim, i) => {
        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.15 - i * 0.03, 0.15 - i * 0.03, 0],
        });

        return (
          <AnimatedCircle
            key={i}
            cx="160"
            cy="160"
            r={90 + i * 25}
            stroke={`rgba(255, 255, 255, ${0.15 - i * 0.03})`}
            strokeWidth="1.5"
            fill="none"
            opacity={opacity}
          />
        );
      })}
    </Svg>
  );
};
