import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-canvas items-center justify-center p-6">
      <Text className="text-2xl font-bold text-ink">Home Screen</Text>
      <Text className="text-ink-500 mt-2 text-center">
        Guest browsing activated! Home and Discovery tabs will be migrated next.
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
