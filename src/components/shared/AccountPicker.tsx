import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Wallet, Plus, X, Check, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/constants/theme';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Account } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';

interface AccountPickerProps {
  selectedAccountId?: string | null;
  onSelect: (account: Account | null) => void;
  placeholder?: string;
  label?: string;
  excludeAccountId?: string;
  showAddButton?: boolean;
}

const MAX_DROPDOWN_HEIGHT = 280;
const ITEM_HEIGHT = 64;

const formatCurrency = (value: number, currency: string = 'USD') => {
  try {
    return new Intl.NumberFormat(currency === 'UZS' ? 'uz-UZ' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'UZS' ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const AccountPicker: React.FC<AccountPickerProps> = ({
  selectedAccountId,
  onSelect,
  placeholder = 'Select account...',
  label,
  excludeAccountId,
  showAddButton = true,
}) => {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const prevAccountsRef = useRef<string[]>([]);

  const { accounts } = useFinanceDomainStore(
    useShallow((state) => ({
      accounts: state.accounts,
    }))
  );

  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Animation values
  const dropdownHeight = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);

  // Selected account
  const selectedAccount = useMemo(
    () => accounts.find((acc) => acc.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    let result = accounts.filter((acc) => !acc.isArchived);

    if (excludeAccountId) {
      result = result.filter((acc) => acc.id !== excludeAccountId);
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (acc) =>
          acc.name.toLowerCase().includes(search) ||
          acc.currency.toLowerCase().includes(search)
      );
    }

    return result;
  }, [accounts, searchText, excludeAccountId]);

  // Auto-select new account when created
  useEffect(() => {
    const currentIds = accounts.map((a) => a.id);
    const prevIds = prevAccountsRef.current;

    if (prevIds.length > 0 && currentIds.length > prevIds.length) {
      const newAccount = accounts.find((a) => !prevIds.includes(a.id));
      if (newAccount) {
        onSelect(newAccount);
        setIsOpen(false);
      }
    }

    prevAccountsRef.current = currentIds;
  }, [accounts, onSelect]);

  // Animate dropdown
  useEffect(() => {
    if (isOpen) {
      const itemsCount = filteredAccounts.length + (showAddButton ? 1 : 0);
      const targetHeight = Math.min(itemsCount * ITEM_HEIGHT, MAX_DROPDOWN_HEIGHT);
      dropdownHeight.value = withTiming(targetHeight, { duration: 200 });
      dropdownOpacity.value = withTiming(1, { duration: 150 });
    } else {
      dropdownHeight.value = withTiming(0, { duration: 150 });
      dropdownOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [isOpen, filteredAccounts.length, showAddButton, dropdownHeight, dropdownOpacity]);

  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    maxHeight: dropdownHeight.value,
    opacity: dropdownOpacity.value,
  }));

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setSearchText('');
    }
  }, [isOpen]);

  const handleSelectAccount = useCallback((account: Account) => {
    onSelect(account);
    setIsOpen(false);
    setSearchText('');
    Keyboard.dismiss();
  }, [onSelect]);

  const handleAddAccount = useCallback(() => {
    setIsOpen(false);
    router.push('/(modals)/finance/add-account');
  }, [router]);

  const handleClear = useCallback(() => {
    onSelect(null);
    setSearchText('');
  }, [onSelect]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Main Trigger */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <View style={styles.triggerContent}>
          <Wallet size={18} color={theme.colors.textMuted} style={styles.triggerIcon} />
          {selectedAccount ? (
            <View style={styles.selectedInfo}>
              <View style={styles.selectedNameRow}>
                <Text style={styles.selectedName} numberOfLines={1}>
                  {selectedAccount.name}
                </Text>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyBadgeText}>{selectedAccount.currency}</Text>
                </View>
              </View>
              <Text style={styles.selectedBalance}>
                {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        <View style={styles.triggerActions}>
          {selectedAccount && (
            <Pressable onPress={handleClear} style={styles.clearButton} hitSlop={8}>
              <X size={16} color={theme.colors.textMuted} />
            </Pressable>
          )}
          <ChevronDown
            size={18}
            color={theme.colors.textMuted}
            style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
          />
        </View>
      </Pressable>

      {/* Dropdown */}
      {isOpen && (
        <View style={styles.dropdownWrapper}>
          <Animated.View style={[styles.dropdown, dropdownAnimatedStyle]}>
            {/* Search Input */}
            {accounts.length > 5 && (
              <View style={styles.searchContainer}>
                <TextInput
                  value={searchText}
                  onChangeText={handleSearchChange}
                  placeholder="Search accounts..."
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.searchInput}
                  autoFocus={false}
                />
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.listContainer}
              nestedScrollEnabled
            >
              {filteredAccounts.map((account) => {
                const isSelected = selectedAccountId === account.id;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => handleSelectAccount(account)}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.accountIcon}>
                      <Wallet size={18} color={isSelected ? theme.colors.primary : theme.colors.textMuted} />
                    </View>
                    <View style={styles.accountInfo}>
                      <View style={styles.accountNameRow}>
                        <Text
                          style={[
                            styles.accountName,
                            isSelected && styles.accountNameSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {account.name}
                        </Text>
                        <View style={[styles.currencyBadge, isSelected && styles.currencyBadgeSelected]}>
                          <Text style={[styles.currencyBadgeText, isSelected && styles.currencyBadgeTextSelected]}>
                            {account.currency}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(account.currentBalance, account.currency)}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={18} color={theme.colors.primary} />
                    )}
                  </Pressable>
                );
              })}

              {filteredAccounts.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No accounts found</Text>
                </View>
              )}
            </ScrollView>

            {/* Add new button - ScrollView tashqarisida */}
            {showAddButton && (
              <Pressable
                onPress={handleAddAccount}
                style={({ pressed }) => [styles.addNewButton, pressed && styles.pressed]}
              >
                <Plus size={18} color={theme.colors.primary} />
                <Text style={styles.addNewText}>Add New Account</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      position: 'relative',
      zIndex: 100,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 10,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 56,
    },
    triggerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    triggerIcon: {
      marginRight: 12,
    },
    triggerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    selectedInfo: {
      flex: 1,
    },
    selectedNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    selectedName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    selectedBalance: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    placeholder: {
      fontSize: 15,
      color: theme.colors.textMuted,
    },
    clearButton: {
      padding: 4,
    },
    dropdownWrapper: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 9999,
      ...Platform.select({
        android: {
          elevation: 9999,
        },
      }),
    },
    dropdown: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginTop: 4,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    searchContainer: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    searchInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    listContainer: {
      maxHeight: MAX_DROPDOWN_HEIGHT - 60,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: ITEM_HEIGHT,
      gap: 12,
    },
    dropdownItemSelected: {
      backgroundColor: `${theme.colors.primary}10`,
    },
    accountIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountInfo: {
      flex: 1,
    },
    accountNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    accountName: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    accountNameSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    accountBalance: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    currencyBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: `${theme.colors.textMuted}20`,
    },
    currencyBadgeSelected: {
      backgroundColor: `${theme.colors.primary}20`,
    },
    currencyBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    currencyBadgeTextSelected: {
      color: theme.colors.primary,
    },
    emptyState: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    addNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    addNewText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    pressed: {
      opacity: 0.7,
    },
  });

export default AccountPicker;
