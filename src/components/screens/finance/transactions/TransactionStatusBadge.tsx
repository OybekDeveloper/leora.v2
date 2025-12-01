import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/constants/theme';
import type { TransactionStatus, DebtStatus } from './types';

type TransactionStatusBadgeProps = {
  status: TransactionStatus;
  debtStatus?: DebtStatus;
};

const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({
  status,
  debtStatus,
}) => {
  const theme = useAppTheme();

  // Label aniqlash
  const getLabel = (): string => {
    if (debtStatus) {
      return debtStatus;
    }
    return status;
  };

  // Monoxrom ranglar - faqat textSecondary va cardItem
  const bgColor = theme.colors.cardItem;
  const textColor = theme.colors.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>
        {getLabel()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'lowercase',
    letterSpacing: 0.3,
  },
});

export default TransactionStatusBadge;
