import React from 'react';
import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="language" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="provider-dashboard" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="create" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="chats" />
      <Stack.Screen name="chat/[taskId]" />
      <Stack.Screen name="task/[id]" />
      <Stack.Screen name="posted" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="provider/[userId]" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="account-settings" />
      <Stack.Screen name="notification-settings" />
      <Stack.Screen name="security-settings" />
      <Stack.Screen name="legal/[doc]" />
      <Stack.Screen name="help-center" />
      <Stack.Screen name="kyc" />
    </Stack>
  );
}
