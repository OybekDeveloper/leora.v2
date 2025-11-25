import React, { useCallback, useMemo } from 'react';
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import UniversalWidget from '@/components/widget/UniversalWidget';
import GreetingCard from '@/components/screens/home/GreetingCard';
import Header from '@/components/screens/home/Header';
import ProgressIndicators from '@/components/screens/home/ProgressIndicators';
import UniversalFAB from '@/components/UniversalFAB';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useWidgetStore } from '@/stores/widgetStore';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/constants/theme';
import { startOfDay } from '@/utils/calendar';
import { EditSquareIcon, DiagramIcon } from '@assets/icons';
import { useLocalization } from '@/localization/useLocalization';
import { useAuthStore } from '@/stores/useAuthStore';

export default function HomeScreen() {
  const scrollY = useSharedValue(0);
  const router = useRouter();
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const { status: networkStatus } = useNetworkStatus();
  const { strings, locale } = useLocalization();
  const {
    selectedDate,
    selectDate,
    progress,
    widgetData,
    loading,
    refreshing,
    calendarIndicators,
    calendarEvents,
    refresh,
  } = useHomeDashboard();

  // Subscribe to Zustand store - will automatically re-render when activeWidgets changes
  const activeWidgets = useWidgetStore((state) => state.activeWidgets);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleDateChange = useCallback(
    (date: Date) => {
      selectDate(date);
    },
    [selectDate],
  );

  const handleOpenWidgetEditor = useCallback(() => {
    router.navigate('/(modals)/menage-widget');
  }, [router]);

  const statusTone: 'online' | 'offline' | 'muted' =
    networkStatus === 'checking' ? 'muted' : networkStatus;

  const userName = user?.fullName ?? user?.username ?? undefined;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const refreshColors = useMemo(() => {
    const spinner = theme.mode === 'dark' ? theme.colors.white : theme.colors.cardItem;
    const track = theme.mode === 'dark' ? theme.colors.card : theme.colors.white;
    const label = theme.colors.textPrimary;
    return { spinner, track, label };
  }, [theme]);
  
  const dateLabel = useMemo(() => {
    const isToday = startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime();
    if (isToday) {
      return strings.home.header.todayLabel;
    }
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(selectedDate);
  }, [locale, selectedDate, strings.home.header.todayLabel]);
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header
          onNotificationPress={() => router.navigate('/(modals)/notifications')}
          scrollY={scrollY}
          onSearchPress={() => router.navigate('/(modals)/search')}
          selectedDate={selectedDate}
          onSelectDate={handleDateChange}
          calendarIndicators={calendarIndicators}
          calendarEvents={calendarEvents}
          networkStatusTone={statusTone}
        />
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
          contentContainerStyle={styles.scrollContent}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={80}
              style={{ zIndex: 1000, elevation: 1000 }}
              tintColor={refreshColors.spinner}
              titleColor={refreshColors.label}
              colors={[refreshColors.spinner]}
              progressBackgroundColor={refreshColors.track}
            />
          )}
        >
          <ProgressIndicators
            scrollY={scrollY}
            data={progress}
            isLoading={loading}
            selectedDate={selectedDate}
          />
          <GreetingCard userName={userName} date={selectedDate} />

          <View style={styles.widgetsSection}>
            <View style={styles.widgetsHeader}>
            <Text style={[styles.widgetsTitle, { color: theme.colors.textPrimary }]}>
              {strings.home.widgets.title}
            </Text>
              <TouchableOpacity
                onPress={handleOpenWidgetEditor}
                style={[
                  styles.widgetsEditButton,
                  {
                    backgroundColor: theme.mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(15,23,42,0.08)',
                  },
                ]}
                activeOpacity={0.8}
              >
                <EditSquareIcon color={theme.colors.textSecondary} size={14} />
                <Text style={[styles.widgetsEditText, { color: theme.colors.textSecondary }]}>
                  {strings.home.widgets.edit}
                </Text>
              </TouchableOpacity>
            </View>

            {activeWidgets.length === 0 ? (
              <View
                style={[
                  styles.widgetEmptyState,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                ]}
              >
                <DiagramIcon color={theme.colors.textSecondary} size={24} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                  {strings.home.widgets.emptyTitle}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                  {strings.home.widgets.emptySubtitle}
                </Text>
              </View>
            ) : (
              activeWidgets.map((widgetId) => (
                <UniversalWidget
                  key={widgetId}
                  widgetId={widgetId}
                  isLoading={loading}
                  dataState={widgetData[widgetId]}
                  dateLabel={dateLabel}
                />
              ))
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </Animated.ScrollView>
        <UniversalFAB />
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 64,
    paddingBottom: 40,
  },
  bottomSpacer: {
    height: 200,
  },
  stickyTop: {
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  widgetsSection: {

  },
  widgetsHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  widgetsEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  widgetsEditText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  widgetEmptyState: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
