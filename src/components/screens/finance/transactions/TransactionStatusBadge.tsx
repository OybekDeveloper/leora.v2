import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
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
  const { strings } = useLocalization();
  const statusStrings = (strings.financeScreens.transactions as any).status ?? {};

  // Label aniqlash
  const getLabel = (): string => {
    if (debtStatus) {
      return debtStatus;
    }
    // Localized status
    if (status === 'confirmed') {
      return statusStrings.confirmed ?? 'confirmed';
    }
    if (status === 'canceled') {
      return statusStrings.canceled ?? 'canceled';
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
