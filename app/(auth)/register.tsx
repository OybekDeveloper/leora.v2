import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
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
import { PasswordRequirementKey, getFirstUnmetPasswordRequirement } from '@/utils/validation';
import { useLockStore } from '@/stores/useLockStore';
import {
  FINANCE_REGION_PRESETS,
  type FinanceRegion,
  getFinanceRegionPreset,
  useFinancePreferencesStore,
  type FinanceCurrency,
  AVAILABLE_FINANCE_CURRENCIES,
} from '@/stores/useFinancePreferencesStore';
import { useSettingsStore, type SupportedLanguage } from '@/stores/useSettingsStore';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import CustomBottomSheet, { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { useLocalization } from '@/localization/useLocalization';
import { LinearGradient } from 'expo-linear-gradient';
import { LanguageSelectorControl } from '@/components/screens/auth/LanguageSelectorControl';

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

const DEFAULT_FINANCE_REGION = FINANCE_REGION_PRESETS[0].id as FinanceRegion;

const RegisterScreen = () => {
  const { strings } = useLocalization();
  const registerStrings = strings.auth.register;
  const validationStrings = strings.auth.validation;
  const commonStrings = strings.auth.common;
  const { register, isLoading, error, clearError } = useAuthStore();
  const theme = useAppTheme();
  const setFinanceRegion = useFinancePreferencesStore((state) => state.setRegion);
  const setGlobalCurrency = useFinancePreferencesStore((state) => state.setGlobalCurrency);
  const selectedLanguage = useSettingsStore((state) => state.language as SupportedLanguage);
  const setLanguagePreference = useSettingsStore((state) => state.setLanguage);
  const setLoggedIn = useLockStore((state) => state.setLoggedIn);
  const setLocked = useLockStore((state) => state.setLocked);
  const updateLastActive = useLockStore((state) => state.updateLastActive);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<FinanceRegion>(DEFAULT_FINANCE_REGION);
  const [selectedCurrency, setSelectedCurrency] = useState<FinanceCurrency>(
    getFinanceRegionPreset(DEFAULT_FINANCE_REGION).currency,
  );

  const [emailError, setEmailError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const hasFocusedRef = useRef(false);
  const regionSheetRef = useRef<BottomSheetHandle>(null);
  const currencySheetRef = useRef<BottomSheetHandle>(null);
  const [currencyQuery, setCurrencyQuery] = useState('');
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
    () => getFinanceRegionPreset(selectedRegion),
    [selectedRegion],
  );
  const currencyOptions = useMemo(
    () =>
      AVAILABLE_FINANCE_CURRENCIES.map((code) => ({
        code,
        label: CURRENCY_LABELS[code],
      })),
    [],
  );
  const regionHelperText = useMemo(
    () => registerStrings.selectors.helper.replace('{currency}', selectedRegionPreset.currency),
    [registerStrings.selectors.helper, selectedRegionPreset.currency],
  );
  const filteredCurrencies = useMemo(() => {
    if (!currencyQuery.trim()) {
      return currencyOptions;
    }
    const search = currencyQuery.trim().toLowerCase();
    return currencyOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(search) || option.label.toLowerCase().includes(search),
    );
  }, [currencyOptions, currencyQuery]);

  const registerErrorMap = useMemo(
    () => ({
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

  useEffect(() => {
    setFinanceRegion(selectedRegion);
    setSelectedCurrency(getFinanceRegionPreset(selectedRegion).currency);
    setCurrencyQuery('');
  }, [selectedRegion, setFinanceRegion]);

  useEffect(() => {
    setGlobalCurrency(selectedCurrency);
  }, [selectedCurrency, setGlobalCurrency]);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        setEmailOrPhone('');
      setFullName('');
      setPassword('');
      setConfirmPassword('');
      setSelectedRegion(DEFAULT_FINANCE_REGION);
      setSelectedCurrency(getFinanceRegionPreset(DEFAULT_FINANCE_REGION).currency);
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
    const unmetRequirement = password ? getFirstUnmetPasswordRequirement(password) : undefined;
    const passwordValidationError = password
      ? unmetRequirement
        ? passwordRequirementMessages[unmetRequirement]
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
      region: selectedRegion,
      currency: selectedCurrency,
    });

    if (success) {
      setLoggedIn(true);
      setLocked(false);
      updateLastActive();
      Alert.alert(
        registerStrings.alerts.successTitle,
        registerStrings.alerts.successMessage,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
      );
      return;
    }

    const latestError = useAuthStore.getState().error;
    const message =
      (latestError ? registerErrorMap[latestError] ?? latestError : undefined) ??
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

  const openRegionSheet = useCallback(() => {
    regionSheetRef.current?.present();
  }, []);

  const openCurrencySheet = useCallback(() => {
    currencySheetRef.current?.present();
  }, []);

  const handleSelectRegion = useCallback(
    (regionId: FinanceRegion) => {
      setSelectedRegion(regionId);
      regionSheetRef.current?.dismiss();
      if (error) {
        clearError();
      }
    },
    [clearError, error],
  );

  const handleSelectCurrency = useCallback((currency: FinanceCurrency) => {
    setSelectedCurrency(currency);
    currencySheetRef.current?.dismiss();
  }, []);

  const handleSelectLanguage = useCallback(
    (language: SupportedLanguage) => {
      setLanguagePreference(language);
      if (error) {
        clearError();
      }
    },
    [clearError, error, setLanguagePreference],
  );

  return (
    <AuthScreenContainer>
      <GlassCard>
        <View style={styles.container}>
          <LanguageSelectorControl
            label={registerStrings.languageSelector.label}
            helper={registerStrings.languageSelector.helper}
            value={selectedLanguage}
            onChange={handleSelectLanguage}
          />
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
                  onPress={openRegionSheet}
                  style={({ pressed }) => [styles.selectorPressable, pressed && styles.selectorPressed]}
                >
                  <Animated.View style={styles.selectorCard}>
                    <LinearGradient
                      colors={['rgba(49,49,58,0.26)', 'rgba(10,10,14,0.2)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.selectorGradient}
                    >
                      <View style={styles.selectorIcon}>
                        <Feather name="globe" size={18} color="#D3DAFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectorLabel}>{registerStrings.selectors.regionLabel}</Text>
                        <Text style={styles.selectorValue}>{selectedRegionPreset.label}</Text>
                        <Text style={styles.selectorSubValue}>{selectedRegionPreset.description}</Text>
                      </View>
                      <Feather name="chevron-down" size={18} color="#A6A6B9" />
                    </LinearGradient>
                  </Animated.View>
                </Pressable>
                <Pressable
                  onPress={openCurrencySheet}
                  style={({ pressed }) => [styles.selectorPressable, pressed && styles.selectorPressed]}
                >
                  <Animated.View style={styles.selectorCard}>
                    <LinearGradient
                      colors={['rgba(49,49,58,0.26)', 'rgba(10,10,14,0.2)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.selectorGradient}
                    >
                      <View style={styles.selectorIcon}>
                        <Feather name="dollar-sign" size={18} color="#D3DAFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectorLabel}>{registerStrings.selectors.currencyLabel}</Text>
                        <Text style={styles.selectorValue}>
                          {selectedCurrency} · {CURRENCY_LABELS[selectedCurrency]}
                        </Text>
                        <Text style={styles.selectorSubValue}>{registerStrings.selectors.currencyHint}</Text>
                      </View>
                      <Feather name="chevron-down" size={18} color="#A6A6B9" />
                    </LinearGradient>
                  </Animated.View>
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
      <CustomBottomSheet
        ref={regionSheetRef}
        snapPoints={['65%']}
        enableDynamicSizing
        scrollable
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{registerStrings.sheets.regionTitle}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {FINANCE_REGION_PRESETS.map((region) => {
              const isActive = region.id === selectedRegion;
              return (
                <Pressable
                  key={region.id}
                  onPress={() => handleSelectRegion(region.id as FinanceRegion)}
                  style={({ pressed }) => [styles.sheetOptionPressable, pressed && styles.selectorPressed]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.sheetOptionCard,
                      { borderColor: isActive ? theme.colors.primary : 'rgba(255,255,255,0.1)' },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetOptionTitle}>{region.label}</Text>
                      <Text style={styles.sheetOptionSubtitle}>{region.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.sheetCurrencyBadge,
                        isActive && { borderColor: theme.colors.primary, backgroundColor: 'rgba(124,131,255,0.12)' },
                      ]}
                    >
                      <Text style={styles.sheetCurrencyText}>{region.currency}</Text>
                    </View>
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </CustomBottomSheet>
      <CustomBottomSheet
        ref={currencySheetRef}
        snapPoints={['65%']}
        enableDynamicSizing
        scrollable
        onDismiss={() => setCurrencyQuery('')}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{registerStrings.sheets.currencyTitle}</Text>
          <AdaptiveGlassView style={styles.currencySearch}>
            <Feather name="search" size={16} color="#7E8B9A" />
            <TextInput
              value={currencyQuery}
              onChangeText={setCurrencyQuery}
              placeholder={registerStrings.sheets.currencySearch}
              placeholderTextColor="#7E8B9A"
              style={styles.currencySearchInput}
            />
          </AdaptiveGlassView>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredCurrencies.map((option) => {
              const isActive = option.code === selectedCurrency;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => handleSelectCurrency(option.code)}
                  style={({ pressed }) => [styles.sheetOptionPressable, pressed && styles.selectorPressed]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.sheetOptionCard,
                      { borderColor: isActive ? theme.colors.primary : 'rgba(255,255,255,0.1)' },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sheetOptionTitle}>{option.code}</Text>
                      <Text style={styles.sheetOptionSubtitle}>{option.label}</Text>
                    </View>
                    {isActive && <Feather name="check" size={16} color="#fff" />}
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </CustomBottomSheet>
    </AuthScreenContainer>
  );
};

const styles = StyleSheet.create({
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
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#A6A6B9',
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
    color: '#fff',
  },
  regionHelper: {
    fontSize: 13,
    color: '#A6A6B9',
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
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  selectorGradient: {
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  selectorLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#7E8B9A',
    letterSpacing: 0.5,
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  selectorSubValue: {
    fontSize: 12,
    color: '#A6A6B9',
  },
  sheetContent: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sheetOptionPressable: {
    borderRadius: 16,
  },
  sheetOptionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  sheetOptionSubtitle: {
    fontSize: 12,
    color: '#A6A6B9',
  },
  sheetCurrencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sheetCurrencyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  currencySearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(12,12,20,0.45)',
  },
  currencySearchInput: {
    flex: 1,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#A6A6B9',
    fontSize: 14,
  },
  signInLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RegisterScreen;
