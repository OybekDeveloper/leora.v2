import { useEffect } from 'react';
import { Hand } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 180 }),
        withTiming(-10, { duration: 180 }),
        withTiming(0, { duration: 180 })
      ),
      3,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Hand size={28} color={Colors.textPrimary} />
    </Animated.View>
  );
}
