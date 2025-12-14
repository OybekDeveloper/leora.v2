import React from 'react';
import { View, Text } from 'react-native';
import { createThemedStyles } from '@/constants/theme';

type Step = {
  id: number;
  label: string;
  icon?: string;
};

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, steps }) => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step item - dot va label vertikal */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.dot,
                    isActive && styles.dotActive,
                    isCompleted && styles.dotCompleted,
                  ]}
                >
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]} numberOfLines={1}>
                  {step.label}
                </Text>
              </View>

              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <View style={[styles.connector, isCompleted && styles.connectorCompleted]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.primary + '30',
  },
  dotCompleted: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.success || theme.colors.primary,
  },
  checkmark: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  connector: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: 8,
    marginBottom: 22, // Align with dot, not label
  },
  connectorCompleted: {
    backgroundColor: theme.colors.success || theme.colors.primary,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
}));
