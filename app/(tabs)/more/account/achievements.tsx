import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { createThemedStyles, useAppTheme } from '@/constants/theme';
import {
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';

import { useAccountLocalization } from '@/localization/more/account';

/* --------------------------------- Styles -------------------------------- */
const useStyles = createThemedStyles((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl * 2,
    gap: theme.spacing.lg,
  },
  card: {
    borderRadius: 16,
    backgroundColor: theme.colors.card,
  },
  cardInner: {
    padding: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.mode === 'dark'
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(15,23,42,0.08)',
  },

  // Header (Completion)
  capSmall: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  completionRow: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionLeft: {
    flex: 1,
    gap: 10,
  },
  completionNumber: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: '#f4d24b',
  },
  completionSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  trophyWrap: {
    width: 110,
    height: 110,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Accordion
  accHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  accTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  // Achievement rows
  item: {
    paddingVertical: 12,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  itemRight: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  itemSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  itemDetails: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  tabUnderline: {
    height: 2,
    marginTop: 6,
    borderRadius: 2,
  },

  // Category lines
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  catCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  showAll: {
    alignSelf: 'center',
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
}));

/* ------------------------------- Utilities ------------------------------- */
const HR = () => {
  const styles = useStyles();
  return <View style={styles.hr} />;
};

type AccProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};
/** Measure‑based accordion with smooth height animation */
const Accordion: React.FC<AccProps> = ({ title, defaultOpen = true, children }) => {
  const styles = useStyles();
  const theme = useAppTheme();

  const [contentH, setContentH] = useState(0);
  const open = useSharedValue(defaultOpen ? 1 : 0);

  const animated = useAnimatedStyle(() => {
    return {
      height: withTiming(open.value ? contentH : 0, {
        duration: 260,
        easing: Easing.out(Easing.quad),
      }),
      opacity: withTiming(open.value ? 1 : 0.4, { duration: 240 }),
    };
  }, [contentH]);

  const toggle = useCallback(() => {
    open.value = open.value ? 0 : 1;
  }, []);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(open.value ? '180deg' : '0deg', { duration: 220 }) }],
  }));

  return (
    <View>
      <Pressable onPress={toggle} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, styles.accHeader]}>
        <Text style={styles.accTitle}>{title}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color={theme.colors.icon} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[{ overflow: 'hidden' }, animated]}>
        {/* measure box */}
        <View
          onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

type RowProps = {
  title: string;
  subtitle: string;
  details: string;
  right?: string; // time or progress
};
const AchievementRow: React.FC<RowProps> = ({ title, subtitle, details, right }) => {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <Text style={styles.itemTitle}>{title}</Text>
        {right ? <Text style={styles.itemRight}>{right}</Text> : null}
      </View>
      <Text style={styles.itemSub}>{subtitle}</Text>
      <Text style={styles.itemDetails}>{details}</Text>
    </View>
  );
};

/* --------------------------------- Screen -------------------------------- */
export default function Achievements() {
  const styles = useStyles();
  const theme = useAppTheme();
  const { achievements: copy } = useAccountLocalization();
  const defaultTab = copy.categories.tabs[0]?.key ?? 'all';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const underlineWidth = useMemo(() => {
    // simple underline width approximation by label length
    const base = 16;
    return (label: string) => Math.max(base, Math.min(80, label.length * 7));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <AdaptiveGlassView style={styles.card}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.cardInner}>
              <Text style={styles.sectionTitle}>{copy.title}</Text>
              <HR />

              <View style={styles.completionRow}>
                <View style={styles.completionLeft}>
                  <View>
                    <Text style={styles.capSmall}>{copy.completionLabel}:</Text>
                    <Text style={styles.completionNumber}>
                      {copy.completion.done}/{copy.completion.total} ({copy.completion.percent}%)
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.capSmall}>{copy.lastAchievementLabel}:</Text>
                    <Text style={[styles.itemTitle, { marginBottom: 2 }]}>{copy.completion.last.title}</Text>
                    <Text style={styles.itemSub}>{copy.completion.last.subtitle}</Text>
                    <Text style={styles.itemDetails}>{copy.completion.last.details}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </AdaptiveGlassView>

        {/* ---------------------------- RECENTLY UNLOCKED --------------------------- */}
        <AdaptiveGlassView style={styles.card}>
          <View style={styles.cardInner}>
            <Accordion title={copy.recentlyUnlocked.title} defaultOpen>
              <HR />
              {copy.recentlyUnlocked.items.map((a, i) => (
                <View key={a.title}>
                  <AchievementRow
                    title={a.title}
                    subtitle={a.subtitle}
                    details={a.details}
                    right={a.time}
                  />
                  {i < copy.recentlyUnlocked.items.length - 1 ? <HR /> : null}
                </View>
              ))}
            </Accordion>
          </View>
        </AdaptiveGlassView>

        {/* --------------------------- CLOSE TO UNLOCKING --------------------------- */}
        <AdaptiveGlassView style={styles.card}>
          <View style={styles.cardInner}>
            <Accordion title={copy.closeToUnlocking.title} defaultOpen>
              <HR />
              {copy.closeToUnlocking.items.map((a, i) => (
                <View key={a.title}>
                  <AchievementRow
                    title={a.title}
                    subtitle={a.subtitle}
                    details={a.details}
                    right={a.progress}
                  />
                  {i < copy.closeToUnlocking.items.length - 1 ? <HR /> : null}
                </View>
              ))}
            </Accordion>
          </View>
        </AdaptiveGlassView>

        {/* -------------------------------- CATEGORIES ------------------------------ */}
        <AdaptiveGlassView style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={styles.sectionTitle}>{copy.categories.title}</Text>
            <HR />

            {/* Tabs */}
            <View style={[styles.tabsRow, { marginTop: 8 }]}>
              {copy.categories.tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View>
                      <Text style={[styles.tabText, isActive && styles.tabActive]}>{tab.label}</Text>
                      {isActive ? (
                        <View
                          style={[
                            styles.tabUnderline,
                            {
                              width: underlineWidth(tab.label),
                              backgroundColor: theme.colors.textPrimary,
                            },
                          ]}
                        />
                      ) : (
                        <View style={[styles.tabUnderline, { width: underlineWidth(tab.label), backgroundColor: 'transparent' }]} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <HR />

            {/* Category list (static like in mock) */}
            {copy.categories.list.map((c, i) => (
              <View key={c.name}>
                <View style={styles.catRow}>
                  <View style={styles.catLeft}>
                    <Image source={require('@assets/images/achievementItem.png')} style={{ width: 24, height: 24 }} />
                    <Text style={styles.catText}>{c.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.catCount}>{c.count}</Text>
                    <ChevronRight size={16} color={theme.colors.icon} />
                  </View>
                </View>
                {i < copy.categories.list.length - 1 ? <HR /> : null}
              </View>
            ))}

            <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
              <Text style={styles.showAll}>{copy.categories.showAll}</Text>
            </Pressable>
          </View>
        </AdaptiveGlassView>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
