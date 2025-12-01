import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import EmptyAnimation from '@/components/shared/EmptyAnimation';
import { createThemedStyles } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  animationSize?: number;
  style?: StyleProp<ViewStyle>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  animationSize = 180,
  style,
}) => {
  const styles = useStyles();

  return (
    <View style={[styles.wrapper, style]}>
      <EmptyAnimation size={animationSize} />
      <AdaptiveGlassView style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </AdaptiveGlassView>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  wrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 24,
    gap: 14,
    marginTop: 16,
    backgroundColor: theme.colors.card,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
}));

export default EmptyState;
