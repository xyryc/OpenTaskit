import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, Send, Star, Wallet } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { money } from '@/utils/format';
import { CardBackgroundPattern } from '@/components/ui/CardBackgroundPattern';
import { ProviderAvailabilityCard } from '@/components/provider/ProviderAvailabilityCard';

export function ProviderSnapshot() {
  const router = useRouter();
  const { wallet, offers, tasks, me } = useApp();

  const activeOffers = offers.filter(
    (offer) => offer.providerId === ME && offer.status === 'pending'
  ).length;

  const upcomingJobs = tasks.filter(
    (task) =>
      task.assignedProviderId === ME &&
      ['assigned', 'in_progress', 'awaiting_completion'].includes(task.status)
  ).length;

  return (
    <View
      className="relative overflow-hidden rounded-4xl bg-brand p-5 border border-[#0074CB]/30"
      style={{
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      }}
    >
      <CardBackgroundPattern />
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-[12px] font-geist-semibold uppercase tracking-wider text-white">
            Available balance
          </Text>
          <Text className="mt-1 text-[32px] font-geist-bold tracking-tight text-white">
            {money(wallet.available)}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/wallet' as any)}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30 border border-white/40"
        >
          <Wallet size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* 3 Metrics */}
      <View className="mt-4 flex-row gap-2" style={{ gap: 8 }}>
        <Metric
          icon={<Send size={14} color="#FFFFFF" />}
          label="Active offers"
          value={String(activeOffers)}
        />
        <Metric
          icon={<Briefcase size={14} color="#FFFFFF" />}
          label="Upcoming"
          value={String(upcomingJobs)}
        />
        <Metric
          icon={<Star size={14} color="#FFFFFF" />}
          label="Rating"
          value={me.rating.toFixed(1)}
        />
      </View>

      {/* Provider Availability Card wrapped inside the wallet/earning card */}
      <ProviderAvailabilityCard className="mt-4" />
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-white/20 border border-white/30 p-3">
      <View className="flex-row items-center gap-1.5" style={{ gap: 6 }}>
        {icon}
        <Text
          numberOfLines={1}
          className="font-geist-medium text-[11px] text-white"
        >
          {label}
        </Text>
      </View>
      <Text className="mt-1 text-[18px] font-geist-bold tracking-tight text-white">
        {value}
      </Text>
    </View>
  );
}
