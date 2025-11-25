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
        <Text style={styles.sectionTitle}>Core Assistant</Text>
        <SegmentedRow
          icon={Brain}
          label="Help level"
          options={['Minimal', 'Medium', 'Maximum']}
          value={helpLevel}
          onChange={(v) => setHelpLevel(v as typeof helpLevel)}
        />

        <Text style={styles.sectionTitle}>Areas of Application</Text>
        <View style={styles.cardContent}>
          <ToggleRow
            icon={Mic}
            label="Voice recognition"
            description="Capture and transcribe commands instantly."
            value={voiceRec}
            onChange={setVoiceRec}
          />
          <ToggleRow
            icon={ListChecks}
            label="Transaction categories"
            description="Auto-sort expenses into smart folders."
            value={trxCat}
            onChange={setTrxCat}
            right={
              <View style={styles.rowRight}>
                <Chip text="Accuracy 90%" />
                <Chip icon={trxCat ? Check : X} tone={trxCat ? 'positive' : 'negative'} />
              </View>
            }
          />
          <ToggleRow
            icon={Bell}
            label="Smart reminders"
            description="Surface nudges when timing matters."
            value={smartRem}
            onChange={setSmartRem}
          />
          <ToggleRow
            icon={TrendingUp}
            label="Predictions & Analytics"
            description="Forecast balances and spending trends."
            value={predAnalytics}
            onChange={setPredAnalytics}
          />
          <ToggleRow
            icon={MessageCircle}
            label="Motivational messages"
            description="Stay encouraged with micro-coaching."
            value={motivMsg}
            onChange={setMotivMsg}
          />
          <ToggleRow
            icon={CalendarDays}
            label="Schedule optimization"
            description="Re-balance your routines automatically."
            value={scheduleOpt}
            onChange={setScheduleOpt}
          />
        </View>

        <Text style={styles.sectionTitle}>Personalization</Text>
        <View style={styles.cardContent}>
          <InputRow
            icon={Users}
            label="Assistant name"
            value={name}
            placeholder="Assistant name"
            onChangeText={setName}
          />
          <OptionRow
            icon={MessageSquare}
            label="Talk style"
            value={talkStyle}
            onPress={() =>
              setTalkStyle((prev) =>
                prev === 'Friendly' ? 'Formal' : prev === 'Formal' ? 'Casual' : 'Friendly',
              )
            }
          />
          <OptionRow
            icon={Languages}
            label="Language"
            value={language}
            onPress={() => setLanguage((prev) => (prev === 'English' ? 'Uzbek' : 'English'))}
          />
        </View>

        <Text style={styles.sectionTitle}>Speech Settings</Text>
        <View style={styles.cardContent}>
          <ToggleRow
            icon={Keyboard}
            label="Voice typing"
            description="Replace manual typing with dictation."
            value={voiceTyping}
            onChange={setVoiceTyping}
            right={<Chip text={voiceTyping ? 'Enabled' : 'Muted'} />}
          />
          <SegmentedRow
            icon={Sparkles}
            label="Input mode"
            options={['Button', 'Gesture', 'Sentence']}
            value={inputMode}
            onChange={(v) => setInputMode(v as typeof inputMode)}
          />
          <OptionRow
            icon={Globe}
            label="Speech language"
            value={speechLang}
            onPress={() => setSpeechLang((prev) => (prev === 'English' ? 'Uzbek' : 'English'))}
          />

          <AdaptiveGlassView style={styles.rowPill}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Sparkles size={18} color={theme.colors.iconText} />
              </View>
              <View style={styles.labelGroup}>
                <Text style={styles.rowLabel}>Voice training</Text>
                <Text style={styles.rowDescription}>Teach Leora to match your tone.</Text>
              </View>
            </View>
            <Chip text="Start" />
          </AdaptiveGlassView>
        </View>

        <Text style={styles.sectionTitle}>AI Training</Text>
        <View style={styles.cardContent}>
          <View style={styles.statLine}>
            <Text style={styles.statKey}>Last update</Text>
            <Text style={styles.statVal}>3 days ago</Text>
          </View>
          <View style={styles.statLine}>
            <Text style={styles.statKey}>Categorizing accuracy</Text>
            <Text style={styles.statVal}>94%</Text>
          </View>
          <View style={styles.statLine}>
            <Text style={styles.statKey}>Personal rules</Text>
            <Text style={styles.statVal}>12</Text>
          </View>
          <Pressable
            android_ripple={{ color: rippleColor }}
            style={({ pressed }) => [styles.rulesRow, pressed && styles.pressed]}
          >
            <Text style={styles.rulesText}>Rule settings ›</Text>
          </Pressable>
        </View>

        <View style={styles.inlineHeader}>
          <Text style={styles.sectionTitle}>Virtual mentors</Text>
          <Text style={styles.inlineCounter}>Active {mentors.length}/10</Text>
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
                { id: String(prev.length + 1), name: 'Add new mentor', tag: 'Custom' },
              ])
            }
            style={({ pressed }) => [styles.mentorAdd, pressed && styles.pressed]}
          >
            <Text style={styles.mentorAddText}>+ Add new mentor</Text>
          </Pressable>
        </View>

        <Pressable style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}>
          <Text style={styles.resetText}>Reset AI settings</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AISettingsScreen;
