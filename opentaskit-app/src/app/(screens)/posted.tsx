import React from 'react';
import { View, Text, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle2, Home, Share2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/contexts/AppContext';
import { money, scheduleLabel } from '@/utils/format';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { CategoryBadge } from '@/components/CategoryIcon';

export default function TaskPostedScreen() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskById, toast } = useApp();

  const task = taskById(taskId);

  const handleShare = async () => {
    try {
      if (task) {
        await Share.share({
          message: `Check out my task on OpenTaskit: ${task.title} (${money(task.budget)})`,
        });
      } else {
        toast({ title: 'Link copied', description: 'Share your task with friends.', variant: 'success' });
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  return (
    <Screen tone="white" edges={['top']}>
      <StatusBar style="dark" />

      <View className="flex-1 items-center justify-center px-6 text-center">
        {/* Celebration Success Badge */}
        <View className="relative h-24 w-24 items-center justify-center rounded-[32px] bg-brand-tint">
          <CheckCircle2 size={44} color="#0094F7" strokeWidth={2.2} />
        </View>

        <Text className="mt-7 text-center text-[26px] font-geist-semibold tracking-[-0.03em] text-ink">
          Your task is live
        </Text>
        <Text className="mt-2 max-w-[280px] text-center font-geist text-[14.5px] leading-relaxed text-ink-500">
          People nearby can see it now. You will get a notification the moment an offer arrives.
        </Text>

        {/* Task Summary Card */}
        {task && (
          <View className="mt-7 w-full rounded-3xl border border-ink-200 bg-white p-4 shadow-sm">
            <View className="flex-row items-start gap-3" style={{ gap: 12 }}>
              <CategoryBadge categoryId={task.categoryId} size="lg" />
              <View className="flex-1 min-w-0">
                <Text
                  numberOfLines={2}
                  className="text-[14.5px] font-geist-semibold leading-snug text-ink"
                >
                  {task.title}
                </Text>
                <Text className="mt-1 font-geist text-[12.5px] text-ink-500">
                  {money(task.budget)} · {task.location}
                </Text>
                <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                  {scheduleLabel(task.schedule)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Sticky Bottom Actions */}
      <View
        className="shrink-0 gap-2.5 px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 20), gap: 10 }}
      >
        <Button
          full
          size="lg"
          variant="brand"
          onPress={() => router.replace({ pathname: '/(screens)/task/[id]', params: { id: taskId } } as any)}
        >
          View my task
        </Button>

        <Button
          full
          size="lg"
          variant="outline"
          icon={<Share2 size={16} color="#0C1417" />}
          onPress={handleShare}
        >
          Share task
        </Button>

        <Button
          full
          size="lg"
          variant="ghost"
          icon={<Home size={16} color="#5B6A72" />}
          onPress={() => router.replace('/(tabs)/home')}
        >
          Back to home
        </Button>
      </View>
    </Screen>
  );
}
