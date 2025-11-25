import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { ArrowDown } from 'lucide-react-native';

interface CustomRefreshControlProps {
  refreshing: boolean;
  pullDistance: number;
}

export default function CustomRefreshControl({
  refreshing,
  pullDistance,
}: CustomRefreshControlProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (refreshing) {
      // Animate logo rotation when refreshing
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
      scale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
    } else {
      rotation.value = withTiming(0);
      scale.value = withTiming(1);
    }
  }, [refreshing]);

  const containerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pullDistance,
      [0, 100],
      [0, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      pullDistance,
      [0, 150],
      [-50, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const arrowStyle = useAnimatedStyle(() => {
    const arrowRotation = interpolate(
      pullDistance,
      [0, 100],
      [0, 180],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${arrowRotation}deg` }],
      opacity: refreshing ? 0 : 1,
    };
  });

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: refreshing ? 1 : 0,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={arrowStyle}>
        <ArrowDown color="#FFFFFF" size={24} />
      </Animated.View>

      <Animated.View style={[styles.logo, logoStyle]}>
        <View style={styles.logoL}>
          <View style={styles.logoVertical} />
          <View style={styles.logoHorizontal} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    position: 'absolute',
    width: 40,
    height: 50,
  },
  logoL: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  logoVertical: {
    position: 'absolute',
    width: 8,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    left: 0,
    top: 0,
  },
  logoHorizontal: {
    position: 'absolute',
    width: 35,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    left: 0,
    bottom: 0,
  },
});