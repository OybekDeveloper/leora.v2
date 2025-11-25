import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useInsightsContent } from '@/localization/useInsightsContent';
import { useInsightsExperienceStore } from '@/stores/useInsightsExperienceStore';
import { useLocalization } from '@/localization/useLocalization';
import type { InsightStatus } from '@/types/insights';

type HistoryCardItem = {
  id: string;
  title: string;
  summary: string;
  status: InsightStatus;
  date: string;
};

const InsightsHistoryScreen = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const { locale } = useLocalization();
  const { history } = useInsightsContent();
  const records = useInsightsExperienceStore((state) => state.history);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        title: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
        scroll: {
          flex: 1,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.lg,
        },
        sectionSubtitle: {
          fontSize: 13,
          color: theme.colors.textSecondary,
        },
        group: {
          gap: theme.spacing.sm,
        },
        groupLabel: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
        },
        card: {
          borderRadius: theme.radius.xxl,
          padding: theme.spacing.lg,
          gap: theme.spacing.xs,
          backgroundColor: theme.colors.card,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.sm,
        },
        cardTitle: {
          fontSize: 15,
          fontWeight: '600',
          color: theme.colors.textPrimary,
          flex: 1,
        },
        cardSummary: {
          fontSize: 13,
          color: theme.colors.textSecondary,
          lineHeight: 20,
        },
        statusBadge: {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.full,
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
        },
        emptyState: {
          fontSize: 14,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: theme.spacing.xxl,
        },
      }),
    [theme],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );

  const groupedHistory = useMemo(() => {
    const sorted = records
      .map<HistoryCardItem>((record) => {
        const entry = history.entries[record.id];
        return {
          id: record.id,
          title: entry?.title ?? record.id,
          summary: entry?.summary ?? history.subtitle,
          status: record.status,
          date: record.date,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const groups: { dateKey: string; items: HistoryCardItem[] }[] = [];
    sorted.forEach((item) => {
      const dateKey = item.date.split('T')[0];
      const existing = groups.find((group) => group.dateKey === dateKey);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ dateKey, items: [item] });
      }
    });
    return groups;
  }, [history.entries, history.subtitle, records]);

  const renderStatusColor = (status: InsightStatus) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'dismissed':
        return theme.colors.warning;
      case 'viewed':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{history.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionSubtitle}>{history.subtitle}</Text>
        {groupedHistory.length === 0 ? (
          <Text style={styles.emptyState}>{history.empty}</Text>
        ) : (
          groupedHistory.map((group) => (
            <View key={group.dateKey} style={styles.group}>
              <Text style={styles.groupLabel}>
                {dateFormatter.format(new Date(group.dateKey))}
              </Text>
              {group.items.map((item) => (
                <AdaptiveGlassView key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text
                      style={[
                        styles.statusBadge,
                        {
                          color: renderStatusColor(item.status),
                          borderColor: renderStatusColor(item.status),
                          borderWidth: StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      {history.statusLabel[item.status]}
                    </Text>
                  </View>
                  <Text style={styles.cardSummary}>{item.summary}</Text>
                </AdaptiveGlassView>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InsightsHistoryScreen;
