import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { TaskStatus } from '@/types';

export type ChipTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

const toneBoxClasses: Record<ChipTone, string> = {
  neutral: 'bg-ink-100',
  brand: 'bg-brand-tint',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  danger: 'bg-danger/15',
  info: 'bg-info/15',
  outline: 'border border-ink-200 bg-white',
};

const toneTextClasses: Record<ChipTone, string> = {
  neutral: 'text-ink-700',
  brand: 'text-brand-dark',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  outline: 'text-ink-700',
};

export interface ChipProps {
  children: React.ReactNode;
  tone?: ChipTone;
  icon?: React.ReactNode;
  className?: string;
}

export function Chip({ children, tone = 'neutral', icon, className = '' }: ChipProps) {
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${toneBoxClasses[tone]} ${className}`}
    >
      {icon}
      {React.isValidElement(children) ? (
        children
      ) : (
        <Text className={`text-[11.5px] font-geist-medium font-medium leading-none ${toneTextClasses[tone]}`}>
          {children}
        </Text>
      )}
    </View>
  );
}

export interface SelectChipProps {
  children: React.ReactNode;
  selected: boolean;
  onPress?: () => void;
  onClick?: () => void;
  className?: string;
}

export function SelectChip({ children, selected, onPress, onClick, className = '' }: SelectChipProps) {
  const handlePress = onPress ?? onClick;
  return (
    <Pressable
      onPress={handlePress}
      className={`rounded-full border px-3.5 py-2 ${
        selected
          ? 'border-brand bg-brand'
          : 'border-ink-200 bg-white'
      } ${className}`}
    >
      <Text
        className={`text-[13px] font-geist-medium font-medium ${
          selected ? 'text-white' : 'text-ink-700'
        }`}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const statusMeta: Record<TaskStatus, { label: string; tone: ChipTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  posted: { label: 'Posted', tone: 'info' },
  receiving_offers: { label: 'Receiving offers', tone: 'brand' },
  assigned: { label: 'Assigned', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'warning' },
  awaiting_completion: { label: 'Awaiting confirmation', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  disputed: { label: 'Disputed', tone: 'danger' },
};

const toneDotClasses: Record<ChipTone, string> = {
  neutral: 'bg-ink-700',
  brand: 'bg-brand-dark',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  outline: 'bg-ink-700',
};

export function StatusChip({ status, className = '' }: { status: TaskStatus; className?: string }) {
  const meta = statusMeta[status] ?? statusMeta.posted;
  return (
    <Chip
      tone={meta.tone}
      className={className}
      icon={<View className={`h-1.5 w-1.5 rounded-full ${toneDotClasses[meta.tone]}`} />}
    >
      {meta.label}
    </Chip>
  );
}

export function statusLabel(status: TaskStatus): string {
  return statusMeta[status]?.label ?? 'Posted';
}
