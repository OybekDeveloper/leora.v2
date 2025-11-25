import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useAuthStore } from '@/stores/useAuthStore';

interface MoreHeaderProps {
  title?: string;
}

export default function MoreHeader({ title }: MoreHeaderProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const headerStrings = strings.more.header;
  const resolvedTitle = title ?? headerStrings.title;
  const user = useAuthStore((state) => state.user);

  const initials = useMemo(() => {
    const source = user?.fullName || user?.username || 'U';
    return source.slice(0, 2).toUpperCase();
  }, [user]);

  const avatarNode = user?.profileImage ? (
    <Image source={user.profileImage} style={styles.avatarImage} />
  ) : (
    <Text style={[styles.avatarInitials, { color: theme.colors.textPrimary }]}>{initials}</Text>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={headerStrings.profileAction}
        style={[styles.iconButton, { backgroundColor: theme.colors.surfaceElevated }]}
        onPress={() => router.navigate('/profile')}
      >
        {avatarNode}
      </Pressable>
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{resolvedTitle}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={headerStrings.notificationsAction}
        style={styles.iconButton}
        onPress={() => router.navigate('/(modals)/notifications')}
      >
        <Ionicons name="notifications-outline" size={24} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
});
