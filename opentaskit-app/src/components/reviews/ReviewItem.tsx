import React from 'react';
import { View, Text } from 'react-native';
import type { Review } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { timeAgo } from '@/utils/format';
import { Avatar } from '@/components/ui/Avatar';
import { StarRow } from '@/components/ui/Rating';
import { Chip } from '@/components/ui/Chip';

export function ReviewItem({ review }: { review: Review }) {
  const { userById } = useApp();
  const author = userById(review.fromId);

  return (
    <View className="rounded-3xl border border-ink-200 bg-white p-4">
      <View className="flex-row items-start gap-3" style={{ gap: 12 }}>
        <Avatar user={author} size="sm" />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-baseline justify-between gap-2">
            <Text
              numberOfLines={1}
              className="flex-1 text-[14px] font-geist-semibold text-ink"
            >
              {author.name}
            </Text>
            <Text className="shrink-0 font-geist text-[11.5px] text-ink-400">
              {timeAgo(review.at)}
            </Text>
          </View>
          <View className="mt-1">
            <StarRow value={review.rating} size={13} />
          </View>
        </View>
      </View>

      <Text className="mt-3 font-geist text-[13.5px] leading-relaxed text-ink-700">
        {review.text}
      </Text>

      {review.tags.length > 0 && (
        <View className="mt-3 flex-row flex-wrap gap-1.5" style={{ gap: 6 }}>
          {review.tags.map((tag) => (
            <Chip key={tag} tone="brand">
              {tag}
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
}
