import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useInsightsContent } from '@/localization/useInsightsContent';
import { useInsightsExperienceStore } from '@/stores/useInsightsExperienceStore';

const InsightsQuestionsScreen = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const { questions, overview } = useInsightsContent();
  const answers = useInsightsExperienceStore((state) => state.answers);
  const answerQuestion = useInsightsExperienceStore((state) => state.answerQuestion);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
        scrollContent: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.md,
        },
        questionCard: {
          borderRadius: theme.radius.xxl,
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.card,
        },
        prompt: {
          fontSize: 15,
          fontWeight: '600',
          color: theme.colors.textPrimary,
        },
        option: {
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
        },
        optionText: {
          fontSize: 13,
          color: theme.colors.textPrimary,
        },
        answeredLabel: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        customInput: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          color: theme.colors.textPrimary,
        },
        saveButton: {
          alignSelf: 'flex-start',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.full,
          backgroundColor:
            theme.mode === 'dark'
              ? 'rgba(148,163,184,0.18)'
              : 'rgba(15,23,42,0.08)',
        },
        saveText: {
          fontSize: 12,
          fontWeight: '600',
          color: theme.colors.textSecondary,
        },
        description: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
      }),
    [theme],
  );

  const orderedQuestions = useMemo(
    () =>
      questions.dailyOrder
        .map((questionId) => {
          const entry = questions.entries[questionId];
          if (!entry) {
            return null;
          }
          return { id: questionId, ...entry };
        })
        .filter(Boolean) as ({ id: string } & (typeof questions.entries)[string])[],
    [questions.dailyOrder, questions.entries],
  );

  const handleOptionSelect = (questionId: string, optionId: string) => {
    answerQuestion(questionId, { optionId });
  };

  const handleCustomSave = (questionId: string) => {
    setCustomAnswers((prev) => {
      const value = (prev[questionId] ?? '').trim();
      if (!value) {
        return prev;
      }
      answerQuestion(questionId, { customAnswer: value });
      return { ...prev, [questionId]: '' };
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{overview.sections.questions}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {orderedQuestions.map((question) => {
          const answer = answers[question.id];
          const answeredOption = question.options?.find((option) => option.id === answer?.optionId);
          const answerValue = answeredOption?.label ?? answer?.customAnswer;
          return (
            <AdaptiveGlassView key={question.id} style={styles.questionCard}>
              <Text style={styles.prompt}>{question.prompt}</Text>
              {question.description ? (
                <Text style={styles.description}>{question.description}</Text>
              ) : null}
              {answerValue ? (
                <Text style={styles.answeredLabel}>
                  {overview.questionsBlock.customAnswer}: {answerValue}
                </Text>
              ) : null}
              {question.options?.map((option) => (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [styles.option, pressed && { opacity: 0.85 }]}
                  onPress={() => handleOptionSelect(question.id, option.id)}
                >
                  <CheckCircle2 size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.optionText}>{option.label}</Text>
                </Pressable>
              ))}
              {question.allowFreeText ? (
                <>
                  <Text style={styles.description}>
                    {question.customLabel ?? overview.questionsBlock.customAnswer}
                  </Text>
                  <TextInput
                    style={styles.customInput}
                    placeholder={overview.questionsBlock.placeholder}
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    value={
                      customAnswers[question.id] ??
                      answer?.customAnswer ??
                      ''
                    }
                    onChangeText={(text) =>
                      setCustomAnswers((prev) => ({ ...prev, [question.id]: text }))
                    }
                  />
                  <Pressable
                    style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
                    onPress={() => handleCustomSave(question.id)}
                  >
                    <Text style={styles.saveText}>{overview.questionsBlock.submit}</Text>
                  </Pressable>
                </>
              ) : null}
            </AdaptiveGlassView>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InsightsQuestionsScreen;
