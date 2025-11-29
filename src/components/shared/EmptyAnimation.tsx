import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface EmptyAnimationProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const EmptyAnimation: React.FC<EmptyAnimationProps> = ({ size = 200, style }) => {
  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={require('../../../assets/lottie/empty.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
};

export default EmptyAnimation;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
