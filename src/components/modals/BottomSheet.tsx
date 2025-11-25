import React, {
  ComponentProps,
  ForwardedRef,
  ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Platform, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';

import { useAppTheme, type Theme } from '@/constants/theme';
import { applyOpacity } from '@/utils/color';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface BottomSheetHandle {
  present: () => void;
  dismiss: () => void;
}

export type CustomBottomSheetProps = Omit<BottomSheetModalProps, 'children' | 'snapPoints'> & {
  children: ReactNode;
  snapPoints?: (string | number)[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  isFullScreen?: boolean;
  scrollable?: boolean;
  scrollProps?: Partial<ComponentProps<typeof BottomSheetScrollView>>;
  hasScrollableChildren?: boolean;
};

const MAX_HEIGHT_PERCENT = 0.88;

const CustomBottomSheet = forwardRef(function CustomBottomSheet(
  {
    children,
    snapPoints,
    contentContainerStyle,
    backgroundStyle,
    handleIndicatorStyle,
    isFullScreen = false,
    scrollable = false,
    scrollProps,
    hasScrollableChildren = false,
    ...rest
  }: CustomBottomSheetProps,
  ref: ForwardedRef<BottomSheetHandle>
) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { height: windowHeight } = useWindowDimensions();
  const cappedDynamicSize = useMemo(() => windowHeight * MAX_HEIGHT_PERCENT, [windowHeight]);

  const clampSnapPoint = useCallback(
    (point: string | number) => {
      if (typeof point === 'string') {
        const trimmed = point.trim();
        if (trimmed.endsWith('%')) {
          const numeric = parseFloat(trimmed.slice(0, -1));
          if (Number.isFinite(numeric)) {
            const clamped = Math.min(numeric, MAX_HEIGHT_PERCENT * 100);
            return `${clamped}%`;
          }
        }
        return point;
      }
      if (typeof point === 'number') {
        return Math.min(point, cappedDynamicSize);
      }
      return point;
    },
    [cappedDynamicSize]
  );

  const normalizedSnapPoints = useMemo<(string | number)[] | undefined>(() => {
    if (!snapPoints || snapPoints.length === 0) {
      return undefined;
    }
    return snapPoints.map(clampSnapPoint);
  }, [clampSnapPoint, snapPoints]);

  const handlePresent = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleDismiss = useCallback(() => {
    // `close` is safer here; `dismiss` can throw if index gets out of sync with snap points.
    bottomSheetRef.current?.close();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      present: handlePresent,
      dismiss: handleDismiss,
    }),
    [handleDismiss, handlePresent]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.4}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        enableTouchThrough={false}
        style={[props.style, styles.backdrop]}
      >
        <View style={styles.backdropOverlay} />
      </BottomSheetBackdrop>
    ),
    [styles.backdrop, styles.backdropOverlay]
  );

  const renderBackground = useCallback(
    ({ style }: BottomSheetBackgroundProps) => {
      if (Platform.OS === 'ios') {
        return (
          <BlurView
            style={[style, styles.backgroundBlur]}
            tint="dark"
            intensity={60}
          >
            <View style={styles.backgroundOverlay} />
          </BlurView>
        );
      }

      return <View style={[style, styles.androidBackground]} />;
    },
    [styles.androidBackground, styles.backgroundBlur, styles.backgroundOverlay]
  );

  const {
    index,
    keyboardBehavior,
    keyboardBlurBehavior,
    enablePanDownToClose,
    enableDynamicSizing,
    ...modalRest
  } = rest;

  const dynamicSizingEnabled = enableDynamicSizing ?? false;
  const defaultSnapPoints = useMemo<(string | number)[]>(
    () => (isFullScreen ? [`${MAX_HEIGHT_PERCENT * 100}%`] : ['60%']),
    [isFullScreen]
  );
  const resolvedSnapPoints = useMemo<(string | number)[] | undefined>(() => {
    if (dynamicSizingEnabled) {
      return normalizedSnapPoints && normalizedSnapPoints.length > 0 ? normalizedSnapPoints : undefined;
    }
    if (normalizedSnapPoints && normalizedSnapPoints.length > 0) {
      return normalizedSnapPoints;
    }
    return defaultSnapPoints;
  }, [defaultSnapPoints, dynamicSizingEnabled, normalizedSnapPoints]);

  const resolvedIndex = useMemo(() => {
    const targetIndex = index ?? 0;

    // Dynamic sizing without explicit snap points always ends up with a single snap point at index 0.
    if (dynamicSizingEnabled && (!resolvedSnapPoints || resolvedSnapPoints.length === 0)) {
      return Math.min(Math.max(targetIndex, -1), 0);
    }

    if (!resolvedSnapPoints || resolvedSnapPoints.length === 0) {
      return Math.max(-1, targetIndex);
    }

    const maxIndex = resolvedSnapPoints.length - 1;
    return Math.min(Math.max(targetIndex, -1), maxIndex);
  }, [dynamicSizingEnabled, index, resolvedSnapPoints]);

  const panDownToClose = enablePanDownToClose ?? !isFullScreen;
  const backgroundStyles = useMemo(
    () => [styles.background, isFullScreen && styles.fullScreenBackground, backgroundStyle],
    [backgroundStyle, isFullScreen, styles.background, styles.fullScreenBackground]
  );
  const handleIndicatorStyles = useMemo(
    () => [styles.handleIndicator, isFullScreen && styles.hiddenHandleIndicator, handleIndicatorStyle],
    [handleIndicatorStyle, isFullScreen, styles.handleIndicator, styles.hiddenHandleIndicator]
  );
  const baseContentStyle = useMemo(
    () => [styles.contentContainer, isFullScreen && styles.fullScreenContent, contentContainerStyle],
    [contentContainerStyle, isFullScreen, styles.contentContainer, styles.fullScreenContent]
  );
  const flattenedBaseStyle = useMemo(() => StyleSheet.flatten(baseContentStyle), [baseContentStyle]);

  let content: ReactNode;
  if (hasScrollableChildren) {
    content = <BottomSheetView style={[styles.flexContainer, flattenedBaseStyle]}>{children}</BottomSheetView>;
  } else if (scrollable) {
    content = (
      <BottomSheetScrollView
        style={styles.scrollContainer}
        contentContainerStyle={baseContentStyle}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </BottomSheetScrollView>
    );
  } else {
    content = <BottomSheetView style={baseContentStyle}>{children}</BottomSheetView>;
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={resolvedIndex}
      keyboardBehavior={keyboardBehavior ?? 'interactive'}
      keyboardBlurBehavior={keyboardBlurBehavior ?? 'restore'}
      enablePanDownToClose={panDownToClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={handleIndicatorStyles}
      backgroundComponent={renderBackground}
      backgroundStyle={[backgroundStyles, styles.transparentBackground]}
      enableDynamicSizing={dynamicSizingEnabled}
      maxDynamicContentSize={cappedDynamicSize}
      {...(resolvedSnapPoints ? { snapPoints: resolvedSnapPoints } : {})}
      {...modalRest}
    >
      {content}
    </BottomSheetModal>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: 'transparent',
      overflow: 'hidden',
    },
    backdropOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.backdrop,
    },
    backgroundBlur: {
      flex: 1,
      overflow: 'hidden',
      borderRadius: 24,
    },
    backgroundOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: applyOpacity(theme.colors.surface, theme.mode === 'dark' ? 0.5 : 0.7),
      borderRadius: 24,
    },
    androidBackground: {
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceElevated,
    },
    background: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
    },
    transparentBackground: {
      backgroundColor: 'transparent',
    },
    handleIndicator: {
      backgroundColor: theme.colors.textMuted,
      width: 56,
      height: 4,
      borderRadius: 999,
    },
    hiddenHandleIndicator: {
      opacity: 0,
    },
    contentContainer: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    fullScreenContent: {
      flex: 1,
    },
    fullScreenBackground: {
      borderRadius: 0,
    },
    scrollContainer: {
      flex: 1,
    },
    flexContainer: {
      flex: 1,
    },
  });

export default CustomBottomSheet;
