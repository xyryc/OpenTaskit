import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Send, Star, Wallet } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useAppSelector } from '@/store';
import {
  useGetMyProfileQuery,
  useGetMyWalletQuery,
  useGetMyOffersQuery,
  useGetMyAssignedTasksQuery,
} from '@/store/api/apiSlice';
import { money } from '@/utils/format';
import { CardBackgroundPattern } from '@/components/ui/CardBackgroundPattern';
import { ProviderAvailabilityCard } from '@/components/provider/ProviderAvailabilityCard';

export function ProviderSnapshot() {
  const router = useRouter();
  const { me } = useApp();
  const guest = useAppSelector((state) => state.auth.guest);

  const { data: walletData } = useGetMyWalletQuery(undefined, { skip: guest });
  const { data: profile } = useGetMyProfileQuery(undefined, { skip: guest });
  const { data: offersData = [] } = useGetMyOffersQuery(undefined, { skip: guest });
  const { data: assignedTasksData = [] } = useGetMyAssignedTasksQuery(undefined, { skip: guest });

  const activeOffers = guest
    ? 0
    : offersData.filter((offer) => offer.status === 'PENDING').length;

  const assignedCompleted = assignedTasksData.filter(
    (t) => t.status === 'COMPLETED' || t.status.toLowerCase() === 'completed'
  ).length;
  const completedJobs = guest
    ? 0
    : assignedTasksData.length > 0
    ? assignedCompleted
    : (profile?.stats?.tasksCompleted ?? 0);
  const ratingValue = (profile?.rating ?? me.rating ?? 5.0).toFixed(1);
  const availableBalance = walletData?.availableBalance ?? 0;

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
        <Pressable
          onPress={() => router.push('/(screens)/wallet' as any)}
          className="flex-1"
        >
          <Text className="text-[12px] font-geist-semibold uppercase tracking-wider text-white">
            Available balance
          </Text>
          <Text className="mt-1 text-[32px] font-geist-bold tracking-tight text-white">
            {money(availableBalance)}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(screens)/wallet' as any)}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30 border border-white/40"
        >
          <Wallet size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* 3 Metrics: Active offers, Completed jobs, Rating */}
      <View className="mt-4 flex-row gap-2" style={{ gap: 8 }}>
        <Metric
          icon={<Send size={14} color="#FFFFFF" />}
          label="Active offers"
          value={String(activeOffers)}
          onPress={() => router.push('/(tabs)/activity' as any)}
        />
        <Metric
          icon={<CheckCircle2 size={14} color="#FFFFFF" />}
          label="Completed"
          value={String(completedJobs)}
          onPress={() => router.push('/(screens)/provider-dashboard' as any)}
        />
        <Metric
          icon={<Star size={14} color="#FFFFFF" />}
          label="Rating"
          value={ratingValue}
          onPress={() => router.push('/(tabs)/profile' as any)}
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
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-1 rounded-2xl bg-white/20 border border-white/30 p-3 active:bg-white/30"
    >
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
    </Pressable>
  );
}
