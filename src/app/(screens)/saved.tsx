import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BookmarkX, Trash2 } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/Feedback';
import { TaskCard } from '@/components/task/TaskCard';

export default function SavedTasksScreen() {
  const router = useRouter();
  const { savedTaskIds, tasks, toggleSaved, offersForTask } = useApp();

  const saved = savedTaskIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Saved tasks"
        subtitle={`${saved.length} ${saved.length === 1 ? 'task' : 'tasks'} saved`}
      />

      {saved.length === 0 ? (
        <View className="flex-1 justify-center px-6">
          <EmptyState
            icon={<BookmarkX size={32} color="#0094F7" />}
            title="No saved tasks yet"
            message="Tap the bookmark on any task to keep it here while you decide whether to send an offer."
            actionLabel="Discover tasks"
            onAction={() => router.push('/discover' as any)}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4">
            {saved.map((task) => (
              <View key={task.id} className="gap-2">
                <TaskCard task={task} />

                {/* Sub-row with offer summary & remove button */}
                <View className="flex-row items-center justify-between px-2">
                  <Text className="font-geist text-[12px] text-ink-500">
                    {offersForTask(task.id).length} offers · budget {money(task.budget)}
                  </Text>
                  <Pressable
                    onPress={() => toggleSaved(task.id)}
                    hitSlop={8}
                    className="flex-row items-center gap-1"
                  >
                    <Trash2 size={13} color="#C7382F" />
                    <Text className="text-[12.5px] font-geist-semibold font-semibold text-danger">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
