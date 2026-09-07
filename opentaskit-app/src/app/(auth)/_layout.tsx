import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAppSelector } from '@/store';

export default function AuthLayout() {
  const authed = useAppSelector((state) => state.auth.authed);

  if (authed) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="reset" />
    </Stack>
  );
}
