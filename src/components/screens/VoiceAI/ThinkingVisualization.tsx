import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Particles } from './Particles';

export const ThinkingVisualization: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinSlowAnim = useRef(new Animated.Value(0)).current;
  const spinReverseAnim = useRef(new Animated.Value(0)).current;
  const spinSlowerAnim = useRef(new Animated.Value(0)).current;
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loopsRef.current.forEach(loop => loop.stop());
    loopsRef.current = [];

    pulseAnim.setValue(1);
    spinSlowAnim.setValue(0);
    spinReverseAnim.setValue(0);
    spinSlowerAnim.setValue(0);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const slowLoop = Animated.loop(
      Animated.timing(spinSlowAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );

    const reverseLoop = Animated.loop(
      Animated.timing(spinReverseAnim, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    );

    const slowerLoop = Animated.loop(
      Animated.timing(spinSlowerAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    );

    loopsRef.current = [pulseLoop, slowLoop, reverseLoop, slowerLoop];
    loopsRef.current.forEach(loop => loop.start());

    return () => {
      loopsRef.current.forEach(loop => loop.stop());
      loopsRef.current = [];
    };
  }, [pulseAnim, spinReverseAnim, spinSlowAnim, spinSlowerAnim]);

  const spinSlow = spinSlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinReverse = spinReverseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const spinSlower = spinSlowerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.outerGlow, { opacity: pulseAnim }]} />
      
      <Animated.View style={[styles.absoluteFill, { transform: [{ rotate: spinSlow }] }]}>
        <Svg width={320} height={320}>
          <Circle cx="160" cy="160" r="96" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
        </Svg>
      </Animated.View>
      
      <Animated.View style={[styles.absoluteFill, { transform: [{ rotate: spinReverse }] }]}>
        <Svg width={320} height={320}>
          <Circle cx="160" cy="160" r="64" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
        </Svg>
      </Animated.View>
      
      <Animated.View style={[styles.absoluteFill, { transform: [{ rotate: spinSlower }] }]}>
        <Svg width={320} height={320}>
          <Circle cx="160" cy="160" r="32" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
        </Svg>
      </Animated.View>

      <Particles stage="thinking" />

      <View style={styles.thinkingCore}>
        <View style={styles.thinkingRing1}>
          <View style={styles.thinkingRing2}>
            <View style={styles.neuralLines}>
              {[...Array(6)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[styles.neuralLine, { opacity: pulseAnim }]}
                />
              ))}
            </View>

            <View style={styles.aiDots}>
              <Animated.View style={[styles.aiDot, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.aiDot, { opacity: 0.7 }]} />
              <Animated.View style={[styles.aiDot, { opacity: 0.4 }]} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.absoluteFill}>
        {[...Array(8)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.outerDot,
              {
                transform: [
                  { translateX: 160 },
                  { translateY: 160 },
                  { rotate: `${i * 45}deg` },
                  { translateX: 140 },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 320,
    height: 320,
  },
  outerGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  thinkingCore: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  thinkingRing1: {
    width: 208,
    height: 208,
    borderRadius: 104,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thinkingRing2: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  neuralLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    paddingVertical: 32,
    justifyContent: 'space-around',
  },
  neuralLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  aiDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  outerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
});
