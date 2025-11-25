import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Input, Button, AuthScreenContainer, LanguageSelectorControl } from '@/components/screens/auth';
import GlassCard from '@/components/shared/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocalization } from '@/localization/useLocalization';
import { SupportedLanguage, useSettingsStore } from '@/stores/useSettingsStore';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordScreen = () => {
  const { strings } = useLocalization();
  const forgotStrings = strings.auth.forgot;
  const validationStrings = strings.auth.validation;
  const { sendPasswordResetCode, verifyPasswordResetOtp, isLoading, error, clearError } = useAuthStore();
  const selectedLanguage = useSettingsStore((state) => state.language as SupportedLanguage);
  const setLanguagePreference = useSettingsStore((state) => state.setLanguage);

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(85);
  const [canResend, setCanResend] = useState(false);
  const hasFocusedRef = useRef(false);

  const forgotErrorMap = useMemo(
    () => ({
      'Please enter a valid email address': validationStrings.emailInvalid,
      'An error occurred. Please try again.': forgotStrings.errors.generic,
      'OTP expired or invalid': forgotStrings.errors.otpExpired,
      'OTP has expired. Please request a new one.': forgotStrings.errors.otpExpired,
      'Invalid OTP code': forgotStrings.errors.otpInvalid,
    }),
    [forgotStrings.errors, validationStrings.emailInvalid],
  );

  const localizedError = useMemo(() => {
    if (!error) return undefined;
    return forgotErrorMap[error] ?? error;
  }, [error, forgotErrorMap]);

  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        setStep('email');
        setEmail('');
        setOtp(['', '', '', '']);
        setTimer(85);
        setCanResend(false);
      }

      setEmailError(undefined);
      clearError();
      hasFocusedRef.current = true;
    }, [clearError])
  );

  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleSelectLanguage = useCallback(
    (language: SupportedLanguage) => {
      setLanguagePreference(language);
      if (error) {
        clearError();
      }
    },
    [clearError, error, setLanguagePreference],
  );

  const handleSendCode = async () => {
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(validationStrings.emailOrUsernameRequired);
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setEmailError(validationStrings.emailInvalid);
      return;
    }

    setEmailError(undefined);
    setEmail(trimmedEmail);

    const success = await sendPasswordResetCode(trimmedEmail);

    if (success) {
      setStep('otp');
      setTimer(85);
      setCanResend(false);
      Alert.alert(
        forgotStrings.alerts.codeSentTitle,
        forgotStrings.alerts.codeSentMessage,
        [{ text: 'OK' }],
      );
    } else if (error) {
      Alert.alert(forgotStrings.alerts.genericErrorTitle, localizedError ?? forgotStrings.alerts.genericErrorMessage);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleRestore = async () => {
    clearError();

    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      Alert.alert(forgotStrings.alerts.genericErrorTitle, forgotStrings.errors.otpIncomplete);
      return;
    }

    const success = await verifyPasswordResetOtp(otpCode);

    if (success) {
      Alert.alert(
        forgotStrings.alerts.otpVerifiedTitle,
        forgotStrings.alerts.otpVerifiedMessage,
        [{ text: forgotStrings.alerts.okButton, onPress: () => router.replace('/(auth)/login') }],
      );
    } else if (error) {
      Alert.alert(forgotStrings.alerts.genericErrorTitle, localizedError ?? forgotStrings.alerts.genericErrorMessage);
    }
  };

  const handleResend = async () => {
    if (canResend) {
      clearError();
      setOtp(['', '', '', '']);

      const success = await sendPasswordResetCode(email.trim());

      if (success) {
        setTimer(85);
        setCanResend(false);
        Alert.alert(forgotStrings.alerts.codeResentTitle, forgotStrings.alerts.codeResentMessage);
      } else if (error) {
        Alert.alert(forgotStrings.alerts.genericErrorTitle, localizedError ?? forgotStrings.alerts.genericErrorMessage);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGoToLogin = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/login');
  };

  return (
    <AuthScreenContainer>
      <GlassCard>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LanguageSelectorControl
            label={forgotStrings.languageSelector.label}
            helper={forgotStrings.languageSelector.helper}
            value={selectedLanguage}
            onChange={handleSelectLanguage}
            containerStyle={{ marginBottom: 16 }}
          />
          {step === 'email' ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>{forgotStrings.emailStep.title}</Text>
                <Text style={styles.description}>
                  {forgotStrings.emailStep.description}
                </Text>
              </View>

              <View style={styles.form}>
                <Input
                  label={forgotStrings.emailStep.fieldLabel}
                  placeholder={forgotStrings.emailStep.placeholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) {
                      clearError();
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={Mail}
                  iconSize={22}
                  error={emailError}
                  onClearError={() => setEmailError(undefined)}
                />

                {/* Error message */}
                {localizedError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{localizedError}</Text>
                  </View>
                )}

                <Button
                  title={
                    isLoading ? forgotStrings.emailStep.button.loading : forgotStrings.emailStep.button.submit
                  }
                  onPress={handleSendCode}
                  disabled={isLoading || !email}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>{forgotStrings.otpStep.title}</Text>
                <Text style={styles.description}>
                  {forgotStrings.otpStep.description.replace('{email}', email)}
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <LinearGradient
                      key={index}
                      colors={[
                        'rgba(49,49,58,0.2)',
                        'rgba(0,0,0,0.12)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.otpBox}
                    >
                      <TextInput
                        ref={otpRefs[index]}
                        style={styles.otpInput}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(index, value)}
                        onKeyPress={({ nativeEvent }) =>
                          handleOtpKeyPress(index, nativeEvent.key)
                        }
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    </LinearGradient>
                  ))}
                </View>

                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>
                    {forgotStrings.otpStep.timerHint.replace('{time}', formatTime(timer))}
                  </Text>
                  {canResend && (
                    <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                      <Text style={styles.resendText}>{forgotStrings.otpStep.resend}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Error message */}
                {localizedError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{localizedError}</Text>
                  </View>
                )}

                <Button
                  title={
                    isLoading ? forgotStrings.otpStep.button.loading : forgotStrings.otpStep.button.submit
                  }
                  onPress={handleRestore}
                  variant="secondary"
                  disabled={isLoading || otp.join('').length !== 4}
                />

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep('email')}
                >
                  <Text style={styles.backText}>{forgotStrings.otpStep.back}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>{forgotStrings.footer.remember} </Text>
            <TouchableOpacity onPress={handleGoToLogin}>
              <Text style={styles.signInLink}>{forgotStrings.footer.signIn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </GlassCard>
    </AuthScreenContainer>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#A6A6B9',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    color: '#A6A6B9',
    fontSize: 14,
    marginBottom: 8,
  },
  resendText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backText: {
    color: '#A6A6B9',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
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

export default ForgotPasswordScreen;
