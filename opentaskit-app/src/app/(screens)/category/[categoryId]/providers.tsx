import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BadgeCheck,
  ChevronRight,
  MapPin,
  UserSearch,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { categoryById } from '@/data/categories';
import { initialsOf } from '@/utils/format';
import { useGetCategoriesQuery, useGetProvidersQuery } from '@/store/api/apiSlice';
import type { ProviderItem } from '@/types/api';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip, SelectChip } from '@/components/ui/Chip';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';
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

  const [sort, setSort] = useState<SortKey>('rating');
  const [refreshing, setRefreshing] = useState(false);

  const { data: categories = [] } = useGetCategoriesQuery();
  const fallbackCategory = categoryById(categoryId);
  const activeCategory =
    categories.find((c) => c.id === categoryId || c.slug === categoryId) || fallbackCategory;

  const {
    data: apiProviders = [],
    isLoading,
    refetch,
  } = useGetProvidersQuery({
    categoryId: activeCategory?.id || categoryId,
  });

  const providers = useMemo(() => {
    const list = [...apiProviders];
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'experience') list.sort((a, b) => b.completedJobs - a.completedJobs);
    return list;
  }, [apiProviders, sort]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePostTask = () => {
    if (!requireAccount('post')) return;
    router.push({
      pathname: '/(screens)/create',
      params: { categoryId: activeCategory?.id || categoryId },
    } as any);
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title={activeCategory.name}
        subtitle={
          isLoading
            ? 'Loading providers...'
            : `${providers.length} ${
                providers.length === 1 ? 'person' : 'people'
              } offering this service`
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0094F7"
          />
        }
      >
        <View className="px-5 pt-4">
          {/* Category Banner Card */}
          <View
            className="mb-4 flex-row items-center rounded-3xl border border-ink-200 bg-white p-4"
            style={{ gap: 12 }}
          >
            <CategoryBadge categoryId={(activeCategory as any)?.slug || categoryId} size="lg" />
            <View className="flex-1 min-w-0">
              <Text className="text-[14.5px] font-geist-semibold text-ink">
                {activeCategory.name} near you
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
            </ScrollView>
          </View>

          {/* Provider List */}
          {isLoading ? (
            <ListSkeleton count={3} />
          ) : providers.length > 0 ? (
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
                    Post a {activeCategory.name.toLowerCase()} task
                  </Button>
                </View>
              </View>
            </View>
          ) : (
            <View className="py-12">
              <EmptyState
                icon={<UserSearch size={32} color="#8A959B" />}
                title={`No ${activeCategory.name.toLowerCase()} providers yet`}
                message="Post your task anyway — new people join every week and we will notify you when offers arrive."
                actionLabel="Post a task"
                onAction={handlePostTask}
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
  provider: ProviderItem;
  onPress: () => void;
}) {
  const avatarUser = {
    name: provider.fullName || provider.name,
    initials: initialsOf(provider.fullName || provider.name),
    avatarUrl: provider.avatarUrl,
    tone: 'bg-brand text-white',
    verified: provider.isVerified || provider.verified,
  };

  return (
    <Pressable
      onPress={onPress}
      className="w-full rounded-3xl border border-ink-200 bg-white p-4 shadow-sm active:bg-ink-100/60"
    >
      <View className="flex-row items-start gap-3" style={{ gap: 12 }}>
        <Avatar user={avatarUser} size="lg" showVerified />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-1.5">
            <Text
              numberOfLines={1}
              className="text-[15px] font-geist-semibold tracking-[-0.01em] text-ink"
            >
              {provider.fullName || provider.name}
            </Text>
            {(provider.isVerified || provider.verified) && (
              <BadgeCheck size={16} color="#0094F7" />
            )}
          </View>
          <Text
            numberOfLines={1}
            className="mt-0.5 font-geist text-[12.5px] text-ink-500"
          >
            {provider.headline || 'OpenTaskit Tasker'}
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
            {provider.location || 'Sri Lanka'}
          </Text>
        </View>
        <Text className="font-geist text-[12px] text-ink-500">
          · {provider.completedJobs} {provider.completedJobs === 1 ? 'job' : 'jobs'} done
        </Text>
      </View>

      {provider.skills?.length > 0 && (
        <View className="mt-3 flex-row flex-wrap gap-1.5 border-t border-ink-100 pt-3" style={{ gap: 6 }}>
          {provider.skills.slice(0, 3).map((skill) => (
            <Chip key={skill} tone="outline">
              {skill}
            </Chip>
          ))}
        </View>
      )}
    </Pressable>
  );
}

