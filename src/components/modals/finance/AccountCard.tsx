import React, { ReactNode, useCallback, useMemo } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TapGestureHandler } from 'react-native-gesture-handler';

import { useAppTheme } from '@/constants/theme';

interface AccountCardProps {
  title: string;
  subtitle?: string;
  balance: string;
  icon: ReactNode;
  progress?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  hintPeek?: number;
}

const DEFAULT_DURATION = 400;
const DEFAULT_EASING = Easing.linear;
const DEFAULT_PEEK = 3;

export const AccountCard: React.FC<AccountCardProps> = ({
  title,
  subtitle,
  balance,
  icon,
  progress,
  children,
  style,
  hintPeek = DEFAULT_PEEK,
}) => {
  const theme = useAppTheme();
  const openProgress = useSharedValue(0);
  const dropdownHeight = useSharedValue(0);

  const toggleOpen = useCallback(() => {
    const next = openProgress.value === 1 ? 0 : 1;
    openProgress.value = withTiming(next, {
      duration: DEFAULT_DURATION,
      easing: DEFAULT_EASING,
    });
  }, [openProgress]);

  const handleDropdownLayout = useCallback(
    (event: LayoutChangeEvent) => {
      dropdownHeight.value = event.nativeEvent.layout.height;
    },
    [dropdownHeight],
  );

  const dropdownContainerStyle = useAnimatedStyle(() => {
    if (dropdownHeight.value === 0) {
      return { height: hintPeek };
    }

    const available = Math.max(dropdownHeight.value - hintPeek, 0);
    const height = hintPeek + available * openProgress.value;
    return { height };
  });

  const dropdownStyle = useAnimatedStyle(() => {
    if (dropdownHeight.value === 0) {
      return { transform: [{ translateY: 0 }] };
    }

    const distance = dropdownHeight.value - hintPeek;
    const translateY = distance * (1 - openProgress.value);

    return { transform: [{ translateY }] };
  });

  const handleTapStateChange = useCallback(() => {
    toggleOpen();
  }, [toggleOpen]);

  const clampedProgress = useMemo(() => {
    if (progress === undefined) {
      return undefined;
    }
    return Math.min(Math.max(progress, 0), 1);
  }, [progress]);

  const progressFillStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (clampedProgress === undefined) {
      return undefined;
    }
    return { width: `${clampedProgress * 100}%` } as ViewStyle;
  }, [clampedProgress]);

  return (
    <TapGestureHandler onEnded={handleTapStateChange}>
      <Animated.View style={[styles.wrapper, style]}>
        <View
          style={[
            styles.glassWrapper,
            {
              backgroundColor: theme.mode === 'dark'
                ? 'rgba(32,32,40,0.86)'
                : 'rgba(255,255,255,0.78)',
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadowColor,
            },
          ]}
        >
          <View style={styles.glassOverlay} />
          <View style={styles.cardContent}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>{icon}</View>

              <View style={styles.metaSection}>
                <Text
                  style={[
                    styles.title,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={[
                      styles.subtitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {subtitle}
                  </Text>
                ) : null}

                {clampedProgress !== undefined ? (
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: theme.colors.borderMuted },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: theme.colors.primary },
                        progressFillStyle,
                      ]}
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.balanceSection}>
                <Text
                  style={[
                    styles.balanceText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {balance}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.shadowHintContainer}>
          <View
            style={[
              styles.shadowHint,
              {
                shadowColor: theme.colors.shadowColor,
                backgroundColor: theme.colors.surfaceMuted,
              },
            ]}
          />
        </View>

        <Animated.View
          style={[styles.dropdownContainer, dropdownContainerStyle]}
        >
          <Animated.View
            style={[
              styles.dropdownContent,
              dropdownStyle,
              {
                borderColor: theme.colors.borderMuted,
              },
            ]}
            onLayout={handleDropdownLayout}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.dropdownBackdrop,
                { backgroundColor: theme.colors.surface },
              ]}
            />
            <View style={styles.dropdownInner}>{children}</View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </TapGestureHandler>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'visible',
  },
  glassWrapper: {
    borderRadius: 20,
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
    position: 'relative',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardContent: {
    borderRadius: 20,
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  metaSection: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  balanceSection: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 18,
    fontWeight: '700',
  },
  shadowHintContainer: {
    height: 12,
    alignItems: 'center',
  },
  shadowHint: {
    width: '60%',
    height: 6,
    borderRadius: 999,
    opacity: 0.35,
  },
  dropdownContainer: {
    overflow: 'visible',
  },
  dropdownContent: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    position: 'relative',
  },
  dropdownInner: {
    paddingVertical: 6,
  },
  dropdownBackdrop: {
    opacity: 0.85,
  },
});

export default AccountCard;
