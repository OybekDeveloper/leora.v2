import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DollorEuroIcon, SearchDocIcon } from '@assets/icons';
import { Theme, useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { useFinanceDateStore } from '@/stores/useFinanceDateStore';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useShallow } from 'zustand/react/shallow';
import DateChangeModal from '@/components/modals/DateChangeModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { addDays, startOfDay, startOfMonth, startOfWeek, toISODateKey } from '@/utils/calendar';
import type { CalendarEventMap, CalendarEventType, CalendarIndicatorsMap, CalendarProgressMap, HomeDataStatus, ProgressData } from '@/types/home';

interface FinanceHeaderProps {
  onSearchPress?: () => void;
  onCurrencyPress?: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      height: 64,
      backgroundColor: theme.colors.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerActionsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      zIndex: 1,
    },
    headerActionsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 1,
    },
    headerButton: {
      padding: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerTitleContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'none',
    },
    headerTitleText: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      letterSpacing: 2,
    },
    dateLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
  });

const FinanceHeader: React.FC<FinanceHeaderProps> = ({
  onSearchPress,
  onCurrencyPress,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const iconColor = theme.colors.textMuted;
  const { strings, locale } = useLocalization();
  const headerTitle = strings.tabs.finance;
  const calendarSheetRef = useRef<BottomSheetHandle>(null);

  const { selectedDate, setSelectedDate } = useFinanceDateStore();

  const financeData = useFinanceDomainStore(
    useShallow((state) => ({
      transactions: state.transactions,
      budgets: state.budgets,
      debts: state.debts,
    })),
  );

  // Formatlangan sana
  const formattedDate = useMemo(() => {
    if (!selectedDate) {
      return 'All';
    }
    const todayIso = toISODateKey(startOfDay(new Date()));
    const selectedIso = toISODateKey(selectedDate);
    if (todayIso === selectedIso) {
      return strings.calendar?.todayLabel ?? strings.plannerScreens?.tasks?.todayLabel ?? 'Today';
    }
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(selectedDate);
  }, [locale, selectedDate, strings]);

  const handleOpenCalendar = useCallback(() => {
    calendarSheetRef.current?.present();
  }, []);

  const handleSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
    },
    [setSelectedDate],
  );

  // Calendar uchun eventlar va progress hisoblash
  const { calendarEvents, calendarProgress, calendarIndicators } = useMemo(() => {
    const events: CalendarEventMap = {};
    const dateKeys = new Set<string>();

    // Calendar view uchun 42 kun generatsiya qilish
    const currentDate = selectedDate ?? new Date();
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    for (let i = 0; i < 42; i++) {
      dateKeys.add(toISODateKey(addDays(calendarStart, i)));
    }

    const register = (value: string | Date | undefined | null, type: CalendarEventType) => {
      if (!value) return;
      const date = typeof value === 'string' ? new Date(value) : value;
      if (Number.isNaN(date.getTime())) return;
      const iso = toISODateKey(date);
      dateKeys.add(iso);
      if (!events[iso]) {
        events[iso] = {};
      }
      events[iso]![type] = (events[iso]![type] ?? 0) + 1;
    };

    // Transactionlarni ro'yxatdan o'tkazish
    financeData.transactions.forEach((txn) => register(txn.date, 'tasks'));

    // Budgetlarni ro'yxatdan o'tkazish
    financeData.budgets.forEach((budget) => {
      if (budget.startDate) register(budget.startDate, 'goals');
      if (budget.endDate) register(budget.endDate, 'goals');
    });

    // Debtlarni ro'yxatdan o'tkazish
    financeData.debts.forEach((debt) => {
      register(debt.startDate, 'habits');
      if (debt.dueDate) register(debt.dueDate, 'habits');
    });

    // Progress va indikatorlarni hisoblash
    const progressMap: CalendarProgressMap = {};
    const indicators: CalendarIndicatorsMap = {};

    const mapValueToStatus = (value: number): HomeDataStatus => {
      if (value >= 70) return 'success';
      if (value >= 40) return 'warning';
      if (value > 0) return 'danger';
      return 'muted';
    };

    dateKeys.forEach((key) => {
      // Har bir sana uchun transaction sonini hisoblash
      const dayTransactions = financeData.transactions.filter(
        (txn) => toISODateKey(new Date(txn.date)) === key
      );
      const transactionProgress = Math.min(100, dayTransactions.length * 20);

      // Budget progress
      const activeBudgets = financeData.budgets.filter((budget) => {
        if (!budget.startDate || !budget.endDate) return false;
        return key >= toISODateKey(new Date(budget.startDate)) &&
          key <= toISODateKey(new Date(budget.endDate));
      });
      const budgetProgress = activeBudgets.length > 0
        ? activeBudgets.reduce((sum, b) => sum + Math.min(100, 100 - (b.percentUsed ?? 0)), 0) / activeBudgets.length
        : 0;

      const dayProgress: ProgressData = {
        tasks: transactionProgress,
        budget: budgetProgress,
        focus: 0,
      };

      progressMap[key] = dayProgress;
      indicators[key] = [
        mapValueToStatus(transactionProgress),
        mapValueToStatus(budgetProgress),
        'muted',
      ];
    });

    return { calendarEvents: events, calendarProgress: progressMap, calendarIndicators: indicators };
  }, [financeData.budgets, financeData.debts, financeData.transactions, selectedDate]);

  return (
    <>
      <View style={styles.header}>
        {/* Chap tomon - Calendar va Currency */}
        <View style={styles.headerActionsLeft}>
          <TouchableOpacity style={styles.headerButton} onPress={onCurrencyPress}>
            <DollorEuroIcon color={iconColor} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleOpenCalendar}>
            <Ionicons name="calendar-outline" size={24} color={iconColor} />
            <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
              {formattedDate}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Markaz - Title (absolute position bilan markazda) */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>{headerTitle}</Text>
        </View>

        {/* O'ng tomon - Search */}
        <View style={styles.headerActionsRight}>
          <TouchableOpacity style={styles.headerButton} onPress={onSearchPress}>
            <SearchDocIcon color={iconColor} size={24} />
          </TouchableOpacity>
        </View>
      </View>
      <DateChangeModal
        ref={calendarSheetRef}
        selectedDate={selectedDate ?? new Date()}
        events={calendarEvents}
        progress={calendarProgress}
        indicators={calendarIndicators}
        onSelectDate={handleSelectDate}
      />
    </>
  );
};

export default FinanceHeader;
