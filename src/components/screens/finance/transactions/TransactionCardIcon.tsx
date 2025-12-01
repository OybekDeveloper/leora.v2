import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { FINANCE_CATEGORIES } from '@/constants/financeCategories';
import type { TransactionCardType } from './types';

type TransactionCardIconProps = {
  categoryId?: string;
  type: TransactionCardType;
  size?: number;
};

// Monoxrom ikonkalar - barcha turlar uchun bir xil rang
const DEFAULT_ICONS: Record<TransactionCardType, LucideIcon> = {
  income: ArrowDownLeft,
  outcome: ArrowUpRight,
  transfer: ArrowLeftRight,
  debt: Wallet,
};

const TransactionCardIcon: React.FC<TransactionCardIconProps> = ({
  categoryId,
  type,
  size = 44,
}) => {
  const theme = useAppTheme();

  // Kategoriya bo'yicha ikonka olish (rang emas, faqat ikonka)
  let Icon: LucideIcon;

  if (categoryId) {
    const category = FINANCE_CATEGORIES.find((c) => c.id === categoryId || c.name === categoryId);
    Icon = category?.icon ?? DEFAULT_ICONS[type];
  } else {
    Icon = DEFAULT_ICONS[type];
  }

  const iconSize = size * 0.5;

  // Monoxrom ranglar - ikonka textSecondary, fon surfaceElevated
  const iconColor = theme.colors.textSecondary;
  const bgColor = theme.colors.surfaceElevated;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Icon size={iconSize} color={iconColor} strokeWidth={2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TransactionCardIcon;
