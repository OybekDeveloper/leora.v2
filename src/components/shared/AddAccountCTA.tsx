import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlusCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';

interface AddAccountCTAProps {
  title?: string;
  subtitle?: string;
}

export const AddAccountCTA: React.FC<AddAccountCTAProps> = ({
  title = 'Add first account',
  subtitle = 'Accounts are required to proceed',
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/(modals)/finance/add-account');
  }, [router]);

  return (
    <Pressable onPress={handlePress} style={styles.root}>
      <AdaptiveGlassView style={styles.card}>
        <View style={styles.iconWrap}>
          <PlusCircle size={24} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </AdaptiveGlassView>
    </Pressable>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    root: {
      marginVertical: theme.spacing.md,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.xxl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
  });
