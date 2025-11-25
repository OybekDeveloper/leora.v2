import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import DateChangeModal from '@/components/modals/DateChangeModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { useAppTheme } from '@/constants/theme';

type ActiveField = 'from' | 'to' | null;

const FinanceExportModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dateModalRef = useRef<BottomSheetHandle>(null);

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
      'Export queued',
      `Preparing ${format.toUpperCase()} report\n${formatLabel(dateRange.from)} → ${formatLabel(dateRange.to)}`,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Export statistics</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Date range</Text>
        <View style={styles.rangeCard}>
          <Pressable style={styles.dateRow} onPress={() => handleOpenPicker('from')}>
            <Text style={styles.rowLabel}>From</Text>
            <Text style={styles.rowValue}>{formatLabel(dateRange.from)}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.dateRow} onPress={() => handleOpenPicker('to')}>
            <Text style={styles.rowLabel}>To</Text>
            <Text style={styles.rowValue}>{formatLabel(dateRange.to)}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Format</Text>
        <Pressable style={[styles.exportButton, { backgroundColor: theme.colors.primary + '1A' }]} onPress={() => handleExport('excel')}>
          <Text style={[styles.exportLabel, { color: theme.colors.primary }]}>Export as Excel</Text>
        </Pressable>
        <Pressable style={[styles.exportButton, { backgroundColor: theme.colors.card }]} onPress={() => handleExport('pdf')}>
          <Text style={[styles.exportLabel, { color: theme.colors.textPrimary }]}>Export as PDF</Text>
        </Pressable>
      </View>

      <DateChangeModal
        ref={dateModalRef}
        selectedDate={activeField === 'from' ? dateRange.from : dateRange.to}
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
