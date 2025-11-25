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
        return '#ffb3b3';
      case 'focused':
        return '#dce1ff';
      default:
        return '#A6A6B9';
    }
  }, [validationState]);

  const textColor = validationState === 'error' ? '#FFE5E5' : '#FFFFFF';

  const borderColor = stateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['rgba(255,255,255,0.08)', '#7C83FF', '#FF4D4F'],
  });

  const borderWidth = stateAnim.interpolate({
    inputRange: [0, 1, 1],
    outputRange: [1, 1, 1],
  });

  const iconTint = useMemo(() => {
    switch (validationState) {
      case 'error':
        return '#FF8A8C';
      case 'focused':
        return '#D1D5FF';
      default:
        return '#A6A6B9';
    }
  }, [validationState]);

  const labelTint = useMemo(() => {
    switch (validationState) {
      case 'error':
        return '#FF7A7C';
      case 'focused':
        return '#F3F4FF';
      default:
        return '#A6A6B9';
    }
  }, [validationState]);

  const IconComponent = icon;

  return (
    <Animated.View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: labelTint }]}>{label}</Text>}

      <Animated.View style={[styles.inputWrapper, { borderColor, borderWidth }]}>
        <LinearGradient
          colors={['rgba(49,49,58,0.2)', 'rgba(0,0,0,0.12)']}
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
                <EyeOff size={18} color="#dce1ff" />
              ) : (
                <Eye size={18} color="#dce1ff" />
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

const styles = StyleSheet.create({
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
    shadowColor: 'rgba(0,0,0,0.25)',
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
    color: '#FF8A8C',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
