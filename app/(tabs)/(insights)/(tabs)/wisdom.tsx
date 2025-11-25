import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRight,
  BookOpen,
  Heart,
  Lightbulb,
  MessageCircle,
  Plus,
  RefreshCcw,
  Search,
  Share2,
  Star,
  Target,
  type LucideIcon,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import type { Theme } from '@/constants/theme';
import { useAppTheme } from '@/constants/theme';
import { AdvisorKey } from '@/localization/insightsContent';
import { useInsightsContent } from '@/localization/useInsightsContent';

type AdvisorCard = {
  key: AdvisorKey;
  name: string;
  role: string;
  icon: LucideIcon;
  insight: string;
  reminder: string;
  recommendation: string;
  challenge: string;
};

const ADVISOR_KEYS: AdvisorKey[] = ['buffett', 'musk', 'marcus'];
const ADVISOR_ICONS: Record<AdvisorKey, LucideIcon> = {
  buffett: BookOpen,
  musk: Target,
  marcus: Star,
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
      paddingBottom: theme.spacing.xxxl + 32,
      gap: theme.spacing.xxl,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      letterSpacing: 0.2,
    },
    sectionDate: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    quoteCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    quoteText: {
      fontSize: 20,
      lineHeight: 28,
      color: theme.colors.textPrimary,
      letterSpacing: 0.2,
    },
    quoteAuthor: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    quoteContext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    quoteActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    bulbHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    applicationCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      backgroundColor:
        theme.colors.card,
      gap: theme.spacing.md,
    },
    bodyText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    ctaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      alignSelf: 'flex-start',
    },
    ctaText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    libraryCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
      backgroundColor:theme.colors.card,
    },
    tabRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tabChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor:theme.colors.card,
    },
    tabChipActive: {
      backgroundColor:theme.colors.card,
    },
    chipText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    chipTextActive: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    favoriteBlock: {
      gap: theme.spacing.sm,
    },
    favoriteTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    favoriteQuote: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    favoriteAuthor: {
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'right',
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      alignSelf: 'flex-start',
    },
    challengeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    challengeStatus: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    challengeCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    challengeText: {
      fontSize: 16,
      color: theme.colors.textPrimary,
      lineHeight: 24,
    },
    searchField: {
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor:theme.colors.card,
    },
    searchPlaceholder: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    advisorsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    advisorList: {
      gap: theme.spacing.lg,
    },
    advisorCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    advisorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    advisorName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    advisorRole: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    advisorBody: {
      gap: theme.spacing.xs,
    },
    advisorText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    advisorActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      flexWrap: 'wrap',
    },
    advisorAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    advisorActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    addMentorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.md,
      backgroundColor:theme.colors.card,
    },
    addMentorText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
  });

const WisdomTab: React.FC = () => {
  const theme = useAppTheme();
  const { wisdom } = useInsightsContent();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const advisors = useMemo<AdvisorCard[]>(
    () =>
      ADVISOR_KEYS.map((key) => ({
        key,
        icon: ADVISOR_ICONS[key],
        ...wisdom.advisors[key],
      })),
    [wisdom.advisors],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{wisdom.sections.wisdomOfDay}</Text>
          <Text style={styles.sectionDate}>{wisdom.quoteDate}</Text>
        </View>
        <View style={styles.divider} />
        <AdaptiveGlassView style={styles.quoteCard}>
          <Text style={styles.quoteText}>“{wisdom.quoteOfDay.text}”</Text>
          <Text style={styles.quoteAuthor}>— {wisdom.quoteOfDay.author}</Text>
          <Text style={styles.quoteContext}>{wisdom.quoteOfDay.context}</Text>
          <View style={styles.quoteActions}>
            <View style={styles.actionButton}>
              <Heart size={16} color={theme.colors.textSecondary} />
              <Text style={styles.actionText}>{wisdom.quoteActions.add}</Text>
            </View>
            <View style={styles.actionButton}>
              <RefreshCcw size={16} color={theme.colors.textSecondary} />
              <Text style={styles.actionText}>{wisdom.quoteActions.another}</Text>
            </View>
            <View style={styles.actionButton}>
              <Share2 size={16} color={theme.colors.textSecondary} />
              <Text style={styles.actionText}>{wisdom.quoteActions.share}</Text>
            </View>
          </View>
        </AdaptiveGlassView>
      </View>

      <View style={styles.section}>
        <View style={styles.bulbHeader}>
          <Lightbulb size={16} color={theme.colors.textSecondary} />
          <Text style={styles.sectionTitle}>{wisdom.sections.application}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.applicationCard}>
          <Text style={styles.bodyText}>{wisdom.applicationMessage}</Text>
          <View style={styles.ctaRow}>
            <Plus size={16} color={theme.colors.textSecondary} />
            <Text style={styles.ctaText}>{wisdom.applicationCta}</Text>
            <ArrowRight size={16} color={theme.colors.textSecondary} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{wisdom.sections.library}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.libraryCard}>
          <View style={styles.tabRow}>
            {wisdom.categories.map((category, index) => {
              const active = index === 0;
              return (
                <View
                  key={`${category}-${index}`}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.favoriteBlock}>
            <Text style={styles.favoriteTitle}>{wisdom.favoritesTitle}</Text>
            {wisdom.favoriteQuotes.map((quote, index) => (
              <View key={`${quote.text}-${index}`} style={{ gap: 4 }}>
                <Text style={styles.favoriteQuote}>“{quote.text}”</Text>
                <Text style={styles.favoriteAuthor}>— {quote.author}</Text>
              </View>
            ))}
            <View style={styles.linkRow}>
              <Heart size={14} color={theme.colors.textSecondary} />
              <Text style={styles.actionText}>{wisdom.favoritesLink}</Text>
            </View>
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <View style={styles.challengeHeader}>
              <View style={styles.linkRow}>
                <Share2 size={14} color={theme.colors.textSecondary} />
                <Text style={styles.favoriteTitle}>{wisdom.challenge.title}</Text>
              </View>
              <Text style={styles.challengeStatus}>{wisdom.challenge.status}</Text>
            </View>
            <Text style={styles.favoriteQuote}>“{wisdom.challenge.quote.text}”</Text>
            <Text style={styles.favoriteAuthor}>— {wisdom.challenge.quote.author}</Text>
          </View>

          <AdaptiveGlassView style={styles.challengeCard}>
            <Text style={styles.challengeText}>“{wisdom.challenge.quote.text}”</Text>
            <Text style={styles.bodyText}>{wisdom.challenge.progress}</Text>
            <Text style={styles.bodyText}>{wisdom.challenge.quote.context}</Text>
            <View style={styles.linkRow}>
              <MessageCircle size={14} color={theme.colors.textSecondary} />
              <Text style={styles.actionText}>{wisdom.challenge.markComplete}</Text>
            </View>
          </AdaptiveGlassView>
        </View>

        <View style={styles.searchField}>
          <Search size={16} color={theme.colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>{wisdom.searchPlaceholder}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.advisorsHeader}>
          <Text style={styles.sectionTitle}>{wisdom.sections.advisors}</Text>
          <Text style={styles.sectionDate}>{wisdom.advisorsHeaderAction}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.advisorList}>
          {advisors.map((advisor) => {
            const Icon = advisor.icon;
            return (
              <AdaptiveGlassView key={advisor.key} style={styles.advisorCard}>
                <View style={styles.advisorHeader}>
                  <View>
                    <Text style={styles.advisorName}>{advisor.name}</Text>
                    <Text style={styles.advisorRole}>{advisor.role}</Text>
                  </View>
                  <Icon size={20} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.advisorBody}>
                  <Text style={styles.advisorText}>{advisor.insight}</Text>
                  <Text style={styles.advisorText}>{advisor.reminder}</Text>
                  <Text style={styles.advisorText}>{advisor.recommendation}</Text>
                  <Text style={styles.advisorText}>{advisor.challenge}</Text>
                </View>
                <View style={styles.advisorActions}>
                  <View style={styles.advisorAction}>
                    <MessageCircle size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.advisorActionText}>{wisdom.actions.askQuestion}</Text>
                  </View>
                  <View style={styles.advisorAction}>
                    <Target size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.advisorActionText}>{wisdom.actions.actionPlan}</Text>
                  </View>
                </View>
              </AdaptiveGlassView>
            );
          })}
        </View>
        <View style={styles.addMentorButton}>
          <Plus size={16} color={theme.colors.textSecondary} />
          <Text style={styles.addMentorText}>{wisdom.addMentor}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default WisdomTab;
