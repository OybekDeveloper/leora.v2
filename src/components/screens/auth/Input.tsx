import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';

import { useAppTheme, type Theme } from '@/constants/theme';

type ValidationState = 'default' | 'focused' | 'error';

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

interface InputProps extends TextInputProps {
  label?: string;
  icon?: IconComponent;
  iconSize?: number;
  isPassword?: boolean;
  error?: string;
  onClearError?: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginBottom: 10,
    },
    label: {
      fontWeight: '600',
      letterSpacing: 0.15,
      marginBottom: 8,
    },
    inputWrapper: {
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    gradientBackground: {
      borderRadius: 14,
      position: 'relative',
    },
    input: {
      height: 56,
      fontSize: 16,
      fontWeight: '500',
    },
    inputWithIcon: {
      paddingLeft: 54,
    },
    inputWithToggle: {
      paddingRight: 48,
    },
    iconContainer: {
      position: 'absolute',
      left: 18,
      top: 18,
    },
    eyeIcon: {
      position: 'absolute',
      right: 0,
      top: 0,
      width: 48,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorWrapper: {
      overflow: 'hidden',
      marginTop: 4,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
  });

// Theme-based color configurations
const getThemeColors = (theme: Theme, isDark: boolean) => ({
  placeholder: {
    default: theme.colors.inputPlaceholder,
    focused: theme.colors.inputBorderFocus,
    error: isDark ? theme.colors.dangerBg : theme.colors.danger,
  },
  text: {
    default: theme.colors.textPrimary,
    error: isDark ? theme.colors.inputErrorBg : theme.colors.danger,
  },
  border: {
    default: theme.colors.glassBorder,
    focused: theme.colors.inputBorderFocus,
    error: theme.colors.inputBorderError,
  },
  icon: {
    default: theme.colors.inputPlaceholder,
    focused: theme.colors.inputBorderFocus,
    error: theme.colors.danger,
  },
  label: {
    default: theme.colors.inputPlaceholder,
    focused: theme.colors.textPrimary,
    error: theme.colors.danger,
  },
  gradient: isDark
    ? ([theme.colors.glassBg, 'rgba(0,0,0,0.12)'] as const)
    : (['rgba(255,255,255,0.8)', theme.colors.surfaceElevated] as const),
  eyeIcon: theme.colors.inputBorderFocus,
});

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  iconSize = 20,
  isPassword = false,
  style,
  error: externalError,
  onClearError,
  onFocus,
  onBlur,
  onChangeText,
  value = '',
  ...props
}) => {
  const theme = useAppTheme();
  const isDark = theme.mode === 'dark';
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = useMemo(() => getThemeColors(theme, isDark), [theme, isDark]);

  const error = externalError;

  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animated values keep transitions subtle and polished
  const stateAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(error ? 1 : 0)).current;

  const validationState: ValidationState = error
    ? 'error'
    : isFocused
    ? 'focused'
    : 'default';

  useEffect(() => {
    const toValue = validationState === 'error' ? 2 : validationState === 'focused' ? 1 : 0;

    Animated.timing(stateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [stateAnim, validationState]);

  useEffect(() => {
    Animated.timing(errorAnim, {
      toValue: error ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [error, errorAnim]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);

    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    onChangeText?.(text);

    if (error) {
      onClearError?.();
    }
  };

  const placeholderColor = useMemo(() => {
    switch (validationState) {
      case 'error':
        return colors.placeholder.error;
      case 'focused':
        return colors.placeholder.focused;
      default:
        return colors.placeholder.default;
    }
  }, [validationState, colors]);

  const textColor = validationState === 'error' ? colors.text.error : colors.text.default;

  const borderColor = stateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [colors.border.default, colors.border.focused, colors.border.error],
  });

  const borderWidth = stateAnim.interpolate({
    inputRange: [0, 1, 1],
    outputRange: [1, 1, 1],
  });

  const iconTint = useMemo(() => {
    switch (validationState) {
      case 'error':
        return colors.icon.error;
      case 'focused':
        return colors.icon.focused;
      default:
        return colors.icon.default;
    }
  }, [validationState, colors]);

  const labelTint = useMemo(() => {
    switch (validationState) {
      case 'error':
        return colors.label.error;
      case 'focused':
        return colors.label.focused;
      default:
        return colors.label.default;
    }
  }, [validationState, colors]);

  const IconComponent = icon;

  return (
    <Animated.View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: labelTint }]}>{label}</Text>}

      <Animated.View style={[styles.inputWrapper, { borderColor, borderWidth }]}>
        <LinearGradient
          colors={colors.gradient as unknown as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBackground}
        >
          {IconComponent && (
            <Animated.View style={styles.iconContainer}>
              <IconComponent size={iconSize} color={iconTint} />
            </Animated.View>
          )}

          <TextInput
            style={[
              styles.input,
              IconComponent ? styles.inputWithIcon : undefined,
              isPassword ? styles.inputWithToggle : undefined,
              { color: textColor },
            ]}
            value={value}
            secureTextEntry={isPassword && !showPassword}
            placeholderTextColor={placeholderColor}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <EyeOff size={18} color={colors.eyeIcon} />
              ) : (
                <Eye size={18} color={colors.eyeIcon} />
              )}
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.errorWrapper,
          {
            opacity: errorAnim,
            transform: [
              {
                translateY: errorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-4, 0],
                }),
              },
            ],
            height: errorAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 18],
            }),
          },
        ]}
      >
        <Text style={styles.errorText}>{error ?? ''}</Text>
      </Animated.View>
    </Animated.View>
  );
};
