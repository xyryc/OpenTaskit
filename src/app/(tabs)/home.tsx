import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Bell,
  ChevronDown,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search as SearchIcon,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { categories } from '@/data/categories';
import { recommendedTasks, reasonLabel } from '@/utils/recommend';
import { Screen, SectionHeader } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/Segmented';
import { ListSkeleton, Skeleton } from '@/components/ui/Feedback';
import { TaskCard } from '@/components/task/TaskCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ProviderSnapshot } from '@/components/home/ProviderSnapshot';
import { PosterTodo } from '@/components/home/PosterTodo';
import { LocationSheet } from '@/components/home/LocationSheet';
import { GuestBanner, AccountGate } from '@/components/auth/AccountGate';

export default function HomeScreen() {
  const router = useRouter();
  const {
    t,
    me,
    mode,
    setMode,
    tasks,
    unreadNotifications,
    unreadMessages,
    currentLocation,
    requireAccount,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const openTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.requesterId !== ME &&
          ['posted', 'receiving_offers'].includes(task.status)
      ),
    [tasks]
  );

  const nearby = useMemo(
    () => [...openTasks].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 6),
    [openTasks]
  );

  const recommended = useMemo(
    () => recommendedTasks(openTasks, me, 6),
    [openTasks, me]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const handlePostTask = () => {
    if (!requireAccount('post')) return;
    router.push('/create' as any);
  };

  const handleOpenCategory = (categoryId: string) => {
    router.push(
      mode === 'requester'
        ? (`/category/${categoryId}/providers` as any)
        : (`/category/${categoryId}` as any)
    );
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View className="z-20 border-b border-ink-100 bg-white px-5 pb-3 pt-3">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.push('/profile' as any)}>
            <Avatar user={me} size="md" showVerified />
          </Pressable>

          <View className="flex-1 min-w-0">
            <Text numberOfLines={1} className="font-geist text-[12.5px] text-ink-500">
              {t('home.greeting') || 'Good morning'},{' '}
              <Text className="font-geist-semibold font-semibold text-ink">
                {me.name.split(' ')[0]}
              </Text>
            </Text>

            <Pressable
              onPress={() => setLocationOpen(true)}
              className="mt-0.5 flex-row items-center gap-1"
            >
              <MapPin size={14} color="#0094F7" />
              <Text numberOfLines={1} className="max-w-[170px] text-[13.5px] font-geist-semibold font-semibold text-ink">
                {currentLocation}
              </Text>
              <ChevronDown size={14} color="#8A959B" />
            </Pressable>
          </View>

          {/* Messages */}
          <Pressable
            onPress={() => router.push('/chats' as any)}
            className="relative h-10 w-10 items-center justify-center rounded-full border border-ink-200/70 bg-white"
          >
            <MessageCircle size={18} color="#0C1417" />
            {unreadMessages > 0 && (
              <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1">
                <Text className="text-[10px] font-geist-bold font-bold text-white">
                  {unreadMessages}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Notifications */}
          <Pressable
            onPress={() => router.push('/notifications' as any)}
            className="relative h-10 w-10 items-center justify-center rounded-full border border-ink-200/70 bg-white"
          >
            <Bell size={18} color="#0C1417" />
            {unreadNotifications > 0 && (
              <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1">
                <Text className="text-[10px] font-geist-bold font-bold text-white">
                  {unreadNotifications}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Mode Toggle */}
        <View className="mt-3">
          <SegmentedControl
            options={[
              { value: 'requester', label: t('home.mode.requester') || 'I need a service' },
              { value: 'provider', label: t('home.mode.provider') || 'I provide services' },
            ]}
            value={mode}
            onChange={(val) => setMode(val as any)}
          />
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 36, paddingTop: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <GuestBanner />

        {/* Search Bar */}
        <View className="px-5 mt-3">
          <Pressable
            onPress={() => router.push('/search' as any)}
            className="h-12 w-full flex-row items-center gap-2.5 rounded-2xl border border-ink-200 bg-white px-4"
          >
            <SearchIcon size={18} color="#8A959B" />
            <Text className="font-geist text-[14.5px] text-ink-400">
              Search tasks, categories or people
            </Text>
          </Pressable>
        </View>

        {/* Mode-Specific Hero or Snapshot */}
        {mode === 'requester' ? (
          <View className="mx-5 mt-4 overflow-hidden rounded-4xl bg-brand-deep p-5">
            <Text className="text-[24px] font-geist-bold font-bold leading-tight tracking-tight text-white">
              {t('home.hero.title') || 'Get anything done around you'}
            </Text>
            <Text
              className="font-geist mt-2 text-[13.5px] leading-relaxed"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {t('home.hero.sub') || 'Post what you need, compare real offers from nearby taskers, and get it done safely.'}
            </Text>
            <View className="mt-5 flex-row gap-2.5">
              <View className="flex-1">
                <Button size="md" variant="brand" full onPress={handlePostTask}>
                  {t('home.cta.post') || 'Post a task'}
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  size="md"
                  variant="glass"
                  full
                  onPress={() => router.push('/activity' as any)}
                >
                  {t('home.cta.activeTasks') || 'Active tasks'}
                </Button>
              </View>
            </View>
          </View>
        ) : (
          <View className="mx-5 mt-4">
            <ProviderSnapshot />
          </View>
        )}

        {/* Categories Section */}
        <View className="mt-7">
          <View className="px-5">
            <SectionHeader
              title={t('home.categories') || 'Categories'}
              action={t('home.seeAll') || 'See all'}
              onAction={() => router.push('/discover' as any)}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            className="pb-1"
          >
            {categories.slice(0, 8).map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleOpenCategory(category.id)}
                className="w-[86px] items-center gap-2 rounded-3xl border border-ink-200 bg-white px-2 py-3.5"
              >
                <View
                  className={`h-11 w-11 items-center justify-center rounded-2xl ${category.tone}`}
                >
                  <CategoryIcon categoryId={category.id} size={20} />
                </View>
                <Text
                  numberOfLines={1}
                  className="w-full text-center text-[11.5px] font-geist-medium font-medium text-ink-700"
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Content depending on Mode */}
        {mode === 'requester' ? (
          /* Requester side: To-do items */
          <View className="mt-7 px-5">
            <SectionHeader
              title={t('home.todo') || 'To-do'}
              action="All tasks"
              onAction={() => router.push('/activity' as any)}
            />
            {loading ? <ListSkeleton count={2} /> : <PosterTodo />}
          </View>
        ) : (
          /* Provider side: Nearby and Recommended Tasks */
          <View>
            {/* Nearby Tasks */}
            <View className="mt-7">
              <View className="px-5">
                <SectionHeader
                  title={t('home.nearby') || 'Nearby tasks'}
                  action={t('home.seeAll') || 'See all'}
                  onAction={() => router.push('/discover' as any)}
                />
              </View>

              {loading ? (
                <View className="flex-row gap-3 px-5">
                  <Skeleton className="h-[212px] w-[252px] rounded-3xl" />
                  <Skeleton className="h-[212px] w-[252px] rounded-3xl" />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                  className="pb-1"
                >
                  {nearby.map((task) => (
                    <TaskCard key={task.id} task={task} variant="carousel" />
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Recommended Tasks */}
            <View className="mt-7">
              <View className="px-5">
                <SectionHeader
                  title={t('home.recommended') || 'Recommended for you'}
                  action={t('home.seeAll') || 'See all'}
                  onAction={() => router.push('/discover' as any)}
                />
                {recommended.length > 0 && (
                  <Text className="font-geist -mt-1 mb-3 text-[12px] text-ink-400">
                    {reasonLabel(recommended[0], me)} · based on your skills and location
                  </Text>
                )}
              </View>

              {loading ? (
                <View className="flex-row gap-3 px-5">
                  <Skeleton className="h-[212px] w-[252px] rounded-3xl" />
                  <Skeleton className="h-[212px] w-[252px] rounded-3xl" />
                </View>
              ) : recommended.length === 0 ? (
                <View className="mx-5 rounded-3xl border border-ink-200/70 bg-white p-4">
                  <Text className="font-geist text-[13px] leading-relaxed text-ink-500">
                    Nothing matches your skills nearby just yet. Add more skills to your profile, or browse everything in Discover.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                  className="pb-1"
                >
                  {recommended.map((task) => (
                    <TaskCard key={task.id} task={task} variant="carousel" />
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* Refresh Action Footer */}
        <View className="mt-6 flex-row items-center justify-center px-5 pb-2">
          <Pressable
            onPress={handleRefresh}
            className="flex-row items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-2"
          >
            <RefreshCw size={14} color="#2B3A41" />
            <Text className="text-[12px] font-geist-semibold font-semibold text-ink-700">
              {refreshing ? 'Refreshing…' : 'Pull to refresh · updated just now'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Location Sheet */}
      <LocationSheet
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
      />

      {/* Guest Account Gate */}
      <AccountGate />
    </Screen>
  );
}
