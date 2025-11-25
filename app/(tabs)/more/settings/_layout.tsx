import React from 'react';
import { Stack } from 'expo-router';
import ProfileHeader from '../_components/ProfileHeader';

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title="THEME"
              changeTitle="Save Changes"
              onBack={back ? () => navigation.goBack() : undefined}
              onEdit={() => {}}
            />
          ),
          presentation: 'modal',
        }} 
      />
      <Stack.Screen
        name="notifications"
        options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title="Notifications"
              changeTitle="Save Changes"
              onBack={back ? () => navigation.goBack() : undefined}
            />
          ),
        }}
      />
      <Stack.Screen
        name="ai"
        options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title="AI Settings"
              changeTitle="Save Changes"
              onBack={back ? () => navigation.goBack() : undefined}
            />
          ),
        }}
      />
      <Stack.Screen
        name="security"
        options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title="Security"
              changeTitle="Save Changes"
              onBack={back ? () => navigation.goBack() : undefined}
            />
          ),
        }}
      />
      <Stack.Screen
        name="language"
        options={{
          header: ({ navigation, back }) => (
            <ProfileHeader
              title="Language"
              changeTitle="Save Changes"
              onBack={back ? () => navigation.goBack() : undefined}
            />
          ),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
