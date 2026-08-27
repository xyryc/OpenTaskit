import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  Percent,
  PlusCircle,
  RotateCcw,
  Scale,
  SplitSquareHorizontal,
} from 'lucide-react-native';

import type { Transaction } from '@/types';
import { signedMoney } from '@/utils/format';

const KIND_META: Record<
  Transaction['kind'],
  {
    icon: React.ReactNode;
    iconBg: string;
  }
> = {
  commission: {
    icon: <Percent size={18} color="#2B3A41" />,
    iconBg: 'bg-ink-100',
  },
  topup: {
    icon: <PlusCircle size={18} color="#0072C4" />,
    iconBg: 'bg-info/15',
  },
  payment_received: {
    icon: <ArrowDownLeft size={18} color="#0E9F6E" />,
    iconBg: 'bg-success/15',
  },
  payment_released: {
    icon: <ArrowUpRight size={18} color="#2B3A41" />,
    iconBg: 'bg-ink-100',
  },
  adjustment: {
    icon: <Scale size={18} color="#B4690E" />,
    iconBg: 'bg-warning/15',
  },
  refund: {
    icon: <RotateCcw size={18} color="#0072C4" />,
    iconBg: 'bg-info/15',
  },
  partial_payment: {
    icon: <SplitSquareHorizontal size={18} color="#B4690E" />,
    iconBg: 'bg-warning/15',
  },
  penalty: {
    icon: <Ban size={18} color="#C7382F" />,
    iconBg: 'bg-danger/15',
  },
};

export function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const router = useRouter();
  const meta = KIND_META[transaction.kind] ?? KIND_META.commission;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(screens)/wallet/transaction/[transactionId]',
          params: { transactionId: transaction.id },
        } as any)
      }
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
          {transaction.title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 font-geist text-[12px] text-ink-500">
          {transaction.subtitle}
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
