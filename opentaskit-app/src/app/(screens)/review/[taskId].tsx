import React, { useState } from 'react';
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
import { ME } from '@/data/users';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { RatingInput } from '@/components/ui/Rating';
import { SelectChip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';

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
  const { taskById, userById, leaveReview } = useApp();

  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>(['Professional', 'On time']);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  const task = taskById(taskId);
  if (!task) {
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

  const isProvider = task.assignedProviderId === ME;
  const other = userById(
    isProvider
      ? task.requesterId
      : task.assignedProviderId ?? task.requesterId
  );

  const handleSubmit = () => {
    if (text.trim().length < 10) {
      setError('Add a sentence or two so others can learn from your experience');
      return;
    }
    setError(undefined);
    leaveReview({
      taskId,
      toId: other.id,
      rating,
      text: text.trim(),
      tags,
      role: isProvider ? 'requester' : 'provider',
    });
    setDone(true);
  };

  // Celebration state upon publishing review
  if (done) {
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
      <ScreenHeader title="Leave a review" subtitle={task.title} />

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
        <Button full size="lg" variant="brand" onPress={handleSubmit}>
          Publish review
        </Button>
      </View>
    </Screen>
  );
}
