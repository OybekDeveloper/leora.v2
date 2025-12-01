import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useNotificationsSettingsLocalization } from '@/localization/more/settings';
import { SafeAreaView } from 'react-native-safe-area-context';

type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  right?: React.ReactNode;
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
      color: theme.colors.textMuted,
      fontSize: 13,
      letterSpacing: 0.5,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    card: {
      marginBottom: theme.spacing.lg,
    },
    cardContent: {
      paddingVertical: theme.spacing.md,
      backgroundColor: 'transparent',
      gap: 6
    },
    rowPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,

    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkBox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
      backgroundColor: 'transparent',
    },
    checkBoxOn: {
      backgroundColor: theme.colors.highlight,
      borderColor: theme.colors.primary,
    },
    checkMark: {
      color: theme.colors.primary,
      fontWeight: '800',
      fontSize: 12,
      lineHeight: 12,
    },
    rowLabel: {
      color: theme.colors.textPrimary,
      fontSize: 15,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    inlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      marginBottom: 4,
      paddingHorizontal: theme.spacing.xs,
    },
    inlineLabel: {
      color: theme.colors.textMuted,
      width: 46,
      fontSize: 14,
    },
    inlineTo: {
      color: theme.colors.textMuted,
      marginHorizontal: theme.spacing.xs,
    },
    chip: {
      backgroundColor: theme.colors.overlaySoft,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      marginLeft: theme.spacing.sm,
    },
    chipText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    timeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.cardItem,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 7,
      borderRadius: theme.radius.full,
      marginLeft: theme.spacing.sm,
    },
    timeIcon: {
      marginRight: theme.spacing.xs,
      color: theme.colors.textMuted,
    },
    timeText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    footer: {
      flexDirection: 'row',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xxl,
    },
    primaryBtn: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    primaryBtnText: {
      color: theme.colors.onPrimary,
      fontWeight: '800',
      fontSize: 15,
    },
    ghostBtn: {
      flex: 1,
      backgroundColor: 'transparent',
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingVertical: 14,
      alignItems: 'center',
      marginLeft: theme.spacing.sm,
    },
    ghostBtnText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
      fontSize: 15,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.995 }],
    },
  });

const NotificationsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useNotificationsSettingsLocalization();

  const renderChip = (text: string) => (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );

  const renderTimeChip = (text: string, icon?: string) => (
    <View style={styles.timeChip}>
      {icon ? <Text style={styles.timeIcon}>{icon}</Text> : null}
      <Text style={styles.timeText}>{text}</Text>
    </View>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const ToggleRow = ({ label, value, onChange, right }: ToggleRowProps) => (
    <AdaptiveGlassView style={[styles.rowPill, {
      borderRadius: theme.radius.lg,
    }]}>
      <Pressable onPress={() => onChange(!value)} style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={styles.rowLeft}>
          <View style={[styles.checkBox, value && styles.checkBoxOn]}>
            {value ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        {right ? <View style={styles.rowRight}>{right}</View> : null}
      </Pressable>
    </AdaptiveGlassView>
  );

  const [push, setPush] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [lockscreen, setLockscreen] = useState(true);

  const [overspend, setOverspend] = useState(true);
  const [debt, setDebt] = useState(true);
  const [unusual, setUnusual] = useState(true);
  const [goals, setGoals] = useState(true);

  const [taskRem, setTaskRem] = useState(true);
  const [deadline, setDeadline] = useState(true);
  const [goalProg, setGoalProg] = useState(true);
  const [resched, setResched] = useState(false);

  const [morning, setMorning] = useState(true);
  const [night, setNight] = useState(true);
  const [streak, setStreak] = useState(true);
  const [motivation, setMotivation] = useState(true);

  const [smartRec, setSmartRec] = useState(true);
  const [insight, setInsight] = useState(true);
  const [mentorsAdv, setMentorsAdv] = useState(true);
  const [predicts, setPredicts] = useState(false);

  const [dnd, setDnd] = useState(false);
  const [weekends, setWeekends] = useState(false);

  const timeMain = useMemo(() => ({ start: '08:00', end: '21:00' }), []);
  const timeDnd = useMemo(() => ({ from: '09:00', to: '21:00' }), []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle title={t.sections.main} />
        <View style={styles.cardContent}>
          <ToggleRow label={t.main.pushNotifications} value={push} onChange={setPush} />
          <ToggleRow label={t.main.sound} value={sound} onChange={setSound} />
          <ToggleRow label={t.main.vibration} value={vibration} onChange={setVibration} />
          <ToggleRow label={t.main.showOnLockScreen} value={lockscreen} onChange={setLockscreen} />
        </View>

        <SectionTitle title={t.sections.finance} />
        <View style={styles.cardContent}>
          <ToggleRow label={t.finance.budgetOverspend} value={overspend} onChange={setOverspend} />
          <ToggleRow label={t.finance.debtReminder} value={debt} onChange={setDebt} />
          <ToggleRow label={t.finance.unusualSpends} value={unusual} onChange={setUnusual} />
          <ToggleRow label={t.finance.financialGoalsAchievements} value={goals} onChange={setGoals} />
          <View style={styles.inlineRow}>
            <Text style={styles.inlineLabel}>{t.finance.time}</Text>
            <View style={{ flexDirection: 'row' }}>
              {renderTimeChip(timeMain.start, '⏰')}
              {renderTimeChip(timeMain.end, '⏰')}
            </View>
          </View>
        </View>

        <SectionTitle title={t.sections.taskAndGoals} />
        <View style={styles.cardContent}>
          <ToggleRow
            label={t.taskAndGoals.taskReminder}
            value={taskRem}
            onChange={setTaskRem}
            right={
              <View style={{ flexDirection: 'row' }}>
                {renderChip(t.taskAndGoals.before)}
                {renderChip(`15 ${t.timeUnits.mins}`)}
              </View>
            }
          />
          <ToggleRow
            label={t.taskAndGoals.deadline}
            value={deadline}
            onChange={setDeadline}
            right={
              <View style={{ flexDirection: 'row' }}>
                {renderChip(t.taskAndGoals.before)}
                {renderChip(`1 ${t.timeUnits.day}`)}
              </View>
            }
          />
          <ToggleRow
            label={t.taskAndGoals.goalProgress}
            value={goalProg}
            onChange={setGoalProg}
            right={renderChip(t.taskAndGoals.everyday)}
          />
          <ToggleRow
            label={t.taskAndGoals.taskRescheduleSuggestion}
            value={resched}
            onChange={setResched}
          />
        </View>

        <SectionTitle title={t.sections.habits} />
        <View style={styles.cardContent}>
          <ToggleRow
            label={t.habits.morningHabits}
            value={morning}
            onChange={setMorning}
            right={renderChip('07:00')}
          />
          <ToggleRow
            label={t.habits.nightHabits}
            value={night}
            onChange={setNight}
            right={renderChip('21:00')}
          />
          <ToggleRow label={t.habits.streakReminder} value={streak} onChange={setStreak} />
          <ToggleRow label={t.habits.motivationalMessages} value={motivation} onChange={setMotivation} />
        </View>

        <SectionTitle title={t.sections.aiAssistant} />
        <View style={styles.cardContent}>
          <ToggleRow
            label={t.aiAssistant.smartRecommendation}
            value={smartRec}
            onChange={setSmartRec}
            right={renderChip(t.aiAssistant.timesPerDay)}
          />
          <ToggleRow
            label={t.aiAssistant.insightAndAnalytics}
            value={insight}
            onChange={setInsight}
            right={renderChip(t.aiAssistant.everyWeek)}
          />
          <ToggleRow
            label={t.aiAssistant.mentorsAdvices}
            value={mentorsAdv}
            onChange={setMentorsAdv}
            right={renderChip(t.taskAndGoals.everyday)}
          />
          <ToggleRow
            label={t.aiAssistant.predictionsAndForecasts}
            value={predicts}
            onChange={setPredicts}
          />
        </View>

        <SectionTitle title={t.sections.doNotDisturb} />
        <View style={styles.cardContent}>
          <ToggleRow label={t.doNotDisturb.dontDisturb} value={dnd} onChange={setDnd} />
          <View style={styles.inlineRow}>
            <Text style={styles.inlineLabel}>{t.doNotDisturb.time}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {renderChip(t.doNotDisturb.from)}
              {renderTimeChip(timeDnd.from, '⏰')}
              <Text style={styles.inlineTo}>{t.doNotDisturb.to}</Text>
              {renderTimeChip(timeDnd.to, '⏰')}
            </View>
          </View>
          <ToggleRow label={t.doNotDisturb.onWeekends} value={weekends} onChange={setWeekends} />
        </View>

        <View style={styles.footer}>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
            <Text style={styles.primaryBtnText}>{t.actions.save}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
            <Text style={styles.ghostBtnText}>{t.actions.testNotification}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
