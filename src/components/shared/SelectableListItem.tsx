import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Platform,
  UIManager,
  Pressable,
  LayoutAnimation,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { useAppTheme } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SelectableListItemProps {
  id: string;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: () => void;
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/**
 * SelectableListItem - Universal wrapper for selectable list items
 *
 * Behavior:
 * - When NOT in selection mode: child receives all events normally, long-press enters selection mode
 * - When IN selection mode: tapping anywhere toggles selection, child events are blocked
 *
 * The check icon uses a simple fade animation.
 */
const SelectableListItem: React.FC<SelectableListItemProps> = ({
  id,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onLongPress,
  onPress,
  children,
  style,
  disabled = false,
}) => {
  const theme = useAppTheme();

  // Handle tap in selection mode - toggles selection
  const handleSelectionTap = useCallback(() => {
    if (disabled) return;
    onToggleSelect(id);
  }, [disabled, onToggleSelect, id]);

  // Handle long press to enter selection mode
  const handleLongPress = useCallback(() => {
    if (disabled || isSelectionMode) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onLongPress();
  }, [disabled, isSelectionMode, onLongPress]);

  // Handle normal tap when not in selection mode
  const handleNormalTap = useCallback(() => {
    if (disabled || isSelectionMode) return;
    onPress?.();
  }, [disabled, isSelectionMode, onPress]);

  // Simple fade animation for checkbox container
  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isSelectionMode ? 1 : 0, { duration: 150 }),
  }), [isSelectionMode]);

  // Simple fade animation for selected check icon
  const checkIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isSelected ? 1 : 0, { duration: 150 }),
  }), [isSelected]);

  // Simple fade animation for unselected circle icon
  const uncheckedIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isSelected ? 0 : 1, { duration: 150 }),
  }), [isSelected]);

  // Selection highlight overlay
  const selectionOverlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isSelected ? 0.08 : 0, { duration: 150 }),
  }), [isSelected]);

  return (
    <View style={[styles.container, style]}>
      {/* Main pressable area */}
      <Pressable
        onPress={isSelectionMode ? handleSelectionTap : handleNormalTap}
        onLongPress={handleLongPress}
        delayLongPress={400}
        disabled={disabled}
        style={styles.pressableArea}
      >
        <View style={styles.innerContainer}>
          {/* Selection checkbox - simple fade */}
          <Animated.View style={[styles.checkboxContainer, checkboxAnimatedStyle]}>
            <View style={styles.iconWrapper}>
              {/* Unchecked circle */}
              <Animated.View style={[styles.iconAbsolute, uncheckedIconAnimatedStyle]}>
                <Circle size={24} color={theme.colors.textTertiary} />
              </Animated.View>
              {/* Checked circle */}
              <Animated.View style={[styles.iconAbsolute, checkIconAnimatedStyle]}>
                <CheckCircle2 size={24} color={theme.colors.primary} />
              </Animated.View>
            </View>
          </Animated.View>

          {/* Content wrapper - pointerEvents controls child interaction */}
          <View
            style={styles.content}
            pointerEvents={isSelectionMode ? 'none' : 'auto'}
          >
            {children}
          </View>

          {/* Visual selection highlight */}
          <Animated.View
            style={[
              styles.selectionHighlight,
              { backgroundColor: theme.colors.primary },
              selectionOverlayStyle,
            ]}
            pointerEvents="none"
          />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  pressableArea: {
    width: '100%',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  checkboxContainer: {
    position: 'absolute',
    left: -36,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconAbsolute: {
    position: 'absolute',
  },
  content: {
    flex: 1,
  },
  selectionHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    zIndex: -1,
  },
});

export default SelectableListItem;
