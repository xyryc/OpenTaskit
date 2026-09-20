import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useAppSelector } from '@/store';
import {
  useCreateReviewMutation,
  useGetOffersForTaskQuery,
  useGetReviewsForTaskQuery,
  useGetTaskByIdQuery,
} from '@/store/api/apiSlice';
import { getApiErrorMessage } from '@/utils/apiError';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { RatingInput } from '@/components/ui/Rating';
import { SelectChip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { TaskCardSkeleton } from '@/components/ui/Feedback';

const TAG_OPTIONS = [
  'Professional',
  'On time',
  'Great communication',
  'High quality',
  'Friendly',
  'Reliable',
];

const RATING_COPY = [
  '',
  'Not good',
  'Below expectations',
  'Okay',
  'Great',
  'Excellent',
];

export default function LeaveReviewScreen() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userById, toast } = useApp();
  const authUser = useAppSelector((state) => state.auth.user);

  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>(['Professional', 'On time']);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  const { data: apiTask, isLoading: isTaskLoading } = useGetTaskByIdQuery(taskId, { skip: !taskId });
  const { data: taskOffers } = useGetOffersForTaskQuery(taskId, { skip: !taskId });
  const { data: taskReviews, isLoading: isReviewsLoading } = useGetReviewsForTaskQuery(taskId, { skip: !taskId });
  const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();

  const acceptedOffer = useMemo(() => taskOffers?.find((o) => o.status === 'ACCEPTED'), [taskOffers]);
  const isProvider = !!(authUser?.id && acceptedOffer && acceptedOffer.userId === authUser.id);

  const otherSummary = isProvider ? apiTask?.user : acceptedOffer?.user;
  const fallbackOther = userById(
    isProvider ? apiTask?.userId ?? '' : acceptedOffer?.userId ?? ''
  );
  const other = otherSummary
    ? {
        ...fallbackOther,
        id: otherSummary.id,
        name: otherSummary.fullName || fallbackOther.name,
        avatarUrl: otherSummary.avatarUrl ?? fallbackOther.avatarUrl,
        verified: (otherSummary as any).isVerified ?? fallbackOther.verified,
      }
    : fallbackOther;

  const alreadyReviewed = useMemo(
    () => !!authUser?.id && taskReviews?.some((r) => r.fromUserId === authUser.id),
    [taskReviews, authUser?.id]
  );

  const handleSubmit = async () => {
    if (text.trim().length < 10) {
      setError('Add a sentence or two so others can learn from your experience');
      return;
    }
    setError(undefined);
    try {
      await createReview({
        taskId,
        rating,
        text: text.trim(),
        tags,
      }).unwrap();
      setDone(true);
    } catch (err) {
      toast({
        title: 'Could not submit review',
        description: getApiErrorMessage(err),
        variant: 'error',
      });
    }
  };

  if (isTaskLoading || isReviewsLoading) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Review" />
        <View className="p-5 gap-3" style={{ gap: 12 }}>
          <TaskCardSkeleton />
        </View>
      </Screen>
    );
  }

  if (!apiTask) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Review" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-ink-500">
            Task not found.
          </Text>
        </View>
      </Screen>
    );
  }

  if (apiTask.status !== 'COMPLETED') {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Review" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center font-geist text-[14px] text-ink-500">
            Reviews can only be left once this task is marked completed.
          </Text>
        </View>
      </Screen>
    );
  }

  // Celebration state upon publishing review (or if already reviewed earlier)
  if (done || alreadyReviewed) {
    return (
      <Screen tone="white" edges={['top']}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-6 text-center">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-brand-tint">
            <CheckCircle2 size={48} color="#0094F7" />
          </View>

          <Text className="mt-6 text-[26px] font-geist-bold tracking-[-0.03em] text-ink text-center">
            Thanks for the review
          </Text>

          <Text className="mt-2 max-w-[280px] text-center font-geist text-[14.5px] leading-relaxed text-ink-500">
            Your feedback is now on {other.name.split(' ')[0]}’s profile and
            helps the next person choose with confidence.
          </Text>
        </View>

        <View
          className="shrink-0 gap-2.5 px-6 pb-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 4, gap: 10 }}
        >
          <Button
            full
            size="lg"
            variant="brand"
            onPress={() =>
              router.push({
                pathname: '/(screens)/provider/[userId]',
                params: { userId: other.id },
              } as any)
            }
          >
            See their profile
          </Button>
          <Button
            full
            size="lg"
            variant="ghost"
            onPress={() => router.push('/(tabs)/activity')}
          >
            Back to activity
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Leave a review" subtitle={apiTask.title} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="gap-6 px-5 pt-6" style={{ gap: 24 }}>
          {/* Header with Avatar and Rating */}
          <View className="items-center text-center">
            <Avatar user={other} size="xl" showVerified />
            <Text className="mt-4 text-[20px] font-geist-bold tracking-[-0.02em] text-ink text-center">
              How was your experience?
            </Text>
            <Text className="mt-1 font-geist text-[13.5px] text-ink-500 text-center">
              {isProvider ? 'Rate the requester' : 'Rate'} {other.name}
            </Text>

            <View className="mt-5">
              <RatingInput value={rating} onChange={setRating} />
            </View>
            <Text className="mt-2.5 font-geist-semibold text-[14px] text-brand">
              {RATING_COPY[rating]}
            </Text>
          </View>

          {/* Tags */}
          <View>
            <Text className="mb-2.5 text-[14.5px] font-geist-semibold text-ink">
              What stood out?
            </Text>
            <View className="flex-row flex-wrap gap-2" style={{ gap: 8 }}>
              {TAG_OPTIONS.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <SelectChip
                    key={tag}
                    selected={selected}
                    onPress={() =>
                      setTags((prev) =>
                        selected
                          ? prev.filter((x) => x !== tag)
                          : [...prev, tag]
                      )
                    }
                  >
                    {tag}
                  </SelectChip>
                );
              })}
            </View>
          </View>

          {/* Text Area */}
          <View>
            <TextArea
              label="Your review"
              value={text}
              onChangeText={setText}
              error={error}
              placeholder="What went well? Anything the next person should know?"
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        <Button full size="lg" variant="brand" loading={isSubmitting} onPress={handleSubmit}>
          Publish review
        </Button>
      </View>
    </Screen>
  );
}
