import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import GradientText from '@/components/ui/GradientText';

export default function MoreHeader() {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const headerStrings = strings.more.header;

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: theme.colors.borderMuted ?? theme.colors.border,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <GradientText containerStyle={styles.leftLabelContainer} style={styles.leftLabel}>
        {headerStrings.badgeLabel.toUpperCase()}
      </GradientText>

      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{headerStrings.title}</Text>

      <GradientText containerStyle={styles.rightLabelContainer} style={styles.rightLabel}>
        {headerStrings.dateLabel.toUpperCase()}
      </GradientText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  leftLabelContainer: {
    position: 'absolute',
    left: 20,
  },
  leftLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rightLabelContainer: {
    position: 'absolute',
    right: 20,
  },
  rightLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
