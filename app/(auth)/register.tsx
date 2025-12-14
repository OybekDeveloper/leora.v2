import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Mail, Lock, User } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import {
  Input,
  Button,
  SocialLoginButtons,
  AuthScreenContainer,
} from '@/components/screens/auth';
import { PasswordStrengthMeter } from '@/components/screens/auth/PasswordStrengthMeter';
import GlassCard from '@/components/shared/GlassCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { PasswordRequirementKey } from '@/utils/validation';
import { useLockStore } from '@/stores/useLockStore';
import {
  getFinanceRegionPreset,
  useFinancePreferencesStore,
  type FinanceCurrency,
} from '@/stores/useFinancePreferencesStore';
import { useAppTheme, type Theme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

const CURRENCY_LABELS: Record<FinanceCurrency, string> = {
  UZS: 'Uzbekistani Som',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  TRY: 'Turkish Lira',
  SAR: 'Saudi Riyal',
  AED: 'UAE Dirham',
  USDT: 'Tether (USDT)',
  RUB: 'Russian Ruble',
};

const RegisterScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { strings } = useLocalization();
  const registerStrings = strings.auth.register;
  const validationStrings = strings.auth.validation;
  const commonStrings = strings.auth.common;
  const { register, isLoading, error, clearError } = useAuthStore();
  const financeRegion = useFinancePreferencesStore((state) => state.region);
  const globalCurrency = useFinancePreferencesStore((state) => state.globalCurrency);
  const setLoggedIn = useLockStore((state) => state.setLoggedIn);
  const setLocked = useLockStore((state) => state.setLocked);
  const updateLastActive = useLockStore((state) => state.updateLastActive);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const hasFocusedRef = useRef(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const passwordRequirementMessages = useMemo<Record<PasswordRequirementKey, string>>(
    () => ({
      minLength: validationStrings.passwordMinLength,
      uppercase: validationStrings.passwordUppercase,
      lowercase: validationStrings.passwordLowercase,
      number: validationStrings.passwordNumber,
      special: validationStrings.passwordSpecial,
    }),
    [validationStrings],
  );

  const selectedRegionPreset = useMemo(
    () => getFinanceRegionPreset(financeRegion),
    [financeRegion],
  );
  const regionHelperText = useMemo(
    () => registerStrings.selectors.helper.replace('{currency}', globalCurrency),
    [registerStrings.selectors.helper, globalCurrency],
  );

  const registerErrorMap = useMemo(
    (): Record<string, string> => ({
      'Please fill in all fields': registerStrings.errors.missingFields,
      'Please select your region': registerStrings.errors.selectRegion,
      'Passwords do not match': registerStrings.errors.passwordMismatch,
      'Please enter a valid email address': registerStrings.errors.emailInvalid,
      'An account with this email already exists': registerStrings.errors.emailExists,
      'An error occurred during registration. Please try again.': registerStrings.errors.generic,
      'Password must be at least 6 characters long': validationStrings.passwordMinLength,
      'Password must be at least 8 characters long': validationStrings.passwordMinLength,
      'Password must contain at least one uppercase letter': validationStrings.passwordUppercase,
      'Password must contain at least one lowercase letter': validationStrings.passwordLowercase,
      'Password must contain at least one number': validationStrings.passwordNumber,
      'Password must contain at least one special character': validationStrings.passwordSpecial,
    }),
    [registerStrings.errors, validationStrings],
  );

  const localizedRegisterError = useMemo(() => {
    if (!error) return undefined;
    return registerErrorMap[error] ?? error;
  }, [error, registerErrorMap]);

  const isFormValid = Boolean(
    emailOrPhone.trim() &&
    fullName.trim() &&
    password &&
    confirmPassword &&
    !emailError &&
    !nameError &&
    !passwordError &&
    !confirmPasswordError,
  );

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        setEmailOrPhone('');
        setFullName('');
        setPassword('');
        setConfirmPassword('');
        setIsPasswordFocused(false);
      }

      setEmailError(undefined);
      setNameError(undefined);
      setPasswordError(undefined);
      setConfirmPasswordError(undefined);
      clearError();
      hasFocusedRef.current = true;
    }, [clearError])
  );

  const handleRegister = async () => {
    clearError();

    const trimmedEmail = emailOrPhone.trim();
    const trimmedName = fullName.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const emailValidationError = trimmedEmail
      ? emailRegex.test(trimmedEmail)
        ? undefined
        : validationStrings.emailInvalid
      : validationStrings.emailRequired;
    const nameValidationError = trimmedName ? undefined : validationStrings.nameRequired;
    // Faqat minimal uzunlik tekshiriladi (6 ta belgi)
    const passwordValidationError = password
      ? password.length < 6
        ? validationStrings.passwordMinLength
        : undefined
      : validationStrings.passwordRequired;
    const confirmPasswordValidationError = confirmPassword
      ? confirmPassword !== password
        ? validationStrings.passwordMismatch
        : undefined
      : validationStrings.passwordConfirmRequired;

    setEmailError(emailValidationError);
    setNameError(nameValidationError);
    setPasswordError(passwordValidationError);
    setConfirmPasswordError(confirmPasswordValidationError);

    if (
      emailValidationError ||
      nameValidationError ||
      passwordValidationError ||
      confirmPasswordValidationError
    ) {
      return;
    }

    const success = await register({
      emailOrPhone: trimmedEmail,
      fullName: trimmedName,
      password,
      confirmPassword,
      region: financeRegion,
      currency: globalCurrency,
    });

    if (success) {
      setLoggedIn(true);
      setLocked(false);
      updateLastActive();
      // Navigate directly without Alert to prevent double splash screen bug
      router.replace('/(tabs)');
      return;
    }

    const latestError = useAuthStore.getState().error;
    const message =
      (latestError ? (registerErrorMap[latestError] ?? latestError) : undefined) ??
      registerStrings.errors.generic;
    Alert.alert(registerStrings.alerts.failureTitle, message);
  };

  const handleSocialRegister = (provider: string) => {
    Alert.alert(
      registerStrings.alerts.socialTitle,
      registerStrings.alerts.socialMessage.replace('{provider}', provider),
    );
  };

  const handleGoToLogin = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/login');
  };

  const openRegionModal = useCallback(() => {
    router.push('/(auth)/select-region');
  }, []);

  const openCurrencyModal = useCallback(() => {
    router.push('/(auth)/select-currency');
  }, []);

  return (
    <AuthScreenContainer>
      <GlassCard>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{registerStrings.title}</Text>
            <Text style={styles.description}>
              {registerStrings.description}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label={registerStrings.fields.email}
              placeholder={registerStrings.placeholders.email}
              value={emailOrPhone}
              onChangeText={(text: string) => {
                setEmailOrPhone(text);
                if (error) {
                  clearError();
                }
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              inputMode="email"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
              icon={Mail}
              iconSize={22}
              error={emailError}
              onClearError={() => setEmailError(undefined)}
            />

            <Input
              label={registerStrings.fields.fullName}
              placeholder={registerStrings.placeholders.fullName}
              value={fullName}
              onChangeText={(text: string) => {
                setFullName(text);
                if (error) {
                  clearError();
                }
              }}
              icon={User}
              iconSize={22}
              error={nameError}
              onClearError={() => setNameError(undefined)}
            />

            <Input
              label={registerStrings.fields.password}
              placeholder={registerStrings.placeholders.password}
              value={password}
              onChangeText={(text: string) => {
                setPassword(text);
                if (error) {
                  clearError();
                }
              }}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              isPassword
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              autoCorrect={false}
              spellCheck={false}
              icon={Lock}
              iconSize={22}
              error={passwordError}
              onClearError={() => setPasswordError(undefined)}
            />

            <PasswordStrengthMeter
              password={password}
              visible={isPasswordFocused}
              guideStrings={registerStrings.passwordGuide}
            />

            <Input
              label={registerStrings.fields.confirmPassword}
              placeholder={registerStrings.placeholders.confirmPassword}
              value={confirmPassword}
              onChangeText={(text: string) => {
                setConfirmPassword(text);
                if (error) {
                  clearError();
                }
              }}
              isPassword
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              autoCorrect={false}
              spellCheck={false}
              icon={Lock}
              iconSize={22}
              error={confirmPasswordError}
              onClearError={() => setConfirmPasswordError(undefined)}
            />

            <View style={styles.regionSection}>
              <View style={styles.regionHeader}>
                <Text style={styles.regionTitle}>{registerStrings.selectors.sectionTitle}</Text>
                <Text style={styles.regionHelper}>
                  {regionHelperText}
                </Text>
              </View>
              <View style={styles.regionSelectors}>
                <Pressable
                  onPress={openRegionModal}
                  style={({ pressed }) => [styles.selectorPressable, pressed && styles.selectorPressed]}
                >
                  <View style={styles.selectorCard}>
                    <View style={styles.selectorContent}>
                      <View style={styles.selectorIcon}>
                        <Feather name="globe" size={18} color={theme.colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectorLabel}>{registerStrings.selectors.regionLabel}</Text>
                        <Text style={styles.selectorValue}>{selectedRegionPreset.label}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={theme.colors.textSecondary} />
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  onPress={openCurrencyModal}
                  style={({ pressed }) => [styles.selectorPressable, pressed && styles.selectorPressed]}
                >
                  <View style={styles.selectorCard}>
                    <View style={styles.selectorContent}>
                      <View style={styles.selectorIcon}>
                        <Feather name="dollar-sign" size={18} color={theme.colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectorLabel}>{registerStrings.selectors.currencyLabel}</Text>
                        <Text style={styles.selectorValue}>
                          {globalCurrency} · {CURRENCY_LABELS[globalCurrency]}
                        </Text>
                        <Text style={styles.selectorSubValue}>{registerStrings.selectors.currencyHint}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={theme.colors.textSecondary} />
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Error message */}
            {localizedRegisterError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{localizedRegisterError}</Text>
              </View>
            )}

            <Button
              title={registerStrings.buttons.submit}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
              loading={isLoading}
            />

            <SocialLoginButtons
              dividerLabel={commonStrings.socialDivider}
              onGooglePress={() => handleSocialRegister('Google')}
              onFacebookPress={() => handleSocialRegister('Facebook')}
              onApplePress={() => handleSocialRegister('Apple')}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{registerStrings.links.haveAccount} </Text>
              <TouchableOpacity onPress={handleGoToLogin}>
                <Text style={styles.signInLink}>{registerStrings.links.signIn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GlassCard>
    </AuthScreenContainer>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
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
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      width: '100%',
    },
    regionSection: {
      marginTop: 20,
      marginBottom: 12,
      gap: 12,
    },
    regionHeader: {
      gap: 4,
    },
    regionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    regionHelper: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    regionSelectors: {
      gap: 12,
    },
    selectorPressable: {
      borderRadius: 18,
    },
    selectorPressed: {
      opacity: 0.94,
    },
    selectorCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      overflow: 'hidden',
      backgroundColor: theme.colors.card,
    },
    selectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    selectorIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.glassBg,
    },
    selectorLabel: {
      fontSize: 12,
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
      letterSpacing: 0.5,
    },
    selectorValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    selectorSubValue: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    footerText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    signInLink: {
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
  });

export default RegisterScreen;
