import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BookmarkX, Trash2, LogIn } from 'lucide-react-native';

import { useSavedTasks } from '@/hooks/useSavedTasks';
import { mapApiTaskToTask } from '@/utils/taskFilters';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/Feedback';
import { TaskCard } from '@/components/task/TaskCard';
import { useApp } from '@/contexts/AppContext';

export default function SavedTasksScreen() {
  const router = useRouter();
  const { toast } = useApp();
  const {
    savedTasks,
    isLoading,
    isFetching,
    refetch,
    toggleSave,
    isLoggedIn,
  } = useSavedTasks();

  const handleRemove = async (taskId: string) => {
    const res = await toggleSave(taskId);
    if (res.success) {
      toast({ title: 'Removed from saved', variant: 'info' });
    } else {
      toast({ title: 'Failed to remove', description: 'Please try again', variant: 'error' });
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Saved tasks"
        subtitle={
          isLoggedIn
            ? `${savedTasks.length} ${savedTasks.length === 1 ? 'task' : 'tasks'} saved`
            : 'Sign in to access bookmarks'
        }
      />

      {!isLoggedIn ? (
        <View className="flex-1 justify-center px-6">
          <EmptyState
            icon={<LogIn size={32} color="#0094F7" />}
            title="Sign in to view saved tasks"
            message="Your saved bookmarks will be synced to your account across all your devices."
            actionLabel="Sign in"
            onAction={() => router.push('/(auth)/login' as any)}
          />
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#0094F7" />
          <Text className="mt-3 font-geist text-[13px] text-ink-500">
            Loading your saved tasks...
          </Text>
        </View>
      ) : savedTasks.length === 0 ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#0094F7"
              colors={['#0094F7']}
            />
          }
        >
          <EmptyState
            icon={<BookmarkX size={32} color="#0094F7" />}
            title="No saved tasks yet"
            message="Tap the bookmark on any task to keep it here while you decide whether to send an offer."
            actionLabel="Discover tasks"
            onAction={() => router.push('/discover' as any)}
          />
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#0094F7"
              colors={['#0094F7']}
            />
          }
        >
          <View className="gap-4">
            {savedTasks.map((apiItem) => {
              const task = mapApiTaskToTask(apiItem);
              return (
                <View key={task.id} className="gap-2">
                  <TaskCard task={task} />

                  {/* Sub-row with offer summary & remove button */}
                  <View className="flex-row items-center justify-between px-2">
                    <Text className="font-geist text-[12px] text-ink-500">
                      {task.offersCount ?? 0} offers · budget {money(task.budget)}
                    </Text>
                    <Pressable
                      onPress={() => handleRemove(task.id)}
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
              );
            })}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

