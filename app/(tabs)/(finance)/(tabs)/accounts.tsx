// app/(tabs)/(finance)/(tabs)/accounts.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  Archive,
  Banknote,
  Bitcoin,
  Briefcase,
  Building,
  Coins,
  CreditCard,
  DollarSign,
  Edit3,
  PiggyBank,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type {
  AccountIconId,
  AccountItem,
  AccountKind,
  AccountTransaction,
} from '@/types/accounts';
import type { Account as DomainAccount, AccountType, Transaction as DomainTransaction } from '@/domain/finance/types';
import { useLocalization } from '@/localization/useLocalization';
import { useShallow } from 'zustand/react/shallow';
import { useCustomAccountTypesStore } from '@/stores/useCustomAccountTypesStore';

type AccountsStrings = ReturnType<typeof useLocalization>['strings']['financeScreens']['accounts'];

// ===========================
// Helper Functions
// ===========================

const formatCurrency = (amount: number, currency: string = 'UZS'): string => {
  if (currency === 'UZS') {
    return new Intl.NumberFormat('en-US').format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const ACCOUNT_COLOR_MAP: Record<AccountKind, string> = {
  cash: '#F97316',
  card: '#2563EB',
  savings: '#0EA5E9',
  usd: '#4F46E5',
  crypto: '#F59E0B',
  other: '#94A3B8',
  custom: '#A855F7',
};

const CUSTOM_ICON_MAP: Record<AccountIconId, LucideIcon> = {
  wallet: Wallet,
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  bank: Building,
  briefcase: Briefcase,
  coins: Coins,
  sparkles: Sparkles,
  bitcoin: Bitcoin,
  shield: Shield,
  'trending-up': TrendingUp,
};

const getIconForAccount = (account: AccountItem) => {
  if (account.type === 'custom' && account.customIcon) {
    return CUSTOM_ICON_MAP[account.customIcon] ?? Wallet;
  }

  switch (account.type) {
    case 'cash':
      return Wallet;
    case 'card':
      return CreditCard;
    case 'savings':
      return PiggyBank;
    case 'usd':
      return DollarSign;
    case 'crypto':
      return Bitcoin;
    case 'other':
      return Banknote;
    default:
      return Wallet;
  }
};

const formatTransactionTime = (date: Date) => {
  const now = new Date();
  const todayKey = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (date.toDateString() === todayKey) {
    return `Today ${formatter.format(date)}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${formatter.format(date)}`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getTransactionTimestamp = (transaction: DomainTransaction): number => {
  if (!transaction?.date) {
    return 0;
  }
  const date = new Date(transaction.date);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const buildAccountHistory = (account: DomainAccount, list: DomainTransaction[]): AccountTransaction[] => {
  const accountId = account.id;
  const accountCurrency = account.currency;
  return list
    .filter((txn) => txn.accountId === accountId || txn.toAccountId === accountId)
    .sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a))
    .slice(0, 4)
    .map((txn) => {
      let type: AccountTransaction['type'] = 'income';
      let amount = txn.amount;
      let currency = txn.currency ?? accountCurrency;

      if (txn.type === 'transfer') {
        const isSourceSide = (txn.accountId ?? txn.fromAccountId) === accountId;
        if (isSourceSide) {
          type = 'outcome';
          amount = txn.amount;
          currency = txn.currency ?? accountCurrency;
        } else {
          type = 'income';
          amount = txn.toAmount ?? txn.amount;
          currency = txn.toCurrency ?? accountCurrency;
        }
      } else {
        type = txn.type === 'income' ? 'income' : 'outcome';
        amount = txn.amount;
        currency = txn.currency ?? accountCurrency;
      }

      return {
        id: txn.id,
        type,
        amount,
        currency,
        time: formatTransactionTime(new Date(txn.date)),
        description: txn.description,
      };
    });
};

const mapDomainAccountTypeToKind = (type: AccountType): AccountKind => {
  switch (type) {
    case 'cash':
      return 'cash';
    case 'card':
      return 'card';
    case 'savings':
      return 'savings';
    case 'credit':
    case 'debt':
      return 'usd';
    case 'investment':
      return 'crypto';
    default:
      return 'other';
  }
};

const getAccountTypeLabel = (kind: AccountKind): string => {
  switch (kind) {
    case 'cash':
      return 'Cash';
    case 'card':
      return 'Card';
    case 'savings':
      return 'Savings';
    case 'usd':
      return 'USD';
    case 'crypto':
      return 'Crypto';
    case 'other':
      return 'Other';
    case 'custom':
      return 'Custom';
    default:
      return 'Account';
  }
};

const mapDomainAccountToItem = (
  account: DomainAccount,
  transactions: DomainTransaction[],
  customTypes: Array<{ id: string; label: string; icon: AccountIconId }>,
): AccountItem => {
  let kind = mapDomainAccountTypeToKind(account.accountType);
  let customTypeId: string | undefined;
  let customTypeLabel: string | undefined;
  let customIcon: AccountIconId | undefined;

  // Check if this is a custom type account
  if (account.customTypeId && account.accountType === 'other') {
    const customType = customTypes.find((ct) => ct.id === account.customTypeId);
    if (customType) {
      kind = 'custom';
      customTypeId = customType.id;
      customTypeLabel = customType.label;
      customIcon = customType.icon;
    }
  }

  return {
    id: account.id,
    name: account.name,
    type: kind,
    balance: account.currentBalance,
    currency: account.currency,
    subtitle: customTypeLabel ?? getAccountTypeLabel(kind),
    iconColor: ACCOUNT_COLOR_MAP[kind] ?? '#94A3B8',
    customTypeId,
    customTypeLabel,
    customIcon,
    progress: undefined,
    goal: undefined,
    usdRate: undefined,
    transactions: buildAccountHistory(account, transactions),
    isArchived: account.isArchived,
  };
};

// ===========================
// Transaction Row Component with Staggered Animation
// ===========================

interface TransactionRowProps {
  transaction: AccountTransaction;
  theme: ReturnType<typeof useAppTheme>;
  index: number;
  isVisible: boolean;
  labels: {
    income: string;
    outcome: string;
  };
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  theme,
  index,
  isVisible,
  labels,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (isVisible) {
      // Staggered animation - each row delayed by 50ms
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values
      opacity.setValue(0);
      translateY.setValue(15);
    }
  }, [isVisible, index, opacity, translateY]);

  const isIncome = transaction.type === 'income';
  const textColor = isIncome ? theme.colors.success : theme.colors.danger;
  const sign = isIncome ? '+' : '-';

  return (
    <Animated.View
      style={[
        styles.transactionRow,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.transactionType, { color: theme.colors.textSecondary }]}>
        {transaction.type === 'income' ? labels.income : labels.outcome}
      </Text>
      <Text style={[styles.transactionAmount, { color: textColor }]}>
        {sign} {formatCurrency(transaction.amount, transaction.currency)}
      </Text>
      <Text style={[styles.transactionTime, { color: theme.colors.textMuted }]}>
        {transaction.time}
      </Text>
    </Animated.View>
  );
};

// ===========================
// Account Card Component
// ===========================

interface AccountCardProps {
  account: AccountItem;
  isExpanded: boolean;
  isActionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  theme: ReturnType<typeof useAppTheme>;
  strings: AccountsStrings;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isExpanded,
  isActionMode,
  onPress,
  onLongPress,
  onEdit,
  onArchive,
  onDelete,
  theme,
  strings,
}) => {
  const Icon = getIconForAccount(account);
  const transactions = account.transactions ?? [];
  const transactionLabels = useMemo(
    () => ({ income: strings.income, outcome: strings.outcome }),
    [strings.income, strings.outcome],
  );

  // Animation values
  const historyOpacity = useRef(new Animated.Value(0)).current;
  const historyTranslateY = useRef(new Animated.Value(20)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const shadowIntensity = useRef(new Animated.Value(0.08)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isExpanded) {
      // Opening animation sequence
      Animated.parallel([
        // Card scale up slightly
        Animated.spring(cardScale, {
          toValue: 1.02,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        // Increase shadow intensity
        Animated.timing(shadowIntensity, {
          toValue: 0.18,
          duration: 250,
          useNativeDriver: false,
        }),
        // Transaction history fade + slide up
        Animated.parallel([
          Animated.timing(historyOpacity, {
            toValue: 1,
            duration: 300,
            delay: 50,
            useNativeDriver: true,
          }),
          Animated.spring(historyTranslateY, {
            toValue: 0,
            friction: 10,
            tension: 80,
            delay: 50,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Closing animation sequence
      Animated.parallel([
        // Card scale back to normal
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        // Restore shadow intensity
        Animated.timing(shadowIntensity, {
          toValue: 0.08,
          duration: 250,
          useNativeDriver: false,
        }),
        // Transaction history fade + slide down
        Animated.parallel([
          Animated.timing(historyOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(historyTranslateY, {
            toValue: 20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isExpanded, cardScale, shadowIntensity, historyOpacity, historyTranslateY]);

  useEffect(() => {
    if (isActionMode) {
      // Fade to action mode
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(actionOpacity, {
          toValue: 1,
          duration: 200,
          delay: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade back to content
      Animated.parallel([
        Animated.timing(actionOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          delay: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActionMode, contentOpacity, actionOpacity]);


  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      <AdaptiveGlassView style={[styles.glassSurface, styles.glassAccountCard,
      {
        backgroundColor: theme.colors.card
      }
      ]}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onPress}
          onLongPress={onLongPress}
        >
          {/* Default Card Content */}
          <Animated.View
            style={[
              styles.cardContent,
              {
                opacity: contentOpacity,
              },
            ]}
            pointerEvents={isActionMode ? 'none' : 'auto'}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.icon },
              ]}
            >
              <Icon size={24} color={theme.colors.iconText} strokeWidth={2} />
            </View>

            <View style={styles.cardInfo}>
              <Text style={[styles.accountName, { color: theme.colors.textPrimary }]}>
                {account.name}
              </Text>
              <Text style={[styles.accountSubtitle, { color: theme.colors.textMuted }]}>
                {account.subtitle}
              </Text>

              {/* Savings Progress Bar */}
              {account.type === 'savings' && account.progress !== undefined && (
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: theme.colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${account.progress}%`,
                          backgroundColor: account.iconColor,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {strings.goalProgress.replace('{value}', `${account.progress}`)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.balanceContainer}>
              <Text style={[styles.balance, { color: theme.colors.textPrimary }]}>
                {formatCurrency(account.balance)} {account.currency}
              </Text>
              {/* USD Conversion */}
              {account.type === 'usd' && account.usdRate && (
                <Text style={[styles.usdConversion, { color: theme.colors.textMuted }]}>
                  ${formatCurrency(Math.round(account.balance / account.usdRate), 'USD')}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Action Mode Buttons */}
          <Animated.View
            style={[
              styles.actionButtons,
              {
                opacity: actionOpacity,
              },
            ]}
            pointerEvents={isActionMode ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: "transparent" },
              ]}
              onPress={onEdit}
              activeOpacity={0.7}
            >
              <Edit3 size={18} color={theme.colors.iconTextSecondary} strokeWidth={2} />
              <Text style={[styles.actionText, { color: theme.colors.iconTextSecondary }]}>
                {strings.actions.edit}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: "transparent" },
              ]}
              onPress={onArchive}
              activeOpacity={0.7}
            >
              <Archive size={18} color={theme.colors.iconTextSecondary} strokeWidth={2} />
              <Text style={[styles.actionText, { color: theme.colors.iconTextSecondary }]}>
                {strings.actions.archive}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: "transparent" },
              ]}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={theme.colors.iconTextSecondary} strokeWidth={2} />
              <Text style={[styles.actionText, { color: theme.colors.iconTextSecondary }]}>
                {strings.actions.delete}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Transaction History Section - Inside Card */}
          {isExpanded && !isActionMode && transactions.length > 0 && (
            <Animated.View
              style={[
                styles.transactionHistoryInner,
                {
                  backgroundColor:
                    theme.mode === 'dark'
                      ? 'rgba(0, 0, 0, 0.15)'
                      : 'rgba(0, 0, 0, 0.03)',
                  opacity: historyOpacity,
                  transform: [{ translateY: historyTranslateY }],
                },
              ]}
            >
              <Text
                style={[
                  styles.historyTitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {strings.historyTitle}
              </Text>

              <View style={styles.transactionTable}>
                <View
                  style={[
                    styles.transactionsHeader,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Text style={[styles.headerText, { color: theme.colors.textMuted }]}>
                    {strings.historyHeaders.type}
                  </Text>
                  <Text style={[styles.headerText, { color: theme.colors.textMuted }]}>
                    {strings.historyHeaders.amount}
                  </Text>
                  <Text style={[styles.headerText, { color: theme.colors.textMuted }]}>
                    {strings.historyHeaders.time}
                  </Text>
                </View>

                <View style={styles.transactionsList}>
                  {transactions.map((transaction, index) => (
                    <View key={transaction.id}>
                      <TransactionRow
                        transaction={transaction}
                        theme={theme}
                        index={index}
                        isVisible={isExpanded}
                        labels={transactionLabels}
                      />
                      {index < transactions.length - 1 && (
                        <View
                          style={[styles.divider, { backgroundColor: theme.colors.border }]}
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>

        {/* Animated shadow overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
          ]}
          pointerEvents="none"
        />
      </AdaptiveGlassView>
    </Animated.View>
  );
};

// ===========================
// Main Component
// ===========================

export default function AccountsTab() {
  const theme = useAppTheme();
  const router = useRouter();
  const { strings } = useLocalization();
  const accountStrings = strings.financeScreens.accounts;
  const {
    accounts: domainAccounts,
    transactions: domainTransactions,
    deleteAccount,
    archiveAccount,
  } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
      transactions: state.transactions,
      deleteAccount: state.deleteAccount,
      archiveAccount: state.archiveAccount,
    })),
  );
  const customTypes = useCustomAccountTypesStore((state) => state.customTypes);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionModeId, setActionModeId] = useState<string | null>(null);
  const accountItems = useMemo(
    () => domainAccounts.map((account) => mapDomainAccountToItem(account, domainTransactions, customTypes)),
    [domainAccounts, domainTransactions, customTypes],
  );
  const preparedAccounts = useMemo(
    () => accountItems.filter((account) => !account.isArchived),
    [accountItems],
  );

  const handleCardPress = (id: string) => {
    if (actionModeId === id) {
      // Exit action mode
      setActionModeId(null);
    } else if (expandedId === id) {
      // Collapse current card
      setExpandedId(null);
    } else {
      // Expand new card (automatically collapses the previous one)
      setExpandedId(id);
      setActionModeId(null);
    }
  };

  const handleLongPress = (id: string) => {
    setActionModeId(id);
    setExpandedId(null);
  };

  const handleEdit = useCallback(
    (id: string) => {
      const account = accountItems.find((item) => item.id === id && !item.isArchived);
      if (!account) {
        return;
      }
      setExpandedId(null);
      setActionModeId(null);
      router.push({ pathname: '/(modals)/finance/add-account', params: { id: account.id } });
    },
    [accountItems, router],
  );

  const handleArchive = useCallback(
    (id: string) => {
      archiveAccount(id);
      if (expandedId === id) {
        setExpandedId(null);
      }
      setActionModeId(null);
    },
    [archiveAccount, expandedId],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteAccount(id);
      if (expandedId === id) {
        setExpandedId(null);
      }
      setActionModeId(null);
    },
    [deleteAccount, expandedId],
  );

  const handleAddNew = useCallback(() => {
    router.push('/(modals)/finance/add-account');
  }, [router]);

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.textSecondary }]}>
              {accountStrings.header}
            </Text>
          </View>


          {preparedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              isExpanded={expandedId === account.id}
              isActionMode={actionModeId === account.id}
              onPress={() => handleCardPress(account.id)}
              onLongPress={() => handleLongPress(account.id)}
              onEdit={() => handleEdit(account.id)}
              onArchive={() => handleArchive(account.id)}
              onDelete={() => handleDelete(account.id)}
              theme={theme}
              strings={accountStrings}
            />
          ))}

          {/* Add New Button */}
          <AdaptiveGlassView style={[styles.glassSurface, styles.glass1]}>
            <TouchableOpacity
              style={[
                styles.addNewButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: 'transparent',
                },
              ]}

              onPress={handleAddNew}
              activeOpacity={0.7}
            >
              <Plus size={24} color={theme.colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </AdaptiveGlassView>
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </>
  );
}

// ===========================
// Styles
// ===========================

const styles = StyleSheet.create({
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  glass1: {
    borderRadius: 24,
    borderWidth: 0,
  },
  glassAccountCard: {
    borderRadius: 24,
    padding: 2
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  addNewLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100
  },
  cardContainer: {
    marginBottom: 18,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  accountSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  usdConversion: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 18,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionHistoryInner: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    opacity: 0.7,
  },
  transactionTable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  transactionsList: {
    marginTop: 4,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  transactionTime: {
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  addNewButton: {
    height: 80,
    borderRadius: 24,
    borderWidth: Platform.OS === "ios" ? 0 : 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    width: "100%"
  },
  bottomSpacer: {
    height: 40,
  },
});
