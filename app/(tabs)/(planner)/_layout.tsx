// app/(tabs)/(planner)/_layout.tsx
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import UniversalFAB from '@/components/UniversalFAB';
import { useAppTheme } from '@/constants/theme';

const PlannerLayout = () => {
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
        </Stack>
      </View>
      <UniversalFAB />
    </SafeAreaView>
  );
};

export default PlannerLayout;
