// app/(modals)/voice-ai.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowDownRight,
  Check,
  Edit3,
  ListChecks,
  Mic,
  Repeat2,
  Trash2,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Theme, useAppTheme } from '@/constants/theme';

type VoiceStage = 'ready' | 'listening' | 'analyzing' | 'review';

interface ReviewCategory {
  id: string;
  label: string;
  count: number;
}

type ReviewKind = 'transaction' | 'task';

interface ReviewItem {
  id: string;
  kind: ReviewKind;
  title: string;
  subtitle: string;
  amount?: string;
  meta: string[];
  note?: string;
}

const TRANSCRIPT_SAMPLE = [
  'Запиши расход 45$ на кофе в Coffee Point.',
  'Заверши две помидорки по маркетинговому плану.',
  'Перекинь арендный платеж 600$ с основной карты.',
];

const REVIEW_DATA = {
  totalActions: 3,
  categories: [
    { id: 'transactions', label: 'Transactions', count: 2 },
    { id: 'tasks', label: 'Tasks', count: 1 },
  ] satisfies ReviewCategory[],
  items: [
    {
      id: 'txn-coffee',
      kind: 'transaction',
      title: 'Coffee Point • Lunch',
      subtitle: 'Outcome · Balance Cash',
      amount: '$45',
      meta: ['Category · Food & Drinks', 'Note · AI processed'],
    },
    {
      id: 'txn-rent',
      kind: 'transaction',
      title: 'Apartment Rent',
      subtitle: 'Transfer · Main Card → Landlord',
      amount: '$600',
      meta: ['Category · Housing', 'Auto-tagged · Recurring payment'],
    },
    {
      id: 'task-marketing',
      kind: 'task',
      title: 'Marketing plan recap',
      subtitle: 'Task · Today, 18:00',
      meta: ['2 pomodoros logged', 'Context · Campaign Q2'],
      note: 'Add summary to planner and ping the team in Focus Room.',
    },
  ] satisfies ReviewItem[],
};

const STAGE_HEADLINES: Record<
  VoiceStage,
  { title: string; subtitle: string }
> = {
  ready: {
    title: 'AI Voice Message',
    subtitle: 'Summon Leora and describe what you just accomplished.',
  },
  listening: {
    title: 'Listening',
    subtitle: 'Speak naturally – mention sums, tasks, or projects.',
  },
  analyzing: {
    title: 'Analyzing with AI',
    subtitle: 'Extracting actions, matching categories, preparing summary.',
  },
  review: {
    title: 'Recognized items',
    subtitle: 'Review suggestions, edit the details, and save the results.',
  },
};

const LISTENING_DURATION_MS = 1400;
const ANALYSIS_DURATION_MS = 2000;

const createStyles = (theme: Theme) => {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: Platform.select({ ios: 6, default: 10 }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 18,
      letterSpacing: 4,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.overlaySoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollArea: {
      flexGrow: 1,
      paddingBottom: 32,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 24,
      gap: 12,
    },
    heading: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    orbGradient: {
      width: 220,
      height: 220,
      borderRadius: 110,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    orbCore: {
      width: 170,
      height: 170,
      borderRadius: 85,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(10, 12, 26, 0.45)',
    },
    wave: {
      position: 'absolute',
      width: 200,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 999,
      backgroundColor: colors.primary,
      gap: 10,
    },
    primaryButtonDisabled: {
      backgroundColor: colors.overlaySoft,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
      backgroundColor: colors.surface,
    },
    secondaryButtonText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    transcriptCard: {
      width: '100%',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 18,
      gap: 12,
      marginTop: 16,
    },
    transcriptLabel: {
      fontSize: 12,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    transcriptLine: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    reviewSummary: {
      width: '100%',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
      marginTop: 12,
      gap: 14,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryCount: {
      fontSize: 34,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    categoryChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryChip: {
      borderRadius: 14,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.overlaySoft,
    },
    categoryChipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    reviewItemCard: {
      width: '100%',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 18,
      marginTop: 16,
      flexDirection: 'row',
      gap: 14,
    },
    reviewIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewBody: {
      flex: 1,
      gap: 6,
    },
    reviewTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    reviewTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    reviewAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    reviewSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    reviewMeta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    reviewNote: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textSecondary,
    },
    reviewActions: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 10,
    },
    reviewActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      gap: 6,
    },
    reviewActionActive: {
      backgroundColor: colors.success,
      borderColor: 'transparent',
    },
    reviewActionText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    reviewActionTextActive: {
      color: colors.onSuccess,
    },
    footer: {
      paddingVertical: 20,
      gap: 12,
    },
    helperText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
      paddingHorizontal: 12,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 20,
      opacity: 0.4,
    },
    historySection: {
      width: '100%',
      gap: 10,
    },
    historyCard: {
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    historyText: {
      fontSize: 14,
      color: colors.textPrimary,
    },
    historySub: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
};

const getKindColors = (theme: Theme, kind: ReviewKind) => {
  const { colors } = theme;
  if (kind === 'transaction') {
    return {
      background: colors.warning + '22',
      tint: colors.warning,
    };
  }
  return {
    background: colors.info + '22',
    tint: colors.info,
  };
};

export default function VoicePresentationModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [stage, setStage] = useState<VoiceStage>('ready');
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const listeningTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const analysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stageHeadline = STAGE_HEADLINES[stage];

  const startPulse = useCallback(() => {
    pulseAnimation.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnimation]);

  const startWave = useCallback(() => {
    waveAnimation.setValue(0);
    Animated.loop(
      Animated.timing(waveAnimation, {
        toValue: 1,
        duration: 2600,
        useNativeDriver: true,
      }),
    ).start();
  }, [waveAnimation]);

  const stopAnimations = useCallback(() => {
    pulseAnimation.stopAnimation();
    waveAnimation.stopAnimation();
  }, [pulseAnimation, waveAnimation]);

  const clearListeningTimers = useCallback(() => {
    listeningTimers.current.forEach((timer) => clearTimeout(timer));
    listeningTimers.current = [];
  }, []);

  const resetFlow = useCallback(() => {
    clearListeningTimers();
    if (analysisTimer.current) {
      clearTimeout(analysisTimer.current);
      analysisTimer.current = null;
    }
    stopAnimations();
    setStage('ready');
    setTranscriptLines([]);
    setReviewItems([]);
    setSelectedIds(new Set());
  }, [clearListeningTimers, stopAnimations]);

  useEffect(() => {
    return () => {
      clearListeningTimers();
      if (analysisTimer.current) {
        clearTimeout(analysisTimer.current);
      }
      stopAnimations();
    };
  }, [clearListeningTimers, stopAnimations]);

  useEffect(() => {
    if (stage === 'listening' || stage === 'analyzing') {
      startPulse();
      startWave();
    } else {
      stopAnimations();
    }
  }, [stage, startPulse, startWave, stopAnimations]);

  const handleStartTalking = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearListeningTimers();
    setTranscriptLines([]);
    setStage('listening');

    TRANSCRIPT_SAMPLE.forEach((line, index) => {
      const timer = setTimeout(() => {
        setTranscriptLines((prev) =>
          prev.includes(line) ? prev : [...prev, line],
        );
      }, LISTENING_DURATION_MS * (index + 1));
      listeningTimers.current.push(timer);
    });
  }, [clearListeningTimers]);

  const handleAnalyze = useCallback(() => {
    if (stage !== 'listening') {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStage('analyzing');
    clearListeningTimers();

    analysisTimer.current = setTimeout(() => {
      setStage('review');
      setReviewItems(REVIEW_DATA.items);
      setSelectedIds(new Set(REVIEW_DATA.items.map((item) => item.id)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, ANALYSIS_DURATION_MS);
  }, [stage, clearListeningTimers]);

  const handleToggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDiscardItem = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReviewItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleSaveSelection = useCallback(() => {
    if (!selectedIds.size) {
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetFlow();
  }, [selectedIds, resetFlow]);

  const selectedCount = selectedIds.size;

  const waveTranslate = waveAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-35, 35],
  });

  const waveScale = useMemo(() => {
    const amplitude = stage === 'listening' ? 1.12 : 1.04;
    return pulseAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, amplitude],
    });
  }, [pulseAnimation, stage]);

  const renderOrb = useCallback(
    (mode: VoiceStage) => {
      const showWave = mode === 'listening' || mode === 'analyzing';
      const gradientColors =
        mode === 'listening'
          ? ['#2E2566', '#11192F']
          : mode === 'analyzing'
            ? ['#202543', '#101523']
            : ['#1B303C', '#0E121E'];

      return (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.15, y: 0.2 }}
          end={{ x: 0.85, y: 0.9 }}
          style={styles.orbGradient}
        >
          {showWave && (
            <>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    transform: [{ scale: waveScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  {
                    transform: [{ translateX: waveTranslate }],
                    opacity: mode === 'analyzing' ? 0.7 : 1,
                  },
                ]}
              />
            </>
          )}
          <View style={styles.orbCore}>
            {mode === 'ready' && <Mic color="#FFFFFF" size={54} />}
            {mode === 'review' && <Check color="#FFFFFF" size={48} />}
            {mode === 'listening' && <Mic color="#FFFFFF" size={54} />}
            {mode === 'analyzing' && (
              <ActivityIndicator color="#FFFFFF" size="large" />
            )}
          </View>
        </LinearGradient>
      );
    },
    [styles.orbGradient, styles.orbCore, styles.wave, waveScale, waveTranslate],
  );

  const renderReady = () => (
    <View style={{ alignItems: 'center', gap: 18 }}>
      {renderOrb('ready')}
      <Text style={styles.heading}>{stageHeadline.title}</Text>
      <Text style={styles.subtitle}>{stageHeadline.subtitle}</Text>

      <TouchableOpacity
        onPress={handleStartTalking}
        style={styles.primaryButton}
        activeOpacity={0.85}
      >
        <Mic color={colors.onPrimary} size={20} />
        <Text style={styles.primaryButtonText}>Start Talking</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>
        Describe purchases, tasks, or quick reminders in one breath — Leora
        will unpack them into actions.
      </Text>

      <View style={styles.divider} />

      <View style={styles.historySection}>
        <Text style={styles.transcriptLabel}>Recent voice entries</Text>
        <View style={styles.historyCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyText}>Lunch expense at Bistro</Text>
            <Text style={styles.historySub}>Saved 2 mins ago · $18 • Food</Text>
          </View>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.75}
          >
            <Repeat2 color={colors.textPrimary} size={16} />
            <Text style={styles.secondaryButtonText}>Repeat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderListening = () => (
    <View style={{ alignItems: 'center', gap: 18 }}>
      {renderOrb('listening')}
      <Text style={styles.heading}>{stageHeadline.title}</Text>
      <Text style={styles.subtitle}>{stageHeadline.subtitle}</Text>

      <View style={styles.transcriptCard}>
        <Text style={styles.transcriptLabel}>Transcript (mock)</Text>
        {transcriptLines.length === 0 ? (
          <Text style={styles.transcriptLine}>Слушаю…</Text>
        ) : (
          transcriptLines.map((line, index) => (
            <Text key={index} style={styles.transcriptLine}>
              • {line}
            </Text>
          ))
        )}
      </View>
    </View>
  );

  const renderAnalyzing = () => (
    <View style={{ alignItems: 'center', gap: 18 }}>
      {renderOrb('analyzing')}
      <Text style={styles.heading}>{stageHeadline.title}</Text>
      <Text style={styles.subtitle}>{stageHeadline.subtitle}</Text>

      <View style={styles.transcriptCard}>
        <Text style={styles.transcriptLabel}>Transcript</Text>
        {transcriptLines.map((line, index) => (
          <Text key={index} style={styles.transcriptLine}>
            • {line}
          </Text>
        ))}
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={{ alignItems: 'center', gap: 18, paddingBottom: 18 }}>
      {renderOrb('review')}
      <Text style={styles.heading}>{stageHeadline.title}</Text>
      <Text style={styles.subtitle}>{stageHeadline.subtitle}</Text>

      <View style={styles.reviewSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryCount}>
            {REVIEW_DATA.totalActions.toString().padStart(2, '0')}
          </Text>
        </View>
        <View style={styles.categoryChips}>
          {REVIEW_DATA.categories.map((category) => (
            <View key={category.id} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>
                {category.label} · {category.count}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {reviewItems.map((item) => {
        const colorsConfig = getKindColors(theme, item.kind);
        const isSelected = selectedIds.has(item.id);

        return (
          <View key={item.id} style={styles.reviewItemCard}>
            <View
              style={[
                styles.reviewIcon,
                { backgroundColor: colorsConfig.background },
              ]}
            >
              {item.kind === 'transaction' ? (
                <ArrowDownRight color={colorsConfig.tint} size={22} />
              ) : (
                <ListChecks color={colorsConfig.tint} size={22} />
              )}
            </View>

            <View style={styles.reviewBody}>
              <View style={styles.reviewTitleRow}>
                <Text style={styles.reviewTitle}>{item.title}</Text>
                {item.amount ? (
                  <Text style={styles.reviewAmount}>{item.amount}</Text>
                ) : null}
              </View>
              <Text style={styles.reviewSubtitle}>{item.subtitle}</Text>
              {item.meta.map((meta, index) => (
                <Text key={index} style={styles.reviewMeta}>
                  {meta}
                </Text>
              ))}
              {item.note ? (
                <Text style={styles.reviewNote}>{item.note}</Text>
              ) : null}

              <View style={styles.reviewActions}>
                <TouchableOpacity
                  onPress={() => handleToggleItem(item.id)}
                  style={[
                    styles.reviewActionButton,
                    isSelected && styles.reviewActionActive,
                  ]}
                  activeOpacity={0.85}
                >
                  <Check
                    color={
                      isSelected ? colors.onSuccess : colors.textSecondary
                    }
                    size={16}
                  />
                  <Text
                    style={[
                      styles.reviewActionText,
                      isSelected && styles.reviewActionTextActive,
                    ]}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reviewActionButton}
                  activeOpacity={0.8}
                >
                  <Edit3 color={colors.textSecondary} size={16} />
                  <Text style={styles.reviewActionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDiscardItem(item.id)}
                  style={styles.reviewActionButton}
                  activeOpacity={0.8}
                >
                  <Trash2 color={colors.textSecondary} size={16} />
                  <Text style={styles.reviewActionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderStage = () => {
    switch (stage) {
      case 'ready':
        return renderReady();
      case 'listening':
        return renderListening();
      case 'analyzing':
        return renderAnalyzing();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (stage) {
      case 'ready':
        return null;
      case 'listening':
        return (
          <>
            <TouchableOpacity
              onPress={handleAnalyze}
              style={styles.primaryButton}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Analyzing with AI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetFlow}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Cancel recording</Text>
            </TouchableOpacity>
          </>
        );
      case 'analyzing':
        return (
          <>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.primaryButtonDisabled,
                { opacity: 0.6 },
              ]}
              activeOpacity={1}
              disabled
            >
              <ActivityIndicator color={colors.onPrimary} />
              <Text style={styles.primaryButtonText}>Analyzing with AI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetFlow}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        );
      case 'review':
        return (
          <>
            <TouchableOpacity
              onPress={handleSaveSelection}
              style={[
                styles.primaryButton,
                selectedCount === 0 && styles.primaryButtonDisabled,
                selectedCount === 0 && { opacity: 0.4 },
              ]}
              disabled={selectedCount === 0}
              activeOpacity={0.85}
            >
              <Check color={colors.onPrimary} size={18} />
              <Text style={styles.primaryButtonText}>
                Save {selectedCount} item{selectedCount === 1 ? '' : 's'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetFlow}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Mic color={colors.textPrimary} size={18} />
              <Text style={styles.secondaryButtonText}>Record again</Text>
            </TouchableOpacity>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={['#1B2238EE', '#090B14CC']}
        style={styles.backdrop}
      />

      <View style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LEORA</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
            activeOpacity={0.75}
          >
            <X color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollArea}
        >
          <View style={styles.heroSection}>{renderStage()}</View>
        </ScrollView>

        <View style={styles.footer}>{renderFooter()}</View>
      </View>
    </SafeAreaView>
  );
}
