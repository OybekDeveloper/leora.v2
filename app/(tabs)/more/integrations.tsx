import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Apple,
  CalendarDays,
  ChevronRight,
  CloudCog,
  CloudOff,
  Home,
  LifeBuoy,
  PlugZap,
  SmartphoneCharging,
  Watch,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useMorePagesLocalization } from '@/localization/more/pages';

type SectionKey = 'calendars' | 'banks' | 'applications' | 'devices';

type IntegrationItem = {
  key: string;
  name: string;
  meta?: string;
  statusLabel: string;
  statusTone?: 'positive' | 'warning' | 'neutral';
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom:32
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl,
      paddingTop: theme.spacing.lg,
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
          ? 'rgba(40,43,55,0.6)'
          : 'rgba(226,232,240,0.7)',
    },
    chipActive: {
      backgroundColor:
        theme.mode === 'dark'
          ? theme.colors.primary
          : theme.colors.primary,
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
    section: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.25,
    },
    sectionMeta: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.3,
    },
    sectionCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor:theme.colors.card
    },
    integrationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.md,
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
          ? 'rgba(35,38,52,0.8)'
          : 'rgba(226,232,240,0.7)',
    },
    integrationTextGroup: {
      flex: 1,
    },
    integrationName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    integrationMeta: {
      marginTop: 2,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    statusPill: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(56,60,72,0.7)'
          : 'rgba(226,232,240,0.7)',
    },
    statusPillPositive: {
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(34,197,94,0.16)'
          : 'rgba(16,185,129,0.18)',
    },
    statusPillWarning: {
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(250,204,21,0.16)'
          : 'rgba(234,179,8,0.2)',
    },
    statusPillText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: theme.colors.textSecondary,
    },
    statusPillTextPositive: {
      color: theme.colors.success,
    },
    statusPillTextWarning: {
      color: theme.colors.warning,
    },
    footerCard: {
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    footerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.full,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(56,60,72,0.85)'
          : 'rgba(229,231,235,0.85)',
    },
    footerButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: 0.3,
    },
  });

const getIntegrationIcon = (key: string, theme: Theme) => {
  switch (key) {
    case 'google-calendar':
      return <CalendarDays size={22} color="#34A853" />;
    case 'apple-calendar':
      return <Apple size={22} color={theme.colors.textPrimary} />;
    case 'outlook-calendar':
      return <CloudCog size={22} color={theme.colors.icon} />;
    case 'uzcard':
      return <CloudOff size={22} color={theme.colors.icon} />;
    case 'humo':
      return <LifeBuoy size={22} color={theme.colors.icon} />;
    case 'kapitalbank':
      return <Home size={22} color={theme.colors.icon} />;
    case 'ipotekabank':
      return <LifeBuoy size={22} color={theme.colors.icon} />;
    case 'telegram':
      return <PlugZap size={22} color="#34A853" />;
    case 'whatsapp':
      return <PlugZap size={22} color="#22C55E" />;
    case 'slack':
      return <PlugZap size={22} color={theme.colors.warning} />;
    case 'spotify':
      return <PlugZap size={22} color="#22C55E" />;
    case 'apple-watch':
      return <Watch size={24} color="#FFFFFF" />;
    case 'wear-os':
      return <SmartphoneCharging size={22} color={theme.colors.icon} />;
    default:
      return <PlugZap size={22} color={theme.colors.icon} />;
  }
};

const useSectionRegistry = () => {
  const sectionsRef = useRef<Partial<Record<SectionKey, number>>>({});
  const scrollRef = useRef<ScrollView | null>(null);
  const pending = useRef<SectionKey | null>(null);

  const scrollToSection = useCallback((key: SectionKey) => {
    const y = sectionsRef.current[key];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(y - 96, 0), animated: true });
    }
  }, []);

  const registerSection = useCallback(
    (key: SectionKey) =>
      (event: { nativeEvent: { layout: { y: number } } }) => {
        sectionsRef.current[key] = event.nativeEvent.layout.y;
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

  return { scrollRef, registerSection, scrollToSection, schedule };
};

const IntegrationsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { integrations: copy } = useMorePagesLocalization();
  const router = useRouter();

  const { section } = useLocalSearchParams<{ section?: string }>();
  const normalizedSection = (section?.toLowerCase() ?? 'calendars') as SectionKey;
  const sectionKeys = copy.sections.map((item) => item.key);
  const hasSection = sectionKeys.includes(normalizedSection);

  const { scrollRef, registerSection, schedule } = useSectionRegistry();

  useEffect(() => {
    if (hasSection) {
      schedule(normalizedSection);
    }
  }, [hasSection, normalizedSection, schedule]);

  const renderIntegrationRow = useCallback(
    (item: IntegrationItem) => {
      const toneStyles =
        item.statusTone === 'positive'
          ? [styles.statusPill, styles.statusPillPositive]
          : item.statusTone === 'warning'
          ? [styles.statusPill, styles.statusPillWarning]
          : [styles.statusPill];

      const toneTextStyles =
        item.statusTone === 'positive'
          ? [styles.statusPillText, styles.statusPillTextPositive]
          : item.statusTone === 'warning'
          ? [styles.statusPillText, styles.statusPillTextWarning]
          : [styles.statusPillText];

      return (
        <AdaptiveGlassView key={item.key} style={styles.integrationRow}>
          <View style={styles.rowLeft}>
            <AdaptiveGlassView style={styles.iconWrap}>{getIntegrationIcon(item.key, theme)}</AdaptiveGlassView>
            <View style={styles.integrationTextGroup}>
              <Text style={styles.integrationName}>{item.name}</Text>
              {item.meta ? <Text style={styles.integrationMeta}>{item.meta}</Text> : null}
            </View>
          </View>
          <AdaptiveGlassView style={toneStyles}>
            <Text style={toneTextStyles}>{item.statusLabel}</Text>
          </AdaptiveGlassView>
        </AdaptiveGlassView>
      );
    },
    [styles, theme],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {copy.sections.map((section) => (
          <View
            key={section.key}
            style={styles.section}
            onLayout={registerSection(section.key)}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionMeta}>{section.activeLabel}</Text>
            </View>
            <AdaptiveGlassView style={styles.sectionCard}>
              {section.items.map(renderIntegrationRow)}
            </AdaptiveGlassView>
          </View>
        ))}

        <AdaptiveGlassView style={styles.footerCard}>
          <Pressable onPress={() => router.push('/(tabs)/more/settings')}>
            <AdaptiveGlassView style={styles.footerButton}>
              <ChevronRight size={16} color={theme.colors.textPrimary} />
              <Text style={styles.footerButtonText}>{copy.footerCta}</Text>
            </AdaptiveGlassView>
          </Pressable>
        </AdaptiveGlassView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default IntegrationsScreen;
