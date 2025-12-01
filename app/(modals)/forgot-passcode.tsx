import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';

type RecoveryStep = 'contact' | 'code';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.xl,
    },
    header: {
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      alignItems: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    closeButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.08)',
    },
    closeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    card: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.xl,
      gap: theme.spacing.lg,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.10)'
          : 'rgba(15,23,42,0.05)',
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
   input: {
      marginVertical: 6,
      borderRadius: theme.radius.md,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
    },
    inputIn:{
      padding: theme.spacing.lg,
      color: theme.colors.textPrimary,
    },
    helper: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    buttonPrimary: {
      flex: 1,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    buttonPrimaryText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
    buttonGhost: {
      flex: 1,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.08)',
    },
    buttonGhostText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
  });

const ForgotPasscodeModal: React.FC = () => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const forgotStrings = strings.modals.forgotPasscode;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const [step, setStep] = useState<RecoveryStep>('contact');
  const [contactValue, setContactValue] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const contactValid = contactValue.trim().length >= 4;
  const codeValid = codeValue.trim().length >= 4;

  const handleClose = () => {
    router.back();
  };

  const handleSendCode = () => {
    if (!contactValid) return;
    setStatus(
      forgotStrings.codeSentMessage.replace('{contact}', contactValue.trim()),
    );
    setStep('code');
  };

  const handleVerify = () => {
    if (!codeValid) return;
    router.push({
      pathname: '/(modals)/change-password',
      params: { source: 'lock', mode: 'create' },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{forgotStrings.title}</Text>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>{forgotStrings.close}</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              {forgotStrings.subtitle}
            </Text>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.sectionLabel}>{forgotStrings.contact}</Text>
              <AdaptiveGlassView
                style={styles.input}
              >
                <TextInput
                  value={contactValue}
                  style={styles.inputIn}
                  onChangeText={setContactValue}
                  placeholder={forgotStrings.emailOrPhone}
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={step === 'contact'}
                />
              </AdaptiveGlassView>
              <Text style={styles.helper}>
                {forgotStrings.contactHelper}
              </Text>
            </View>

            {step === 'code' && (
              <View>
                <Text style={styles.sectionLabel}>{forgotStrings.verificationCode}</Text>
                <AdaptiveGlassView style={styles.input}>
                  <TextInput
                    value={codeValue}
                    onChangeText={setCodeValue}
                    style={styles.inputIn}
                    placeholder={forgotStrings.enterCode}
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </AdaptiveGlassView>
                <Text style={styles.helper}>
                  {status ?? forgotStrings.codeHelper}
                </Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable style={styles.buttonGhost} onPress={handleClose}>
                <Text style={styles.buttonGhostText}>{forgotStrings.cancel}</Text>
              </Pressable>
              {step === 'contact' ? (
                <Pressable
                  style={[
                    styles.buttonPrimary,
                    {
                      backgroundColor: contactValid
                        ? theme.colors.primary
                        : 'rgba(148,163,184,0.35)',
                    },
                  ]}
                  disabled={!contactValid}
                  onPress={handleSendCode}
                >
                  <Text
                    style={[
                      styles.buttonPrimaryText,
                      {
                        color: contactValid
                          ? theme.colors.onPrimary
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {forgotStrings.sendCode}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[
                    styles.buttonPrimary,
                    {
                      backgroundColor: codeValid
                        ? theme.colors.primary
                        : 'rgba(148,163,184,0.35)',
                    },
                  ]}
                  disabled={!codeValid}
                  onPress={handleVerify}
                >
                  <Text
                    style={[
                      styles.buttonPrimaryText,
                      {
                        color: codeValid
                          ? theme.colors.onPrimary
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {forgotStrings.verify}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasscodeModal;
