import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import {
  MIN_PASSWORD_LENGTH,
  PasswordRequirementKey,
  evaluatePasswordRequirements,
} from '@/utils/validation';
import type { AppTranslations } from '@/localization/strings';

type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

type PasswordStrengthMeterProps = {
  password: string;
  visible: boolean;
  guideStrings: AppTranslations['auth']['register']['passwordGuide'];
};

const STRENGTH_COLORS: Record<PasswordStrengthLevel, string> = {
  weak: '#ef4444',
  medium: '#facc15',
  strong: '#22c55e',
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  visible,
  guideStrings,
}) => {
  const animation = useRef(new Animated.Value(0)).current;
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
    }

    Animated.timing(animation, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 150,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) {
        setIsRendering(false);
      }
    });
  }, [animation, visible]);

  const requirements = useMemo<{ key: PasswordRequirementKey; label: string }[]>(
    () => [
      {
        key: 'minLength',
        label: guideStrings.requirements.length.replace('{count}', String(MIN_PASSWORD_LENGTH)),
      },
      { key: 'uppercase', label: guideStrings.requirements.uppercase },
      { key: 'lowercase', label: guideStrings.requirements.lowercase },
      { key: 'number', label: guideStrings.requirements.number },
      { key: 'special', label: guideStrings.requirements.special },
    ],
    [guideStrings.requirements],
  );

  const requirementState = useMemo(
    () => evaluatePasswordRequirements(password),
    [password],
  );

  const metCount = useMemo(
    () =>
      requirements.reduce(
        (count, requirement) => (requirementState[requirement.key] ? count + 1 : count),
        0,
      ),
    [requirementState, requirements],
  );

  const totalRequirements = requirements.length || 1;

  const strengthLevel = useMemo<PasswordStrengthLevel>(() => {
    if (!password || metCount <= 2) {
      return 'weak';
    }
    if (metCount < totalRequirements) {
      return 'medium';
    }
    return 'strong';
  }, [metCount, password, totalRequirements]);

  const progress = useMemo(() => {
    if (!password) return 0;
    return Math.max(metCount / totalRequirements, 0.15);
  }, [metCount, password, totalRequirements]);

  if (!visible && !isRendering) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.label}>{guideStrings.strengthLabel}</Text>
        <Text style={[styles.value, { color: STRENGTH_COLORS[strengthLevel] }]}>
          {guideStrings.levels[strengthLevel]}
        </Text>
      </View>
      <Text style={styles.helper}>{guideStrings.helper}</Text>
      <View style={styles.progress}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: STRENGTH_COLORS[strengthLevel] },
          ]}
        />
      </View>
      <Text style={styles.requirementsLabel}>{guideStrings.requirementsTitle}</Text>
      <View style={styles.requirements}>
        {requirements.map((requirement) => {
          const met = requirementState[requirement.key];
          return (
            <View style={styles.requirementRow} key={requirement.key}>
              <Feather
                name={met ? 'check-circle' : 'x-circle'}
                size={16}
                color={met ? '#4ade80' : '#f87171'}
              />
              <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
                {requirement.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(22,22,32,0.4)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  helper: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  progress: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  requirementsLabel: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  requirements: {
    gap: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    color: '#9CA3AF',
    fontSize: 13,
    flex: 1,
  },
  requirementTextMet: {
    color: '#D1FAE5',
  },
});
