import React from 'react';
import { View, Text } from 'react-native';
import { Screen, ScreenHeader } from '@/components/layout/Screen';

export default function CreateTaskScreen() {
  return (
    <Screen tone="canvas" edges={['top']}>
      <ScreenHeader title="Post a Task" />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-ink">Post a Task Screen</Text>
        <Text className="mt-2 text-[14px] text-ink-500 text-center">
          (Upcoming in migration)
        </Text>
      </View>
    </Screen>
  );
}
