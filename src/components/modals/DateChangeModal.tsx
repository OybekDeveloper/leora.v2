import React, {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import type { CalendarIndicatorsMap, CalendarEventMap, CalendarEventType, HomeDataStatus } from '@/types/home';
import {
  addDays,
  addMonths,
  buildCalendarDays,
  startOfDay,
  startOfWeek,
  startOfMonth,
  toISODateKey,
  useCalendarWeeks,
} from '@/utils/calendar';

type PickerMode = 'days' | 'months' | 'years';

interface DateModalProps {
  selectedDate?: Date;
  indicators?: CalendarIndicatorsMap;
  events?: CalendarEventMap;
  onDismiss?: () => void;
  onSelectDate?: (date: Date) => void;
}

const YEARS_PER_VIEW = 12;

function clampDay(date: Date, targetMonth: Date): Date {
  const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(date.getDate(), daysInMonth);
  return startOfDay(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), safeDay));
}

function DateChangeModalComponent(
  { selectedDate, indicators, events, onDismiss, onSelectDate }: DateModalProps,
  ref: ForwardedRef<BottomSheetHandle>
) {
  const theme = useAppTheme();
  const { strings, locale } = useLocalization();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const indicatorSource = useMemo(() => indicators ?? {}, [indicators]);
  const eventSource = useMemo(() => events ?? {}, [events]);
  const [visible, setVisible] = useState(false);
  const today = useMemo(() => startOfDay(new Date()), []);
  const sanitizedSelected = useMemo(
    () => startOfDay(selectedDate ?? new Date()),
    [selectedDate],
  );
  const [pickerMode, setPickerMode] = useState<PickerMode>('days');
  const [pendingDate, setPendingDate] = useState<Date>(() => sanitizedSelected);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(sanitizedSelected));
  const [yearGridStart, setYearGridStart] = useState<number>(() => {
    const year = sanitizedSelected.getFullYear();
    return year - (year % YEARS_PER_VIEW);
  });
  const sheetHeight = useMemo(() => Math.round(height * 0.58), [height]);
  const translateY = React.useRef(new Animated.Value(-sheetHeight)).current;

  useEffect(() => {
    if (!visible) {
      translateY.setValue(-sheetHeight);
    }
  }, [sheetHeight, translateY, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    translateY.stopAnimation();
    translateY.setValue(-sheetHeight);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sheetHeight, translateY, visible]);

  const dismiss = useCallback(() => {
    if (!visible) {
      return;
    }
    translateY.stopAnimation();
    Animated.timing(translateY, {
      toValue: -sheetHeight,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setVisible(false);
        onDismiss?.();
      }
    });
  }, [onDismiss, sheetHeight, translateY, visible]);

  const present = useCallback(() => {
    if (visible) {
      return;
    }
    const normalized = startOfDay(selectedDate ?? new Date());
    setPendingDate(normalized);
    const baseMonth = startOfMonth(normalized);
    setVisibleMonth(baseMonth);
    setPickerMode('days');
    const baseYear = normalized.getFullYear();
    setYearGridStart(baseYear - (baseYear % YEARS_PER_VIEW));
    setVisible(true);
  }, [selectedDate, visible]);

  useImperativeHandle(
    ref,
    () => ({
      present,
      dismiss,
    }),
    [dismiss, present],
  );

  const handleClose = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth, pendingDate, today),
    [pendingDate, today, visibleMonth],
  );
  const weeks = useCalendarWeeks(calendarDays);

  const monthName = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(visibleMonth),
    [locale, visibleMonth],
  );
  const yearNumber = useMemo(() => visibleMonth.getFullYear(), [visibleMonth]);
  const pendingIso = useMemo(() => toISODateKey(pendingDate), [pendingDate]);
  const weekLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }).map((_, idx) => formatter.format(addDays(start, idx)));
  }, [locale]);

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    return Array.from({ length: 12 }).map((_, idx) => formatter.format(new Date(2000, idx, 1)));
  }, [locale]);

  const statusColors: Record<HomeDataStatus, string> = useMemo(
    () => ({
      success: theme.colors.success,
      warning: theme.colors.warning,
      danger: theme.colors.danger,
      muted: theme.colors.border,
    }),
    [theme.colors.border, theme.colors.danger, theme.colors.success, theme.colors.warning],
  );
  const eventColors: Record<CalendarEventType, string> = useMemo(
    () => ({
      tasks: theme.colors.primary,
      habits: theme.colors.success,
      goals: theme.colors.warning,
      finance: theme.colors.info ?? theme.colors.textSecondary,
    }),
    [theme.colors.info, theme.colors.primary, theme.colors.success, theme.colors.textSecondary, theme.colors.warning],
  );

  const handleDayPress = useCallback(
    (day: Date) => {
      const normalized = startOfDay(day);
      setPendingDate(normalized);
      onSelectDate?.(new Date(normalized));
      dismiss();
    },
    [dismiss, onSelectDate],
  );

  const handleModeToggle = useCallback((mode: PickerMode) => {
    setPickerMode((current) => (current === mode ? 'days' : mode));
  }, []);

  const handleMonthChange = useCallback(
    (direction: 'prev' | 'next') => {
      if (pickerMode === 'years') {
        setYearGridStart((prev) => prev + (direction === 'prev' ? -YEARS_PER_VIEW : YEARS_PER_VIEW));
        return;
      }
      if (pickerMode === 'months') {
        setVisibleMonth((prev) => new Date(prev.getFullYear() + (direction === 'prev' ? -1 : 1), prev.getMonth(), 1));
        return;
      }
      setVisibleMonth((prev) => addMonths(prev, direction === 'prev' ? -1 : 1));
    },
    [pickerMode],
  );

  const renderDots = useCallback(
    (isoKey: string, isDimmed: boolean) => {
      const dayEvents = eventSource[isoKey];
      if (dayEvents) {
        const entries = Object.entries(dayEvents).filter(([, count]) => (count ?? 0) > 0);
        if (entries.length) {
          return (
            <View style={[styles.dotRow, isDimmed && { opacity: 0.4 }]}>
              {entries.slice(0, 4).map(([type]) => {
                const color = eventColors[type as CalendarEventType] ?? theme.colors.textSecondary;
                return (
                  <View
                    key={`${isoKey}-event-${type}`}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: color,
                        borderColor: color,
                      },
                    ]}
                  />
                );
              })}
            </View>
          );
        }
      }
      const statuses = indicatorSource[isoKey] ?? [];
      return (
        <View style={[styles.dotRow, isDimmed && { opacity: 0.4 }]}>
          {Array.from({ length: 3 }).map((_, idx) => {
            const status = statuses[idx] ?? 'muted';
            const color = statusColors[status];
            const hasFill = status !== 'muted';
            return (
              <View
                key={`${isoKey}-dot-${idx}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor: hasFill ? color : 'transparent',
                    borderColor: hasFill ? color : theme.colors.border,
                  },
                ]}
              />
            );
          })}
        </View>
      );
    },
    [eventColors, eventSource, indicatorSource, statusColors, theme.colors.border],
  );

  const renderMonthGrid = () => (
    <View style={styles.monthGrid}>
      {monthLabels.map((label, idx) => {
        const candidate = new Date(yearNumber, idx, 1);
        const isCurrentMonth = candidate.getMonth() === visibleMonth.getMonth() && candidate.getFullYear() === visibleMonth.getFullYear();
        const isSelectedMonth =
          pendingDate.getFullYear() === candidate.getFullYear() &&
          pendingDate.getMonth() === candidate.getMonth();
        return (
          <Pressable
            key={label}
            style={({ pressed }) => [
              styles.monthCell,
              pressed && styles.cellPressed,
            ]}
            onPress={() => {
              const nextMonth = clampDay(pendingDate, candidate);
              setVisibleMonth(startOfMonth(candidate));
              setPendingDate(nextMonth);
              setPickerMode('days');
            }}
          >
            <Text
              style={[
                styles.monthLabel,
                {
                  color: isSelectedMonth
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                  fontWeight: isCurrentMonth ? '700' : '500',
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderYearGrid = () => (
    <View style={styles.yearGrid}>
      {Array.from({ length: YEARS_PER_VIEW }).map((_, idx) => {
        const year = yearGridStart + idx;
        const isCurrentYear = year === today.getFullYear();
        const isSelectedYear = year === pendingDate.getFullYear();
        return (
          <Pressable
            key={year}
            style={({ pressed }) => [
              styles.yearCell,
              pressed && styles.cellPressed,
            ]}
            onPress={() => {
              const nextMonth = clampDay(pendingDate, new Date(year, visibleMonth.getMonth(), 1));
              setVisibleMonth((prev) => startOfMonth(new Date(year, prev.getMonth(), 1)));
              setPendingDate(nextMonth);
              setPickerMode('days');
            }}
          >
            <Text
              style={[
                styles.yearLabel,
                {
                  color: isSelectedYear
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                  fontWeight: isCurrentYear ? '700' : '500',
                },
              ]}
            >
              {year}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.backdrop }]}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              minHeight: sheetHeight,
              backgroundColor: theme.colors.background,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.sheetContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{strings.calendar?.selectDateTitle ?? 'Select Date'}</Text>
              <Pressable onPress={handleClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.calendarHeader}>
              <Pressable
                style={({ pressed }) => [
                  styles.navButton,
                  pressed && styles.navButtonPressed,
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => handleMonthChange('prev')}
              >
                <ChevronLeft size={18} color={theme.colors.textSecondary} />
              </Pressable>

              <View style={styles.calendarTitles}>
                <Pressable
                  style={({ pressed }) => [
                    styles.monthButton,
                    {
                      backgroundColor:theme.colors.background
                    },
                    pressed && styles.calendarButtonPressed,
                  ]}
                  onPress={() => handleModeToggle('months')}
                >
                  <Text style={[styles.yearTitle, { color: theme.colors.textPrimary }]}>
                    {monthName}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.yearButton,
                    {
                      backgroundColor:theme.colors.background
                    },
                    pressed && styles.calendarButtonPressed,
                  ]}
                  onPress={() => {
                    setYearGridStart(yearNumber - (yearNumber % YEARS_PER_VIEW));
                    handleModeToggle('years');
                  }}
                >
                  <Text style={[styles.yearTitle, { color: theme.colors.textSecondary }]}>
                    {yearNumber}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.navButton,
                  pressed && styles.navButtonPressed,
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => handleMonthChange('next')}
              >
                <ChevronRight size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {pickerMode === 'days' && (
              <>
                <View style={styles.weekRow}>
                  {weekLabels.map((label) => (
                    <Text key={label} style={[styles.weekLabel, { color: theme.colors.textTertiary }]}>
                      {label}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {weeks.map((week) => (
                    <View key={week[0]?.key ?? Math.random()} style={styles.weekRow}>
                      {week.map((day) => {
                        const isoKey = toISODateKey(day.date);
                        const isSelected = pendingIso === isoKey;
                        const isToday = toISODateKey(today) === isoKey;
                        const isDimmed = !day.isCurrentMonth;
                        const baseColor = isSelected ? theme.colors.textSecondary : theme.colors.border;
                        const textColor = isSelected
                          ? theme.colors.textPrimary
                          : isDimmed
                            ? theme.colors.textTertiary
                            : theme.colors.textSecondary;

                        return (
                          <View key={day.key} style={styles.dayCell}>
                            <Pressable
                              onPress={() => handleDayPress(day.date)}
                              style={({ pressed }) => [
                                styles.dayCircle,
                                {
                                  borderColor: isSelected ? baseColor : 'transparent',
                                  backgroundColor: isSelected ? `${baseColor}1A` : 'transparent',
                                },
                                isToday && !isSelected && { borderColor: theme.colors.border },
                                pressed && styles.dayPressed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayLabel,
                                  {
                                    color: textColor,
                                    fontWeight: isSelected ? '700' : '500',
                                  },
                                ]}
                              >
                                {parseInt(day.label, 10)}
                              </Text>
                            </Pressable>
                            {renderDots(isoKey, isDimmed || day.isFuture)}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </>
            )}

            {pickerMode === 'months' && renderMonthGrid()}
            {pickerMode === 'years' && renderYearGrid()}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    opacity: 0.75,
  },
  calendarTitles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'transparent',
    marginRight: 10,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  yearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  yearTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarButtonPressed: {
    opacity: 0.8,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  calendarGrid: {
    marginTop: 12,
    gap: 6,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayLabel: {
    fontSize: 15,
  },
  dayPressed: {
    opacity: 0.8,
  },
  dotRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '33.33%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  cellPressed: {
    opacity: 0.75,
  },
  monthLabel: {
    fontSize: 15,
  },
  yearGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  yearCell: {
    width: '33.33%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  yearLabel: {
    fontSize: 16,
  },
});

export default React.forwardRef<BottomSheetHandle, DateModalProps>(DateChangeModalComponent);
