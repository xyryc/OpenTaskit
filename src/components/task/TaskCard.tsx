import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark, Clock, MapPin, Users } from 'lucide-react-native';
import type { Task } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { categoryById } from '@/data/categories';
import { distance, money, scheduleLabel } from '@/utils/format';
import { paymentMethodLabel } from '@/utils/payment';
import { CategoryBadge } from '@/components/CategoryIcon';
import { Avatar } from '@/components/ui/Avatar';

export interface TaskCardProps {
  task: Task;
  variant?: 'list' | 'carousel';
  showStatus?: boolean;
  badge?: React.ReactNode;
  hideRequester?: boolean;
  mine?: boolean;
  footer?: React.ReactNode;
  onClick?: () => void;
}

export function TaskCard({
  task,
  variant = 'list',
  showStatus,
  badge,
  hideRequester,
  mine,
  footer,
  onClick,
}: TaskCardProps) {
  const router = useRouter();
  const { savedTaskIds, toggleSaved, offersForTask, userById } = useApp();
  const saved = savedTaskIds.includes(task.id);
  const requester = userById(task.requesterId);
  const offerCount = offersForTask(task.id).length;
  const category = categoryById(task.categoryId);

  const handleOpen = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/task/${task.id}` as any);
    }
  };

  const bookmarkButton = (
    <Pressable
      onPress={() => toggleSaved(task.id)}
      hitSlop={8}
      className="h-8 w-8 items-center justify-center rounded-full"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }}
    >
      <Bookmark
        size={16}
        color={saved ? '#0094F7' : '#8A959B'}
        fill={saved ? '#0094F7' : 'transparent'}
      />
    </Pressable>
  );

  if (variant === 'carousel') {
    return (
      <View className="w-[252px] h-[212px] shrink-0">
        <Pressable
          onPress={handleOpen}
          className="h-full w-full overflow-hidden rounded-3xl border border-ink-200 bg-white"
          style={{
            elevation: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}
        >
          {/* Card Header Tone */}
          <View className="flex-row items-center justify-between gap-2 bg-brand-tint px-3.5 py-2.5">
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <CategoryBadge categoryId={task.categoryId} size="md" />
              <Text numberOfLines={1} className="text-[12px] font-semibold text-brand-dark flex-1">
                {category?.name}
              </Text>
            </View>
            {bookmarkButton}
          </View>

          {/* Card Body */}
          <View className="p-3.5 flex-1 justify-between">
            <View>
              <Text
                numberOfLines={2}
                className="text-[14px] font-semibold leading-snug tracking-tight text-ink"
              >
                {task.title}
              </Text>

              <View className="mt-1.5 flex-row items-center justify-between">
                <Text className="text-[15px] font-bold text-ink">{money(task.budget)}</Text>
                <View className="flex-row items-center gap-1">
                  <MapPin size={13} color="#8A959B" />
                  <Text className="text-[12px] text-ink-500">{distance(task.distanceKm)}</Text>
                </View>
              </View>

              <View className="mt-1 flex-row items-center gap-1">
                <Clock size={13} color="#8A959B" />
                <Text numberOfLines={1} className="text-[11.5px] text-ink-500 flex-1">
                  {scheduleLabel(task.schedule).replace('As soon as possible', 'ASAP')}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between border-t border-ink-100 pt-2">
              {hideRequester ? (
                <Text className="text-[11.5px] text-ink-400">
                  {paymentMethodLabel(task.paymentMethod)}
                </Text>
              ) : (
                <View className="flex-row items-center gap-1.5 min-w-0">
                  <Avatar user={requester} size="xs" />
                  <Text numberOfLines={1} className="text-[11.5px] text-ink-500 max-w-[90px]">
                    {requester.name.split(' ')[0]}
                  </Text>
                </View>
              )}

              {badge ?? (
                <View className="flex-row items-center gap-1">
                  <Users size={13} color="#0072C4" />
                  <Text className="text-[11.5px] font-medium text-brand-dark">
                    {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className={`overflow-hidden rounded-3xl border ${
        mine ? 'border-brand bg-brand-tint' : 'border-ink-200 bg-white'
      }`}
      style={{
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      }}
    >
      <Pressable onPress={handleOpen} className="w-full p-4">
        <View className="flex-row items-start gap-3">
          <CategoryBadge categoryId={task.categoryId} size="lg" />

          <View className="flex-1 min-w-0">
            {mine && (
              <View className="mb-1 self-start rounded-full bg-brand px-2 py-0.5">
                <Text className="text-[10.5px] font-bold uppercase tracking-wider text-white">
                  Your task
                </Text>
              </View>
            )}

            <View className="flex-row items-start justify-between gap-2">
              <Text
                numberOfLines={2}
                className="flex-1 text-[14.5px] font-semibold leading-snug tracking-tight text-ink"
              >
                {task.title}
              </Text>
              {bookmarkButton}
            </View>

            <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2.5 gap-y-1">
              <Text className="text-[12px] font-medium text-ink-700">{category?.name}</Text>
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color="#8A959B" />
                <Text className="text-[12px] text-ink-500">{distance(task.distanceKm)}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Clock size={13} color="#8A959B" />
                <Text className="text-[12px] text-ink-500">
                  {scheduleLabel(task.schedule).replace('As soon as possible', 'ASAP')}
                </Text>
              </View>
            </View>

            <View className="mt-2.5 flex-row items-end justify-between gap-2">
              <View className="flex-row items-baseline gap-1">
                <Text className="text-[17px] font-bold text-ink">{money(task.budget)}</Text>
                {task.flexibleBudget && (
                  <Text className="text-[11.5px] text-ink-400">flexible</Text>
                )}
              </View>

              {badge ?? (
                <View className="flex-row items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5">
                  <Users size={12} color="#0072C4" />
                  <Text className="text-[11.5px] font-medium text-brand-dark">
                    {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {footer && <View className="mt-3 pt-2.5 border-t border-ink-100">{footer}</View>}
      </Pressable>
    </View>
  );
}
