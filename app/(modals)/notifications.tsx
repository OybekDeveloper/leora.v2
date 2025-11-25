import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bell, BookOpenText, Clock, Inbox } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Theme, useAppTheme } from '@/constants/theme';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import type { AppNotification } from '@/stores/useNotificationsStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const iconByCategory = {
  task: Clock,
  news: BookOpenText,
  system: Inbox,
} as const;

const formatRelativeTime = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationsModalScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const notifications = useNotificationsStore((state) => state.notifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const [activeNewsId, setActiveNewsId] = useState<string | null>(null);

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [notifications],
  );

  const unreadCount = useMemo(
    () => sortedNotifications.filter((notification) => !notification.read).length,
    [sortedNotifications],
  );

  const activeNews = useMemo(
    () => sortedNotifications.find((notification) => notification.id === activeNewsId && notification.category === 'news'),
    [activeNewsId, sortedNotifications],
  );

  const handleClose = () => {
    router.back();
  };

  const navigateToLink = useCallback(
    (link: NonNullable<AppNotification['link']>) => {
      const target = { pathname: link.route, params: link.params };
      const executeNavigation = () => router.navigate(target as any);
      const canDismiss = router.canGoBack?.() ?? true;
      if (canDismiss) {
        router.back();
        setTimeout(executeNavigation, 50);
      } else {
        executeNavigation();
      }
    },
    [router],
  );

  const handleSelect = (notification: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.category === 'news') {
      setActiveNewsId(notification.id);
      return;
    }

    if (notification.link) {
      navigateToLink(notification.link);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Pressable onPress={handleClose} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textSecondary} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={unreadCount === 0}
        onPress={markAllAsRead}
        style={({ pressed }) => [
          styles.markAllButton,
          {
            opacity: unreadCount === 0 ? 0.4 : pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[styles.markAllLabel, { color: colors.textSecondary }]}>Mark all as read</Text>
      </Pressable>
      {activeNews && (
        <View style={[styles.newsPanel, { backgroundColor: colors.card }]}> 
          <View style={styles.newsHeader}>
            <Text style={[styles.newsTitle, { color: colors.textPrimary }]}>{activeNews.title}</Text>
            <Pressable onPress={() => setActiveNewsId(null)} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={[styles.newsBody, { color: colors.textSecondary }]}>{activeNews.newsContent}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sortedNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const IconComponent = iconByCategory[item.category] ?? Bell;
          const isUnread = !item.read;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [styles.notificationItem, pressed && { opacity: 0.6 }]}
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isUnread ? colors.cardItem : colors.card,
                    borderColor: colors.cardItem,
                  },
                ]}
              >
                <View style={styles.notificationHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.icon }]}> 
                    <IconComponent size={18} color={colors.iconText} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>{item.message}</Text>
                  </View>
                  <View style={styles.metaColumn}>
                    <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                    {isUnread && <View style={[styles.statusDot, { backgroundColor: colors.iconText }]} />}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={[styles.noResults, { color: colors.textSecondary }]}>No new notifications</Text>}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      paddingVertical: 16,
      paddingTop: Platform.OS === 'ios' ? 12 : 40,
      backgroundColor: theme.colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.cardItem,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    markAllButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.card,
    },
    markAllLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    newsPanel: {
      borderRadius: 16,
      padding: 14,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.cardItem,
    },
    newsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    newsTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    newsBody: {
      fontSize: 14,
      lineHeight: 20,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    notificationItem: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
    },
    card: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationTitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    notificationMessage: {
      fontSize: 13,
      marginTop: 2,
    },
    metaColumn: {
      alignItems: 'flex-end',
      gap: 4,
    },
    notificationTime: {
      fontSize: 12,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    noResults: {
      textAlign: 'center',
      marginTop: 32,
      fontSize: 15,
    },
  });
