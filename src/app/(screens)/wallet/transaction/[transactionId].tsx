import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Copy, Receipt } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { clockTime, dayLabel, money, signedMoney } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

export default function TransactionDetailScreen() {
  const { transactionId = '' } = useLocalSearchParams<{
    transactionId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions, taskById, toast } = useApp();

  const transaction = transactions.find((item) => item.id === transactionId);

  if (!transaction) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Transaction" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-ink-500">
            This transaction is no longer available.
          </Text>
        </View>
      </Screen>
    );
  }

  const task = transaction.taskId ? taskById(transaction.taskId) : undefined;
  const refCode = `NX-${transaction.id.toUpperCase()}`;

  const handleCopy = () => {
    toast({ title: 'Reference copied: ' + refCode, variant: 'success' });
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Transaction" subtitle={transaction.title} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 24,
        }}
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          {/* Main Receipt Card */}
          <View className="items-center rounded-4xl border border-ink-200 bg-white p-6 shadow-sm">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint">
              <Receipt size={24} color="#0094F7" />
            </View>

            <Text
              className={`mt-4 text-[32px] font-geist-bold tracking-[-0.04em] ${
                transaction.amount > 0 ? 'text-success' : 'text-ink'
              }`}
            >
              {signedMoney(transaction.amount)}
            </Text>

            <Text className="mt-1 text-center font-geist text-[13.5px] text-ink-500">
              {transaction.subtitle}
            </Text>

            <View className="mt-3">
              <Chip
                tone={
                  transaction.status === 'completed'
                    ? 'success'
                    : transaction.status === 'pending'
                    ? 'warning'
                    : 'danger'
                }
              >
                {transaction.status}
              </Chip>
            </View>
          </View>

          {/* Details Breakdown */}
          <View className="divide-y divide-ink-100 rounded-3xl border border-ink-200 bg-white px-4 shadow-sm">
            <ReceiptRow label="Type" value={transaction.title} />
            <ReceiptRow
              label="Date"
              value={`${dayLabel(transaction.at)} · ${clockTime(
                transaction.at
              )}`}
            />
            {transaction.method && (
              <ReceiptRow label="Method" value={transaction.method} />
            )}
            <ReceiptRow label="Reference" value={refCode} />
            {transaction.kind === 'commission' && (
              <ReceiptRow
                label="Commission rate"
                value="12% of job value"
              />
            )}
          </View>

          {/* Related Task Card */}
          {task && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(screens)/job/[taskId]',
                  params: { taskId: task.id },
                } as any)
              }
              className="flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-4 shadow-sm active:bg-ink-100/60"
              style={{ gap: 12 }}
            >
              <View className="flex-1 min-w-0">
                <Text className="text-[11.5px] font-geist-medium uppercase tracking-[0.07em] text-ink-400">
                  Related task
                </Text>
                <Text
                  numberOfLines={2}
                  className="mt-0.5 text-[14.5px] font-geist-semibold text-ink"
                >
                  {task.title}
                </Text>
                <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                  {money(task.budget)} · {task.location}
                </Text>
              </View>
              <ChevronRight size={18} color="#8A959B" />
            </Pressable>
          )}

          {/* Copy Reference Button */}
          <Button
            full
            size="lg"
            variant="outline"
            icon={<Copy size={16} color="#0C1417" />}
            onPress={handleCopy}
          >
            Copy reference
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-3.5" style={{ gap: 12 }}>
      <Text className="font-geist text-[13px] text-ink-500">{label}</Text>
      <Text
        numberOfLines={1}
        className="flex-1 text-right font-geist-medium text-[13.5px] text-ink"
      >
        {value}
      </Text>
    </View>
  );
}
