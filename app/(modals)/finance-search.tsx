import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import { useFinanceCurrency } from '@/hooks/useFinanceCurrency';
import { normalizeFinanceCurrency } from '@/utils/financeCurrency';
import { useShallow } from 'zustand/react/shallow';

type ResultType = 'account' | 'transaction' | 'budget' | 'debt';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  amount?: string;
  route: string;
}

const FinanceSearchModal = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');

  const { accounts, transactions, budgets, debts } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      budgets: state.budgets,
      debts: state.debts,
    })),
  );

  const { formatCurrency, globalCurrency } = useFinanceCurrency();

  const results = useMemo(() => {
    if (!query.trim()) {
      return [] as SearchResult[];
    }
    const needle = query.trim().toLowerCase();
    const matches: SearchResult[] = [];

    accounts.forEach((account) => {
      if (account.name.toLowerCase().includes(needle)) {
        matches.push({
          id: `account-${account.id}`,
          type: 'account',
          title: account.name,
          subtitle: account.accountType ?? 'Account',
          amount: formatCurrency(account.currentBalance, {
            fromCurrency: normalizeFinanceCurrency(account.currency),
            toCurrency: globalCurrency,
            convert: true,
          }),
          route: '/(tabs)/(finance)/(tabs)/accounts',
        });
      }
    });

    transactions.forEach((transaction) => {
      const matchTarget = `${transaction.categoryId ?? ''} ${transaction.description ?? ''}`.toLowerCase();
      if (!matchTarget.includes(needle)) {
        return;
      }
      const transactionDate = new Date(transaction.date);
      const accountCurrency = transaction.accountId
        ? accounts.find((a) => a.id === transaction.accountId)?.currency
        : undefined;
      matches.push({
        id: `transaction-${transaction.id}`,
        type: 'transaction',
        title: transaction.categoryId ?? 'Transaction',
        subtitle: Number.isNaN(transactionDate.getTime())
          ? transaction.date
          : transactionDate.toLocaleDateString(),
        amount: formatCurrency(transaction.amount, {
          fromCurrency: normalizeFinanceCurrency(
            transaction.currency ?? accountCurrency,
          ),
          toCurrency: globalCurrency,
          convert: true,
        }),
        route: '/(tabs)/(finance)/(tabs)/transactions',
      });
    });

    budgets.forEach((budget) => {
      if (budget.name.toLowerCase().includes(needle)) {
        const spent = formatCurrency(budget.spentAmount, {
          fromCurrency: normalizeFinanceCurrency(budget.currency),
          toCurrency: globalCurrency,
          convert: true,
        });
        matches.push({
          id: `budget-${budget.id}`,
          type: 'budget',
          title: budget.name,
          subtitle: budget.budgetType,
          amount: spent,
          route: '/(tabs)/(finance)/(tabs)/budgets',
        });
      }
    });

    debts.forEach((debt) => {
      if (
        debt.counterpartyName.toLowerCase().includes(needle) ||
        (debt.description ?? '').toLowerCase().includes(needle)
      ) {
        matches.push({
          id: `debt-${debt.id}`,
          type: 'debt',
          title: debt.counterpartyName,
          subtitle: debt.direction === 'they_owe_me' ? 'Incoming debt' : 'My debt',
          amount: formatCurrency(debt.principalAmount, {
            fromCurrency: normalizeFinanceCurrency(debt.principalCurrency),
            toCurrency: globalCurrency,
            convert: true,
          }),
          route: '/(tabs)/(finance)/(tabs)/debts',
        });
      }
    });

    return matches;
  }, [accounts, budgets, debts, formatCurrency, globalCurrency, query, transactions]);

  const handleNavigate = (destination: string) => {
    router.back();
    setTimeout(() => {
      router.push(destination as any);
    }, 50);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search finance data</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
        <TextInput
          placeholder="Search accounts, transactions, budgets…"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable style={styles.resultRow} onPress={() => handleNavigate(item.route)}>
            <View>
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
            </View>
            {item.amount ? <Text style={styles.resultAmount}>{item.amount}</Text> : null}
          </Pressable>
        )}
        ListEmptyComponent={
          query ? (
            <Text style={styles.emptyText}>No results</Text>
          ) : (
            <Text style={styles.emptyText}>Start typing to search</Text>
          )
        }
      />
    </SafeAreaView>
  );
};

export default FinanceSearchModal;

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    searchBar: {
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 15,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 10,
    },
    resultRow: {
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: 16,
      backgroundColor: theme.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resultTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    resultSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    resultAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: theme.colors.textSecondary,
    },
  });
