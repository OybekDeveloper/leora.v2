import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowRight,
  Database,
  Download,
  FileArchive,
  HardDrive,
  History,
  Layers,
  RefreshCcw,
  Save,
  Settings,
  Trash2,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useMorePagesLocalization } from '@/localization/more/pages';

type SectionKey = 'backup' | 'export' | 'storage';

type SectionContent = {
  title: string;
  subtitle: string;
};

type IconComponent = React.ComponentType<{ color?: string; size?: number }>;

const ROW_ICONS: Record<SectionKey, IconComponent[]> = {
  backup: [Save, RefreshCcw],
  export: [Download, FileArchive, Database],
  storage: [HardDrive, Trash2, Settings],
};

const SECTION_ORDER: SectionKey[] = ['backup', 'export', 'storage'];
const BACKUP_SUMMARY_ICONS: IconComponent[] = [History, Layers];
const STORAGE_SUMMARY_ICONS: IconComponent[] = [Database, ArrowRight];

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: 32,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.xl,
    },
    filterBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    chip: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: 10,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(38,41,52,0.65)'
          : 'rgba(226,232,240,0.75)',
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
      color: theme.colors.textSecondary,
    },
    chipTextActive: {
      color: theme.colors.onPrimary,
    },
    sectionHeader: {
      marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionSubtitle: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      letterSpacing: 0.25,
    },
    sectionCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      borderRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(34,36,44,0.8)'
          : 'rgba(226,232,240,0.85)',
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      flex: 1,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(52,56,72,0.8)'
          : 'rgba(210,217,228,0.9)',
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.1,
    },
    rowSubtitle: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    actionPill: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(51,152,255,0.16)'
          : 'rgba(59,130,246,0.15)',
    },
    actionText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.4,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    summaryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    summaryKey: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
  });

const useSectionRegistry = () => {
  const scrollRef = useRef<ScrollView | null>(null);
  const mapRef = useRef<Partial<Record<SectionKey, number>>>({});
  const pending = useRef<SectionKey | null>(null);

  const scrollTo = useCallback((key: SectionKey) => {
    const y = mapRef.current[key];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(y - 96, 0), animated: true });
    }
  }, []);

  const register = useCallback(
    (key: SectionKey) => (event: { nativeEvent: { layout: { y: number } } }) => {
      mapRef.current[key] = event.nativeEvent.layout.y;
      if (pending.current === key) {
        pending.current = null;
        requestAnimationFrame(() => scrollTo(key));
      }
    },
    [scrollTo],
  );

  const schedule = useCallback(
    (key: SectionKey) => {
      pending.current = key;
      requestAnimationFrame(() => scrollTo(key));
    },
    [scrollTo],
  );

  return { scrollRef, register, schedule };
};

const DataScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: copy } = useMorePagesLocalization();
  const router = useRouter();

  const { section } = useLocalSearchParams<{ section?: string }>();
  const normalizedSection = (section?.toLowerCase() ?? 'backup') as SectionKey;
  const defaultSection: SectionKey = SECTION_ORDER.includes(normalizedSection)
    ? normalizedSection
    : 'backup';

  const [activeSection, setActiveSection] = useState<SectionKey>(defaultSection);

  const { scrollRef, register, schedule } = useSectionRegistry();

  useEffect(() => {
    if (SECTION_ORDER.includes(normalizedSection)) {
      setActiveSection(normalizedSection);
      schedule(normalizedSection);
    }
  }, [normalizedSection, schedule]);

  const handleFilterPress = useCallback(
    (target: SectionKey) => {
      setActiveSection(target);
      schedule(target);
      router.setParams({ section: target });
    },
    [router, schedule],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.filterBar}>
          {SECTION_ORDER.map((key) => {
            const active = key === activeSection;
            return (
              <Pressable key={key} onPress={() => handleFilterPress(key)}>
                <AdaptiveGlassView style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {copy.sections[key].title}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            );
          })}
        </View>

        {SECTION_ORDER.map((key) => (
          <View key={key} onLayout={register(key)} style={{ gap: theme.spacing.sm }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{copy.sections[key].title}</Text>
              <Text style={styles.sectionSubtitle}>{copy.sections[key].subtitle}</Text>
            </View>
            <AdaptiveGlassView style={styles.sectionCard}>
              {copy.rows[key].map((row, index) => {
                const Icon = ROW_ICONS[key][index] ?? ROW_ICONS[key][0];
                return (
                  <AdaptiveGlassView key={row.title} style={styles.rowCard}>
                    <View style={styles.rowLeft}>
                      <AdaptiveGlassView style={styles.iconWrap}>
                        <Icon size={18} color={theme.colors.iconText} />
                      </AdaptiveGlassView>
                      <View>
                        <Text style={styles.rowTitle}>{row.title}</Text>
                        <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
                      </View>
                    </View>
                    <AdaptiveGlassView style={styles.actionPill}>
                      <Text style={styles.actionText}>{row.action}</Text>
                    </AdaptiveGlassView>
                  </AdaptiveGlassView>
                );
              })}

              {key === 'backup'
                ? copy.summary.backup.map((item, idx) => {
                    const Icon = BACKUP_SUMMARY_ICONS[idx] ?? History;
                    return (
                      <View key={item.label} style={styles.summaryRow}>
                        <View style={styles.summaryLeft}>
                          <Icon size={14} color={theme.colors.textMuted} />
                          <Text style={styles.summaryKey}>{item.label}</Text>
                        </View>
                        <Text style={styles.summaryValue}>{item.value}</Text>
                      </View>
                    );
                  })
                : null}
              {key === 'storage'
                ? copy.summary.storage.map((item, idx) => {
                    const Icon = STORAGE_SUMMARY_ICONS[idx] ?? Database;
                    return (
                      <View key={item.label} style={styles.summaryRow}>
                        <View style={styles.summaryLeft}>
                          <Icon size={14} color={theme.colors.textMuted} />
                          <Text style={styles.summaryKey}>{item.label}</Text>
                        </View>
                        <Text style={styles.summaryValue}>{item.value}</Text>
                      </View>
                    );
                  })
                : null}
            </AdaptiveGlassView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DataScreen;
