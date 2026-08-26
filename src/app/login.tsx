import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
      <Text className="text-2xl font-bold text-ink">Log In Screen</Text>
      <Text className="text-ink-500 mt-2 text-center">
        (Next up in auth flow migration)
      </Text>
      <Button
        className="mt-6"
        variant="outline"
        onPress={() => router.replace('/welcome')}
      >
        Back to Welcome
      </Button>
    </SafeAreaView>
  );
}
