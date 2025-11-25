import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Theme, useAppTheme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const SUGGESTIONS = [
  'How to improve focus',
  'Create a new task',
  'Budget tips 2025',
  'Plan my goals',
  'AI suggestions for finance',
  'Quick expenses list',
  'Upcoming invoices',
  'Track my debts',
];

export default function SearchModalScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    return SUGGESTIONS.filter((item) =>
      item.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [query]);

  // Ekran ochilganda inputga focus qo'yish
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    router.back();
  };

  const handleSelect = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Search selected:', item);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item)}
            style={({ pressed }) => [styles.resultItem, pressed && { opacity: 0.6 }]}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.textSecondary}
              style={{ marginRight: 12 }}
            />
            <Text style={styles.resultText}>{item}</Text>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <View style={styles.searchBar}>
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search..."
                  placeholderTextColor={colors.textSecondary + '99'}
                  style={styles.input}
                  autoCorrect={false}
                  autoCapitalize="none"
                  autoFocus={true}
                  returnKeyType="search"
                />
                {!!query.length && (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
              <Pressable onPress={handleClose} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          query.length > 1 ? (
            <Text style={styles.emptyText}>No results found</Text>
          ) : (
            <Text style={styles.emptyText}>Start typing to search</Text>
          )
        }
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingBottom: 12,
      paddingTop: Platform.OS === 'ios' ? 12 : 40,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.textSecondary + '33',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 12,
    },
    input: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 16,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.textSecondary + '22',
    },
    resultText: {
      color: theme.colors.textPrimary,
      fontSize: 16,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      marginTop: 32,
      fontSize: 15,
    },
  });
