import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  Mail,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkle,
  Star,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useMorePagesLocalization } from '@/localization/more/pages';

type SectionKey = 'popular' | 'manuals' | 'videos' | 'contact';
const SUPPORT_SECTIONS: SectionKey[] = ['popular', 'manuals', 'videos', 'contact'];

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: 32
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.xl,
    },
    filtersWrapper: {
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
          ? 'rgba(40,43,55,0.55)'
          : 'rgba(226,232,240,0.72)',
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      letterSpacing: 0.3,
    },
    chipTextActive: {
      color: theme.colors.onPrimary,
    },
    sectionHeader: {
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
      gap: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.25,
    },
    sectionSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      letterSpacing: 0.3,
    },
    sectionCard: {
      gap: theme.spacing.sm,
    },
    accordionRow: {
      borderRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(35,38,52,0.7)'
          : 'rgba(226,232,240,0.8)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    accordionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    manualRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(38,42,54,0.75)'
          : 'rgba(233,236,244,0.85)',
    },
    manualTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    manualDuration: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    videoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(38,42,54,0.78)'
          : 'rgba(233,236,244,0.88)',
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      flex: 1,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(41,44,60,0.8)'
          : 'rgba(216,222,233,0.9)',
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    rowMeta: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    supportRow: {
      gap: theme.spacing.sm,
    },
    supportRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(27,29,39,0.75)'
          : 'rgba(226,232,240,0.85)',
    },
    supportCTA: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: theme.colors.primary,
    },
    supportCTAWarning: {
      color: theme.colors.warning,
    },
    supportCTAPositive: {
      color: theme.colors.success,
    },
    footerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      flexWrap: 'wrap',
    },
    footerButton: {
      flex: 1,
      minWidth: '48%',
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(38,42,54,0.82)'
          : 'rgba(226,232,240,0.82)',
    },
    footerButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
  });

const useSectionRegistry = () => {
  const mapRef = useRef<Partial<Record<SectionKey, number>>>({});
  const scrollRef = useRef<ScrollView | null>(null);
  const pending = useRef<SectionKey | null>(null);

  const scrollToSection = useCallback((key: SectionKey) => {
    const y = mapRef.current[key];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(y - 96, 0), animated: true });
    }
  }, []);

  const register = useCallback(
    (key: SectionKey) =>
      (event: { nativeEvent: { layout: { y: number } } }) => {
        mapRef.current[key] = event.nativeEvent.layout.y;
        if (pending.current === key) {
          pending.current = null;
          requestAnimationFrame(() => scrollToSection(key));
        }
      },
    [scrollToSection],
  );

  const schedule = useCallback(
    (key: SectionKey) => {
      pending.current = key;
      requestAnimationFrame(() => scrollToSection(key));
    },
    [scrollToSection],
  );

  return { scrollRef, register, schedule };
};

const SupportScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { support: copy } = useMorePagesLocalization();
  const router = useRouter();

  const { section } = useLocalSearchParams<{ section?: string }>();
  const normalizedSection = (section?.toLowerCase() ?? 'popular') as SectionKey;

  const [activeSection, setActiveSection] = useState<SectionKey>(
    copy.sections[normalizedSection] ? normalizedSection : 'popular',
  );

  const { scrollRef, register, schedule } = useSectionRegistry();

  useEffect(() => {
    if (copy.sections[normalizedSection]) {
      setActiveSection(normalizedSection);
      schedule(normalizedSection);
    }
  }, [copy.sections, normalizedSection, schedule]);

  const handleFilter = useCallback(
    (target: SectionKey) => {
      setActiveSection(target);
      schedule(target);
      router.setParams({ section: target });
    },
    [router, schedule],
  );

  const renderPopular = useCallback(
    () => (
      <View style={styles.sectionCard}>
        {copy.popularQuestions.map((question, index) => (
          <AdaptiveGlassView key={`${question}-${index}`} style={styles.accordionRow}>
            <Text style={styles.accordionText}>{question}</Text>
            <ArrowRight size={16} color={theme.colors.textSecondary} />
          </AdaptiveGlassView>
        ))}
        <Pressable onPress={() => console.log('Open FAQ')}>
          <Text style={styles.supportCTA}>All FAQ</Text>
        </Pressable>
      </View>
    ),
    [copy.popularQuestions, styles.accordionRow, styles.accordionText, styles.sectionCard, styles.supportCTA, theme.colors.textSecondary],
  );

  const renderManuals = useCallback(
    () => (
      <View style={styles.sectionCard}>
        {copy.manuals.map((item, index) => (
          <AdaptiveGlassView key={`${item.title}-${index}`} style={styles.manualRow}>
            <View style={styles.rowLeft}>
              <AdaptiveGlassView style={styles.iconWrap}>
                <BookOpen size={18} color={theme.colors.iconText} />
              </AdaptiveGlassView>
              <Text style={styles.manualTitle}>{item.title}</Text>
            </View>
            <Text style={styles.manualDuration}>{item.duration}</Text>
          </AdaptiveGlassView>
        ))}
        <Pressable onPress={() => console.log('All manuals')}>
          <Text style={styles.supportCTA}>All manuals</Text>
        </Pressable>
      </View>
    ),
    [
      copy.manuals,
      styles.sectionCard,
      styles.manualRow,
      styles.rowLeft,
      styles.iconWrap,
      styles.manualTitle,
      styles.manualDuration,
      styles.supportCTA,
      theme.colors.iconText,
    ],
  );

  const renderVideos = useCallback(
    () => (
      <View style={styles.sectionCard}>
        {copy.videos.map((item, index) => (
          <AdaptiveGlassView key={`${item.title}-${index}`} style={styles.videoRow}>
            <View style={styles.rowLeft}>
              <AdaptiveGlassView style={styles.iconWrap}>
                {item.isChannel ? (
                  <Sparkle size={18} color="#FF4D4F" />
                ) : (
                  <Play size={18} color={theme.colors.iconText} />
                )}
              </AdaptiveGlassView>
              <Text style={styles.rowTitle}>{item.title}</Text>
            </View>
            {item.duration ? <Text style={styles.rowMeta}>{item.duration}</Text> : null}
          </AdaptiveGlassView>
        ))}
      </View>
    ),
    [copy.videos, styles.sectionCard, styles.videoRow, styles.rowLeft, styles.iconWrap, styles.rowTitle, styles.rowMeta, theme.colors.iconText],
  );

  const renderSupport = useCallback(() => {
    return (
      <View style={styles.supportRow}>
        {copy.channels.map((channel, index) => {
          const icon =
            channel.title.toLowerCase().includes('email') ? (
              <Mail size={18} color={theme.colors.iconText} />
            ) : channel.title.toLowerCase().includes('telegram') ? (
              <MessageCircle size={18} color={theme.colors.iconText} />
            ) : channel.title.toLowerCase().includes('premium') ? (
              <Star size={18} color={theme.colors.iconText} />
            ) : channel.title.toLowerCase().includes('free') ? (
              <ShieldCheck size={18} color={theme.colors.iconText} />
            ) : (
              <MessageCircle size={18} color={theme.colors.iconText} />
            );

          return (
            <AdaptiveGlassView key={`${channel.title}-${index}`} style={styles.supportRowItem}>
              <View style={styles.rowLeft}>
                <AdaptiveGlassView style={styles.iconWrap}>{icon}</AdaptiveGlassView>
                <View>
                  <Text style={styles.rowTitle}>{channel.title}</Text>
                  {channel.subtitle ? <Text style={styles.rowMeta}>{channel.subtitle}</Text> : null}
                </View>
              </View>
            {channel.cta ? (
              <Text
                style={[
                  styles.supportCTA,
                  channel.tone === 'positive' && styles.supportCTAPositive,
                  channel.tone === 'warning' && styles.supportCTAWarning,
                ]}
              >
                {channel.cta}
              </Text>
            ) : null}
          </AdaptiveGlassView>
        )})}

        <View style={styles.footerActions}>
          <Pressable >
            <AdaptiveGlassView style={styles.footerButton}>
              <Text style={styles.footerButtonText}>{copy.footer.report}</Text>
            </AdaptiveGlassView>
          </Pressable>
          <Pressable>
            <AdaptiveGlassView style={styles.footerButton}>
              <Text style={styles.footerButtonText}>{copy.footer.suggest}</Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
      </View>
    );
  }, [
    copy.channels,
    copy.footer.report,
    copy.footer.suggest,
    styles.supportRow,
    styles.supportRowItem,
    styles.rowLeft,
    styles.iconWrap,
    styles.rowTitle,
    styles.rowMeta,
    styles.supportCTA,
    styles.supportCTAPositive,
    styles.supportCTAWarning,
    styles.footerActions,
    styles.footerButton,
    styles.footerButtonText,
    theme.colors.iconText,
  ]);

  const renderSection = useCallback(
    (key: SectionKey) => {
      switch (key) {
        case 'popular':
          return renderPopular();
        case 'manuals':
          return renderManuals();
        case 'videos':
          return renderVideos();
        case 'contact':
          return renderSupport();
        default:
          return null;
      }
    },
    [renderManuals, renderPopular, renderSupport, renderVideos],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORT_SECTIONS.map((key) => (
          <View key={key} style={{ gap: 12 }} onLayout={register(key)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{copy.sections[key].title}</Text>
              <Text style={styles.sectionSubtitle}>{copy.sections[key].subtitle}</Text>
            </View>
            {renderSection(key)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupportScreen;
