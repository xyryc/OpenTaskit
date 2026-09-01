import React from 'react';
import { View, Text } from 'react-native';

export function Skeleton({ className = '' }: { className?: string }) {
  return <View className={`bg-ink-200/60 rounded-xl ${className}`} />;
}

export function TaskCardSkeleton() {
  return (
    <View className="rounded-3xl border border-ink-200/70 bg-white p-4">
      <View className="flex-row gap-3">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
          <View className="flex-row gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </View>
        </View>
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </View>
  );
}

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact,
}: EmptyStateProps) {
  return (
    <View className={`items-center text-center ${compact ? 'py-6' : 'py-12'}`}>
      <View className="relative mb-4 h-16 w-16 items-center justify-center rounded-[24px] bg-brand-tint">
        {icon}
      </View>
      <Text className="text-[16px] font-geist-bold font-bold tracking-tight text-ink text-center">
        {title}
      </Text>
      <Text className="font-geist mt-1.5 max-w-[260px] text-[13.5px] leading-relaxed text-ink-500 text-center">
        {message}
      </Text>
    </View>
  );
}
