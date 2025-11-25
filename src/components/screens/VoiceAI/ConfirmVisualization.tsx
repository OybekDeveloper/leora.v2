import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

import { Colors } from '@/constants/theme';

export const ConfirmVisualization: React.FC = () => {
  const haloAnim = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const runSequence = () => {
      haloAnim.setValue(0);
      focusAnim.setValue(0);
      checkAnim.setValue(0);

      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(haloAnim, {
              toValue: 1,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(haloAnim, {
              toValue: 0,
              duration: 1400,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(focusAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          })
        ),
        Animated.sequence([
          Animated.delay(220),
          Animated.spring(checkAnim, {
            toValue: 1,
            speed: 12,
            bounciness: 10,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    runSequence();
  }, [checkAnim, focusAnim, haloAnim]);

  const haloScale = haloAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.05],
  });

  const haloOpacity = haloAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  const focusOpacity = focusAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.05, 0.2, 0.05],
  });

  const focusScale = focusAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.85, 1.05, 0.85],
  });

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const checkOpacity = checkAnim;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.halo,
          {
            transform: [{ scale: haloScale }],
            opacity: haloOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.focusRing,
          {
            opacity: focusOpacity,
            transform: [{ scale: focusScale }],
          },
        ]}
      />

      <View style={styles.core}>
        <View style={styles.coreRing}>
          <Animated.View
            style={[
              styles.checkIcon,
              {
                transform: [{ scale: checkScale }],
                opacity: checkOpacity,
              },
            ]}
          >
            <ShieldCheck size={44} color={Colors.textPrimary} strokeWidth={2.4} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary + '14',
  },
  focusRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.primary + '12',
  },
  core: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coreRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
