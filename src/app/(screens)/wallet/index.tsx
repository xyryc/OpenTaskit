import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowUpRight,
  Percent,
  Plus,
  Receipt,
  TrendingUp,
  Wallet2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { SelectChip } from '@/components/ui/Chip';
import { TransactionRow } from '@/components/wallet/TransactionRow';

type Filter = 'all' | 'in' | 'out';

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wallet, transactions, toast } = useApp();

  const [filter, setFilter] = useState<Filter>('all');

  const list = transactions.filter((tr) =>
    filter === 'all' ? true : filter === 'in' ? tr.amount > 0 : tr.amount < 0
  );

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
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          {/* Main Balance Hero Card */}
          <View className="overflow-hidden rounded-4xl bg-[#002D42] p-5 text-white shadow-md">
            <Text className="text-[12px] font-geist-medium uppercase tracking-[0.09em] text-white/60">
              Available balance
            </Text>
            <Text className="mt-1 text-[34px] font-geist-bold tracking-[-0.04em] text-white">
              {money(wallet.available)}
            </Text>

            {/* Sub-stats 3-grid */}
            <View className="mt-4 flex-row gap-2" style={{ gap: 8 }}>
              <View className="flex-1 rounded-2xl bg-white/10 px-3 py-2.5">
                <View className="flex-row items-center gap-1.5" style={{ gap: 6 }}>
                  <Receipt size={12} color="rgba(255,255,255,0.7)" />
                  <Text className="font-geist text-[10.5px] text-white/70">
                    Pending
                  </Text>
                </View>
                <Text className="mt-1 text-[13px] font-geist-semibold text-white">
                  {money(wallet.pending)}
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-white/10 px-3 py-2.5">
                <View className="flex-row items-center gap-1.5" style={{ gap: 6 }}>
                  <TrendingUp size={12} color="rgba(255,255,255,0.7)" />
                  <Text className="font-geist text-[10.5px] text-white/70">
                    Earnings
                  </Text>
                </View>
                <Text className="mt-1 text-[13px] font-geist-semibold text-white">
                  {money(wallet.earnings)}
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-white/10 px-3 py-2.5">
                <View className="flex-row items-center gap-1.5" style={{ gap: 6 }}>
                  <Percent size={12} color="rgba(255,255,255,0.7)" />
                  <Text className="font-geist text-[10.5px] text-white/70">
                    Commission
                  </Text>
                </View>
                <Text className="mt-1 text-[13px] font-geist-semibold text-white">
                  {money(wallet.commissions)}
                </Text>
              </View>
            </View>

            {/* Hero Card Actions */}
            <View className="mt-4 flex-row gap-2.5" style={{ gap: 10 }}>
              <Button
                size="md"
                variant="outline"
                className="flex-1 border border-white/30 bg-white/15"
                icon={<Plus size={16} color="#FFFFFF" />}
                onPress={() => router.push('/(screens)/wallet/topup')}
              >
                Top up
              </Button>
              <Button
                size="md"
                className="flex-1 bg-white"
                icon={<ArrowUpRight size={16} color="#0C1417" />}
                onPress={() =>
                  toast({
                    title: 'Withdrawal requested',
                    description: 'Funds will transfer to your bank within 24h.',
                    variant: 'info',
                  })
                }
              >
                Withdraw
              </Button>
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
              {list.length === 0 ? (
                <View className="py-8">
                  <EmptyState
                    icon={<Wallet2 size={32} color="#8A959B" />}
                    title="No transactions yet"
                    message="Commissions, top-ups and payments will appear here with a full breakdown."
                    actionLabel="Top up wallet"
                    onAction={() => router.push('/(screens)/wallet/topup')}
                    compact
                  />
                </View>
              ) : (
                <View className="divide-y divide-ink-100 rounded-3xl border border-ink-200 bg-white p-2 shadow-sm">
                  {list.map((transaction) => (
                    <TransactionRow
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
