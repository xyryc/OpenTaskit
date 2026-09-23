import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowUpRight,
  Receipt,
  Wallet2,
} from 'lucide-react-native';

import { useGetMyWalletQuery, useGetMyPayoutsQuery } from '@/store/api/apiSlice';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';
import { SelectChip } from '@/components/ui/Chip';
import { CardBackgroundPattern } from '@/components/ui/CardBackgroundPattern';
import { WalletTransactionRow } from '@/components/wallet/WalletTransactionRow';

type Filter = 'all' | 'in' | 'out';

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: wallet, isLoading, refetch: refetchWallet } = useGetMyWalletQuery();
  const { data: payouts, refetch: refetchPayouts } = useGetMyPayoutsQuery();

  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const transactions = wallet?.transactions ?? [];
  const list = transactions.filter((tr) =>
    filter === 'all' ? true : filter === 'in' ? tr.amount > 0 : tr.amount < 0
  );

  const pendingPayoutTotal = useMemo(
    () =>
      (payouts ?? [])
        .filter((p) => p.status === 'PENDING' || p.status === 'APPROVED')
        .reduce((sum, p) => sum + p.amount, 0),
    [payouts]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchWallet(), refetchPayouts()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Wallet" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 24,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0094F7" />
        }
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          {/* Main Balance Hero Card */}
          <View className="relative overflow-hidden rounded-4xl bg-brand p-5 shadow-lg border border-[#0074CB]/30">
            <CardBackgroundPattern />
            <Text className="text-[12px] font-geist-semibold uppercase tracking-[0.1em] text-white">
              Available balance
            </Text>
            <Text className="mt-1 text-[34px] font-geist-bold tracking-[-0.04em] text-white">
              {money(wallet?.availableBalance ?? 0)}
            </Text>

            {/* Sub-stats */}
            <View className="mt-4 flex-row gap-2" style={{ gap: 8 }}>
              <View className="flex-1 rounded-2xl bg-white/20 border border-white/30 px-3 py-2.5">
                <View className="flex-row items-center gap-1.5" style={{ gap: 6 }}>
                  <Receipt size={12} color="#FFFFFF" />
                  <Text className="font-geist-medium text-[11px] text-white">
                    Withdrawal in review
                  </Text>
                </View>
                <Text className="mt-1 text-[13.5px] font-geist-bold text-white">
                  {money(pendingPayoutTotal)}
                </Text>
              </View>
            </View>

            {/* Hero Card Actions */}
            <View className="mt-4 flex-row gap-2.5" style={{ gap: 10 }}>
              <Pressable
                onPress={() => router.push('/(screens)/wallet/withdraw')}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm active:bg-white/90"
                style={{ gap: 6 }}
              >
                <ArrowUpRight size={17} color="#0072C4" />
                <Text className="font-geist-semibold text-[14px] text-brand-dark">
                  Withdraw
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Transactions Header & Filter Chips */}
          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[17px] font-geist-bold tracking-[-0.02em] text-ink">
                Transactions
              </Text>
              <View className="flex-row gap-1.5" style={{ gap: 6 }}>
                <SelectChip
                  selected={filter === 'all'}
                  onPress={() => setFilter('all')}
                >
                  All
                </SelectChip>
                <SelectChip
                  selected={filter === 'in'}
                  onPress={() => setFilter('in')}
                >
                  In
                </SelectChip>
                <SelectChip
                  selected={filter === 'out'}
                  onPress={() => setFilter('out')}
                >
                  Out
                </SelectChip>
              </View>
            </View>

            {/* List */}
            <View className="mt-3">
              {isLoading ? (
                <ListSkeleton count={4} />
              ) : list.length === 0 ? (
                <View className="py-8">
                  <EmptyState
                    icon={<Wallet2 size={32} color="#8A959B" />}
                    title="No transactions yet"
                    message="Earnings released from completed jobs will appear here."
                    compact
                  />
                </View>
              ) : (
                <View className="divide-y divide-ink-100 rounded-3xl border border-ink-200 bg-white p-2 shadow-sm">
                  {list.map((transaction) => (
                    <WalletTransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
