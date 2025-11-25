import React from 'react';
import { Stack, useRouter } from 'expo-router';
import ProfileHeader from '../_components/ProfileHeader';

export default function AccountLayout() {
  const router = useRouter()
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="achievements"
        options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title="Achievements"
              changeTitle="Save Changes"
              onBack={back ? () => navigation.goBack() : undefined}
            />
          ),
        }}
      />
      <Stack.Screen
        name="premium"
        options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title="Premium Status"
              changeTitle="Save Changes"
              onBack={back ? () => navigation.goBack() : undefined}
            />
          ),
        }}
      />
      <Stack.Screen
        name="statistics"
        options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title="Statistics"
              changeTitle="Save Changes"
              onBack={back ? () => navigation.goBack() : undefined}
            />
          ),
        }}
      />
    </Stack>
  );
}
