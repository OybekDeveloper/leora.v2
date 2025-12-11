import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useAuthStore } from '@/stores/useAuthStore';
import type { User } from '@/types/auth.types';

type VisibilityOption = NonNullable<User['visibility']> | 'public' | 'friends' | 'private';

type EditProfileFormState = {
  fullName: string;
  email: string;
  username: string;
  phoneNumber: string;
  bio: string;
  visibility: VisibilityOption;
};

const ProfileEditModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { strings } = useLocalization();
  const profileStrings = strings.profile;
  const commonStrings = (strings as any).common ?? {};
  const closeLabel = commonStrings.close ?? 'Close';
  const styles = useMemo(() => createStyles(theme), [theme]);

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [formState, setFormState] = useState<EditProfileFormState>({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    username: user?.username ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    bio: user?.bio ?? '',
    visibility: (user?.visibility ?? 'friends') as VisibilityOption,
  });

  useEffect(() => {
    setFormState({
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      username: user?.username ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      bio: user?.bio ?? '',
      visibility: (user?.visibility ?? 'friends') as VisibilityOption,
    });
  }, [user]);

  const handleChange = useCallback((key: keyof EditProfileFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    updateUser({
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      username: formState.username.trim(),
      phoneNumber: formState.phoneNumber?.trim() || undefined,
      bio: formState.bio.trim(),
      visibility: formState.visibility as User['visibility'],
    });
    router.back();
  }, [formState, updateUser, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{profileStrings.buttons.edit}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeText}>{closeLabel}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{profileStrings.fields.fullName}</Text>
            <TextInput
              value={formState.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
              placeholder={profileStrings.fields.fullName}
              style={styles.input}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{profileStrings.fields.email}</Text>
            <TextInput
              value={formState.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder={profileStrings.fields.email}
              style={styles.input}
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{profileStrings.fields.username}</Text>
            <TextInput
              value={formState.username}
              onChangeText={(text) => handleChange('username', text)}
              placeholder={profileStrings.fields.username}
              style={styles.input}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{profileStrings.fields.phone}</Text>
            <TextInput
              value={formState.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              placeholder={profileStrings.fields.phone}
              style={styles.input}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{profileStrings.fields.bio}</Text>
            <TextInput
              value={formState.bio}
              onChangeText={(text) => handleChange('bio', text)}
              placeholder={profileStrings.fields.bio}
              style={[styles.input, styles.multilineInput]}
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonLabel}>{profileStrings.buttons.cancel}</Text>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonLabel}>{profileStrings.buttons.save}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ProfileEditModal;

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.card,
    },
    multilineInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  });
