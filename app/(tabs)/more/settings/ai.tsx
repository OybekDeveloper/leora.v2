import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import {
  Bell,
  Brain,
  CalendarDays,
  Check,
  Globe,
  GripVertical,
  Keyboard,
  Languages,
  ListChecks,
  MessageCircle,
  MessageSquare,
  Mic,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react-native';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { useAISettingsLocalization } from '@/localization/more/settings';

type LucideIcon = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

type ToggleRowProps = {
  icon: LucideIcon;
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  right?: React.ReactNode;
};

type OptionRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  onPress: () => void;
};

type SegmentedRowProps = {
  icon: LucideIcon;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

type InputRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
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
      borderRadius: theme.radius.lg,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    cardContent: {
      paddingVertical: theme.spacing.md,
      backgroundColor: 'transparent',
      gap: theme.spacing.sm,
    },
    rowPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      marginRight: theme.spacing.sm,
    },
    rowLabel: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    rowDescription: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    labelGroup: {
      marginLeft: theme.spacing.sm,
      flexShrink: 1,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    iconBadge: {
      width: 38,
      height: 38,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.overlaySoft,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
    },
    chipPositive: {
      backgroundColor: theme.colors.successBg,
    },
    chipNegative: {
      backgroundColor: theme.colors.dangerBg,
    },
    chipIconSpacing: {
      marginRight: 6,
    },
    chipText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    inputWrap: {
      minWidth: 140,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    input: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      padding: 0,
    },
    segment: {
      flexDirection: 'row',
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentItemActive: {
      backgroundColor: theme.colors.highlight,
    },
    segmentText: {
      color: theme.colors.textMuted,
      fontWeight: '700',
      fontSize: 13,
    },
    segmentTextActive: {
      color: theme.colors.textPrimary,
    },
    statLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 6,
    },
    statKey: {
      color: theme.colors.textMuted,
      fontSize: 14,
    },
    statVal: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    rulesRow: {
      marginTop: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.cardItem,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    rulesText: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    inlineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
      marginBottom: 4,
    },
    inlineCounter: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    mentorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.cardItem,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    mentorLabel: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    mentorName: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    mentorTag: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    mentorHandle: {
      marginLeft: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mentorAdd: {
      backgroundColor: theme.colors.cardItem,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg ,
      alignItems: 'center',
    },
    mentorAddText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
    resetBtn: {
      marginTop: theme.spacing.xs,
      backgroundColor: 'transparent',
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingVertical: 14,
      alignItems: 'center',
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xxl,
    },
    resetText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.995 }],
    },
  });

const AISettingsScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useAISettingsLocalization();

  const rippleColor =
    theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';

  const Chip = ({
    icon: Icon,
    text,
    tone = 'default',
  }: {
    icon?: LucideIcon;
    text?: string;
    tone?: 'default' | 'positive' | 'negative';
  }) => (
    <View
      style={[
        styles.chip,
        tone === 'positive' && styles.chipPositive,
        tone === 'negative' && styles.chipNegative,
      ]}
    >
      {Icon ? (
        <View style={text ? styles.chipIconSpacing : undefined}>
          <Icon
            size={14}
            strokeWidth={2.6}
            color={
              tone === 'positive'
                ? theme.colors.success
                : tone === 'negative'
                ? theme.colors.danger
                : theme.colors.textMuted
            }
          />
        </View>
      ) : null}
      {text ? <Text style={styles.chipText}>{text}</Text> : null}
    </View>
  );

  const ToggleRow = ({ icon: Icon, label, description, value, onChange, right }: ToggleRowProps) => (
    <Pressable
      onPress={() => onChange(!value)}
    >
      <AdaptiveGlassView style={[styles.rowPill, { padding: 0 }]}>
        <View style={styles.rowLeft}>
          <View style={styles.iconBadge}>
            <Icon size={18} color={theme.colors.iconText} />
          </View>
          <View style={styles.labelGroup}>
            <Text style={styles.rowLabel}>{label}</Text>
            {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
          </View>
        </View>
        <View style={styles.rowRight}>
          {right ?? <Chip icon={value ? Check : X} tone={value ? 'positive' : 'negative'} />}
        </View>
      </AdaptiveGlassView>
    </Pressable >
  );

  const OptionRow = ({ icon: Icon, label, value, onPress }: OptionRowProps) => (
    <Pressable
      onPress={onPress}
    >
      <AdaptiveGlassView style={styles.rowPill}>
        <View style={styles.rowLeft}>
          <View style={styles.iconBadge}>
            <Icon size={18} color={theme.colors.iconText} />
          </View>
          <View style={styles.labelGroup}>
            <Text style={styles.rowLabel}>{label}</Text>
          </View>
        </View>
        <Chip text={value} />
      </AdaptiveGlassView>
    </Pressable>
  );

  const SegmentedRow = ({ icon: Icon, label, options, value, onChange }: SegmentedRowProps) => (
    <AdaptiveGlassView style={styles.rowPill}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBadge}>
          <Icon size={18} color={theme.colors.iconText} />
        </View>
        <View style={styles.labelGroup}>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
      </View>
      <View style={{ flexShrink: 0, minWidth: 200 }}>
        <View style={styles.segment}>
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => onChange(opt)}
                android_ripple={{ color: rippleColor }}
                style={({ pressed }) => [
                  styles.segmentItem,
                  selected && styles.segmentItemActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </AdaptiveGlassView>
  );

  const InputRow = ({ icon: Icon, label, value, placeholder, onChangeText }: InputRowProps) => (
    <AdaptiveGlassView style={styles.rowPill}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBadge}>
          <Icon size={18} color={theme.colors.iconText} />
        </View>
        <View style={styles.labelGroup}>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />
      </View>
    </AdaptiveGlassView>
  );

  const [helpLevel, setHelpLevel] = useState<'Minimal' | 'Medium' | 'Maximum'>('Minimal');

  const [voiceRec, setVoiceRec] = useState(true);
  const [trxCat, setTrxCat] = useState(true);
  const [smartRem, setSmartRem] = useState(false);
  const [predAnalytics, setPredAnalytics] = useState(true);
  const [motivMsg, setMotivMsg] = useState(false);
  const [scheduleOpt, setScheduleOpt] = useState(false);

  const [name, setName] = useState('Leora');
  const [talkStyle, setTalkStyle] = useState<'Friendly' | 'Formal' | 'Casual'>('Friendly');
  const [language, setLanguage] = useState<'English' | 'Uzbek'>('English');

  const [voiceTyping, setVoiceTyping] = useState(true);
  const [inputMode, setInputMode] = useState<'Button' | 'Gesture' | 'Sentence'>('Button');
  const [speechLang, setSpeechLang] = useState<'English' | 'Uzbek'>('English');

  const [mentors, setMentors] = useState([
    { id: '1', name: 'Warren Buffett', tag: 'Financial' },
    { id: '2', name: 'Elon Musk', tag: 'Productivity' },
    { id: '3', name: 'Marcus Aurelius', tag: 'Balance' },
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t.sections.coreAssistant}</Text>
        <SegmentedRow
          icon={Brain}
          label={t.coreAssistant.helpLevel}
          options={[t.coreAssistant.levels.minimal, t.coreAssistant.levels.medium, t.coreAssistant.levels.maximum]}
          value={helpLevel === 'Minimal' ? t.coreAssistant.levels.minimal : helpLevel === 'Medium' ? t.coreAssistant.levels.medium : t.coreAssistant.levels.maximum}
          onChange={(v) => {
            if (v === t.coreAssistant.levels.minimal) setHelpLevel('Minimal');
            else if (v === t.coreAssistant.levels.medium) setHelpLevel('Medium');
            else setHelpLevel('Maximum');
          }}
        />

        <Text style={styles.sectionTitle}>{t.sections.areasOfApplication}</Text>
        <View style={styles.cardContent}>
          <ToggleRow
            icon={Mic}
            label={t.areasOfApplication.voiceRecognition.label}
            description={t.areasOfApplication.voiceRecognition.description}
            value={voiceRec}
            onChange={setVoiceRec}
          />
          <ToggleRow
            icon={ListChecks}
            label={t.areasOfApplication.transactionCategories.label}
            description={t.areasOfApplication.transactionCategories.description}
            value={trxCat}
            onChange={setTrxCat}
            right={
              <View style={styles.rowRight}>
                <Chip text={`${t.areasOfApplication.transactionCategories.accuracy} 90%`} />
                <Chip icon={trxCat ? Check : X} tone={trxCat ? 'positive' : 'negative'} />
              </View>
            }
          />
          <ToggleRow
            icon={Bell}
            label={t.areasOfApplication.smartReminders.label}
            description={t.areasOfApplication.smartReminders.description}
            value={smartRem}
            onChange={setSmartRem}
          />
          <ToggleRow
            icon={TrendingUp}
            label={t.areasOfApplication.predictionsAnalytics.label}
            description={t.areasOfApplication.predictionsAnalytics.description}
            value={predAnalytics}
            onChange={setPredAnalytics}
          />
          <ToggleRow
            icon={MessageCircle}
            label={t.areasOfApplication.motivationalMessages.label}
            description={t.areasOfApplication.motivationalMessages.description}
            value={motivMsg}
            onChange={setMotivMsg}
          />
          <ToggleRow
            icon={CalendarDays}
            label={t.areasOfApplication.scheduleOptimization.label}
            description={t.areasOfApplication.scheduleOptimization.description}
            value={scheduleOpt}
            onChange={setScheduleOpt}
          />
        </View>

        <Text style={styles.sectionTitle}>{t.sections.personalization}</Text>
        <View style={styles.cardContent}>
          <InputRow
            icon={Users}
            label={t.personalization.assistantName.label}
            value={name}
            placeholder={t.personalization.assistantName.placeholder}
            onChangeText={setName}
          />
          <OptionRow
            icon={MessageSquare}
            label={t.personalization.talkStyle.label}
            value={talkStyle === 'Friendly' ? t.personalization.talkStyle.options.friendly : talkStyle === 'Formal' ? t.personalization.talkStyle.options.formal : t.personalization.talkStyle.options.casual}
            onPress={() =>
              setTalkStyle((prev) =>
                prev === 'Friendly' ? 'Formal' : prev === 'Formal' ? 'Casual' : 'Friendly',
              )
            }
          />
          <OptionRow
            icon={Languages}
            label={t.personalization.language}
            value={language}
            onPress={() => setLanguage((prev) => (prev === 'English' ? 'Uzbek' : 'English'))}
          />
        </View>

        <Text style={styles.sectionTitle}>{t.sections.speechSettings}</Text>
        <View style={styles.cardContent}>
          <ToggleRow
            icon={Keyboard}
            label={t.speechSettings.voiceTyping.label}
            description={t.speechSettings.voiceTyping.description}
            value={voiceTyping}
            onChange={setVoiceTyping}
            right={<Chip text={voiceTyping ? t.speechSettings.voiceTyping.enabled : t.speechSettings.voiceTyping.muted} />}
          />
          <SegmentedRow
            icon={Sparkles}
            label={t.speechSettings.inputMode.label}
            options={[t.speechSettings.inputMode.options.button, t.speechSettings.inputMode.options.gesture, t.speechSettings.inputMode.options.sentence]}
            value={inputMode === 'Button' ? t.speechSettings.inputMode.options.button : inputMode === 'Gesture' ? t.speechSettings.inputMode.options.gesture : t.speechSettings.inputMode.options.sentence}
            onChange={(v) => {
              if (v === t.speechSettings.inputMode.options.button) setInputMode('Button');
              else if (v === t.speechSettings.inputMode.options.gesture) setInputMode('Gesture');
              else setInputMode('Sentence');
            }}
          />
          <OptionRow
            icon={Globe}
            label={t.speechSettings.speechLanguage}
            value={speechLang}
            onPress={() => setSpeechLang((prev) => (prev === 'English' ? 'Uzbek' : 'English'))}
          />

          <AdaptiveGlassView style={styles.rowPill}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Sparkles size={18} color={theme.colors.iconText} />
              </View>
              <View style={styles.labelGroup}>
                <Text style={styles.rowLabel}>{t.speechSettings.voiceTraining.label}</Text>
                <Text style={styles.rowDescription}>{t.speechSettings.voiceTraining.description}</Text>
              </View>
            </View>
            <Chip text={t.speechSettings.voiceTraining.start} />
          </AdaptiveGlassView>
        </View>

        <Text style={styles.sectionTitle}>{t.sections.aiTraining}</Text>
        <View style={styles.cardContent}>
          <View style={styles.statLine}>
            <Text style={styles.statKey}>{t.aiTraining.lastUpdate}</Text>
            <Text style={styles.statVal}>3 {t.aiTraining.daysAgo}</Text>
          </View>
          <View style={styles.statLine}>
            <Text style={styles.statKey}>{t.aiTraining.categorizingAccuracy}</Text>
            <Text style={styles.statVal}>94%</Text>
          </View>
          <View style={styles.statLine}>
            <Text style={styles.statKey}>{t.aiTraining.personalRules}</Text>
            <Text style={styles.statVal}>12</Text>
          </View>
          <Pressable
            android_ripple={{ color: rippleColor }}
            style={({ pressed }) => [styles.rulesRow, pressed && styles.pressed]}
          >
            <Text style={styles.rulesText}>{t.aiTraining.ruleSettings} ›</Text>
          </Pressable>
        </View>

        <View style={styles.inlineHeader}>
          <Text style={styles.sectionTitle}>{t.sections.virtualMentors}</Text>
          <Text style={styles.inlineCounter}>{t.virtualMentors.active} {mentors.length}/10</Text>
        </View>

        <View style={styles.cardContent}>
          {mentors.map((mentor) => (
            <AdaptiveGlassView key={mentor.id} style={styles.mentorRow}>
              <View style={styles.iconBadge}>
                <Users size={18} color={theme.colors.iconText} />
              </View>
              <View style={styles.mentorLabel}>
                <Text style={styles.mentorName}>{mentor.name}</Text>
                <Text style={styles.mentorTag}>{mentor.tag}</Text>
              </View>
              <View style={styles.mentorHandle}>
                <GripVertical size={18} color={theme.colors.textMuted} />
              </View>
            </AdaptiveGlassView>
          ))}

          <Pressable
            android_ripple={{ color: rippleColor }}
            onPress={() =>
              setMentors((prev) => [
                ...prev,
                { id: String(prev.length + 1), name: 'Add new mentor', tag: t.virtualMentors.tags.custom },
              ])
            }
            style={({ pressed }) => [styles.mentorAdd, pressed && styles.pressed]}
          >
            <Text style={styles.mentorAddText}>{t.virtualMentors.addNewMentor}</Text>
          </Pressable>
        </View>

        <Pressable style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}>
          <Text style={styles.resetText}>{t.actions.resetAiSettings}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AISettingsScreen;
