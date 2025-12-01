import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/shallow';

import DateChangeModal from '@/components/modals/DateChangeModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { addDays, startOfMonth, startOfWeek, toISODateKey } from '@/utils/calendar';
import type { CalendarEventMap, CalendarIndicatorsMap, CalendarProgressMap, HomeDataStatus, ProgressData } from '@/types/home';

type ActiveField = 'from' | 'to' | null;

const FinanceExportModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const { strings } = useLocalization();
  const exportStrings = strings.modals.financeExport;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dateModalRef = useRef<BottomSheetHandle>(null);

  const transactions = useFinanceDomainStore(useShallow((state) => state.transactions));

  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start, to: now };
  });

  const formatLabel = (date: Date) =>
    date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const handleOpenPicker = (field: ActiveField) => {
    setActiveField(field);
    dateModalRef.current?.present();
  };

  const handleSelectDate = (nextDate: Date) => {
    if (!nextDate || Number.isNaN(nextDate.getTime())) {
      return;
    }
    setDateRange((prev) => {
      if (activeField === 'from') {
        return { ...prev, from: nextDate };
      }
      if (activeField === 'to') {
        return { ...prev, to: nextDate };
      }
      return prev;
    });
    setActiveField(null);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    Alert.alert(
      exportStrings.exportQueued,
      exportStrings.preparingReport
        .replace('{format}', format.toUpperCase())
        .replace('{from}', formatLabel(dateRange.from))
        .replace('{to}', formatLabel(dateRange.to)),
    );
  };

  const currentPickerDate = activeField === 'from' ? dateRange.from : dateRange.to;

  const { calendarEvents, calendarProgress, calendarIndicators } = useMemo(() => {
    const events: CalendarEventMap = {};
    const dateKeys = new Set<string>();

    // Generate all 42 days for calendar view
    const monthStart = startOfMonth(currentPickerDate);
    const calendarStart = startOfWeek(monthStart);
    for (let i = 0; i < 42; i++) {
      dateKeys.add(toISODateKey(addDays(calendarStart, i)));
    }

    // Add transaction dates
    transactions.forEach((txn) => {
      if (!txn.date) return;
      const date = new Date(txn.date);
      if (Number.isNaN(date.getTime())) return;
      const iso = toISODateKey(date);
      dateKeys.add(iso);
      if (!events[iso]) {
        events[iso] = {};
      }
      events[iso]!.finance = (events[iso]!.finance ?? 0) + 1;
    });

    // Compute progress - for finance, show transaction activity
    const progressMap: CalendarProgressMap = {};
    const indicators: CalendarIndicatorsMap = {};

    const mapValueToStatus = (value: number): HomeDataStatus => {
      if (value >= 70) return 'success';
      if (value >= 40) return 'warning';
      if (value > 0) return 'danger';
      return 'muted';
    };

    dateKeys.forEach((key) => {
      const dayTransactions = transactions.filter((txn) => {
        if (!txn.date) return false;
        return toISODateKey(new Date(txn.date)) === key;
      });

      // For finance: show activity level (has transactions = some progress)
      const hasActivity = dayTransactions.length > 0;
      const activityScore = hasActivity ? Math.min(100, dayTransactions.length * 25) : 0;

      const dayProgress: ProgressData = {
        tasks: 0,
        budget: activityScore,
        focus: 0,
      };

      progressMap[key] = dayProgress;
      indicators[key] = [
        'muted', // tasks
        mapValueToStatus(activityScore), // budget/finance
        'muted', // habits
      ];
    });

    return { calendarEvents: events, calendarProgress: progressMap, calendarIndicators: indicators };
  }, [currentPickerDate, transactions]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{exportStrings.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>{exportStrings.dateRange}</Text>
        <View style={styles.rangeCard}>
          <Pressable style={styles.dateRow} onPress={() => handleOpenPicker('from')}>
            <Text style={styles.rowLabel}>{exportStrings.from}</Text>
            <Text style={styles.rowValue}>{formatLabel(dateRange.from)}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.dateRow} onPress={() => handleOpenPicker('to')}>
            <Text style={styles.rowLabel}>{exportStrings.to}</Text>
            <Text style={styles.rowValue}>{formatLabel(dateRange.to)}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{exportStrings.format}</Text>
        <Pressable style={[styles.exportButton, { backgroundColor: theme.colors.primary + '1A' }]} onPress={() => handleExport('excel')}>
          <Text style={[styles.exportLabel, { color: theme.colors.primary }]}>{exportStrings.exportExcel}</Text>
        </Pressable>
        <Pressable style={[styles.exportButton, { backgroundColor: theme.colors.card }]} onPress={() => handleExport('pdf')}>
          <Text style={[styles.exportLabel, { color: theme.colors.textPrimary }]}>{exportStrings.exportPdf}</Text>
        </Pressable>
      </View>

      <DateChangeModal
        ref={dateModalRef}
        selectedDate={currentPickerDate}
        events={calendarEvents}
        progress={calendarProgress}
        indicators={calendarIndicators}
        onSelectDate={handleSelectDate}
      />
    </SafeAreaView>
  );
};

export default FinanceExportModal;

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      letterSpacing: 0.5,
    },
    rangeCard: {
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    dateRow: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    rowValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginHorizontal: 18,
    },
    exportButton: {
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    exportLabel: {
      fontSize: 15,
      fontWeight: '600',
    },
  });
