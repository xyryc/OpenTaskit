import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  MapPin,
  UserSearch,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { providersForCategory } from '@/data/users';
import { categoryById } from '@/data/categories';
import { distance } from '@/utils/format';
import type { User } from '@/types';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip, SelectChip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/Feedback';
import { StarRating } from '@/components/ui/Rating';
import { CategoryBadge } from '@/components/CategoryIcon';

type SortKey = 'nearest' | 'rating' | 'experience';

export default function CategoryProvidersScreen() {
  const { categoryId = 'cleaning' } = useLocalSearchParams<{
    categoryId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requireAccount } = useApp();

  const [sort, setSort] = useState<SortKey>('nearest');
  const [availableOnly, setAvailableOnly] = useState(false);

  const category = categoryById(categoryId);

  const providers = useMemo(() => {
    const list = providersForCategory(categoryId).filter(
      (p) => !availableOnly || p.available
    );
    const sorted = [...list];
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    if (sort === 'experience') sorted.sort((a, b) => b.completedJobs - a.completedJobs);
    return sorted;
  }, [categoryId, sort, availableOnly]);

  const handlePostTask = () => {
    if (!requireAccount('post')) return;
    router.push('/(screens)/create');
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title={category.name}
        subtitle={`${providers.length} ${
          providers.length === 1 ? 'person' : 'people'
        } offering this service`}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-4">
          {/* Category Banner Card */}
          <View
            className="mb-4 flex-row items-center rounded-3xl border border-ink-200 bg-white p-4"
            style={{ gap: 12 }}
          >
            <CategoryBadge categoryId={categoryId} size="lg" />
            <View className="flex-1 min-w-0">
              <Text className="text-[14.5px] font-geist-semibold text-ink">
                {category.name} near you
              </Text>
              <Text className="mt-0.5 font-geist text-[12.5px] leading-snug text-ink-500">
                Browse people who do this work, then post a task to receive their offers.
              </Text>
            </View>
          </View>

          {/* Quick Filter Chips */}
          <View className="mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <SelectChip
                selected={sort === 'nearest'}
                onPress={() => setSort('nearest')}
              >
                Nearest
              </SelectChip>
              <SelectChip
                selected={sort === 'rating'}
                onPress={() => setSort('rating')}
              >
                Top rated
              </SelectChip>
              <SelectChip
                selected={sort === 'experience'}
                onPress={() => setSort('experience')}
              >
                Most jobs
              </SelectChip>
              <SelectChip
                selected={availableOnly}
                onPress={() => setAvailableOnly((v) => !v)}
              >
                Available now
              </SelectChip>
            </ScrollView>
          </View>

          {/* Provider List */}
          {providers.length > 0 ? (
            <View className="gap-3" style={{ gap: 12 }}>
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onPress={() =>
                    router.push({
                      pathname: '/(screens)/provider/[userId]',
                      params: { userId: provider.id },
                    } as any)
                  }
                />
              ))}

              {/* Ready to hire CTA */}
              <View className="mt-2 rounded-3xl border border-brand/30 bg-brand-tint/40 p-4">
                <Text className="text-[14.5px] font-geist-semibold text-ink">
                  Ready to get it done?
                </Text>
                <Text className="mt-1 font-geist text-[12.5px] leading-relaxed text-ink-600">
                  Post your task and everyone here can send you a price. You choose who to hire.
                </Text>
                <View className="mt-3">
                  <Button
                    size="md"
                    full
                    variant="brand"
                    onPress={handlePostTask}
                  >
                    Post a {category.name.toLowerCase()} task
                  </Button>
                </View>
              </View>
            </View>
          ) : (
            <View className="py-12">
              <EmptyState
                icon={<UserSearch size={32} color="#8A959B" />}
                title={`No ${category.name.toLowerCase()} providers yet`}
                message={
                  availableOnly
                    ? 'Nobody in this category is marked available right now. Turn the filter off to see everyone.'
                    : 'Post your task anyway — new people join every week and we will notify you when offers arrive.'
                }
                actionLabel={availableOnly ? 'Show everyone' : 'Post a task'}
                onAction={
                  availableOnly
                    ? () => setAvailableOnly(false)
                    : handlePostTask
                }
              />
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ProviderCard({
  provider,
  onPress,
}: {
  provider: User;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full rounded-3xl border border-ink-200 bg-white p-4 shadow-sm active:bg-ink-100/60"
    >
      <View className="flex-row items-start gap-3" style={{ gap: 12 }}>
        <Avatar user={provider} size="lg" showVerified />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-1.5">
            <Text
              numberOfLines={1}
              className="text-[15px] font-geist-semibold tracking-[-0.01em] text-ink"
            >
              {provider.name}
            </Text>
            {provider.verified && (
              <BadgeCheck size={16} color="#0094F7" />
            )}
          </View>
          <Text
            numberOfLines={1}
            className="mt-0.5 font-geist text-[12.5px] text-ink-500"
          >
            {provider.headline}
          </Text>
          <View className="mt-1">
            <StarRating
              value={provider.rating}
              count={provider.reviewCount}
              size="sm"
            />
          </View>
        </View>
        <ChevronRight size={18} color="#B9C2C7" className="mt-1" />
      </View>

      <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-1.5" style={{ gap: 8 }}>
        <View className="flex-row items-center gap-1">
          <MapPin size={12} color="#8A959B" />
          <Text className="font-geist text-[12px] text-ink-500">
            {provider.location} · {distance(provider.distanceKm)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color="#8A959B" />
          <Text className="font-geist text-[12px] text-ink-500">
            Replies {provider.respondsIn}
          </Text>
        </View>
        <Text className="font-geist text-[12px] text-ink-500">
          · {provider.completedJobs} jobs done
        </Text>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-1.5 border-t border-ink-100 pt-3" style={{ gap: 6 }}>
        <Chip tone={provider.available ? 'success' : 'neutral'}>
          {provider.available ? 'Available now' : 'Not accepting work'}
        </Chip>
        {provider.skills.slice(0, 2).map((skill) => (
          <Chip key={skill} tone="outline">
            {skill}
          </Chip>
        ))}
      </View>
    </Pressable>
  );
}
