import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
} from 'lucide-react-native';

import type { WalletTransactionItem, WalletTransactionType } from '@/types';
import { signedMoney, timeAgo } from '@/utils/format';

const TYPE_META: Record<
  WalletTransactionType,
  { icon: React.ReactNode; iconBg: string; label: string }
> = {
  ESCROW_RELEASE: {
    icon: <ArrowDownLeft size={18} color="#0E9F6E" />,
    iconBg: 'bg-success/15',
    label: 'Job payment received',
  },
  PLATFORM_FEE: {
    icon: <Scale size={18} color="#B4690E" />,
    iconBg: 'bg-warning/15',
    label: 'Platform fee',
  },
  WITHDRAWAL: {
    icon: <ArrowUpRight size={18} color="#2B3A41" />,
    iconBg: 'bg-ink-100',
    label: 'Withdrawal',
  },
  ADJUSTMENT: {
    icon: <Scale size={18} color="#0072C4" />,
    iconBg: 'bg-info/15',
    label: 'Adjustment',
  },
};

export function WalletTransactionRow({
  transaction,
}: {
  transaction: WalletTransactionItem;
}) {
  const router = useRouter();
  const meta = TYPE_META[transaction.type] ?? TYPE_META.ADJUSTMENT;

  return (
    <Pressable
      onPress={() => router.push(`/(screens)/wallet/transaction/${transaction.id}` as any)}
      className="flex-row items-center gap-3 rounded-2xl p-2 active:bg-ink-100/60"
      style={{ gap: 12 }}
    >
      <View
        className={`h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.iconBg}`}
      >
        {meta.icon}
      </View>

      <View className="flex-1 min-w-0">
        <Text numberOfLines={1} className="text-[14px] font-geist-semibold text-ink">
          {transaction.description || meta.label}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 font-geist text-[12px] text-ink-500">
          {timeAgo(transaction.createdAt)}
        </Text>
      </View>

      <View className="shrink-0 text-right">
        <Text
          className={`text-[15px] font-geist-bold ${
            transaction.amount > 0 ? 'text-success' : 'text-ink'
          }`}
        >
          {signedMoney(transaction.amount)}
        </Text>
      </View>
    </Pressable>
  );
}
