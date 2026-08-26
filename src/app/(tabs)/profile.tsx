import React from 'react';
import { View, Text } from 'react-native';
import { Screen, ScreenHeader } from '@/components/layout/Screen';

export default function ProfileScreen() {
  return (
    <Screen tone="canvas" edges={['top']}>
      <ScreenHeader title="Profile" back={false} />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-ink">Profile Screen</Text>
        <Text className="mt-2 text-[14px] text-ink-500 text-center">
          (Next up in migration)
        </Text>
      </View>
    </Screen>
  );
}
