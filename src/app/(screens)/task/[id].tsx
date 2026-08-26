import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { useApp } from '@/contexts/AppContext';

export default function TaskDetailPlaceholder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { taskById } = useApp();
  const task = id ? taskById(id) : null;

  return (
    <Screen tone="canvas" edges={['top']}>
      <ScreenHeader title="Task Details" />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-ink text-center">
          {task?.title ?? `Task ${id}`}
        </Text>
        <Text className="mt-2 text-[14px] text-ink-500 text-center">
          (Upcoming in migration)
        </Text>
      </View>
    </Screen>
  );
}
