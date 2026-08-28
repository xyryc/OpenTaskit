import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Briefcase,
  CheckCircle2,
  Compass,
  Send,
  Star,
  Wallet2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { money } from '@/utils/format';
import { Screen, ScreenHeader, SectionHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/Chip';
import { Toggle } from '@/components/ui/Input';
import { TrustStats } from '@/components/task/TrustStats';
import { EmptyState } from '@/components/ui/Feedback';
import { CategoryBadge } from '@/components/CategoryIcon';
import { CardBackgroundPattern } from '@/components/ui/CardBackgroundPattern';
import { ProviderAvailabilityCard } from '@/components/provider/ProviderAvailabilityCard';

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const { wallet, offers, tasks, me, available, toggleAvailable } = useApp();

  const activeOffers = offers.filter(
    (offer) => offer.providerId === ME && offer.status === 'pending'
  );
  const jobs = tasks.filter((task) => task.assignedProviderId === ME);
  const upcoming = jobs.filter((task) =>
    ['assigned', 'in_progress', 'awaiting_completion'].includes(task.status)
  );
  const completed = jobs.filter((task) => task.status === 'completed');

  return (
    <Screen tone="canvas" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title="Provider dashboard"
        subtitle="Your earning side of OpenTaskit"
      />

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View className="relative overflow-hidden rounded-4xl bg-brand p-5 shadow-lg border border-[#0074CB]/30">
          <CardBackgroundPattern />
          <Text className="text-[12px] font-geist-semibold uppercase tracking-wider text-white">
            Available balance
          </Text>
          <Text className="mt-1 text-[34px] font-geist-bold tracking-tight text-white">
            {money(wallet.available)}
          </Text>

          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-white/20 border border-white/30 py-2.5 items-center">
              <Text className="text-[18px] font-geist-bold text-white">
                {activeOffers.length}
              </Text>
              <Text className="font-geist-medium text-[11px] text-white">Active offers</Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white/20 border border-white/30 py-2.5 items-center">
              <Text className="text-[18px] font-geist-bold text-white">
                {upcoming.length}
              </Text>
              <Text className="font-geist-medium text-[11px] text-white">Upcoming</Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white/20 border border-white/30 py-2.5 items-center">
              <Text className="text-[18px] font-geist-bold text-white">
                {completed.length}
              </Text>
              <Text className="font-geist-medium text-[11px] text-white">Completed</Text>
            </View>
          </View>

          {/* Embedded Provider Availability Card (without redundant dashboard button) */}
          <ProviderAvailabilityCard className="mt-4" showDashboardButton={false} />
        </View>

        {/* 4 Action Cards */}
        <View className="mt-5 flex-row flex-wrap gap-2.5">
          <Action
            icon={<Compass size={20} color="#0072C4" />}
            label="Find tasks"
            onPress={() => router.push('/discover' as any)}
          />
          <Action
            icon={<Send size={20} color="#0072C4" />}
            label="My offers"
            onPress={() => router.push('/activity' as any)}
          />
          <Action
            icon={<Briefcase size={20} color="#0072C4" />}
            label="Upcoming jobs"
            onPress={() => router.push('/activity' as any)}
          />
          <Action
            icon={<Wallet2 size={20} color="#0072C4" />}
            label="Wallet"
            onPress={() => router.push('/wallet' as any)}
          />
        </View>

        {/* Earnings & Reputation */}
        <View className="mt-6">
          <SectionHeader title="Earnings & reputation" />
          <TrustStats
            stats={[
              { label: 'Total earnings', value: money(wallet.earnings) },
              { label: 'Jobs completed', value: `${completed.length}` },
              { label: 'Rating', value: `${me.rating.toFixed(1)} ★` },
              { label: 'Success rate', value: `${me.successRate}%` },
            ]}
          />
        </View>

        {/* Upcoming Jobs */}
        <View className="mt-6">
          <SectionHeader
            title="Upcoming jobs"
            action="All jobs"
            onAction={() => router.push('/activity' as any)}
          />
          {upcoming.length > 0 ? (
            <View className="gap-2.5">
              {upcoming.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push(`/task/${task.id}` as any)}
                  className="flex-row items-center gap-3 rounded-3xl border border-ink-200/70 bg-white p-4 shadow-sm"
                >
                  <CategoryBadge categoryId={task.categoryId} size="md" />
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="text-[14px] font-geist-bold font-bold text-ink">
                      {task.title}
                    </Text>
                    <Text className="font-geist text-[12.5px] text-ink-500">
                      {task.schedule.date ?? 'Flexible'} · {money(task.budget)}
                    </Text>
                  </View>
                  <StatusChip status={task.status} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="rounded-3xl border border-ink-200/70 bg-white p-4">
              <EmptyState
                icon={<Briefcase size={28} color="#0094F7" />}
                title="No upcoming jobs"
                message="Send offers on tasks nearby to fill your schedule."
                compact
              />
            </View>
          )}
        </View>

        {/* Recently Completed */}
        <View className="mt-6">
          <SectionHeader title="Recently completed" />
          {completed.length > 0 ? (
            <View className="rounded-3xl border border-ink-200/70 bg-white px-4 divide-y divide-ink-100">
              {completed.map((task) => (
                <View key={task.id} className="flex-row items-center gap-3 py-3.5">
                  <CheckCircle2 size={18} color="#0F8A5F" />
                  <Text numberOfLines={1} className="flex-1 text-[13.5px] font-geist-medium font-medium text-ink">
                    {task.title}
                  </Text>
                  <Text className="text-[13px] font-geist-semibold font-semibold text-ink-700">
                    {money(task.budget)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="rounded-3xl border border-ink-200/70 bg-white p-4">
              <Text className="font-geist text-[13.5px] text-ink-500 text-center">
                Completed jobs and their payouts will be listed here.
              </Text>
            </View>
          )}
        </View>

        {/* See reviews button */}
        <Button
          full
          size="lg"
          variant="outline"
          className="mt-6"
          icon={<Star size={16} color="#E0A400" fill="#E0A400" />}
          onPress={() => router.push(`/reviews/${ME}` as any)}
        >
          See my reviews
        </Button>
      </ScrollView>
    </Screen>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 min-w-[140px] flex-row items-center gap-3 rounded-3xl border border-ink-200/70 bg-white p-4 shadow-sm"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-tint">
        {icon}
      </View>
      <Text className="text-[14px] font-geist-semibold font-semibold text-ink">{label}</Text>
    </Pressable>
  );
}
