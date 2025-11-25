// app/(tabs)/(finance)/_layout.tsx
import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UniversalFAB from '@/components/UniversalFAB';
import { useAppTheme } from '@/constants/theme';

const FinanceLayout = () => {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <UniversalFAB />
    </SafeAreaView>
  );
};

export default FinanceLayout;
