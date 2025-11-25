import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { BudgetFlowType } from '@/domain/finance/types';
import { useAppTheme } from '@/constants/theme';

type BudgetCreateInlineProps = {
  defaultName?: string;
  defaultCurrency: string;
  defaultTransactionType?: BudgetFlowType;
  onSubmit: (payload: { name: string; amount: number; currency: string; transactionType: BudgetFlowType }) => void;
  onCancel?: () => void;
};

export const BudgetCreateInline: React.FC<BudgetCreateInlineProps> = ({
  defaultName,
  defaultCurrency,
  defaultTransactionType = 'expense',
  onSubmit,
  onCancel,
}) => {
  const theme = useAppTheme();
  const [name, setName] = useState(defaultName ?? 'New Budget');
  const [amountInput, setAmountInput] = useState('');
  const [transactionType, setTransactionType] = useState<BudgetFlowType>(defaultTransactionType);

  const amount = useMemo(() => {
    const parsed = parseFloat(amountInput.replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountInput]);

  const handleSubmit = () => {
    if (!(amount > 0)) return;
    onSubmit({
      name: name.trim() || (defaultName ?? 'New Budget'),
      amount,
      currency: defaultCurrency,
      transactionType,
    });
    setAmountInput('');
  };

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Create Budget</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.card,
            color: theme.colors.textPrimary,
            borderColor: theme.colors.border,
          },
        ]}
        placeholder="Budget name"
        placeholderTextColor={theme.colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.card,
            color: theme.colors.textPrimary,
            borderColor: theme.colors.border,
          },
        ]}
        placeholder="Limit amount"
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="decimal-pad"
        value={amountInput}
        onChangeText={setAmountInput}
      />
      <View style={styles.row}>
        <Pressable
          onPress={() => setTransactionType('expense')}
          style={[
            styles.pill,
            transactionType === 'expense' && { backgroundColor: theme.colors.primary + '22', borderColor: theme.colors.primary },
            { borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.pillText, { color: theme.colors.textPrimary }]}>Outcome</Text>
        </Pressable>
        <Pressable
          onPress={() => setTransactionType('income')}
          style={[
            styles.pill,
            transactionType === 'income' && { backgroundColor: theme.colors.success + '22', borderColor: theme.colors.success },
            { borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.pillText, { color: theme.colors.textPrimary }]}>Income</Text>
        </Pressable>
      </View>
      <View style={styles.actions}>
        {onCancel && (
          <Pressable onPress={onCancel} style={[styles.button, { borderColor: theme.colors.border }]}>
            <Text style={[styles.buttonTextSecondary, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleSubmit}
          style={[
            styles.button,
            styles.primary,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.buttonTextPrimary}>Create</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  button: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  primary: {},
});

export default BudgetCreateInline;
