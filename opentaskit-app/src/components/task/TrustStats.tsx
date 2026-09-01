import React from 'react';
import { View, Text } from 'react-native';

export interface Stat {
  label: string;
  value: string;
}

export function TrustStats({ stats }: { stats: Stat[] }) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {stats.map((stat) => (
        <View
          key={stat.label}
          className="flex-1 min-w-[140px] rounded-2xl border border-ink-200/70 bg-white px-3.5 py-3"
        >
          <Text className="text-[11.5px] font-geist-semibold font-semibold uppercase tracking-wider text-ink-400">
            {stat.label}
          </Text>
          <Text className="mt-1 text-[17px] font-geist-bold font-bold tracking-tight text-ink">
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function InlineStat({ label, value }: Stat) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[16px] font-geist-bold font-bold tracking-tight text-ink">{value}</Text>
      <Text className="font-geist mt-0.5 text-[11px] text-ink-400">{label}</Text>
    </View>
  );
}
