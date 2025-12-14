import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  SharedValue,
  Easing,
} from 'react-native-reanimated';
import {
  ShoppingCart,
  User,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Target,
  Check,
  Flame,
  Timer,
  Sparkles,
  Mic,
  Bell,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Car,
  AlertCircle,
  Wallet,
} from 'lucide-react-native';
import { type Theme } from '@/constants/theme';
import { type MockupType } from '@/data/onboardingPages';

// Mockup strings type
export interface MockupStrings {
  budget: { category: string };
  debt: { inDays: string };
  analytics: { income: string; expense: string; vsLastMonth: string; transport: string };
  accounts: { mainCard: string; savings: string };
  goals: { name: string };
  tasks: { item1: string; item2: string; item3: string };
  habits: { name: string; record: string };
  focus: { task: string };
  ai: { title: string; insight: string; suggestion: string };
  voice: { command: string; result: string };
  reminders: { debt: string; budget: string; today: string };
  predictions: { title: string; prediction: string; tip: string; accuracy: string };
}

interface MockupProps {
  type: MockupType;
  theme: Theme;
  scrollX: SharedValue<number>;
  pageIndex: number;
  screenWidth: number;
  strings: MockupStrings;
}

// Format number with spaces
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// Static data (numbers only - no text)
const MOCKUP_DATA = {
  budget: { spent: 450000, limit: 600000, currency: 'UZS', percentage: 75 },
  debt: {
    given: { name: 'Akbar', amount: 500000, dueIn: 5 },
    taken: { name: 'Sardor', amount: 300000, dueIn: 10 },
  },
  analytics: { income: 5000000, expense: 3200000, trend: 12, topAmount: 800000 },
  goals: { current: 3500000, target: 10000000, percentage: 35 },
  habits: { streak: 7, record: 21, days: [true, true, false, true, true, true, true, true, false, true] },
  focus: { duration: 25, completed: 3, total: 4 },
};

// ============ BUDGET MOCKUP ============
const BudgetMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const data = MOCKUP_DATA.budget;
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.cardItem }]}>
          <ShoppingCart size={20} color={theme.colors.textSecondary} />
        </View>
        <Text style={styles.cardTitle}>{strings.budget.category}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${data.percentage}%`,
                backgroundColor: theme.colors.textSecondary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{data.percentage}%</Text>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountSpent}>{formatNumber(data.spent)}</Text>
        <Text style={styles.amountDivider}>/</Text>
        <Text style={styles.amountLimit}>{formatNumber(data.limit)} {data.currency}</Text>
      </View>
    </View>
  );
};

// ============ DEBT MOCKUP ============
const DebtMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const data = MOCKUP_DATA.debt;
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.debtContainer}>
      {/* Given */}
      <View style={[styles.debtCard, { borderLeftColor: theme.colors.textSecondary }]}>
        <View style={styles.debtHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.cardItem }]}>
            <User size={16} color={theme.colors.textSecondary} />
          </View>
          <Text style={styles.debtName}>{data.given.name}</Text>
          <ArrowUp size={14} color={theme.colors.textSecondary} />
        </View>
        <Text style={[styles.debtAmount, { color: theme.colors.textPrimary }]}>
          +{formatNumber(data.given.amount)}
        </Text>
        <Text style={styles.debtDue}>{data.given.dueIn} {strings.debt.inDays}</Text>
      </View>

      {/* Taken */}
      <View style={[styles.debtCard, { borderLeftColor: theme.colors.textMuted }]}>
        <View style={styles.debtHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.cardItem }]}>
            <User size={16} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.debtName}>{data.taken.name}</Text>
          <ArrowDown size={14} color={theme.colors.textMuted} />
        </View>
        <Text style={[styles.debtAmount, { color: theme.colors.textSecondary }]}>
          -{formatNumber(data.taken.amount)}
        </Text>
        <Text style={styles.debtDue}>{data.taken.dueIn} {strings.debt.inDays}</Text>
      </View>
    </View>
  );
};

// ============ ANALYTICS MOCKUP ============
const AnalyticsMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const data = MOCKUP_DATA.analytics;
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.card}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{strings.analytics.income}</Text>
          <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
            {formatNumber(data.income)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{strings.analytics.expense}</Text>
          <Text style={[styles.statValue, { color: theme.colors.textSecondary }]}>
            {formatNumber(data.expense)}
          </Text>
        </View>
      </View>

      {/* Trend */}
      <View style={styles.trendRow}>
        <View style={[styles.trendBadge, { backgroundColor: theme.colors.cardItem }]}>
          <TrendingUp size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.trendText, { color: theme.colors.textSecondary }]}>+{data.trend}%</Text>
        </View>
        <Text style={styles.trendLabel} numberOfLines={2}>{strings.analytics.vsLastMonth}</Text>
      </View>

      {/* Top Category */}
      <View style={styles.topCategory}>
        <Car size={16} color={theme.colors.textMuted} />
        <Text style={styles.topCategoryText} numberOfLines={1}>{strings.analytics.transport}</Text>
        <Text style={styles.topCategoryAmount}>{formatNumber(data.topAmount)}</Text>
      </View>
    </View>
  );
};

// ============ ACCOUNTS MOCKUP ============
const AccountsMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const styles = createMockupStyles(theme);
  const cards = [
    { name: strings.accounts.mainCard, balance: 2500000, type: 'card', currency: 'UZS' },
    { name: strings.accounts.savings, balance: 5000000, type: 'savings', currency: 'UZS' },
  ];

  return (
    <View style={styles.accountsContainer}>
      {cards.map((card, index) => (
        <View key={index} style={styles.accountCard}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.cardItem }]}>
            {card.type === 'card' ? (
              <CreditCard size={18} color={theme.colors.textSecondary} />
            ) : (
              <PiggyBank size={18} color={theme.colors.textSecondary} />
            )}
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{card.name}</Text>
            <Text style={styles.accountBalance}>
              {formatNumber(card.balance)} {card.currency}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ============ GOALS MOCKUP ============
const GoalsMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const data = MOCKUP_DATA.goals;
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.goalHeader}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.cardItem }]}>
          <Target size={20} color={theme.colors.textSecondary} />
        </View>
        <Text style={styles.cardTitle}>{strings.goals.name}</Text>
      </View>

      {/* Progress Ring Simplified */}
      <View style={styles.goalProgress}>
        <View style={[styles.progressRing, { borderColor: theme.colors.textSecondary }]}>
          <Text style={[styles.progressRingText, { color: theme.colors.textPrimary }]}>{data.percentage}%</Text>
        </View>
      </View>

      <View style={styles.goalAmounts}>
        <Text style={styles.goalCurrent}>{formatNumber(data.current)}</Text>
        <Text style={styles.goalDivider}>/</Text>
        <Text style={styles.goalTarget}>{formatNumber(data.target)}</Text>
      </View>
    </View>
  );
};

// ============ TASKS MOCKUP ============
const TasksMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const styles = createMockupStyles(theme);
  const tasks = [
    { title: strings.tasks.item1, priority: 'high', done: false },
    { title: strings.tasks.item2, priority: 'medium', done: true },
    { title: strings.tasks.item3, priority: 'low', done: false },
  ];

  return (
    <View style={styles.tasksList}>
      {tasks.map((task, index) => (
        <View key={index} style={styles.taskItem}>
          <View style={[
            styles.taskCheckbox,
            task.done && { backgroundColor: theme.colors.textSecondary, borderColor: theme.colors.textSecondary },
          ]}>
            {task.done && <Check size={12} color={theme.colors.card} />}
          </View>
          <Text style={[
            styles.taskTitle,
            task.done && styles.taskTitleDone,
          ]}>
            {task.title}
          </Text>
          <View style={[
            styles.priorityDot,
            { backgroundColor: theme.colors.textMuted },
          ]} />
        </View>
      ))}
    </View>
  );
};

// ============ HABITS MOCKUP ============
const HabitsMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const data = MOCKUP_DATA.habits;
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.habitHeader}>
        <Text style={styles.cardTitle}>{strings.habits.name}</Text>
        <View style={[styles.streakBadge, { backgroundColor: theme.colors.cardItem }]}>
          <Flame size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.streakText, { color: theme.colors.textSecondary }]}>{data.streak}</Text>
        </View>
      </View>

      {/* Day bubbles */}
      <View style={styles.dayBubbles}>
        {data.days.map((done, index) => (
          <View
            key={index}
            style={[
              styles.dayBubble,
              { backgroundColor: done ? theme.colors.textSecondary : theme.colors.border },
            ]}
          />
        ))}
      </View>

      <View style={styles.habitStats}>
        <Text style={styles.habitStatLabel}>{strings.habits.record}:</Text>
        <Text style={styles.habitStatValue}>{data.record}</Text>
      </View>
    </View>
  );
};

// ============ FOCUS MOCKUP ============
const FocusMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const data = MOCKUP_DATA.focus;
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.focusTimer}>
        <View style={[styles.timerCircle, { borderColor: theme.colors.textSecondary }]}>
          <Timer size={24} color={theme.colors.textSecondary} />
          <Text style={[styles.timerText, { color: theme.colors.textPrimary }]}>{data.duration}:00</Text>
        </View>
      </View>

      <Text style={styles.focusTask}>{strings.focus.task}</Text>

      <View style={styles.pomodoroRow}>
        {[...Array(data.total)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pomodoroDot,
              { borderColor: theme.colors.textSecondary },
              index < data.completed && { backgroundColor: theme.colors.textSecondary },
            ]}
          />
        ))}
      </View>

      <Text style={styles.pomodoroText}>
        {data.completed}/{data.total} pomodoro
      </Text>
    </View>
  );
};

// ============ AI ANALYSIS MOCKUP ============
const AIAnalysisMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.aiCard}>
      <View style={styles.aiHeader}>
        <Sparkles size={20} color={theme.colors.textSecondary} />
        <Text style={styles.aiTitle}>{strings.ai.title}</Text>
      </View>

      <View style={styles.aiInsight}>
        <Car size={16} color={theme.colors.textMuted} />
        <Text style={styles.aiInsightText}>{strings.ai.insight}</Text>
      </View>

      <View style={[styles.aiSuggestion, { backgroundColor: theme.colors.cardItem }]}>
        <Lightbulb size={14} color={theme.colors.textSecondary} />
        <Text style={[styles.aiSuggestionText, { color: theme.colors.textSecondary }]}>{strings.ai.suggestion}</Text>
      </View>
    </View>
  );
};

// ============ VOICE MOCKUP ============
const VoiceMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.voiceCard}>
      <View style={[styles.micCircle, { backgroundColor: theme.colors.cardItem }]}>
        <Mic size={28} color={theme.colors.textSecondary} />
      </View>

      {/* Waveform */}
      <View style={styles.waveform}>
        {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3].map((height, index) => (
          <View
            key={index}
            style={[styles.waveBar, { height: 20 * height, backgroundColor: theme.colors.textSecondary }]}
          />
        ))}
      </View>

      <Text style={styles.voiceCommand}>{strings.voice.command}</Text>
      <View style={[styles.voiceResult, { backgroundColor: theme.colors.cardItem }]}>
        <Check size={14} color={theme.colors.textSecondary} />
        <Text style={[styles.voiceResultText, { color: theme.colors.textSecondary }]}>{strings.voice.result}</Text>
      </View>
    </View>
  );
};

// ============ REMINDERS MOCKUP ============
const RemindersMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const styles = createMockupStyles(theme);
  const items = [
    { title: strings.reminders.debt, time: `${strings.reminders.today} 18:00`, type: 'debt' },
    { title: strings.reminders.budget, time: `${strings.budget.category} 90%`, type: 'budget' },
  ];

  return (
    <View style={styles.remindersList}>
      {items.map((item, index) => (
        <View key={index} style={styles.reminderItem}>
          <View style={[styles.reminderIcon, { backgroundColor: theme.colors.cardItem }]}>
            {item.type === 'debt' ? (
              <Wallet size={16} color={theme.colors.textSecondary} />
            ) : (
              <AlertCircle size={16} color={theme.colors.textSecondary} />
            )}
          </View>
          <View style={styles.reminderContent}>
            <Text style={styles.reminderTitle}>{item.title}</Text>
            <Text style={styles.reminderTime}>{item.time}</Text>
          </View>
          <Bell size={14} color={theme.colors.textMuted} />
        </View>
      ))}
    </View>
  );
};

// ============ PREDICTIONS MOCKUP ============
const PredictionsMockup: React.FC<{ theme: Theme; strings: MockupStrings }> = ({ theme, strings }) => {
  const styles = createMockupStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.predictionHeader}>
        <Lightbulb size={20} color={theme.colors.textSecondary} />
        <Text style={styles.aiTitle}>{strings.predictions.title}</Text>
      </View>

      <Text style={styles.predictionText}>{strings.predictions.prediction}</Text>

      <View style={styles.predictionTip}>
        <TrendingDown size={14} color={theme.colors.textSecondary} />
        <Text style={[styles.predictionTipText, { color: theme.colors.textSecondary }]}>{strings.predictions.tip}</Text>
      </View>

      <View style={styles.accuracyBadge}>
        <Text style={styles.accuracyText}>94% {strings.predictions.accuracy}</Text>
      </View>
    </View>
  );
};

// ============ MAIN MOCKUP COMPONENT ============
export const OnboardingMockup: React.FC<MockupProps> = ({
  type,
  theme,
  scrollX,
  pageIndex,
  screenWidth,
  strings,
}) => {
  const inputRange = [
    (pageIndex - 1) * screenWidth,
    pageIndex * screenWidth,
    (pageIndex + 1) * screenWidth,
  ];

  // Smooth animation with easing - no spring bouncing
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: withTiming(scale, { duration: 300, easing: Easing.out(Easing.cubic) }) }],
      opacity: withTiming(opacity, { duration: 300, easing: Easing.out(Easing.cubic) }),
    };
  });

  const renderMockup = () => {
    switch (type) {
      case 'budget':
        return <BudgetMockup theme={theme} strings={strings} />;
      case 'debt':
        return <DebtMockup theme={theme} strings={strings} />;
      case 'analytics':
        return <AnalyticsMockup theme={theme} strings={strings} />;
      case 'accounts':
        return <AccountsMockup theme={theme} strings={strings} />;
      case 'goals':
        return <GoalsMockup theme={theme} strings={strings} />;
      case 'tasks':
        return <TasksMockup theme={theme} strings={strings} />;
      case 'habits':
        return <HabitsMockup theme={theme} strings={strings} />;
      case 'focus':
        return <FocusMockup theme={theme} strings={strings} />;
      case 'ai-analysis':
        return <AIAnalysisMockup theme={theme} strings={strings} />;
      case 'voice':
        return <VoiceMockup theme={theme} strings={strings} />;
      case 'reminders':
        return <RemindersMockup theme={theme} strings={strings} />;
      case 'predictions':
        return <PredictionsMockup theme={theme} strings={strings} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[{ marginVertical: 20 }, animatedStyle]}>
      {renderMockup()}
    </Animated.View>
  );
};

// ============ STYLES ============
const createMockupStyles = (theme: Theme) =>
  StyleSheet.create({
    // Card base
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      width: 280,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginLeft: 10,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Budget
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressBar: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: theme.radius.full,
      marginRight: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.radius.full,
    },
    progressText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      width: 35,
      textAlign: 'right',
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    amountSpent: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    amountDivider: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginHorizontal: 4,
    },
    amountLimit: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    // Debt
    debtContainer: {
      width: 280,
      gap: 10,
    },
    debtCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: 12,
      borderLeftWidth: 3,
    },
    debtHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    avatarCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    debtName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginLeft: 8,
    },
    debtAmount: {
      fontSize: 16,
      fontWeight: '700',
    },
    debtDue: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },

    // Analytics
    statsRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
    },
    trendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 12,
      gap: 6,
    },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexShrink: 0,
    },
    trendText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    trendLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      flex: 1,
      flexShrink: 1,
    },
    topCategory: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.cardItem,
      padding: 8,
      borderRadius: 8,
    },
    topCategoryText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginLeft: 8,
      marginRight: 8,
    },
    topCategoryAmount: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      flexShrink: 0,
    },

    // Accounts
    accountsContainer: {
      width: 280,
      gap: 10,
    },
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: 12,
    },
    accountInfo: {
      flex: 1,
      marginLeft: 12,
    },
    accountName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    accountBalance: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginTop: 2,
    },

    // Goals
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    goalProgress: {
      alignItems: 'center',
      marginBottom: 12,
    },
    progressRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.cardItem,
    },
    progressRingText: {
      fontSize: 20,
      fontWeight: '700',
    },
    goalAmounts: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'baseline',
    },
    goalCurrent: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    goalDivider: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginHorizontal: 4,
    },
    goalTarget: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    // Tasks
    tasksList: {
      width: 280,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xxl,
      padding: 12,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    taskCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskTitle: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textPrimary,
      marginLeft: 10,
    },
    taskTitleDone: {
      textDecorationLine: 'line-through',
      color: theme.colors.textMuted,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    // Habits
    habitHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    streakText: {
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 4,
    },
    dayBubbles: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 12,
    },
    dayBubble: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    habitStats: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    habitStatLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 4,
    },
    habitStatValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },

    // Focus
    focusTimer: {
      alignItems: 'center',
      marginBottom: 12,
    },
    timerCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.cardItem,
    },
    timerText: {
      fontSize: 22,
      fontWeight: '700',
      marginTop: 4,
    },
    focusTask: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    pomodoroRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 8,
    },
    pomodoroDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: 'transparent',
      borderWidth: 2,
    },
    pomodoroText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },

    // AI
    aiCard: {
      width: 280,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    aiTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginLeft: 8,
    },
    aiInsight: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.cardItem,
      padding: 12,
      borderRadius: 10,
      marginBottom: 10,
    },
    aiInsightText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginLeft: 8,
      lineHeight: 18,
      flexShrink: 1,
    },
    aiSuggestion: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 10,
      borderRadius: 8,
    },
    aiSuggestionText: {
      flex: 1,
      fontSize: 12,
      marginLeft: 8,
      flexShrink: 1,
      lineHeight: 16,
    },

    // Voice
    voiceCard: {
      width: 280,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xxl,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    micCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    waveform: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginBottom: 16,
      height: 24,
    },
    waveBar: {
      width: 4,
      borderRadius: 2,
    },
    voiceCommand: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 8,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    voiceResult: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      maxWidth: '100%',
    },
    voiceResultText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
      flexShrink: 1,
    },

    // Reminders
    remindersList: {
      width: 280,
      gap: 10,
    },
    reminderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: 12,
    },
    reminderIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reminderContent: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
    },
    reminderTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    reminderTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },

    // Predictions
    predictionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    predictionText: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    predictionTip: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    predictionTipText: {
      fontSize: 13,
      marginLeft: 6,
      flex: 1,
      flexShrink: 1,
      textAlign: 'center',
    },
    accuracyBadge: {
      alignSelf: 'center',
      backgroundColor: theme.colors.cardItem,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    accuracyText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
  });

export default OnboardingMockup;
