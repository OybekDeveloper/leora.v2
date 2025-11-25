import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useLockStore } from '@/stores/useLockStore';
import { ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PasswordFormState = {
  current: string;
  next: string;
  confirm: string;
};

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
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
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
    hero: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.06)',
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    heroBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: theme.colors.success,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: theme.colors.textPrimary,
    },
    heroSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
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
    inputGroup: {
      gap: theme.spacing.xs,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    input: {
      marginVertical: 4,
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
    hint: {
      fontSize: 12,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    buttonPrimary: {
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    buttonPrimaryText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
    helperText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.danger,
      fontWeight: '600',
    },
    footerHint: {
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing.xs,
    },
    linkText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

const ChangePasswordModal: React.FC = () => {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const setPin = useLockStore((state) => state.setPin);
  const verifyPin = useLockStore((state) => state.verifyPin);
  const storedPin = useLockStore((state) => state.pin);
  const setLockEnabled = useLockStore((state) => state.setLockEnabled);
  const [form, setForm] = useState<PasswordFormState>({
    current: '',
    next: '',
    confirm: '',
  });

  const isCreateMode = (mode ?? (storedPin ? 'update' : 'create')) === 'create';
  const [error, setError] = useState<string | null>(null);

  const sanitizePin = (value: string) => value.replace(/\D/g, '').slice(0, 4);

  const handleClose = () => {
    router.back();
  };

  const handleForgotPin = () => {
    router.push('/(modals)/forgot-passcode');
  };

  const handleChange =
    (field: keyof PasswordFormState) => (value: string) => {
      const normalized = sanitizePin(value);
      setForm((prev) => ({ ...prev, [field]: normalized }));
      setError(null);
    };

  const handleSubmit = () => {
    if (!isCreateMode && !verifyPin(form.current)) {
      setError('Current PIN is incorrect.');
      return;
    }

    setPin(form.next);
    setLockEnabled(true);
    router.back();
  };

  const currentValid = isCreateMode || form.current.length === 4;
  const submitEnabled =
    currentValid && form.next.length === 4 && form.next === form.confirm;
  const mismatch = form.confirm.length === 4 && form.next !== form.confirm;

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
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>
              {isCreateMode ? 'Create PIN' : 'Change PIN'}
            </Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <ShieldCheck size={18} color={theme.colors.success} />
              <Text style={styles.heroBadgeText}>
                {isCreateMode ? 'Secure your space' : 'Update PIN'}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {isCreateMode ? 'Create your 4-digit PIN' : 'Change your 4-digit PIN'}
            </Text>
            <Text style={styles.heroSubtitle}>
              We use this PIN to unlock LEORA on this device. Keep it private and
              avoid simple sequences.
            </Text>
          </View>

          <View style={styles.card}>
            {!isCreateMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current PIN</Text>
                <AdaptiveGlassView
                  style={styles.input}
                >
                  <TextInput
                    value={form.current}
                    onChangeText={handleChange('current')}
                    secureTextEntry
                    style={styles.inputIn }
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </AdaptiveGlassView>
                <View style={styles.linkRow}>
                  <Pressable onPress={handleForgotPin} hitSlop={8}>
                    <Text style={styles.linkText}>Forgot PIN?</Text>
                  </Pressable>
                </View>
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {isCreateMode ? 'Create PIN' : 'New PIN'}
              </Text>
              <AdaptiveGlassView
                style={styles.input}>
                <TextInput
                  value={form.next}
                  onChangeText={handleChange('next')}
                  secureTextEntry
                  style={styles.inputIn} 
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </AdaptiveGlassView>
              <Text style={styles.hint}>
                PIN must contain exactly 4 digits. Avoid repeating the same digit.
              </Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm PIN</Text>
              <AdaptiveGlassView
                style={styles.input}
              >
                <TextInput
                  value={form.confirm}
                  style={styles.inputIn}
                  onChangeText={handleChange('confirm')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </AdaptiveGlassView>
              {mismatch && (
                <Text style={styles.errorText}>PINs do not match.</Text>
              )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Text style={styles.helperText}>
              This PIN protects quick access to LEORA. When it’s updated, your
              other devices will require the new PIN on next launch.
            </Text>
            <Pressable
              onPress={handleSubmit}
              disabled={!submitEnabled}
              style={[
                styles.buttonPrimary,
                {
                  backgroundColor: submitEnabled
                    ? theme.colors.primary
                    : 'rgba(148,163,184,0.35)',
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonPrimaryText,
                  {
                    color: submitEnabled
                      ? theme.colors.onPrimary
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {isCreateMode ? 'Create PIN' : 'Save new PIN'}
              </Text>
            </Pressable>
          </View>
          <View>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.sectionLabel}>Tips</Text>
                <Text style={styles.helperText}>
                  • Use a sequence only you know. Avoid birthdays or obvious patterns.{'\n'}
                  • Change your PIN if you suspect anyone else saw it.
                </Text>
              </View>
            </View>
            <Text style={styles.footerHint}>
              Lost access? Choose “Forgot passcode” on the lock screen to reset
              securely.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordModal;
