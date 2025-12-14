import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import {
  Input,
  Button,
  SocialLoginButtons,
  AuthScreenContainer,
} from '@/components/screens/auth';
import GlassCard from '@/components/shared/GlassCard';
import { CheckIcon } from '@assets/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLockStore } from '@/stores/useLockStore';
import { useLocalization } from '@/localization/useLocalization';
import { useAppTheme, type Theme } from '@/constants/theme';

const LoginScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { strings } = useLocalization();
  const loginStrings = strings.auth.login;
  const validationStrings = strings.auth.validation;
  const commonStrings = strings.auth.common;

  const { login, isLoading, error, clearError, setRememberMe } = useAuthStore();
  const setLoggedIn = useLockStore((state) => state.setLoggedIn);
  const setLocked = useLockStore((state) => state.setLocked);
  const updateLastActive = useLockStore((state) => state.updateLastActive);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMeLocal, setRememberMeLocal] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const hasFocusedRef = useRef(false);

  const remoteErrorMap = useMemo(
    (): Record<string, string> => ({
      "Please enter both email/username and password": loginStrings.errors.missingCredentials,
      "Invalid email/username or password": loginStrings.errors.invalidCredentials,
      "An error occurred during login. Please try again.": loginStrings.errors.generic,
    }),
    [loginStrings.errors]
  );

  const localizedError = useMemo(() => {
    if (!error) return undefined;
    return remoteErrorMap[error] ?? error;
  }, [error, remoteErrorMap]);

  const isFormValid = Boolean(email.trim() && password && !emailError && !passwordError);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        setEmail("");
        setPassword("");
        setRememberMeLocal(false);
      }

      setEmailError(undefined);
      setPasswordError(undefined);
      clearError();
      hasFocusedRef.current = true;
    }, [clearError])
  );

  const handleLogin = async () => {
    clearError();

    const trimmedEmail = email.trim();
    const emailValidationError = trimmedEmail ? undefined : validationStrings.emailOrUsernameRequired;
    const passwordValidationError = password ? undefined : validationStrings.passwordRequired;

    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);

    if (emailValidationError || passwordValidationError) {
      return;
    }

    const success = await login({
      emailOrUsername: trimmedEmail,
      password,
      rememberMe: rememberMeLocal,
    });

    if (success) {
      setRememberMe(rememberMeLocal);
      setLoggedIn(true);
      setLocked(false);
      updateLastActive();
      router.replace("/(tabs)");
      return;
    }

    const latestError = useAuthStore.getState().error;
    const message =
      (latestError ? (remoteErrorMap[latestError] ?? latestError) : undefined) ??
      loginStrings.alerts.failureMessage;
    Alert.alert(loginStrings.alerts.failureTitle, message);
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      loginStrings.alerts.socialTitle,
      loginStrings.alerts.socialMessage.replace("{provider}", provider)
    );
  };

  return (
    <AuthScreenContainer>
      <View style={styles.container}>
        <GlassCard>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{loginStrings.title}</Text>
              <Text style={styles.description}>{loginStrings.description}</Text>
            </View>

            {/* Inputs */}
            <View style={styles.form}>
              <Input
                label={loginStrings.fields.emailOrUsername}
                placeholder={loginStrings.placeholders.emailOrUsername}
                value={email}
                onChangeText={(text: string) => {
                  setEmail(text);
                  if (error) {
                    clearError();
                  }
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                inputMode="email"
                autoComplete="email"
                textContentType="username"
                autoCorrect={false}
                icon={Mail}
                iconSize={22}
                error={emailError}
                onClearError={() => setEmailError(undefined)}
              />

              <Input
                label={loginStrings.fields.password}
                placeholder={loginStrings.placeholders.password}
                value={password}
                onChangeText={(text: string) => {
                  setPassword(text);
                  if (error) {
                    clearError();
                  }
                }}
                isPassword
                autoComplete="password"
                textContentType="password"
                importantForAutofill="yes"
                autoCorrect={false}
                icon={Lock}
                iconSize={22}
                error={passwordError}
                onClearError={() => setPasswordError(undefined)}
              />

              {/* Options */}
              <View style={styles.options}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMeLocal(!rememberMeLocal)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.checkbox, rememberMeLocal && styles.checkboxChecked]}
                  >
                    {rememberMeLocal && <CheckIcon color={theme.colors.onPrimary} size={14} />}
                  </View>
                  <Text style={styles.rememberMeText}>{loginStrings.rememberMe}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.navigate("/(auth)/forgot-password")}>
                  <Text style={styles.forgotPassword}>{loginStrings.forgotPassword}</Text>
                </TouchableOpacity>
              </View>

              {/* Error message */}
              {localizedError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{localizedError}</Text>
                </View>
              )}

              {/* Login button */}
              <Button
                title={loginStrings.buttons.submit}
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
                loading={isLoading}
              />

              {/* Social buttons */}
              <SocialLoginButtons
                dividerLabel={commonStrings.socialDivider}
                onGooglePress={() => handleSocialLogin("Google")}
                onFacebookPress={() => handleSocialLogin("Facebook")}
                onApplePress={() => handleSocialLogin("Apple")}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{loginStrings.links.noAccount} </Text>
              <TouchableOpacity onPress={() => router.navigate("/(auth)/register")}>
                <Text style={styles.signUpLink}>{loginStrings.links.signUp}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </View>
    </AuthScreenContainer>
  );
};

export default LoginScreen;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: 'transparent',
    },
    card: {
      width: '100%',
      paddingBottom: 32,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    header: {
      marginBottom: 16,
      paddingTop: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      width: '100%',
      marginTop: 16,
    },
    options: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.glassBg,
    },
    checkboxChecked: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    checkboxInner: {
      width: 12,
      height: 12,
      borderRadius: 2,
      backgroundColor: 'transparent',
    },
    rememberMeText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    forgotPassword: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    footerText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    signUpLink: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: `${theme.colors.danger}15`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: `${theme.colors.danger}50`,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    input: {
      width: '100%',
      height: 50,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.glassBorder,
      paddingHorizontal: 12,
      color: theme.colors.textPrimary,
      marginBottom: 16,
      backgroundColor: theme.colors.glassBg,
    },
    button: {
      backgroundColor: `${theme.colors.primary}40`,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: `${theme.colors.primary}66`,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonText: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
  });
