import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Minus, Plus, HeartPulse, Flag, ListChecks } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageBackground, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTab } from '../contexts/TabContext';
import { useLocalization } from '@/localization/useLocalization';
import { AddTaskIcon } from '@assets/icons/AddTaskIcon';
import { QuickExpIcon } from '@assets/icons/QuickExpIcon';
import { AIVoiceIcon } from '@assets/icons/AIVoiceIcon';
import { DebtIcon, InComingIcon, TransactionIcon } from '@assets/icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useAppTheme } from '@/constants/theme';

const darkFabBackground = require('@assets/images/darkFub.png');
const lightFabBackground = require('@assets/images/lightFub.png');

interface FABAction {
  id: string;
  icon: any;
  label: string;
}

export default function UniversalFAB() {
  const theme = useAppTheme();
  const { activeTab } = useTab();
  const insets = useSafeAreaInsets();
  const { strings } = useLocalization();
  const isOpen = useSharedValue(false);
  const rotation = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const iconProgress = useSharedValue(0);
  const [openModal, setOpenModal] = useState(false);

  // Animation values for each button
  const buttonAnimations = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  const router = useRouter();

  const actions: FABAction[] = useMemo(() => {
    const fabStrings = strings.universalFab;
    switch (activeTab) {
      case 'index':
        return [
          { id: 'add-task', icon: AddTaskIcon, label: fabStrings.index.task },
          { id: 'quick-expense', icon: QuickExpIcon, label: fabStrings.index.quickExpense },
          { id: 'start-focus', icon: HeartPulse, label: fabStrings.index.focus },
          { id: 'voice-note', icon: AIVoiceIcon, label: fabStrings.index.voiceNote },
        ];
      case 'finance':
      case '(finance)':
        return [
          { id: 'finance-income-outcome', icon: InComingIcon, label: fabStrings.finance.incomeOutcome },
          { id: 'finance-transfer', icon: TransactionIcon, label: fabStrings.finance.transfer },
          { id: 'finance-debt', icon: DebtIcon, label: fabStrings.finance.debt },
        ];
      case 'planner':
      case '(planner)':
        return [
          { id: 'planner-task', icon: AddTaskIcon, label: fabStrings.planner.task },
          { id: 'planner-goal', icon: Flag, label: fabStrings.planner.goal },
          { id: 'planner-habit', icon: ListChecks, label: fabStrings.planner.habit },
          { id: 'planner-focus', icon: HeartPulse, label: fabStrings.planner.focus },
        ];
      default:
        return [];
    }
  }, [activeTab, strings]);

  const [canUseHaptics, setCanUseHaptics] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAvailability = async () => {
      try {
        const availabilityFn = (Haptics as { isAvailableAsync?: () => Promise<boolean> }).isAvailableAsync;
        if (!availabilityFn) {
          if (mounted) {
            setCanUseHaptics(Platform.OS !== 'web');
          }
          return;
        }
        const available = await availabilityFn();
        if (mounted) {
          setCanUseHaptics(available);
        }
      } catch {
        if (mounted) {
          setCanUseHaptics(false);
        }
      }
    };
    checkAvailability();
    return () => {
      mounted = false;
    };
  }, []);

  const triggerHaptic = useCallback(() => {
    if (!canUseHaptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
  }, [canUseHaptics]);

  const toggleExpanded = () => {
    setOpenModal((prev) => !prev);
    console.log(isOpen.value);

    triggerHaptic();

    const timingConfig = {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    };

    if (isOpen.value) {
      // Closing animation
      rotation.value = withTiming(0, { duration: 200, easing: Easing.ease });
      overlayOpacity.value = withTiming(0, { duration: 150 });
      iconProgress.value = withTiming(0, { duration: 200, easing: Easing.ease });

      // Animate buttons out sequentially from top to bottom
      actions.forEach((_, index) => {
        const reverseIndex = actions.length - 1 - index;
        buttonAnimations[index].value = withDelay(
          reverseIndex * 50,
          withTiming(0, { duration: 200, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        );
      });
    } else {
      // Opening animation
      rotation.value = withTiming(1, { duration: 200, easing: Easing.ease });
      overlayOpacity.value = withTiming(1, { duration: 150 });
      iconProgress.value = withTiming(1, { duration: 200, easing: Easing.ease });

      // Animate buttons in sequentially from bottom to top
      actions.forEach((_, index) => {
        buttonAnimations[index].value = withDelay(
          index * 100,
          withTiming(1, timingConfig)
        );
      });
    }

    isOpen.value = !isOpen.value;
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    width: isOpen ? "100%" : 0,
    height: isOpen ? "100%" : 0
  }));

  const fabRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));

  const plusIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - iconProgress.value,
    transform: [
      { rotate: `${iconProgress.value * 90}deg` },
      { scale: 1 - iconProgress.value * 0.15 },
    ],
  }));

  const minusIconStyle = useAnimatedStyle(() => ({
    opacity: iconProgress.value,
    transform: [
      { rotate: `${90 - iconProgress.value * 180}deg` },
      { scale: 0.85 + iconProgress.value * 0.15 },
    ],
  }));

  // Create animated styles for all possible buttons (max 4)
  const button0Style = useAnimatedStyle(() => ({
    bottom: 72,
    opacity: buttonAnimations[0].value,
    transform: [
      { scale: 0.8 + buttonAnimations[0].value * 0.2 },
      { translateY: 80 - buttonAnimations[0].value * 80 },
    ],
  }));

  const button1Style = useAnimatedStyle(() => ({
    bottom: 144,
    opacity: buttonAnimations[1].value,
    transform: [
      { scale: 0.8 + buttonAnimations[1].value * 0.2 },
      { translateY: 80 - buttonAnimations[1].value * 80 },
    ],
  }));

  const button2Style = useAnimatedStyle(() => ({
    bottom: 216,
    opacity: buttonAnimations[2].value,
    transform: [
      { scale: 0.8 + buttonAnimations[2].value * 0.2 },
      { translateY: 80 - buttonAnimations[2].value * 80 },
    ],
  }));

  const button3Style = useAnimatedStyle(() => ({
    bottom: 288,
    opacity: buttonAnimations[3].value,
    transform: [
      { scale: 0.8 + buttonAnimations[3].value * 0.2 },
      { translateY: 80 - buttonAnimations[3].value * 80 },
    ],
  }));

  const label0Style = useAnimatedStyle(() => ({
    opacity: buttonAnimations[0].value,
    transform: [{ translateX: 20 - buttonAnimations[0].value * 20 }],
  }));

  const label1Style = useAnimatedStyle(() => ({
    opacity: buttonAnimations[1].value,
    transform: [{ translateX: 20 - buttonAnimations[1].value * 20 }],
  }));

  const label2Style = useAnimatedStyle(() => ({
    opacity: buttonAnimations[2].value,
    transform: [{ translateX: 20 - buttonAnimations[2].value * 20 }],
  }));

  const label3Style = useAnimatedStyle(() => ({
    opacity: buttonAnimations[3].value,
    transform: [{ translateX: 20 - buttonAnimations[3].value * 20 }],
  }));

  const buttonStyles = [button0Style, button1Style, button2Style, button3Style];
  const labelStyles = [label0Style, label1Style, label2Style, label3Style];

  const bottomOffset = 76 + insets.bottom;

  // Theme-based colors
  const fabBgColor = theme.colors.surface;
  const actionButtonBgColor = theme.mode === 'dark' ? 'rgba(52, 52, 61, 0.6)' : 'rgba(255, 255, 255, 0.9)';
  const iconColor = theme.colors.textPrimary;
  const labelColor = theme.colors.textPrimary;
  const blurTint = theme.mode === 'dark' ? 'dark' : 'light';
  const overlayTintColor = theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
  const backgroundSource = theme.mode === 'dark' ? darkFabBackground : lightFabBackground;
  // Return null after all hooks have been called
  if (actions.length === 0) return null;

  return (
    <>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' }}>
        {/* Full Screen Background Overlay */}
        <Animated.View
          pointerEvents={openModal ? "box-only" : "none"}
          style={[
            styles.overlayContainer,
            overlayStyle,
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPressOut={toggleExpanded}
          >
            <MaskedView
              maskElement={
                <LinearGradient
                  colors={['transparent', 'black', 'black']}
                  locations={[0, 0.3, 1]}
                  style={StyleSheet.absoluteFill}
                />
              }
            >
              <BlurView intensity={50} tint={blurTint} style={StyleSheet.absoluteFill} />
            </MaskedView>
            <ImageBackground
              source={backgroundSource}
              style={[
                styles.backgroundImage,
              ]}
              resizeMode="cover"
            >
              <View style={[styles.overlayTint, { backgroundColor: overlayTintColor }]} />
            </ImageBackground>
          </Pressable>
        </Animated.View>

        {/* Button fubs */}
        <View pointerEvents="box-none" style={{ position: 'absolute', bottom: 0, right: 0 }}>
          {/* FAB + Actions */}
          <View style={[styles.container, { bottom: bottomOffset }]} pointerEvents="box-none">
            {actions.map((action, index) => {
              const Icon = action.icon;

              return (
                <React.Fragment key={String(action.id)}>
                  <Animated.View style={[styles.actionContainer, buttonStyles[index]]}>
                    <Animated.View style={[styles.labelContainer, labelStyles[index]]}>
                      <Text style={[styles.label, { color: labelColor }]}>{action.label}</Text>
                    </Animated.View>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: actionButtonBgColor }]}
                      onPress={() => {
                        toggleExpanded();
                        setTimeout(() => {
                          switch (action.id) {
                            case 'add-task':
                              router.push('/(modals)/planner/task');
                              break;
                            case 'quick-expense':
                            case 'add-expense':
                              console.log('Add Expense');
                              router.navigate('/(modals)/quick-exp');
                              break;
                            case 'start-focus':
                              router.navigate('/focus-mode');
                              break;
                            case 'voice-note':
                              router.navigate('/(modals)/voice-new');
                              break;
                            case 'planner-task':
                              router.push('/(modals)/planner/task');
                              break;
                            case 'planner-goal':
                              router.push('/(modals)/planner/goal');
                              break;
                            case 'planner-habit':
                              router.push('/(modals)/planner/habit');
                              break;
                            case 'planner-focus':
                              router.navigate('/focus-mode');
                              break;
                            case 'finance-income-outcome':
                              router.push({
                                pathname: '/(modals)/finance/quick-exp',
                                params: { tab: 'income' },
                              });
                              break;
                            case 'finance-transfer':
                              router.push('/(modals)/finance/transaction');
                              break;
                            case 'finance-debt':
                              router.push('/(modals)/finance/debt');
                              break;
                          }
                        }, 300);
                      }}
                      activeOpacity={0.8}
                    >
                      <Icon color={iconColor} size={24} strokeWidth={2} />
                    </TouchableOpacity>
                  </Animated.View>
                </React.Fragment>
              );
            })}

            {/* Main FAB - Shadow wrapper */}
            <View style={styles.fabShadowWrapper}>
              <TouchableOpacity
                style={[styles.fab, { backgroundColor: fabBgColor }]}
                onPress={toggleExpanded}
                activeOpacity={0.9}
              >
                <Animated.View style={fabRotationStyle}>
                  <View style={styles.iconStack}>
                    <Animated.View style={[styles.layeredIcon, plusIconStyle]}>
                      <Plus color={iconColor} size={28} strokeWidth={2.5} />
                    </Animated.View>
                    <Animated.View style={[styles.layeredIcon, minusIconStyle]}>
                      <Minus color={iconColor} size={28} strokeWidth={2.5} />
                    </Animated.View>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998
  },
  container: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayTint: {
    flex: 1,
  },
  fabShadowWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 16,
    elevation: 16,
    borderRadius: 28,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionContainer: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    minWidth: 240,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  labelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconStack: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layeredIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
