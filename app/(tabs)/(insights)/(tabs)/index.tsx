import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Coffee,
  History,
  Lightbulb,
  Play,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import type { Theme } from '@/constants/theme';
import { useAppTheme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import {
  OverviewChangeGroupKey,
  OverviewComponentKey,
  OverviewQuickWinKey,
} from '@/localization/insightsContent';
import { useInsightsContent } from '@/localization/useInsightsContent';
import useInsightsDataHook, { type InsightCard } from '@/hooks/useInsightsData';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useInsightsExperienceStore } from '@/stores/useInsightsExperienceStore';

type ComponentMetric = {
  key: OverviewComponentKey;
  icon: LucideIcon;
  label: string;
  score: number;
  strong: string;
  growth: string;
  progress: number;
};

type ChangeGroup = {
  key: OverviewChangeGroupKey;
  title: string;
  icon: LucideIcon;
  bullets: string[];
};

type QuickWin = {
  key: OverviewQuickWinKey;
  icon: LucideIcon;
  title: string;
  impact: string;
  meta: string;
};

const COMPONENT_ORDER: OverviewComponentKey[] = [
  'financial',
  'productivity',
  'balance',
  'goals',
  'discipline',
];

const COMPONENT_ICONS: Record<OverviewComponentKey, LucideIcon> = {
  financial: Target,
  productivity: Brain,
  balance: Lightbulb,
  goals: TrendingUp,
  discipline: Coffee,
};

const COMPONENT_METRICS: Record<OverviewComponentKey, { score: number; progress: number }> = {
  financial: { score: 8.2, progress: 0.82 },
  productivity: { score: 6.5, progress: 0.65 },
  balance: { score: 7.0, progress: 0.7 },
  goals: { score: 9.1, progress: 0.91 },
  discipline: { score: 8.0, progress: 0.8 },
};

const CHANGE_GROUP_ORDER: OverviewChangeGroupKey[] = ['upgrades', 'attention'];
const CHANGE_GROUP_ICONS: Record<OverviewChangeGroupKey, LucideIcon> = {
  upgrades: TrendingUp,
  attention: AlertTriangle,
};

const QUICK_WIN_ORDER: OverviewQuickWinKey[] = ['tasks', 'coffee', 'meditation', 'reading'];
const QUICK_WIN_ICONS: Record<OverviewQuickWinKey, LucideIcon> = {
  tasks: Target,
  coffee: Coffee,
  meditation: Lightbulb,
  reading: Brain,
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
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    heroCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.card,
    },
    heroLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      lineHeight: 26,
    },
    heroBody: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    heroContext: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    heroCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.18)'
          : 'rgba(15,23,42,0.08)',
    },
    surfaceCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.08)'
          : 'rgba(15,23,42,0.04)',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
    },
    scoreValue: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    scoreDenominator: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    progressTrack: {
      height: 16,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.14)'
          : 'rgba(15,23,42,0.12)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(226,232,240,0.5)'
          : 'rgba(71,85,105,0.35)',
    },
    deltaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    deltaText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    componentList: {
      borderRadius: theme.radius.xxl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.08)'
          : 'rgba(15,23,42,0.04)',
    },
    componentRow: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
    },
    componentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    componentTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexShrink: 1,
    },
    componentLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    componentScore: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    componentMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    analysisButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.12)'
          : 'rgba(15,23,42,0.08)',
    },
    analysisText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    changesCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.08)'
          : 'rgba(15,23,42,0.04)',
    },
    changeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    changeTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    bulletText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18,
      marginLeft: theme.spacing.md,
    },
    recommendationBlock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    recommendationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    recommendationTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    recommendationItem: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    recommendationLink: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    quickHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quickTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    quickAction: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    quickList: {
      gap: theme.spacing.sm,
    },
    quickCard: {
      padding: theme.spacing.lg,
      borderRadius: theme.radius.xxl,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    quickIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.18)'
          : 'rgba(15,23,42,0.08)',
    },
    quickContent: {
      flex: 1,
      gap: 4,
    },
    quickTitleText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    quickMetaText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    quickCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    quickCtaText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    insightsSection: {
      gap: theme.spacing.sm,
    },
    insightCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.card,
    },
    insightTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    insightBody: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    insightExplain: {
      fontSize: 11,
      color: theme.colors.textTertiary,
    },
    insightCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.16)'
          : 'rgba(15,23,42,0.08)',
    },
    insightCtaText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    questionsCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.08)'
          : 'rgba(15,23,42,0.02)',
    },
    questionItems: {
      gap: theme.spacing.md,
    },
    questionOptions: {
      gap: theme.spacing.sm,
    },
    questionBlockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    questionPrompt: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      lineHeight: 20,
    },
    questionOption: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    questionOptionActive: {
      borderColor: theme.colors.success,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(34,197,94,0.15)'
          : 'rgba(34,197,94,0.12)',
    },
    questionOptionText: {
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    questionEmpty: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    questionCustomRow: {
      gap: theme.spacing.sm,
    },
    questionInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    questionSubmit: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(148,163,184,0.18)'
          : 'rgba(15,23,42,0.08)',
    },
    questionSubmitText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    historyTeaser: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    historySummary: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    historyMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    historyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    historyButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
  });

const InsightsIndexScreen: React.FC = () => {
  const theme = useAppTheme();
  const { overview, questions: questionsContent, history: historyContent } = useInsightsContent();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const domainDebts = useFinanceDomainStore((state) => state.debts);
  const { overviewData, cards } = useInsightsDataHook();
  const answers = useInsightsExperienceStore((state) => state.answers);
  const answerQuestion = useInsightsExperienceStore((state) => state.answerQuestion);
  const historyRecords = useInsightsExperienceStore((state) => state.history);
  const markInsightStatus = useInsightsExperienceStore((state) => state.markInsightStatus);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
    [cards],
  );
  const fallbackHero = useMemo<InsightCard>(
    () => ({
      id: 'main-fallback',
      title: overview.mainInsightCard.title,
      body: overview.mainInsightCard.body,
      category: 'overview',
      priority: 0,
      createdAt: new Date().toISOString(),
      cta: { label: overview.mainInsightCard.cta, action: 'open_budgets' },
      explain: overview.mainInsightCard.context,
      tone: 'friend',
    }),
    [overview.mainInsightCard],
  );
  const heroCard = sortedCards[0] ?? fallbackHero;
  const secondaryCards = sortedCards[0] ? sortedCards.slice(1) : sortedCards;

  const orderedQuestions = useMemo(
    () =>
      questionsContent.dailyOrder
        .map((questionId) => {
          const entry = questionsContent.entries[questionId];
          if (!entry) {
            return null;
          }
          return { id: questionId, ...entry };
        })
        .filter(Boolean) as ({ id: string } & (typeof questionsContent.entries)[string])[],
    [questionsContent.dailyOrder, questionsContent.entries],
  );

  const openQuestions = useMemo(
    () => orderedQuestions.filter((question) => !answers?.[question.id]).slice(0, 3),
    [answers, orderedQuestions],
  );

  const completedThisWeek = useMemo(
    () =>
      historyRecords.filter(
        (record) => record.status === 'completed' && isWithinDays(record.date, 7),
      ).length,
    [historyRecords],
  );
  const historySummary = overview.historyTeaser.summary.replace('{count}', `${completedThisWeek}`);

  const handleOptionSelect = useCallback(
    (questionId: string, optionId: string) => {
      answerQuestion(questionId, { optionId });
    },
    [answerQuestion],
  );

  const handleCustomSubmit = useCallback(
    (questionId: string) => {
      setCustomAnswers((previous) => {
        const value = previous[questionId]?.trim();
        if (!value) {
          return previous;
        }
        answerQuestion(questionId, { customAnswer: value });
        return { ...previous, [questionId]: '' };
      });
    },
    [answerQuestion],
  );

  const handleViewAllQuestions = useCallback(() => {
    router.push('/(tabs)/(insights)/questions');
  }, [router]);

  const handleOpenHistory = useCallback(() => {
    router.push('/(tabs)/(insights)/history');
  }, [router]);

  const componentMetrics = useMemo<ComponentMetric[]>(
    () =>
      COMPONENT_ORDER.map((key) => {
        const component = overview.components[key];
        const score = overviewData.components?.[key]?.score ?? COMPONENT_METRICS[key].score;
        const progress = overviewData.components?.[key]?.progress ?? COMPONENT_METRICS[key].progress;
        return {
          key,
          icon: COMPONENT_ICONS[key],
          label: component.label,
          strong: component.strong,
          growth: component.growth,
          score,
          progress,
        };
      }),
    [overview.components, overviewData.components],
  );

  const changeGroups = useMemo<ChangeGroup[]>(
    () =>
      CHANGE_GROUP_ORDER.map((key) => ({
        key,
        icon: CHANGE_GROUP_ICONS[key],
        title: overview.changeGroups[key].title,
        bullets: overviewData.changeSignals?.[key] ?? overview.changeGroups[key].bullets,
      })),
    [overview.changeGroups, overviewData.changeSignals],
  );

  const quickWins = useMemo<QuickWin[]>(
    () =>
      QUICK_WIN_ORDER.map((key) => ({
        key,
        icon: QUICK_WIN_ICONS[key],
        title: overview.quickWins.items[key].title,
        impact: overviewData.quickWins?.[key]?.impact ?? overview.quickWins.items[key].impact,
        meta: overviewData.quickWins?.[key]?.meta ?? overview.quickWins.items[key].meta,
      })),
    [overview.quickWins.items, overviewData.quickWins],
  );

  const handleCardAction = useCallback(
    (card: InsightCard) => {
      switch (card.cta?.action) {
        case 'review_budget':
          router.push('/(tabs)/(finance)/(tabs)/budgets');
          break;
        case 'open_exchange':
          router.push('/(modals)/finance-currency');
          break;
        case 'quick_add':
          router.push({
            pathname: '/(modals)/finance/quick-exp',
            params: { tab: 'outcome' },
          });
          break;
        case 'open_debt': {
          if (card.payload?.debtId) {
            const domainDebt = domainDebts.find((item) => item.id === card.payload.debtId);
            if (domainDebt) {
              router.push({
                pathname: '/(modals)/finance/debt',
                params: { id: domainDebt.id },
              });
              break;
            }
          }
          router.push('/(modals)/finance/debt');
          break;
        }
        case 'open_budgets':
          router.push('/(tabs)/(finance)/(tabs)/budgets');
          break;
        case 'open_tasks':
          router.push('/(tabs)/(planner)');
          break;
        case 'open_habits':
          router.push('/(tabs)/(planner)');
          // TODO: route directly to habits when dedicated screen is available.
          break;
        case 'open_history':
          router.push('/(tabs)/(insights)/history');
          break;
        case 'open_questions':
          router.push('/(tabs)/(insights)/questions');
          break;
        default:
          break;
      }
      if (card.id !== 'main-fallback') {
        markInsightStatus(card.id, 'completed');
      }
    },
    [domainDebts, markInsightStatus, router],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{overview.sections.mainInsight}</Text>
        <AdaptiveGlassView style={styles.heroCard}>
          <Text style={styles.heroLabel}>{overview.mainInsightCard.label}</Text>
          <Text style={styles.heroTitle}>{heroCard.title}</Text>
          <Text style={styles.heroBody}>{heroCard.body}</Text>
          {heroCard.explain ? <Text style={styles.heroContext}>{heroCard.explain}</Text> : null}
          {heroCard.cta ? (
            <Pressable
              onPress={() => handleCardAction(heroCard)}
              style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.insightCtaText}>{heroCard.cta.label}</Text>
              <ArrowRight size={14} color={theme.colors.textSecondary} />
            </Pressable>
          ) : null}
        </AdaptiveGlassView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{overview.sections.personalIndex}</Text>
        <View style={styles.surfaceCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{overviewData.score?.toFixed?.(1) ?? '7.8'}</Text>
            <Text style={styles.scoreDenominator}>/ 10</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${clamp01(overviewData.score ? overviewData.score / 10 : 0.78) * 100}%` }]} />
          </View>
          <View style={styles.deltaRow}>
            <TrendingUp size={14} color={theme.colors.textSecondary} />
            <Text style={styles.deltaText}>{overview.deltaText}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.questionBlockHeader}>
          <Text style={styles.sectionTitle}>{overview.sections.questions}</Text>
          <Pressable
            onPress={handleViewAllQuestions}
            style={({ pressed }) => [styles.historyButton, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.historyButtonText}>{overview.questionsBlock.viewAll}</Text>
            <ArrowRight size={14} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
        <AdaptiveGlassView style={styles.questionsCard}>
          <Text style={styles.sectionSubtitle}>{overview.questionsBlock.subtitle}</Text>
          {openQuestions.length === 0 ? (
            <Text style={styles.questionEmpty}>{overview.questionsBlock.empty}</Text>
          ) : (
            <View style={styles.questionItems}>
              {openQuestions.map((question) => (
                <View key={question.id} style={{ gap: theme.spacing.sm }}>
                  <Text style={styles.questionPrompt}>{question.prompt}</Text>
                  {question.options ? (
                    <View style={styles.questionOptions}>
                      {question.options.map((option) => (
                        <Pressable
                          key={option.id}
                          style={({ pressed }) => [
                            styles.questionOption,
                            pressed && { opacity: 0.85 },
                          ]}
                          onPress={() => handleOptionSelect(question.id, option.id)}
                        >
                          <CheckCircle2 size={16} color={theme.colors.textSecondary} />
                          <Text style={styles.questionOptionText}>{option.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                  {question.allowFreeText ? (
                    <View style={styles.questionCustomRow}>
                      <Text style={styles.sectionSubtitle}>
                        {question.customLabel ?? overview.questionsBlock.customAnswer}
                      </Text>
                      <TextInput
                        style={styles.questionInput}
                        placeholder={overview.questionsBlock.placeholder}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={customAnswers[question.id] ?? ''}
                        onChangeText={(text) =>
                          setCustomAnswers((prev) => ({ ...prev, [question.id]: text }))
                        }
                        multiline
                      />
                      <Pressable
                        onPress={() => handleCustomSubmit(question.id)}
                        style={({ pressed }) => [styles.questionSubmit, pressed && { opacity: 0.85 }]}
                      >
                        <Text style={styles.questionSubmitText}>{overview.questionsBlock.submit}</Text>
                        <ArrowRight size={14} color={theme.colors.textSecondary} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </AdaptiveGlassView>
      </View>

      {secondaryCards.length > 0 && (
        <View style={[styles.section, styles.insightsSection]}>
          <Text style={styles.sectionTitle}>{overview.sections.activeInsights}</Text>
          {secondaryCards.map((card) => (
            <AdaptiveGlassView key={card.id} style={styles.insightCard}>
              <Text style={styles.insightTitle}>{card.title}</Text>
              <Text style={styles.insightBody}>{card.body}</Text>
              {card.cta ? (
                <Pressable
                  onPress={() => handleCardAction(card)}
                  style={({ pressed }) => [styles.insightCta, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.insightCtaText}>{card.cta.label}</Text>
                  <ArrowRight size={14} color={theme.colors.textSecondary} />
                </Pressable>
              ) : null}
              {card.explain ? <Text style={styles.insightExplain}>{card.explain}</Text> : null}
            </AdaptiveGlassView>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{overview.sections.history}</Text>
        <AdaptiveGlassView style={styles.historyTeaser}>
          <View>
            <Text style={styles.historySummary}>{historySummary}</Text>
            <Text style={styles.historyMeta}>{historyContent.subtitle}</Text>
          </View>
          <Pressable
            onPress={handleOpenHistory}
            style={({ pressed }) => [styles.historyButton, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.historyButtonText}>{overview.historyTeaser.cta}</Text>
            <History size={16} color={theme.colors.textSecondary} />
          </Pressable>
        </AdaptiveGlassView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{overview.sections.components}</Text>
        <View style={styles.componentList}>
          {componentMetrics.map((component, index) => {
            const Icon = component.icon;
            return (
              <View key={component.key}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.componentRow}>
                  <View style={styles.componentHeader}>
                    <View style={styles.componentTitle}>
                      <Icon size={16} color={theme.colors.textSecondary} />
                      <Text style={styles.componentLabel}>{component.label}</Text>
                    </View>
                    <Text style={styles.componentScore}>
                      {component.score.toFixed(1)} / 10
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, { width: `${component.progress * 100}%` }]}
                    />
                  </View>
                  <Text style={styles.componentMeta}>
                    {overview.strongLabel}: {component.strong}
                  </Text>
                  <Text style={styles.componentMeta}>
                    {overview.growthLabel}: {component.growth}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.analysisButton}>
          <Lightbulb size={14} color={theme.colors.textSecondary} />
          <Text style={styles.analysisText}>{overview.detailedAnalysis}</Text>
          <ArrowRight size={14} color={theme.colors.textSecondary} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{overview.sections.changes}</Text>
        <View style={styles.changesCard}>
          {changeGroups.map((group) => {
            const Icon = group.icon;
            return (
              <View key={group.key} style={{ gap: theme.spacing.xs }}>
                <View style={styles.changeHeader}>
                  <Icon size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.changeTitle}>{group.title}</Text>
                </View>
                {group.bullets.map((item) => (
                  <Text key={item} style={styles.bulletText}>
                    • {item}
                  </Text>
                ))}
              </View>
            );
          })}

          <View style={styles.recommendationBlock}>
            <View style={styles.recommendationHeader}>
              <Lightbulb size={16} color={theme.colors.warning} />
              <Text style={styles.recommendationTitle}>{overview.recommendation.title}</Text>
            </View>
            {overview.recommendation.bullets.map((bullet) => (
              <Text key={bullet} style={styles.recommendationItem}>
                {bullet}
              </Text>
            ))}
            <Text style={styles.recommendationLink}>{overview.recommendation.link}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.quickHeader}>
          <Text style={styles.quickTitle}>{overview.quickWins.title}</Text>
          <Text style={styles.quickAction}>{overview.quickWins.action}</Text>
        </View>
        <View style={styles.quickList}>
          {quickWins.map((item) => {
            const Icon = item.icon;
            return (
              <AdaptiveGlassView key={item.key} style={styles.quickCard}>
                <View style={styles.quickIconWrapper}>
                  <Icon size={18} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.quickContent}>
                  <Text style={styles.quickTitleText}>{item.title}</Text>
                  <Text style={styles.quickMetaText}>{item.impact}</Text>
                  <Text style={styles.quickMetaText}>{item.meta}</Text>
                </View>
                <View style={styles.quickCta}>
                  <Text style={styles.quickCtaText}>{overview.quickWins.cta}</Text>
                  <Play size={16} color={theme.colors.textSecondary} />
                </View>
              </AdaptiveGlassView>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export default InsightsIndexScreen;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const isWithinDays = (value: string, days: number) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }
  const diff = Date.now() - timestamp;
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
};
