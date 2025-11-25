import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLockStore } from "@/stores/useLockStore";
import { useTheme } from "@/contexts/ThemeContext";
import { getTheme, type ThemeColors } from "@/constants/theme";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const LIGHT_COLORS = getTheme("light").colors;
const DARK_COLORS = getTheme("dark").colors;
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LogoutButton = () => {
  const { logout } = useAuthStore();
  const router = useRouter();
  const setLoggedIn = useLockStore((state) => state.setLoggedIn);
  const setLocked = useLockStore((state) => state.setLocked);
  const { theme } = useTheme();
  const palette = useMemo(() => getTheme(theme).colors, [theme]);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [visible, setVisible] = useState(false);
  const themeTransition = useSharedValue(theme === "dark" ? 1 : 0);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    themeTransition.value = withTiming(theme === "dark" ? 1 : 0, {
      duration: 280,
      easing: Easing.inOut(Easing.ease),
    });
  }, [theme, themeTransition]);

  const openModal = () => {
    setVisible(true);
    modalScale.value = withSpring(1, {
      damping: 15,
      stiffness: 180,
    });
    modalOpacity.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  };

  const closeModal = () => {
    modalScale.value = withTiming(0.8, {
      duration: 200,
      easing: Easing.inOut(Easing.quad),
    });
    modalOpacity.value = withTiming(
      0,
      {
        duration: 200,
        easing: Easing.inOut(Easing.quad),
      },
      (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
        }
      }
    );
  };

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    setLocked(false);
    closeModal();
    router.replace("/(auth)/login");
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeTransition.value,
      [0, 1],
      [LIGHT_COLORS.surface, DARK_COLORS.surface]
    ),
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeTransition.value,
      [0, 1],
      [LIGHT_COLORS.backdrop, DARK_COLORS.backdrop]
    ),
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeTransition.value,
      [0, 1],
      [LIGHT_COLORS.surfaceElevated, DARK_COLORS.surfaceElevated]
    ),
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeTransition.value,
      [0, 1],
      [LIGHT_COLORS.surface, DARK_COLORS.surface]
    ),
  }));

  return (
    <>
      {/* Trigger Button */}
      <AnimatedTouchableOpacity
        style={[styles.dangerButton, buttonAnimatedStyle]}
        onPress={openModal}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={20} color={palette.danger} />
        <Text style={styles.dangerButtonText}>Выйти из аккаунта</Text>
      </AnimatedTouchableOpacity>

      {/* Custom Modal */}
      <Modal transparent visible={visible} animationType="none">
        <AnimatedPressable style={[styles.overlay, overlayAnimatedStyle]} onPress={closeModal}>
          <Animated.View style={[styles.modalBackdrop, modalAnimatedStyle]}>
            <Text style={styles.title}>Logout</Text>
            <Text style={styles.message}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.actions}>
              <AnimatedTouchableOpacity
                style={[styles.button, cancelButtonAnimatedStyle]}
                onPress={closeModal}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </AnimatedTouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.logout]}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </AnimatedPressable>
      </Modal>
    </>
  );
};

const createStyles = (palette: ThemeColors) =>
  StyleSheet.create({
    dangerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: palette.danger,
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.danger,
    },
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalBackdrop: {
      width: 300,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      gap: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: palette.textPrimary,
      alignSelf: "stretch",
      textAlign: "center",
    },
    message: {
      fontSize: 14,
      color: palette.textSecondary,
      textAlign: "center",
      alignSelf: "stretch",
    },
    actions: {
      flexDirection: "row",
      alignSelf: "stretch",
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    logout: {
      backgroundColor: palette.danger,
    },
    cancelText: {
      color: palette.textPrimary,
      fontWeight: "600",
    },
    logoutText: {
      color: palette.onDanger,
      fontWeight: "600",
    },
  });
