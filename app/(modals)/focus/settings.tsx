import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme, useThemeColors } from '@/constants/theme';
import { useFocusSettingsStore } from '@/features/focus/useFocusSettingsStore';
import { useFocusTimerStore } from '@/features/focus/useFocusTimerStore';
import { TECHNIQUES, LOCK_OPTIONS, MOTIVATION_OPTIONS, LockId, MotivationId, TechniqueKey } from '@/features/focus/types';
import { useFocusSettingsStrings } from '@/localization/focus/useFocusLocalization';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type SettingsNumberInputProps = {
  value: number;
  onChange: (next: number) => void;
  placeholder: string;
  suffix: string;
  colors: ReturnType<typeof useThemeColors>;
  min?: number;
  max?: number;
};

const SettingsNumberInput = ({
  value,
  onChange,
  placeholder,
  suffix,
  colors,
  min = 0,
  max = 24 * 60,
}: SettingsNumberInputProps) => {
  const [textValue, setTextValue] = useState(String(value));

  useEffect(() => {
    setTextValue(String(value));
  }, [value]);

  const handleChange = useCallback(
    (next: string) => {
      setTextValue(next);
      const numeric = Number.parseInt(next, 10);
      if (!Number.isNaN(numeric)) {
        onChange(clamp(numeric, min, max));
      }
    },
    [max, min, onChange],
  );

  const handleBlur = useCallback(() => {
    if (textValue.trim() === '') {
      setTextValue(String(value));
    }
  }, [textValue, value]);

  return (
    <AdaptiveGlassView style={[styles.glassSurface, styles.sessionInput, { borderColor: colors.border }]}>
      <TextInput
        value={textValue}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType="number-pad"
        style={[styles.sessionInputText, { color: colors.textPrimary }]}
      />
      <Text style={[styles.sessionInputSuffix, { color: colors.textSecondary }]}>{suffix}</Text>
    </AdaptiveGlassView>
  );
};

type FocusCheckboxProps = {
  label: string;
  value: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

const FocusCheckbox = ({ label, value, onToggle, colors }: FocusCheckboxProps) => {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 160 });
  }, [progress, value]);

  const checkboxStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', colors.overlaySoft]),
  }));

  const checkOpacity = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.checkboxPressable, pressed && styles.pressed]}>
      <AdaptiveGlassView style={[styles.glassSurface, styles.checkboxCard, { borderColor: colors.border }]}>
        <View style={styles.checkboxLeft}>
          <Animated.View style={[styles.checkboxBox, checkboxStyle]}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.checkboxFill, checkOpacity]}>
              <Feather name="check" size={16} color={colors.white} />
            </Animated.View>
          </Animated.View>
          <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>{label}</Text>
        </View>
      </AdaptiveGlassView>
    </Pressable>
  );
};

export default function FocusSettingsModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const colors = useThemeColors();
  const strings = useFocusSettingsStrings();

  const techniqueKey = useFocusSettingsStore((state) => state.techniqueKey);
  const workMinutes = useFocusSettingsStore((state) => state.workMinutes);
  const breakMinutes = useFocusSettingsStore((state) => state.breakMinutes);
  const sessionsUntilBigBreak = useFocusSettingsStore((state) => state.sessionsUntilBigBreak);
  const bigBreakMinutes = useFocusSettingsStore((state) => state.bigBreakMinutes);
  const motivation = useFocusSettingsStore((state) => state.motivation);
  const locks = useFocusSettingsStore((state) => state.locks);
  const setTechnique = useFocusSettingsStore((state) => state.setTechnique);
  const setWorkMinutes = useFocusSettingsStore((state) => state.setWorkMinutes);
  const setBreakMinutes = useFocusSettingsStore((state) => state.setBreakMinutes);
  const setSessionsUntilBigBreak = useFocusSettingsStore((state) => state.setSessionsUntilBigBreak);
  const setBigBreakMinutes = useFocusSettingsStore((state) => state.setBigBreakMinutes);
  const toggleMotivation = useFocusSettingsStore((state) => state.toggleMotivation);
  const toggleLock = useFocusSettingsStore((state) => state.toggleLock);
  const resetSettings = useFocusSettingsStore((state) => state.resetSettings);
  const resetTimer = useFocusTimerStore((state) => state.reset);

  const techniqueLabels: Record<TechniqueKey, { label: string; summary: string }> = {
    pomodoro: { label: strings.technique.pomodoro, summary: strings.technique.pomodoroSummary },
    blocs: { label: strings.technique.blocs, summary: strings.technique.blocsSummary },
    free: { label: strings.technique.free, summary: strings.technique.freeSummary },
  };

  const lockLabels: Record<LockId, string> = {
    notifications: strings.locks.notifications,
    social: strings.locks.social,
    apps: strings.locks.apps,
    autoReply: strings.locks.autoReply,
  };

  const motivationLabels: Record<MotivationId, string> = {
    progress: strings.motivation.progress,
    sound: strings.motivation.sound,
    vibration: strings.motivation.vibration,
    music: strings.motivation.music,
  };

  const handleSave = useCallback(() => {
    resetTimer(workMinutes * 60);
    router.back();
  }, [resetTimer, router, workMinutes]);

  const handleReset = useCallback(() => {
    Alert.alert(
      strings.alerts.resetTitle,
      strings.alerts.resetMessage,
      [
        { text: strings.alerts.cancel, style: 'cancel' },
        {
          text: strings.alerts.resetConfirm,
          style: 'destructive',
          onPress: () => {
            resetSettings();
            resetTimer(TECHNIQUES[0].workMinutes * 60);
          },
        },
      ],
    );
  }, [resetSettings, resetTimer, strings.alerts]);

  const isSaveDisabled = false;

  return (
    <>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom', 'top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {strings.header.title}
          </Text>
          <Pressable onPress={router.back} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
              {strings.header.close}
            </Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {strings.technique.label}
              </Text>
              <View style={styles.segmentedControl}>
                {TECHNIQUES.map((item) => {
                  const selected = item.key === techniqueKey;
                  const labels = techniqueLabels[item.key];
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setTechnique(item.key)}
                      style={({ pressed }) => [styles.segmentPressable, pressed && styles.pressed]}
                    >
                      <AdaptiveGlassView
                        style={[
                          styles.glassSurface,
                          styles.segmentButton,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            opacity: selected ? 1 : 0.6,
                          },
                        ]}
                      >
                        <Text style={[styles.segmentLabel, { color: colors.textPrimary }]}>
                          {labels.label}
                        </Text>
                        <Text style={[styles.segmentSubLabel, { color: colors.textSecondary }]}>
                          {labels.summary}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {strings.session.label}
              </Text>
              <View style={styles.sessionGrid}>
                <SettingsNumberInput
                  value={workMinutes}
                  onChange={setWorkMinutes}
                  placeholder="Work"
                  suffix={strings.session.workTime}
                  colors={colors}
                  min={1}
                  max={24 * 60}
                />
                <SettingsNumberInput
                  value={breakMinutes}
                  onChange={setBreakMinutes}
                  placeholder="Break"
                  suffix={strings.session.breakTime}
                  colors={colors}
                  min={0}
                  max={24 * 60}
                />
                <SettingsNumberInput
                  value={sessionsUntilBigBreak}
                  onChange={setSessionsUntilBigBreak}
                  placeholder="Sessions"
                  suffix={strings.session.sessionsUntilBigBreak}
                  colors={colors}
                  min={1}
                  max={12}
                />
                <SettingsNumberInput
                  value={bigBreakMinutes}
                  onChange={setBigBreakMinutes}
                  placeholder="Big break"
                  suffix={strings.session.bigBreakTime}
                  colors={colors}
                  min={1}
                  max={60}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {strings.locks.label}
              </Text>
              <View style={styles.checkboxGrid}>
                {LOCK_OPTIONS.map((item) => (
                  <FocusCheckbox
                    key={item.id}
                    label={lockLabels[item.id as LockId]}
                    value={locks[item.id as LockId]}
                    onToggle={() => toggleLock(item.id as LockId)}
                    colors={colors}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {strings.motivation.label}
              </Text>
              <View style={styles.checkboxGrid}>
                {MOTIVATION_OPTIONS.map((item) => (
                  <FocusCheckbox
                    key={item.id}
                    label={motivationLabels[item.id as MotivationId]}
                    value={motivation[item.id as MotivationId]}
                    onToggle={() => toggleMotivation(item.id as MotivationId)}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <View style={styles.footerButtons}>
        <AnimatedPressable
          style={[
            styles.primaryButton,
            { backgroundColor: theme.colors.primary },
            isSaveDisabled && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaveDisabled}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>
            {strings.buttons.confirm}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={handleReset}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
            {strings.buttons.reset}
          </Text>
        </AnimatedPressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentPressable: {
    flex: 1,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  segmentSubLabel: {
    fontSize: 12,
    marginTop: 6,
  },
  sessionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 12,
  },
  sessionInput: {
    flexBasis: '47%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  sessionInputText: {
    fontSize: 18,
    fontWeight: '600',
  },
  sessionInputSuffix: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  checkboxGrid: {
    gap: 12,
  },
  checkboxPressable: {
    borderRadius: 16,
  },
  checkboxCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checkboxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxFill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
