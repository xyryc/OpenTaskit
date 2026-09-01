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
  CircleDollarSign,
  Gavel,
  MessageCircle,
  Send,
  Settings2,
  Sparkles,
  Star,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { timeAgo } from '@/utils/format';
import type { NotificationKind } from '@/types';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/Feedback';
import { SelectChip } from '@/components/ui/Chip';

const KIND_META: Record<
  NotificationKind,
  {
    icon: React.ReactNode;
    iconBg: string;
  }
> = {
  offer: {
    icon: <Send size={18} color="#0094F7" />,
    iconBg: 'bg-brand-tint',
  },
  message: {
    icon: <MessageCircle size={18} color="#0072C4" />,
    iconBg: 'bg-info/10',
  },
  task: {
    icon: <Sparkles size={18} color="#0094F7" />,
    iconBg: 'bg-brand-tint',
  },
  payment: {
    icon: <CircleDollarSign size={18} color="#0E9F6E" />,
    iconBg: 'bg-success/10',
  },
  dispute: {
    icon: <Gavel size={18} color="#C7382F" />,
    iconBg: 'bg-danger/10',
  },
  review: {
    icon: <Star size={18} color="#C27803" />,
    iconBg: 'bg-warning/15',
  },
  system: {
    icon: <Settings2 size={18} color="#2B3A41" />,
    iconBg: 'bg-ink-100',
  },
};

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
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotifications,
  } = useApp();

  const [filter, setFilter] = useState<NotificationKind | 'all'>('all');

  const list = notifications.filter(
    (item) => filter === 'all' || item.kind === filter
  );

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
              onPress={markAllNotificationsRead}
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
          {list.length === 0 ? (
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
                const meta = KIND_META[item.kind] ?? KIND_META.system;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      markNotificationRead(item.id);
                      if (item.actionTo) {
                        router.push(item.actionTo as any);
                      }
                    }}
                    className={`flex-row gap-3 rounded-3xl border p-4 active:bg-ink-100/60 ${
                      item.read
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
                        {!item.read && (
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
                          {timeAgo(item.at)}
                        </Text>
                        {item.actionLabel && (
                          <Text className="font-geist-medium text-[11.5px] text-brand">
                            · {item.actionLabel}
                          </Text>
                        )}
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
