import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/useAuthStore';
import { useAppTheme } from '@/constants/theme';

export default function AuthLayout() {
  const theme = useAppTheme();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Authenticated bo'lsa tabs ga o'tish
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  return (
    <Stack
      initialRouteName="onboarding"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="select-region" options={{ presentation: 'modal' }} />
      <Stack.Screen name="select-currency" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
