import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  const { hasSeenOnboarding } = useOnboardingStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  return (
    <Stack
      initialRouteName={hasSeenOnboarding ? 'login' : 'onboarding'}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#25252B',
        },
      }}
    >
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
