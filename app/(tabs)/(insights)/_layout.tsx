// app/(tabs)/(insights)/_layout.tsx
import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import UniversalFAB from '@/components/UniversalFAB';
import InsightsModals from '@/components/screens/insights/InsightsModals';
import { useAppTheme } from '@/constants/theme';

const InsightsLayout = () => {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        contentWrapper: {
          flex: 1,
          position: 'relative',
        },
        content: {
          backgroundColor: theme.colors.background,
        },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.contentWrapper}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: styles.content,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="history" />
          <Stack.Screen name="questions" />
        </Stack>
        <UniversalFAB />
      </View>
      <InsightsModals />
    </SafeAreaView>
  );
};

export default InsightsLayout;
