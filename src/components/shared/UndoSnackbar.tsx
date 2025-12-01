import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, Pressable, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Undo2 } from 'lucide-react-native';
import { useAppTheme } from '@/constants/theme';
import { useUndoDeleteStore, type UndoEntityType } from '@/stores/useUndoDeleteStore';
import { useLocalization } from '@/localization/useLocalization';

interface UndoSnackbarProps {
  onUndo?: () => void;
  // Optional: customize labels per entity type
  getLabel?: (entityType: UndoEntityType, count: number) => string;
}

const UndoSnackbar: React.FC<UndoSnackbarProps> = ({ onUndo, getLabel }) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { strings } = useLocalization();

  const {
    isVisible,
    pendingDeletion,
    remainingSeconds,
    undoDeletion,
  } = useUndoDeleteStore();

  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(100);

  // Animate in/out - simple, subtle fade + slight slide
  useEffect(() => {
    if (isVisible) {
      translateY.value = withTiming(0, { duration: 180 });
      opacity.value = withTiming(1, { duration: 180 });
      progressWidth.value = 100;
    } else {
      translateY.value = withTiming(20, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [isVisible, translateY, opacity, progressWidth]);

  // Animate countdown progress bar
  useEffect(() => {
    if (isVisible && pendingDeletion) {
      const totalSeconds = 5; // Match UNDO_TIMEOUT_SECONDS
      const percentage = (remainingSeconds / totalSeconds) * 100;
      progressWidth.value = withTiming(percentage, { duration: 900 });
    }
  }, [remainingSeconds, isVisible, pendingDeletion, progressWidth]);

  const handleUndo = useCallback(() => {
    // Call custom onUndo first (for restoring items)
    onUndo?.();
    // Then clear the pending deletion
    undoDeletion();
  }, [onUndo, undoDeletion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!pendingDeletion) {
    return null;
  }

  const itemCount = pendingDeletion.itemIds.length;
  const entityType = pendingDeletion.entityType;

  // Get localized label
  const getDefaultLabel = (type: UndoEntityType, count: number): string => {
    const commonStrings = (strings as any).common ?? {};
    const pluralSuffix = count > 1 ? 's' : '';

    const entityLabels: Record<UndoEntityType, string> = {
      task: commonStrings.task ?? 'task',
      goal: commonStrings.goal ?? 'goal',
      habit: commonStrings.habit ?? 'habit',
      budget: commonStrings.budget ?? 'budget',
      transaction: commonStrings.transaction ?? 'transaction',
      account: commonStrings.account ?? 'account',
      debt: commonStrings.debt ?? 'debt',
    };

    const entityName = entityLabels[type] + pluralSuffix;
    return `${count} ${entityName} deleted`;
  };

  const label = getLabel
    ? getLabel(entityType, itemCount)
    : getDefaultLabel(entityType, itemCount);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 16) + 80, // Above tab bar
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        containerStyle,
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: theme.colors.primary },
            progressStyle,
          ]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: theme.colors.textPrimary }]}>
            {label}
          </Text>
          <Text style={[styles.countdown, { color: theme.colors.textMuted }]}>
            {remainingSeconds}s
          </Text>
        </View>

        <Pressable
          onPress={handleUndo}
          style={({ pressed }) => [
            styles.undoButton,
            { backgroundColor: `${theme.colors.primary}20` },
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Undo2 size={18} color={theme.colors.primary} />
          <Text style={[styles.undoText, { color: theme.colors.primary }]}>
            UNDO
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    bottom: 0,
    // High zIndex to appear above FAB, modals, and other floating UI
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
  },
  countdown: {
    fontSize: 13,
    fontWeight: '500',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  undoText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default UndoSnackbar;
