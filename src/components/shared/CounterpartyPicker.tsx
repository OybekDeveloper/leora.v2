import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { User, Plus, Phone, X, Check } from 'lucide-react-native';
import { useAppTheme } from '@/constants/theme';
import { useFinanceDomainStore } from '@/stores/useFinanceDomainStore';
import type { Counterparty } from '@/domain/finance/types';
import { useShallow } from 'zustand/react/shallow';

interface CounterpartyPickerProps {
  value: string;
  onSelect: (counterparty: Counterparty | null) => void;
  selectedCounterpartyId?: string | null;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
}

interface NewContactForm {
  name: string;
  phoneNumber: string;
  comment: string;
}

const MAX_DROPDOWN_HEIGHT = 220;
const ITEM_HEIGHT = 52;

const CounterpartyPicker: React.FC<CounterpartyPickerProps> = ({
  value,
  onSelect,
  selectedCounterpartyId,
  placeholder = 'Enter name...',
  label,
  autoFocus = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { counterparties, searchCounterparties, createCounterparty } = useFinanceDomainStore(
    useShallow((state) => ({
      counterparties: state.counterparties,
      searchCounterparties: state.searchCounterparties,
      createCounterparty: state.createCounterparty,
    }))
  );

  const [searchText, setSearchText] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContact, setNewContact] = useState<NewContactForm>({
    name: '',
    phoneNumber: '',
    comment: '',
  });

  // Animation values
  const dropdownHeight = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);

  // Filtered results
  const filteredCounterparties = useMemo(() => {
    if (!searchText.trim()) {
      return counterparties.slice(0, 10);
    }
    return searchCounterparties(searchText).slice(0, 10);
  }, [searchText, counterparties, searchCounterparties]);

  const showDropdown = isFocused && !showCreateForm && searchText.length > 0;

  // Animate dropdown
  useEffect(() => {
    if (showDropdown) {
      const itemsCount = filteredCounterparties.length + 1; // +1 for "Add new" button
      const targetHeight = Math.min(itemsCount * ITEM_HEIGHT, MAX_DROPDOWN_HEIGHT);
      dropdownHeight.value = withTiming(targetHeight, { duration: 200 });
      dropdownOpacity.value = withTiming(1, { duration: 150 });
    } else {
      dropdownHeight.value = withTiming(0, { duration: 150 });
      dropdownOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [showDropdown, filteredCounterparties.length, dropdownHeight, dropdownOpacity]);

  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    maxHeight: dropdownHeight.value,
    opacity: dropdownOpacity.value,
  }));

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      onSelect(null);
    }
  }, [onSelect]);

  const handleSelectCounterparty = useCallback((counterparty: Counterparty) => {
    setSearchText(counterparty.displayName);
    onSelect(counterparty);
    setIsFocused(false);
    Keyboard.dismiss();
  }, [onSelect]);

  const handleOpenCreateForm = useCallback(() => {
    setNewContact({
      name: searchText.trim(),
      phoneNumber: '',
      comment: '',
    });
    setShowCreateForm(true);
  }, [searchText]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setNewContact({ name: '', phoneNumber: '', comment: '' });
  }, []);

  const handleSaveNewContact = useCallback(() => {
    const trimmedName = newContact.name.trim();
    if (!trimmedName) return;

    try {
      const created = createCounterparty(trimmedName, {
        phoneNumber: newContact.phoneNumber.trim() || undefined,
        comment: newContact.comment.trim() || undefined,
      });
      setSearchText(created.displayName);
      onSelect(created);
      setShowCreateForm(false);
      setNewContact({ name: '', phoneNumber: '', comment: '' });
      setIsFocused(false);
      Keyboard.dismiss();
    } catch (error) {
      // Handle duplicate error silently - just use existing
      const existing = counterparties.find(
        (cp) => cp.displayName.toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) {
        handleSelectCounterparty(existing);
      }
    }
  }, [newContact, createCounterparty, onSelect, counterparties, handleSelectCounterparty]);

  const handleClearInput = useCallback(() => {
    setSearchText('');
    onSelect(null);
  }, [onSelect]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay to allow tap on dropdown items
    setTimeout(() => {
      if (!showCreateForm) {
        setIsFocused(false);
      }
    }, 150);
  }, [showCreateForm]);

  // Sync external value changes
  useEffect(() => {
    if (value !== searchText && !isFocused) {
      setSearchText(value);
    }
  }, [value, isFocused, searchText]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Main Input */}
      <View style={styles.inputContainer}>
        <User size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
        <TextInput
          value={searchText}
          onChangeText={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          autoFocus={autoFocus}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={handleClearInput} style={styles.clearButton} hitSlop={8}>
            <X size={16} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdownWrapper}>
          <Animated.View style={[styles.dropdown, dropdownAnimatedStyle]}>
            {filteredCounterparties.map((cp) => (
            <Pressable
              key={cp.id}
              onPress={() => handleSelectCounterparty(cp)}
              style={({ pressed }) => [
                styles.dropdownItem,
                selectedCounterpartyId === cp.id && styles.dropdownItemSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.dropdownItemContent}>
                <Text
                  style={[
                    styles.dropdownItemName,
                    selectedCounterpartyId === cp.id && styles.dropdownItemNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {cp.displayName}
                </Text>
                {cp.phoneNumber && (
                  <View style={styles.phoneRow}>
                    <Phone size={12} color={theme.colors.textMuted} />
                    <Text style={styles.dropdownItemPhone}>{cp.phoneNumber}</Text>
                  </View>
                )}
              </View>
              {selectedCounterpartyId === cp.id && (
                <Check size={18} color={theme.colors.primary} />
              )}
            </Pressable>
          ))}

          {/* Add new button */}
          <Pressable
            onPress={handleOpenCreateForm}
            style={({ pressed }) => [styles.addNewButton, pressed && styles.pressed]}
          >
            <Plus size={18} color={theme.colors.primary} />
            <Text style={styles.addNewText}>
              {filteredCounterparties.length === 0
                ? `Add "${searchText.trim()}"`
                : 'Add new contact'}
            </Text>
          </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <View style={styles.createForm}>
          <Text style={styles.createFormTitle}>New Contact</Text>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Name *</Text>
            <TextInput
              value={newContact.name}
              onChangeText={(text) => setNewContact((prev) => ({ ...prev, name: text }))}
              placeholder="Enter name"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.formInput}
              autoFocus
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              value={newContact.phoneNumber}
              onChangeText={(text) => setNewContact((prev) => ({ ...prev, phoneNumber: text }))}
              placeholder="+998 XX XXX XX XX"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.formInput}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Comment</Text>
            <TextInput
              value={newContact.comment}
              onChangeText={(text) => setNewContact((prev) => ({ ...prev, comment: text }))}
              placeholder="Optional note"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.formInput}
            />
          </View>

          <View style={styles.formActions}>
            <Pressable
              onPress={handleCancelCreate}
              style={({ pressed }) => [styles.formCancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.formCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveNewContact}
              disabled={!newContact.name.trim()}
              style={({ pressed }) => [
                styles.formSaveButton,
                !newContact.name.trim() && styles.formSaveButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.formSaveText}>Save</Text>
            </Pressable>
          </View>
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
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.textPrimary,
      paddingVertical: 14,
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
      borderRadius: 12,
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
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      height: ITEM_HEIGHT,
    },
    dropdownItemSelected: {
      backgroundColor: `${theme.colors.primary}10`,
    },
    dropdownItemContent: {
      flex: 1,
    },
    dropdownItemName: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    dropdownItemNameSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    dropdownItemPhone: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    addNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      height: ITEM_HEIGHT,
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
    createForm: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginTop: 8,
      padding: 16,
      zIndex: 1000,
    },
    createFormTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    formField: {
      marginBottom: 12,
    },
    formLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    formInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    formActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    formCancelButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    formCancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    formSaveButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
    },
    formSaveButtonDisabled: {
      opacity: 0.5,
    },
    formSaveText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  });

export default CounterpartyPicker;
