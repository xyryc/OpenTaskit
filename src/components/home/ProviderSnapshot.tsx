import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Briefcase, Send, Star, Wallet } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { money } from '@/utils/format';
import { Toggle } from '@/components/ui/Input';

export function ProviderSnapshot() {
  const router = useRouter();
  const { wallet, offers, tasks, me, available, toggleAvailable } = useApp();

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
      className="overflow-hidden rounded-4xl bg-brand-deep p-5"
      style={{
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View>
          <Text
            className="text-[12px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Available balance
          </Text>
          <Text className="mt-1 text-[30px] font-bold tracking-tight text-white">
            {money(wallet.available)}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/wallet' as any)}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          <Wallet size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* 3 Metrics */}
      <View className="mt-4 flex-row gap-2">
        <Metric
          icon={<Send size={14} color="rgba(255,255,255,0.7)" />}
          label="Active offers"
          value={String(activeOffers)}
        />
        <Metric
          icon={<Briefcase size={14} color="rgba(255,255,255,0.7)" />}
          label="Upcoming"
          value={String(upcomingJobs)}
        />
        <Metric
          icon={<Star size={14} color="rgba(255,255,255,0.7)" />}
          label="Rating"
          value={me.rating.toFixed(1)}
        />
      </View>

      {/* Availability Toggle */}
      <View
        className="mt-4 rounded-2xl p-3.5"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <Toggle
          tone="dark"
          checked={available}
          onChange={toggleAvailable}
          label={available ? 'Available for work' : 'Not accepting work'}
          description={
            available
              ? 'You appear in nearby searches and can send offers.'
              : 'You will not receive new opportunities until you switch back on.'
          }
        />
      </View>

      {/* Provider Dashboard Button */}
      <Pressable
        onPress={() => router.push('/provider-dashboard' as any)}
        className="mt-4 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5"
      >
        <Text className="text-[14px] font-semibold text-ink">
          Open provider dashboard
        </Text>
        <ArrowRight size={16} color="#0C1417" />
      </Pressable>
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
    <View
      className="flex-1 rounded-2xl p-3"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    >
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text
          numberOfLines={1}
          className="text-[11px]"
          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
        >
          {label}
        </Text>
      </View>
      <Text className="mt-1 text-[18px] font-bold tracking-tight text-white">
        {value}
      </Text>
    </View>
  );
}
