import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';

import CustomModal, { CustomModalProps } from '@/components/modals/CustomModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useThemeColors } from '@/constants/theme';
import { useModalStore } from '@/stores/useModalStore';
import { useFocusSettingsStore } from '@/features/focus/useFocusSettingsStore';
import { useFocusTimerStore } from '@/features/focus/useFocusTimerStore';
import {
  LOCK_OPTIONS,
  MOTIVATION_OPTIONS,
  TECHNIQUES,
  LockId,
  MotivationId,
} from '@/features/focus/types';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const modalProps: Partial<CustomModalProps> = {
  variant: 'form',
  enableDynamicSizing: false,
  fallbackSnapPoint: '92%',
  scrollable: true,
  contentContainerStyle: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 20 },
};

const SettingsNumberInput = ({
  value,
  onChange,
  placeholder,
  suffix,
  colors,
  min = 0,
  max = 24 * 60,
}: {
  value: number;
  onChange: (next: number) => void;
  placeholder: string;
  suffix: string;
  colors: ReturnType<typeof useThemeColors>;
  min?: number;
  max?: number;
}) => {
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
    <AdaptiveGlassView style={[styles.glassSurface, styles.sessionInput]}>
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

const FocusCheckbox = ({
  label,
  value,
  onToggle,
  colors,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) => {
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
      <AdaptiveGlassView style={[styles.glassSurface, styles.checkboxCard]}>
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
  const colors = useThemeColors();
  const { focusSettingsModal, closeFocusSettingsModal } = useModalStore(
    useShallow((state) => ({
      focusSettingsModal: state.focusSettingsModal,
      closeFocusSettingsModal: state.closeFocusSettingsModal,
    })),
  );
  const modalRef = useRef<BottomSheetHandle>(null);

  useEffect(() => {
    if (focusSettingsModal.isOpen) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [focusSettingsModal.isOpen]);

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

  const handleSave = useCallback(() => {
    resetTimer(workMinutes * 60);
    closeFocusSettingsModal();
  }, [closeFocusSettingsModal, resetTimer, workMinutes]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset focus settings?',
      'This will restore default techniques and durations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetSettings();
            resetTimer(TECHNIQUES[0].workMinutes * 60);
          },
        },
      ],
    );
  }, [resetSettings, resetTimer]);

  return (
    <CustomModal ref={modalRef} onDismiss={closeFocusSettingsModal} {...modalProps}>
      <View style={styles.sheetContent}>
        <View style={styles.headerRow}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>FOCUS SETTINGS</Text>
          <Pressable onPress={closeFocusSettingsModal} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Feather name="x" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Technic</Text>
          <View style={styles.segmentedControl}>
            {TECHNIQUES.map((item) => {
              const selected = item.key === techniqueKey;
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
                        opacity: selected ? 1 : 0.6,
                      },
                    ]}
                  >
                    <Text style={[styles.segmentLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.segmentSubLabel, { color: colors.textSecondary }]}>{item.summary}</Text>
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Session duration</Text>
          <View style={styles.sessionGrid}>
            <SettingsNumberInput
              value={workMinutes}
              onChange={setWorkMinutes}
              placeholder="Work"
              suffix="Work time (m)"
              colors={colors}
              min={1}
              max={24 * 60}
            />
            <SettingsNumberInput
              value={breakMinutes}
              onChange={setBreakMinutes}
              placeholder="Break"
              suffix="Break time (m)"
              colors={colors}
              min={0}
              max={24 * 60}
            />
            <SettingsNumberInput
              value={sessionsUntilBigBreak}
              onChange={setSessionsUntilBigBreak}
              placeholder="Sessions"
              suffix="Sessions until big break"
              colors={colors}
              min={1}
              max={12}
            />
            <SettingsNumberInput
              value={bigBreakMinutes}
              onChange={setBigBreakMinutes}
              placeholder="Big break"
              suffix="Big break time (m)"
              colors={colors}
              min={1}
              max={60}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Locks</Text>
          <View style={styles.checkboxGrid}>
            {LOCK_OPTIONS.map((item) => (
              <FocusCheckbox
                key={item.id}
                label={item.label}
                value={locks[item.id as LockId]}
                onToggle={() => toggleLock(item.id as LockId)}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Motivation</Text>
          <View style={styles.checkboxGrid}>
            {MOTIVATION_OPTIONS.map((item) => (
              <FocusCheckbox
                key={item.id}
                label={item.label}
                value={motivation[item.id as MotivationId]}
                onToggle={() => toggleMotivation(item.id as MotivationId)}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <View style={styles.modalButtonsRow}>
          <Pressable onPress={handleReset} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
            <Text style={[styles.modalButtonGhostText, { color: colors.textSecondary }]}>Reset</Text>
          </Pressable>
          <Pressable onPress={handleSave} style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}>
            <AdaptiveGlassView style={[styles.glassSurface, styles.modalButtonInner]}>
              <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Confirm</Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    gap: 16,
    paddingHorizontal:20
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  iconButton: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '500',
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
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingTop: 8,
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 16,
  },
  modalButtonInner: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonGhostText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
