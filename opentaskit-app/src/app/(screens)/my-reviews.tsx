import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MessageSquareQuote } from 'lucide-react-native';

import { useGetMyReviewsQuery } from '@/store/api/apiSlice';
import { initialsOf, timeAgo } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { StarRow } from '@/components/ui/Rating';
import { TabBar } from '@/components/ui/Segmented';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';
import type { ReviewItem } from '@/types';

type Tab = 'received' | 'given';

export default function MyReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('received');

  const { data, isLoading, isFetching } = useGetMyReviewsQuery();

  const reviews = useMemo<ReviewItem[]>(
    () => (tab === 'received' ? data?.received ?? [] : data?.given ?? []),
    [data, tab]
  );

  const handleOpenProfile = (userId?: string) => {
    if (!userId) return;
    router.push({
      pathname: '/(screens)/provider/[userId]',
      params: { userId },
    } as any);
  };

  const handleOpenTask = (taskId?: string) => {
    if (!taskId) return;
    router.push({
      pathname: '/(screens)/task/[id]',
      params: { id: taskId },
    } as any);
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="My reviews" />

      <TabBar
        tabs={[
          { value: 'received', label: 'Received', count: data?.totalReceived },
          { value: 'given', label: 'Given', count: data?.totalGiven },
        ]}
        value={tab}
        onChange={setTab}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 24,
        }}
      >
        <View className="gap-3 px-5 pt-4" style={{ gap: 12 }}>
          {isLoading || isFetching ? (
            <ListSkeleton count={4} />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquareQuote size={32} color="#8A959B" />}
              title={tab === 'received' ? 'No reviews yet' : "You haven't reviewed anyone yet"}
              message={
                tab === 'received'
                  ? 'Reviews from people you work with will show up here.'
                  : 'Once you complete a job, you can leave a review for the other party.'
              }
            />
          ) : (
            reviews.map((review) => {
              const person = tab === 'received' ? review.fromUser : review.toUser;
              const taskImages = review.task?.images ?? [];

              return (
                <View
                  key={review.id}
                  className="rounded-3xl border border-ink-200 bg-white p-4"
                >
                  <View className="flex-row items-start gap-3" style={{ gap: 12 }}>
                    <Pressable
                      onPress={() => handleOpenProfile(person?.id)}
                      hitSlop={6}
                      className="active:opacity-80"
                    >
                      <Avatar
                        user={{
                          name: person?.fullName ?? 'OpenTaskit user',
                          initials: initialsOf(person?.fullName ?? 'OT'),
                          tone: 'bg-brand-tint',
                          verified: false,
                          avatarUrl: person?.avatarUrl ?? undefined,
                        }}
                        size="sm"
                      />
                    </Pressable>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-baseline justify-between gap-2">
                        <Pressable
                          className="flex-1 min-w-0"
                          onPress={() => handleOpenProfile(person?.id)}
                          hitSlop={6}
                        >
                          <Text
                            numberOfLines={1}
                            className="text-[14px] font-geist-semibold text-ink active:text-brand"
                          >
                            {tab === 'received'
                              ? person?.fullName ?? 'OpenTaskit user'
                              : `To ${person?.fullName ?? 'OpenTaskit user'}`}
                          </Text>
                        </Pressable>
                        <Text className="shrink-0 font-geist text-[11.5px] text-ink-400">
                          {timeAgo(review.createdAt)}
                        </Text>
                      </View>
                      <View className="mt-1">
                        <StarRow value={review.rating} size={13} />
                      </View>
                      {review.task?.title && (
                        <Pressable
                          onPress={() => handleOpenTask(review.task?.id)}
                          className="mt-1 active:opacity-75"
                        >
                          <Text
                            numberOfLines={1}
                            className="font-geist text-[12px] text-ink-500"
                          >
                            {review.task.title}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <Text className="mt-3 font-geist text-[13.5px] leading-relaxed text-ink-700">
                    {review.text}
                  </Text>

                  {taskImages.length > 0 && (
                    <View className="mt-3">
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="-mx-1"
                      >
                        <View className="flex-row gap-2 px-1" style={{ gap: 8 }}>
                          {taskImages.map((imgUri, idx) => (
                            <Pressable
                              key={idx}
                              onPress={() => handleOpenTask(review.task?.id)}
                              className="overflow-hidden rounded-2xl border border-ink-100 active:opacity-85"
                            >
                              <Image
                                source={{ uri: imgUri }}
                                style={{ width: 72, height: 72 }}
                                contentFit="cover"
                              />
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {review.tags.length > 0 && (
                    <View className="mt-3 flex-row flex-wrap gap-1.5" style={{ gap: 6 }}>
                      {review.tags.map((tagLabel) => (
                        <Chip key={tagLabel} tone="brand">
                          {tagLabel}
                        </Chip>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
