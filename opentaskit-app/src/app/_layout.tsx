import "../../global.css";
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { store } from '@/store';
import { AppProvider } from '@/contexts/AppContext';
import { NotificationBannerHost } from '@/components/notifications/NotificationBannerHost';
import { PushNotificationSync } from '@/components/notifications/PushNotificationSync';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.ttf'),
    'Geist-Bold': require('../../assets/fonts/Geist-Bold.ttf'),
    'GeistMono-Regular': require('../../assets/fonts/GeistMono-Regular.ttf'),
    'GeistMono-Medium': require('../../assets/fonts/GeistMono-Medium.ttf'),
    'GeistMono-SemiBold': require('../../assets/fonts/GeistMono-SemiBold.ttf'),
    'GeistMono-Bold': require('../../assets/fonts/GeistMono-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }
  return (
    <Provider store={store}>
      <AppProvider>
        <SafeAreaProvider>
          <KeyboardProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(screens)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <NotificationBannerHost />
            <PushNotificationSync />
          </KeyboardProvider>
        </SafeAreaProvider>
      </AppProvider>
    </Provider>
  );
}
