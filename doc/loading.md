```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLoadingOverlayStore } from '@/stores/useLoadingOverlayStore';
import { BlurView } from 'expo-blur';

const LOGO_SOURCE = require('@assets/images/icon.png');

const LOADER_TIPS = [
  'Dialing in your readiness baseline',
  'Aligning focus and recovery metrics',
  'Breathing life into your dashboard',
  'Securing telemetry for the next move',
];

const HIDDEN_OPACITY = 0;

export default function LoadingOverlay() {
    const isVisible = useLoadingOverlayStore((state) => state.isVisible);

  const message = useLoadingOverlayStore((state) => state.message);

  const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : HIDDEN_OPACITY)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [mount, setMount] = useState(isVisible);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setMount(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setTipIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADER_TIPS.length);
    }, 2600);

    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    spinLoop.start();
    return () => spinLoop.stop();
  }, [spinAnim]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : HIDDEN_OPACITY,
      duration: isVisible ? 220 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isVisible) {
        setMount(false);
      }
    });
  }, [fadeAnim, isVisible]);

  const spinnerTransform = useMemo(
    () => [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
    [spinAnim],
  );

  const glowStyle = useMemo(
    () => ({
      transform: [
        {
          scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
        },
      ],
      opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }),
    }),
    [pulseAnim],
  );

  if (!mount) {
    return null;
  }

  return (
    <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity: fadeAnim }] }>
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={[styles.spinner, { transform: spinnerTransform }]} />
          <View style={styles.logoCircle} >
            <Image source={LOGO_SOURCE} style={styles.logo} contentFit="contain" />
          </View>
        </View>
      </View>
      <BlurView intensity={10} style={{
        width:'100%',
        height:'100%',
        position:"absolute",
        top:0,
        left:0,
        zIndex:-1
      }}/>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    width: 132,
    height: 132,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 74,
    backgroundColor: Colors.primary,
    opacity: 0.35,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
  },
  spinner: {
    position: 'absolute',
    width: 122,
    height: 122,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: Colors.white,
    borderRightColor: Colors.primary,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.04)',
  },
  logoCircle: {
    width: 112,
    height: 112,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  textBlock: {
    marginTop: 28,
    alignItems: 'center',
  },
  message: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
