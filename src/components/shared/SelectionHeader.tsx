import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { X, Trash2, RotateCcw, Archive } from 'lucide-react-native';
import { useAppTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SelectionHeaderProps {
  visible: boolean;
  selectedCount: number;
  onArchive?: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  onCancel: () => void;
  isHistoryMode?: boolean;
}

const SelectionHeader: React.FC<SelectionHeaderProps> = ({
  visible,
  selectedCount,
  onArchive,
  onDelete,
  onRestore,
  onCancel,
  isHistoryMode = false,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      visible ? 1 : 0,
      [0, 1],
      [-60, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        {
          translateY: withSpring(translateY, {
            damping: 20,
            stiffness: 300,
          }),
        },
      ],
      opacity: withTiming(visible ? 1 : 0, { duration: 150 }),
    };
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingTop: insets.top,
        },
        animatedStyle,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        {/* Left: X button to exit */}
        <Pressable
          onPress={onCancel}
          style={styles.iconButton}
          hitSlop={12}
        >
          <X size={24} color={theme.colors.textPrimary} />
        </Pressable>

        {/* Center: Counter */}
        <Text style={[styles.counter, { color: theme.colors.textPrimary }]}>
          {selectedCount}
        </Text>

        {/* Right: Action icons */}
        <View style={styles.actions}>
          {/* Archive (only in normal mode) */}
          {!isHistoryMode && onArchive && (
            <Pressable
              onPress={onArchive}
              disabled={selectedCount === 0}
              style={[styles.iconButton, selectedCount === 0 && styles.disabled]}
              hitSlop={8}
            >
              <Archive size={22} color={theme.colors.textPrimary} />
            </Pressable>
          )}

          {/* Restore (only in history mode) */}
          {isHistoryMode && onRestore && (
            <Pressable
              onPress={onRestore}
              disabled={selectedCount === 0}
              style={[styles.iconButton, selectedCount === 0 && styles.disabled]}
              hitSlop={8}
            >
              <RotateCcw size={22} color={theme.colors.primary} />
            </Pressable>
          )}

          {/* Delete */}
          <Pressable
            onPress={onDelete}
            disabled={selectedCount === 0}
            style={[styles.iconButton, selectedCount === 0 && styles.disabled]}
            hitSlop={8}
          >
            <Trash2 size={22} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  counter: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disabled: {
    opacity: 0.4,
  },
});

export default SelectionHeader;
