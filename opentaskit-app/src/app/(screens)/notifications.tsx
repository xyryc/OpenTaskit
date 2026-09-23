import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BellOff,
  CheckCheck,
} from 'lucide-react-native';

import { timeAgo } from '@/utils/format';
import { notificationKind, resolveNotificationRoute } from '@/utils/notifications';
import { NOTIFICATION_KIND_META } from '@/components/notifications/notificationMeta';
import type { NotificationKind, NotificationRecord } from '@/types';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/store/api/apiSlice';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';
import { SelectChip } from '@/components/ui/Chip';

const FILTERS: { key: NotificationKind | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'offer', label: 'Offers' },
  { key: 'message', label: 'Messages' },
  { key: 'task', label: 'Tasks' },
  { key: 'payment', label: 'Payments' },
  { key: 'dispute', label: 'Disputes' },
  { key: 'review', label: 'Reviews' },
  { key: 'system', label: 'System' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useGetNotificationsQuery({ limit: 50 });
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();

  const [filter, setFilter] = useState<NotificationKind | 'all'>('all');

  const notifications = data?.notifications ?? [];
  const unreadNotifications = data?.unreadCount ?? 0;

  const list = notifications.filter(
    (item) => filter === 'all' || notificationKind(item) === filter
  );

  const handlePress = (item: NotificationRecord) => {
    if (!item.isRead) {
      markNotificationRead(item.id);
    }
    const route = resolveNotificationRoute(item);
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title="Notifications"
        subtitle={
          unreadNotifications > 0
            ? `${unreadNotifications} unread`
            : 'You are all caught up'
        }
        actions={
          unreadNotifications > 0 ? (
            <Pressable
              onPress={() => markAllNotificationsRead()}
              className="flex-row items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 active:bg-ink-200"
              style={{ gap: 6 }}
            >
              <CheckCheck size={14} color="#2B3A41" />
              <Text className="font-geist-medium text-[12.5px] text-ink-700">
                Mark all read
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* Filter Horizontal Scroll */}
      <View className="border-b border-ink-100 bg-white py-2.5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5"
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTERS.map((item) => (
            <SelectChip
              key={item.key}
              selected={filter === item.key}
              onPress={() => setFilter(item.key)}
            >
              {item.label}
            </SelectChip>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-4">
          {isLoading ? (
            <ListSkeleton count={5} />
          ) : list.length === 0 ? (
            <View className="py-12">
              <EmptyState
                icon={<BellOff size={32} color="#8A959B" />}
                title="Nothing here yet"
                message="When offers, messages or payment updates arrive, they will show up in this list."
                actionLabel="Back to home"
                onAction={() => router.push('/(tabs)/home')}
              />
            </View>
          ) : (
            <View className="gap-2.5" style={{ gap: 10 }}>
              {list.map((item) => {
                const meta = NOTIFICATION_KIND_META[notificationKind(item)] ?? NOTIFICATION_KIND_META.system;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handlePress(item)}
                    className={`flex-row gap-3 rounded-3xl border p-4 active:bg-ink-100/60 ${
                      item.isRead
                        ? 'border-ink-200 bg-white'
                        : 'border-brand/40 bg-brand-tint/30'
                    }`}
                    style={{ gap: 12 }}
                  >
                    <View
                      className={`h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${meta.iconBg}`}
                    >
                      {meta.icon}
                    </View>

                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text
                          numberOfLines={1}
                          className="flex-1 text-[14px] font-geist-semibold text-ink"
                        >
                          {item.title}
                        </Text>
                        {!item.isRead && (
                          <View className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                        )}
                      </View>

                      <Text
                        numberOfLines={2}
                        className="mt-1 text-[13px] font-geist leading-snug text-ink-600"
                      >
                        {item.body}
                      </Text>

                      <View className="mt-2 flex-row items-center gap-2">
                        <Text className="font-geist text-[11.5px] text-ink-400">
                          {timeAgo(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
