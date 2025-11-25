import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '@/localization/useLocalization';
import { useThemeColors } from '@/constants/theme';

interface InsightsHeaderProps {
  title?: string;
}

export default function InsightsHeader({ title }: InsightsHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const { strings } = useLocalization();
  const resolvedTitle = title ?? strings.tabs.insights.toUpperCase();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.actions}>
        <Pressable
          onPress={() => {}}
          style={[styles.iconButton, { backgroundColor: colors.background }]}
        >
          <Ionicons name="refresh" size={24} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/(tabs)/(insights)/history')}
          style={[styles.iconButton, { backgroundColor: colors.background }]}
        >
          <Ionicons name="bar-chart-outline" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{resolvedTitle}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {}}
          style={[styles.iconButton, { backgroundColor: colors.background }]}
        >
          <Ionicons name="sparkles-outline" size={24} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => router.navigate('/(tabs)/more')}
          style={[styles.iconButton, { backgroundColor: colors.background }]}
        >
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 'auto',
    height: 'auto',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});
