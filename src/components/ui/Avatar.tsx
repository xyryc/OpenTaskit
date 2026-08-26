import React from 'react';
import { View, Text } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import type { User } from '@/types';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeBoxClasses: Record<Size, string> = {
  xs: 'h-7 w-7',
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

const sizeTextClasses: Record<Size, string> = {
  xs: 'text-[11px]',
  sm: 'text-[12px]',
  md: 'text-[14px]',
  lg: 'text-[17px]',
  xl: 'text-[24px]',
};

export interface AvatarProps {
  user: Pick<User, 'name' | 'initials' | 'tone' | 'verified'>;
  size?: Size;
  showVerified?: boolean;
  online?: boolean;
  className?: string;
}

export function Avatar({
  user,
  size = 'md',
  showVerified,
  online,
  className = '',
}: AvatarProps) {
  return (
    <View className={`relative ${sizeBoxClasses[size]} ${className}`}>
      <View
        className={`h-full w-full items-center justify-center rounded-full bg-brand-tint border border-white ${user.tone ?? 'bg-brand-tint'}`}
      >
        <Text className={`font-geist-bold font-bold text-brand-dark ${sizeTextClasses[size]}`}>
          {user.initials}
        </Text>
      </View>

      {showVerified && user.verified && (
        <View className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
          <BadgeCheck size={size === 'xs' || size === 'sm' ? 12 : 16} color="#0094F7" />
        </View>
      )}

      {online && (
        <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
      )}
    </View>
  );
}

export function VerifiedPill({ verified }: { verified: boolean }) {
  if (!verified) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5">
        <Text className="text-[11px] font-geist-medium font-medium text-ink-500">Not verified</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5">
      <BadgeCheck size={12} color="#0072C4" />
      <Text className="text-[11px] font-geist-medium font-medium text-brand-dark">Verified</Text>
    </View>
  );
}
