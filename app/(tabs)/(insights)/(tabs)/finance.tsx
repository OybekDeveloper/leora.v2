import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarRange,
  Check,
  ChefHat,
  Clock,
  Coffee,
  CreditCard,
  Play,
  PiggyBank,
  Route,
  Target,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import type { Theme } from '@/constants/theme';
import { useAppTheme } from '@/constants/theme';
import { DayPartKey, IndicatorKey, SavingKey, WeeklyDayKey } from '@/localization/insightsContent';
import { useInsightsContent } from '@/localization/useInsightsContent';
import useInsightsDataHook from '@/hooks/useInsightsData';

type Indicator = {
  key: IndicatorKey;
  label: string;
  metric: string;
  status: string;
  score: number;
  Icon: LucideIcon;
};

type WeeklyPattern = {
  key: WeeklyDayKey;
  label: string;
  percent: number;
  note: string;
};

type DayPartPattern = {
  key: DayPartKey;
  label: string;
  range: string;
  percent: number;
  note: string;
};

type Anomaly = {
  key: string;
  title: string;
  summary: string;
  recommendation: string;
  meta: string;
};

type SavingEntry = {
  key: SavingKey;
  title: string;
  impact: string;
  detail: string;
  alternative: string;
  bullets: string[];
  actions: {
    key: string;
    label: string;
    Icon: LucideIcon;
  }[];
};

const INDICATOR_META: { key: IndicatorKey; Icon: LucideIcon }[] = [
  { key: 'liquidity', Icon: Wallet },
  { key: 'savings', Icon: PiggyBank },
  { key: 'debt', Icon: CreditCard },
  { key: 'capital', Icon: TrendingUp },
  { key: 'goals', Icon: Target },
];

const WEEKLY_KEYS: WeeklyDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const WEEKLY_PERCENTS: Record<WeeklyDayKey, number> = {
  mon: 0.12,
  tue: 0.11,
  wed: 0.15,
  thu: 0.1,
  fri: 0.22,
  sat: 0.25,
  sun: 0.05,
};

const DAY_PART_KEYS: DayPartKey[] = ['morning', 'day', 'evening', 'night'];
const DAY_PART_PERCENTS: Record<DayPartKey, number> = {
  morning: 0.15,
  day: 0.35,
  evening: 0.4,
  night: 0.1,
};

type FinanceAnomalyKey = 'food' | 'night';
const ANOMALY_KEYS: FinanceAnomalyKey[] = ['food', 'night'];

const SAVING_KEYS: SavingKey[] = ['subscriptions', 'food', 'transport', 'coffee'];
const SAVING_ACTION_ICONS: Record<SavingKey, Partial<Record<string, LucideIcon>>> = {
  subscriptions: { cancel: Ban, select: Check },
  food: { meal: UtensilsCrossed, recipes: ChefHat },
  transport: { routes: Route, pass: CreditCard },
  coffee: { recipes: ChefHat, equipment: Coffee },
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl+32,
      gap: theme.spacing.xxl,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    scoreLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    scoreValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: 0.2,
    },
    scoreBarTrack: {
      marginTop: theme.spacing.sm,
      height: 18,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.18)'
          : 'rgba(15,23,42,0.12)',
      overflow: 'hidden',
    },
    scoreBarFill: {
      height: '100%',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.success,
    },
    indicatorBlock: {
      borderRadius: theme.radius.lg,
      backgroundColor:theme.colors.card,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    indicatorRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    indicatorRowFirst: {
      borderTopWidth: 0,
    },
    indicatorIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.08)'
          : 'rgba(15,23,42,0.08)',
    },
    indicatorContent: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    indicatorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    indicatorTitle: {
      flexShrink: 0,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    indicatorBar: {
      flex: 1,
      height: 12,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.14)'
          : 'rgba(15,23,42,0.08)',
      overflow: 'hidden',
    },
    indicatorBarFill: {
      height: '100%',
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(226,232,240,0.38)'
          : 'rgba(71,85,105,0.32)',
    },
    indicatorFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    indicatorMetric: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    indicatorStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    indicatorStatusText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    alertBlock: {
      gap: theme.spacing.sm,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    alertTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.warning,
    },
    bulletList: {
      gap: theme.spacing.xs,
      marginLeft: theme.spacing.xl,
    },
    bulletText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    patternSection: {
      gap: theme.spacing.md,
    },
    patternCard: {
      borderRadius: theme.radius.lg,
      backgroundColor:theme.colors.card,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    patternTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    patternTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    patternRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    patternLabel: {
      width: 42,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    patternPill: {
      flex: 1,
      height: 12,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.08)',
      overflow: 'hidden',
    },
    patternPillFill: {
      height: '100%',
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(226,232,240,0.36)'
          : 'rgba(71,85,105,0.3)',
    },
    patternPercent: {
      width: 48,
      fontSize: 12,
      color: theme.colors.textPrimary,
    },
    patternNote: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    anomaliesSection: {
      gap: theme.spacing.md,
    },
    anomaliesTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    anomaliesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    anomalyCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    anomalyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    anomalyTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    anomalyTag: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    anomalyBody: {
      gap: theme.spacing.xs,
    },
    anomalyMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    anomalyFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    savingsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    savingsSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    savingsList: {
      gap: theme.spacing.xl,
    },
    savingsItem: {
      gap: theme.spacing.sm,
    },
    savingsTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    savingsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    savingsImpact: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    savingsDetail: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    savingsBullet: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.lg,
    },
    savingsActionRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      flexWrap: 'wrap',
    },
    actionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: 6,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.05)',
    },
    actionChipLabel: {
      fontSize: 12,
      color: theme.colors.textPrimary,
    },
    footerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    footerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.05)',
    },
    footerButtonLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
  });

const FinanceTab: React.FC = () => {
  const theme = useAppTheme();
  const { finance } = useInsightsContent();
  const { financeData } = useInsightsDataHook();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const indicators = useMemo<Indicator[]>(
    () =>
      INDICATOR_META.map(({ key, Icon }) => {
        const translation = finance.indicators[key];
        return {
          key,
          label: translation.label,
          metric: financeData.indicators?.[key]?.metric ?? translation.metric,
          status: translation.status,
          score: financeData.indicators?.[key]?.score ?? 0.6,
          Icon,
        };
      }),
    [finance.indicators, financeData.indicators],
  );

  const weeklyPattern = useMemo<WeeklyPattern[]>(
    () =>
      WEEKLY_KEYS.map((key) => {
        const translation = finance.weeklyPattern[key];
        return {
          key,
          label: translation.label,
          note: translation.note,
          percent: Math.round((financeData.weeklyPattern?.[key] ?? WEEKLY_PERCENTS[key]) * 100),
        };
      }),
    [finance.weeklyPattern, financeData.weeklyPattern],
  );

  const dayPattern = useMemo<DayPartPattern[]>(
    () =>
      DAY_PART_KEYS.map((key) => {
        const translation = finance.dayPattern[key];
        return {
          key,
          label: translation.label,
          range: translation.range,
          note: translation.note,
          percent: Math.round((financeData.dayPattern?.[key] ?? DAY_PART_PERCENTS[key]) * 100),
        };
      }),
    [finance.dayPattern, financeData.dayPattern],
  );

  const anomalies = useMemo<Anomaly[]>(
    () =>
      ANOMALY_KEYS.map((key) => ({
        key,
        title: finance.anomalies[key].title,
        summary: finance.anomalies[key].summary,
        recommendation: finance.anomalies[key].recommendation,
        meta: finance.anomalies[key].meta,
      })),
    [finance.anomalies],
  );

  const savingsEntries = useMemo<SavingEntry[]>(
    () =>
      SAVING_KEYS.map((key) => {
        const entry = finance.savings[key];
        const actions = Object.entries(entry.actions).map(([actionKey, label]) => ({
          key: actionKey,
          label,
          Icon: SAVING_ACTION_ICONS[key]?.[actionKey] ?? ArrowRight,
        }));
        const impactValue = financeData.savings?.[key]?.impactValue ?? 0;
        return {
          key,
          title: entry.title,
          impact: entry.impact,
          detail: entry.detail.replace('{amount}', financeData.formatCurrency(impactValue)),
          alternative: entry.alternative ?? '',
          bullets: entry.bullets ?? [],
          actions,
        };
      }),
    [finance.savings, financeData],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{finance.sections.health}</Text>
        <View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{finance.scoreLabel}</Text>
            <Text style={styles.scoreValue}>
              {financeData.healthScore?.toFixed(1) ?? '8.0'} / 10
            </Text>
          </View>
          <View style={styles.scoreBarTrack}>
            <View
              style={[
                styles.scoreBarFill,
                { width: `${Math.round(clamp01((financeData.healthScore ?? 8) / 10) * 100)}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{finance.sections.indicators}</Text>
        <View style={styles.indicatorBlock}>
          {indicators.map((item, index) => {
            const Icon = item.Icon;
            return (
              <View
                key={item.key}
                style={[
                  styles.indicatorRow,
                  index === 0 && styles.indicatorRowFirst,
                ]}
              >
                <View style={styles.indicatorIconWrapper}>
                  <Icon size={18} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.indicatorContent}>
                  <View style={styles.indicatorHeader}>
                    <Text style={styles.indicatorTitle}>{item.label}</Text>
                    <View style={styles.indicatorBar}>
                      <View
                        style={[
                          styles.indicatorBarFill,
                          { width: `${Math.round(item.score * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.indicatorFooter}>
                    <Text style={styles.indicatorMetric}>{item.metric}</Text>
                    <View style={styles.indicatorStatus}>
                      <Text style={styles.indicatorStatusText}>{item.status}</Text>
                      <Check size={14} color={theme.colors.success} />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.alertBlock}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={18} color={theme.colors.warning} />
            <Text style={styles.alertTitle}>{finance.alert.title}</Text>
          </View>
          <View style={styles.bulletList}>
            {finance.alert.bullets.map((item) => (
              <Text key={item} style={styles.bulletText}>
                • {item}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{finance.sections.patterns}</Text>

        <View style={styles.patternSection}>
          <View style={styles.patternCard}>
            <View style={styles.patternTitleRow}>
              <CalendarRange size={18} color={theme.colors.textSecondary} />
              <Text style={styles.patternTitle}>{finance.patternTitles.weekly}</Text>
            </View>
            {weeklyPattern.map((entry) => (
              <View key={entry.key} style={styles.patternRow}>
                <Text style={styles.patternLabel}>{entry.label}</Text>
                <View style={styles.patternPill}>
                  <View
                    style={[
                      styles.patternPillFill,
                      { width: `${Math.round(entry.percent * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.patternPercent}>
                  {Math.round(entry.percent * 100)}%
                </Text>
                <Text style={styles.patternNote}>{entry.note}</Text>
              </View>
            ))}
          </View>

          <View style={styles.patternCard}>
            <View style={styles.patternTitleRow}>
              <Clock size={18} color={theme.colors.textSecondary} />
              <Text style={styles.patternTitle}>{finance.patternTitles.daily}</Text>
            </View>
            {dayPattern.map((entry) => (
              <View key={entry.key} style={styles.patternRow}>
                <Text style={styles.patternLabel}>
                  {entry.label}{' '}
                  <Text style={styles.patternNote}>({entry.range})</Text>
                </Text>
                <View style={styles.patternPill}>
                  <View
                    style={[
                      styles.patternPillFill,
                      { width: `${Math.round(entry.percent * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.patternPercent}>
                  {Math.round(entry.percent * 100)}%
                </Text>
                <Text style={styles.patternNote}>{entry.note}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.anomaliesSection}>
          <View style={styles.anomaliesTitleRow}>
            <AlertCircle size={18} color={theme.colors.textSecondary} />
            <Text style={styles.anomaliesTitle}>{finance.anomaliesTitle}</Text>
          </View>
          {anomalies.map((anomaly) => (
            <AdaptiveGlassView key={anomaly.key} style={styles.anomalyCard}>
              <View style={styles.anomalyHeader}>
                <Text style={styles.anomalyTitle}>{anomaly.title}</Text>
                <Text style={styles.anomalyTag}>{anomaly.meta}</Text>
              </View>
              <View style={styles.anomalyBody}>
                <Text style={styles.anomalyMeta}>{anomaly.summary}</Text>
                <Text style={styles.anomalyMeta}>{anomaly.recommendation}</Text>
              </View>
              <View style={styles.anomalyFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <AlertCircle size={18} color={theme.colors.textSecondary} />
                  <Text style={styles.anomalyMeta}>{finance.reviewInsights}</Text>
                </View>
                <Play size={18} color={theme.colors.textSecondary} />
              </View>
            </AdaptiveGlassView>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.savingsHeader}>
          <Text style={styles.sectionTitle}>{finance.sections.savings}</Text>
          <Text style={styles.savingsSubtitle}>{finance.savingsSubtitle}</Text>
        </View>

        <View style={styles.savingsList}>
          {savingsEntries.map((entry) => (
            <View key={entry.key} style={styles.savingsItem}>
              <View style={styles.savingsTitleRow}>
                <Text style={styles.savingsTitle}>{entry.title}</Text>
                <Text style={styles.savingsImpact}>{entry.impact}</Text>
              </View>
              <Text style={styles.savingsDetail}>{entry.detail}</Text>
              {entry.alternative ? (
                <Text style={styles.savingsDetail}>{entry.alternative}</Text>
              ) : null}
              {entry.bullets.map((bullet) => (
                <Text key={bullet} style={styles.savingsBullet}>
                  • {bullet}
                </Text>
              ))}
              <View style={styles.savingsActionRow}>
                {entry.actions.map((action) => {
                  const Icon = action.Icon;
                  return (
                    <View key={action.key} style={styles.actionChip}>
                      <Icon size={16} color={theme.colors.textSecondary} />
                      <Text style={styles.actionChipLabel}>{action.label}</Text>
                      <ArrowRight size={14} color={theme.colors.textSecondary} />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerActions}>
          <View style={styles.footerButton}>
            <Check size={16} color={theme.colors.textSecondary} />
            <Text style={styles.footerButtonLabel}>{finance.footerActions.applyAll}</Text>
            <ArrowRight size={16} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.footerButton}>
            <UtensilsCrossed size={16} color={theme.colors.textSecondary} />
            <Text style={styles.footerButtonLabel}>{finance.footerActions.adjustPlan}</Text>
            <ArrowRight size={16} color={theme.colors.textSecondary} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default FinanceTab;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
