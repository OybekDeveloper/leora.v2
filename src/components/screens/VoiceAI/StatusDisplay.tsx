import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

import { Colors } from '@/constants/theme';
import { AIStage } from '@/types/voice-ai.types';

interface StatusDisplayProps {
  stage: AIStage;
  transcript?: string;
}

type SupportedStage = 'listening' | 'thinking' | 'confirm' | 'editing';

const STAGE_CONTENT: Record<SupportedStage, { label: string; title: string; subtitle?: string; accent: string }> = {
  listening: {
    label: 'В ПРОЦЕССЕ',
    title: 'Слушаю команду',
    subtitle: 'Говорите естественно и четко произносите суммы и категории.',
    accent: Colors.info,
  },
  thinking: {
    label: 'АНАЛИЗ',
    title: 'Обрабатываю данные',
    subtitle: 'AI извлекает параметры операции и подбирает категории.',
    accent: Colors.secondary,
  },
  confirm: {
    label: 'ПРОВЕРЬТЕ',
    title: 'Сверьте распознанное',
    subtitle: 'Убедитесь, что суммы и категории определены корректно.',
    accent: Colors.primary,
  },
  editing: {
    label: 'РЕДАКТИРОВАНИЕ',
    title: 'Корректируем детали',
    subtitle: 'При необходимости измените данные перед подтверждением.',
    accent: Colors.warning,
  },
};

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ stage, transcript }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef([0, 1, 2].map(() => new Animated.Value(0.2))).current;
  const dotLoops = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, stage, transcript]);

  useEffect(() => {
    dotLoops.current.forEach(loop => loop.stop());
    dotLoops.current = [];
    dotAnims.forEach(anim => anim.setValue(0.2));

    if (stage !== 'listening') {
      return () => {
        dotLoops.current.forEach(loop => loop.stop());
        dotLoops.current = [];
      };
    }

    const loops = dotAnims.map((anim, index) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(anim, {
            toValue: 1,
            duration: 360,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: 360,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    dotLoops.current = loops;

    return () => {
      dotLoops.current.forEach(loop => loop.stop());
      dotLoops.current = [];
    };
  }, [dotAnims, stage]);

  const content = useMemo(() => {
    if (stage === 'idle' || stage === 'success') return null;
    return STAGE_CONTENT[stage as SupportedStage] ?? null;
  }, [stage]);

  if (!content) {
    return null;
  }

  const showRecognized = !!transcript && (stage === 'thinking' || stage === 'confirm');

  const translateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
      <View style={[styles.badge, { borderColor: content.accent + '44', backgroundColor: content.accent + '12' }]}>
        <View style={[styles.badgeDot, { backgroundColor: content.accent }]} />
        <Text style={[styles.badgeText, { color: content.accent }]}>{content.label}</Text>
      </View>

      <Text style={styles.title}>{content.title}</Text>
      {!!content.subtitle && <Text style={styles.subtitle}>{content.subtitle}</Text>}

      {stage === 'listening' && (
        <View style={styles.dotsRow}>
          {dotAnims.map((anim, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.dot,
                {
                  opacity: anim,
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0.2, 1],
                        outputRange: [0.85, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}

      {showRecognized && (
        <Animated.View style={[styles.recognizedCard, { opacity: fadeAnim }]}>
          <Text style={styles.cardLabel}>РАСПОЗНАНО</Text>
          <Text style={styles.cardText}>{transcript}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 18,
    gap: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.textPrimary,
  },
  recognizedCard: {
    alignSelf: 'stretch',
    marginTop: 8,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
  },
});
