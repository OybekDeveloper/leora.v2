import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Mic } from 'lucide-react-native';
import { AnimatedSoundWaves } from './AnimatedSoundWaves';
import { Particles } from './Particles';

interface ListeningVisualizationProps {
  active?: boolean;
}

export const ListeningVisualization: React.FC<ListeningVisualizationProps> = ({ active = true }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinSlowAnim = useRef(new Animated.Value(0)).current;
  const spinSlowerAnim = useRef(new Animated.Value(0)).current;
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loopsRef.current.forEach(loop => loop.stop());
    loopsRef.current = [];

    pulseAnim.setValue(1);
    spinSlowAnim.setValue(0);
    spinSlowerAnim.setValue(0);

    if (!active) {
      return () => {
        loopsRef.current.forEach(loop => loop.stop());
        loopsRef.current = [];
      };
    }

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

    const slowerLoop = Animated.loop(
      Animated.timing(spinSlowerAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    );

    loopsRef.current = [pulseLoop, slowLoop, slowerLoop];
    loopsRef.current.forEach(loop => loop.start());

    return () => {
      loopsRef.current.forEach(loop => loop.stop());
      loopsRef.current = [];
    };
  }, [active, pulseAnim, spinSlowAnim, spinSlowerAnim]);

  const spinSlow = spinSlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
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
          <Circle cx="160" cy="160" r="112" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
          <Circle cx="160" cy="160" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
        </Svg>
      </Animated.View>

      <AnimatedSoundWaves isActive={active} />
      <Particles stage="listening" />

      <Animated.View style={[styles.coreContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.coreRing1}>
          <View style={styles.coreRing2}>
            <View style={styles.coreRing3}>
              <View style={styles.pingRing} />
              <Mic color="#FFFFFF" size={48} strokeWidth={2} />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.absoluteFill, { transform: [{ rotate: spinSlower }] }]}>
        <Svg width={320} height={320}>
          <Line x1="160" y1="0" x2="160" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <Line x1="160" y1="240" x2="160" y2="320" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </Svg>
      </Animated.View>
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
  coreContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  coreRing1: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coreRing2: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coreRing3: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pingRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
