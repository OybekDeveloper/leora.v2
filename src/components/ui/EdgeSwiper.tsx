import React, { useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';

type EdgeSwiperProps = {
  onSwipeOpen?: () => void;
  onSwipeClose?: () => void;
  children: React.ReactNode;
  threshold?: number;
};

/**
 * Lightweight edge swipe wrapper. Detects a quick horizontal swipe
 * and triggers callbacks to open/close contextual menus without
 * altering layout/position of its children.
 */
export const EdgeSwiper: React.FC<EdgeSwiperProps> = ({
  children,
  onSwipeOpen,
  onSwipeClose,
  threshold = 24,
}) => {
  const swipeDirection = useRef<'open' | 'close' | null>(null);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) < 8,
        onPanResponderMove: (_evt, gesture) => {
          swipeDirection.current = gesture.dx > 0 ? 'open' : 'close';
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (Math.abs(gesture.dx) < threshold) {
            swipeDirection.current = null;
            return;
          }
          if (swipeDirection.current === 'open') {
            onSwipeOpen?.();
          } else {
            onSwipeClose?.();
          }
          swipeDirection.current = null;
        },
      }),
    [onSwipeClose, onSwipeOpen, threshold],
  );

  return (
    <View {...responder.panHandlers}>
      {children}
    </View>
  );
};

export default EdgeSwiper;
