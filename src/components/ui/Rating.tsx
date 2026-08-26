import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Star } from 'lucide-react-native';

export interface StarRatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  value,
  count,
  size = 'sm',
  showValue = true,
  className = '',
}: StarRatingProps) {
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <View className={`flex-row items-center gap-1 ${className}`}>
      <Star size={iconSize} color="#E0A400" fill="#E0A400" />
      {showValue && (
        <Text
          className={`font-semibold text-ink ${
            size === 'sm' ? 'text-[12.5px]' : 'text-[14px]'
          }`}
        >
          {value.toFixed(1)}
        </Text>
      )}
      {count !== undefined && (
        <Text
          className={`text-ink-400 ${
            size === 'sm' ? 'text-[12px]' : 'text-[13px]'
          }`}
        >
          ({count})
        </Text>
      )}
    </View>
  );
}

export function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View className="flex-row items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        return (
          <Star
            key={i}
            size={size}
            color={filled ? '#E0A400' : '#E2E7E9'}
            fill={filled ? '#E0A400' : 'transparent'}
          />
        );
      })}
    </View>
  );
}

export interface RatingInputProps {
  value: number;
  onChange: (v: number) => void;
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        return (
          <Pressable key={i} onPress={() => onChange(i)} className="p-1">
            <Star
              size={32}
              color={filled ? '#E0A400' : '#E2E7E9'}
              fill={filled ? '#E0A400' : 'transparent'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
