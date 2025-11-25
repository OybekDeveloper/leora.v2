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
      <View style={styles.dotsRow}>
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <View key={step.id} style={styles.dotWrapper}>
              <View
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isCompleted && styles.dotCompleted,
                ]}
              >
                {isCompleted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              {step.id < totalSteps && (
                <View style={[styles.connector, isCompleted && styles.connectorCompleted]} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {steps.map((step) => {
          const isActive = step.id === currentStep;

          return (
            <View key={step.id} style={styles.labelWrapper}>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    borderWidth: 4,
    borderColor: theme.colors.primary + '30',
  },
  dotCompleted: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success || theme.colors.primary,
  },
  checkmark: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  connectorCompleted: {
    backgroundColor: theme.colors.success || theme.colors.primary,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  labelWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
}));
