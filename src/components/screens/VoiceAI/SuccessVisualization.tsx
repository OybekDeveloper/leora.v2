import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { Colors } from '@/constants/theme';

const SPARK_ANGLES = [-18, 0, 24];

export const SuccessVisualization: React.FC = () => {
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.45)).current;
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const sparkAnims = useRef(SPARK_ANGLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    ringScale.setValue(0.6);
    ringOpacity.setValue(0.45);
    checkScale.setValue(0.4);
    checkOpacity.setValue(0);
    sparkAnims.forEach((spark) => spark.setValue(0));

    const ringAnim = Animated.parallel([
      Animated.timing(ringScale, {
        toValue: 1.25,
        duration: 620,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 620,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const checkAnim = Animated.parallel([
      Animated.sequence([
        Animated.delay(90),
        Animated.spring(checkScale, {
          toValue: 1,
          speed: 14,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 160,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const sparkSequence = Animated.stagger(
      80,
      sparkAnims.map((value, index) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 420,
          delay: 160 + index * 30,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const composite = Animated.parallel([ringAnim, checkAnim, sparkSequence]);
    composite.start();
    pulseLoop.start();

    return () => {
      composite.stop();
      pulseLoop.stop();
    };
  }, [checkOpacity, checkScale, pulseAnim, ringOpacity, ringScale, sparkAnims]);

  const haloScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.3],
  });

  const renderSpark = (value: Animated.Value, angle: number, index: number) => {
    const opacity = value.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 1, 0],
    });

    const translateY = value.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -52],
    });

    const scale = value.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.2, 1, 0.6],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.spark,
          {
            opacity,
            transform: [
              { translateX: -2 },
              { translateY: -9 },
              { rotate: `${angle}deg` },
              { translateY },
              { scale },
            ],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.ring,
        {
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        },
      ]}
      />

      {sparkAnims.map((anim, index) => renderSpark(anim, SPARK_ANGLES[index], index))}

      <View style={styles.core}>
        <Animated.View
          style={[
            styles.coreHalo,
            {
              transform: [{ scale: haloScale }],
              opacity: haloOpacity,
            },
          ]}
        />
        <View style={styles.coreRing}>
          <Animated.View
            style={[
              styles.checkWrapper,
              {
                transform: [{ scale: checkScale }],
                opacity: checkOpacity,
              },
            ]}
          >
            <Check color={Colors.textPrimary} size={54} strokeWidth={3} />
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
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.success + '26',
  },
  spark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.textPrimary,
  },
  core: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coreHalo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.success + '20',
  },
  coreRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: Colors.success,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

