import React, { useCallback, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import DateChangeModal from '@/components/modals/DateChangeModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { BellFilledIcon, ListSearchIcon } from '@assets/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import type { CalendarEventMap, CalendarIndicatorsMap } from '@/types/home';
import { startOfDay, addDays, toISODateKey } from '@/utils/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNotificationsStore } from '@/stores/useNotificationsStore';

interface HeaderProps {
  scrollY?: SharedValue<number>;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  calendarIndicators: CalendarIndicatorsMap;
  calendarEvents: CalendarEventMap;
  networkStatusTone?: 'online' | 'offline' | 'muted';
}

export default function Header({
  scrollY,
  onSearchPress,
  onNotificationPress,
  selectedDate,
  onSelectDate,
  calendarIndicators,
  calendarEvents,
  networkStatusTone,
}: HeaderProps) {
  const dateSheetRef = useRef<BottomSheetHandle>(null);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const unreadCount = useNotificationsStore(
    (state) => state.notifications.filter((notification) => !notification.read).length,
  );
  const selectedIso = useMemo(() => toISODateKey(selectedDate), [selectedDate]);
  const isTodaySelected = useMemo(() => {
    const todayIso = toISODateKey(startOfDay(new Date()));
    return selectedIso === todayIso;
  }, [selectedIso]);
  const hasSnapshot = useMemo(
    () => calendarIndicators[selectedIso]?.some((status) => status !== 'muted') ?? false,
    [calendarIndicators, selectedIso],
  );
  const dateColor = hasSnapshot ? theme.colors.textPrimary : theme.colors.textSecondary;
  const primaryLabel = useMemo(() => {
    if (isTodaySelected) {
      return strings.home.header.todayLabel;
    }
    const formatted = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(selectedDate);
    return formatted.toLocaleUpperCase(locale);
  }, [isTodaySelected, locale, selectedDate, strings.home.header.todayLabel]);
  const canNavigateForward = !isTodaySelected;

  const handleConfirmDate = useCallback(
    (date: Date) => {
      onSelectDate(date);
    },
    [onSelectDate],
  );

  const handlePreviousDay = useCallback(() => {
    const nextDate = addDays(selectedDate, -1);
    onSelectDate(nextDate);
  }, [onSelectDate, selectedDate]);

  const handleNextDay = useCallback(() => {
    if (!canNavigateForward) {
      return;
    }
    const nextDate = addDays(selectedDate, 1);
    onSelectDate(nextDate);
  }, [canNavigateForward, onSelectDate, selectedDate]);

  const initials = useMemo(() => {
    const source = user?.fullName || user?.username || 'U';
    return source.slice(0, 1).toUpperCase();
  }, [user]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return {
        transform: [{ translateY: 0 }],
        opacity: 1,
      };
    }

    const progress = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = -100 * progress;
    const opacity = 1 - progress;

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const styles = createStyles(theme);
  const avatarNode = user?.profileImage ? (
    <Image source={user.profileImage} style={styles.avatarImage} contentFit="cover" />
  ) : (
    <Text style={[styles.logo, { color: theme.colors.textPrimary }]}>{initials}</Text>
  );
  const statusColor = useMemo(() => {
    if (!networkStatusTone) {
      return undefined;
    }
    switch (networkStatusTone) {
      case 'online':
        return theme.colors.success;
      case 'offline':
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  }, [networkStatusTone, theme.colors.danger, theme.colors.success, theme.colors.textSecondary]);

  return (
    <Animated.View style={[styles.header, animatedStyle]}>
      <View style={styles.ProfileLogo}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={strings.home.header.openProfile}
            onPress={() => router.navigate('/profile')}
            style={[styles.avatar, { backgroundColor: theme.colors.surfaceElevated }]}
            activeOpacity={0.8}
          >
            {avatarNode}
          </TouchableOpacity>
          {statusColor ? (
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor, borderColor: theme.colors.background },
              ]}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.dateWrapper}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={strings.home.header.previousDay}
          onPress={handlePreviousDay}
          style={[
            styles.navButton,
            {
              backgroundColor: theme.mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(15,23,42,0.08)',
            },
          ]}
          activeOpacity={0.8}
        >
          <ChevronLeft size={16} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Pressable
          onPress={() => dateSheetRef.current?.present()}
          style={[
            styles.dateCenter,
            {
              backgroundColor: theme.mode === 'dark'
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(15,23,42,0.08)',
              borderColor: `${theme.colors.border}66`,
            },
          ]}
        >
          <Text
            style={[
              styles.dateLabel,
              { color: dateColor },
            ]}
          >
            {primaryLabel}
          </Text>
        </Pressable>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={strings.home.header.nextDay}
          onPress={handleNextDay}
          disabled={!canNavigateForward}
          style={[
            styles.navButton,
            {
              backgroundColor: theme.mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(15,23,42,0.08)',
              opacity: canNavigateForward ? 1 : 0.4,
            },
          ]}
          activeOpacity={canNavigateForward ? 0.8 : 1}
        >
          <ChevronRight size={16} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        {onSearchPress ? (
          <TouchableOpacity style={styles.iconButton} onPress={onSearchPress}>
            <ListSearchIcon color={theme.colors.textSecondary} size={22} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
          <BellFilledIcon color={theme.colors.textSecondary} size={22} />
          {unreadCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: theme.colors.cardItem }]}> 
              <Text style={[styles.badgeLabel, { color: theme.colors.textPrimary }]}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <DateChangeModal
        ref={dateSheetRef}
        selectedDate={selectedDate}
        indicators={calendarIndicators}
        events={calendarEvents}
        onSelectDate={handleConfirmDate}
      />
    </Animated.View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  header: {
    height: 64,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: Platform.OS === 'ios' ? 56 : 34,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    zIndex: 100,
  },
  ProfileLogo: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  dateWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCenter: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  dateSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  logo: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 4,
    marginLeft: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
