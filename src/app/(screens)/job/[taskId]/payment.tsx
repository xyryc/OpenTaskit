import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Wallet2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import {
  commissionFor,
  earningsFor,
  money,
} from '@/utils/format';
import { PAYMENT_METHODS, paymentMethodMeta } from '@/utils/payment';
import type { PaymentMethod } from '@/types';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Overlay';

export default function PaymentConfirmScreen() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskById, userById, settlePayment, toast } = useApp();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);

  const task = taskById(taskId);
  if (!task) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Confirm & pay" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-ink-500">
            Task not found.
          </Text>
        </View>
      </Screen>
    );
  }

  const payment = paymentMethodMeta(task.paymentMethod);
  const isProvider = task.assignedProviderId === ME;
  const other = userById(
    isProvider
      ? task.requesterId
      : task.assignedProviderId ?? task.requesterId
  );
  const commission = commissionFor(task.budget);

  // Success Celebration View
  if (done) {
    return (
      <Screen tone="white" edges={['top']}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-6 text-center">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-success/15">
            <CheckCircle2 size={48} color="#0E9F6E" />
          </View>

          <Text className="mt-6 text-[26px] font-geist-bold tracking-[-0.03em] text-ink text-center">
            Payment confirmed
          </Text>

          <Text className="mt-2 max-w-[290px] text-center font-geist text-[14.5px] leading-relaxed text-ink-500">
            {money(task.budget)} paid to {other.name.split(' ')[0]} by{' '}
            {payment.label.toLowerCase()}. The task is now complete and the
            wallet record is updated.
          </Text>

          <View className="mt-6 w-full rounded-3xl border border-ink-200 bg-white p-4">
            <SummaryLine label="Task amount" value={money(task.budget)} />
            <SummaryLine
              label="Platform commission (12%)"
              value={`− ${money(commission)}`}
              muted
            />
            <View className="mt-2 border-t border-ink-100 pt-2">
              <SummaryLine
                label="Provider receives"
                value={money(earningsFor(task.budget))}
                strong
              />
            </View>
          </View>
        </View>

        <View
          className="shrink-0 gap-2.5 px-6 pb-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 4, gap: 10 }}
        >
          <Button
            full
            size="lg"
            variant="brand"
            onPress={() =>
              toast({
                title: 'Review submitted',
                description: 'Thank you for your rating!',
                variant: 'success',
              })
            }
          >
            Leave a review
          </Button>
          <Button
            full
            size="lg"
            variant="outline"
            onPress={() => router.push('/(screens)/wallet')}
          >
            Open wallet
          </Button>
          <Button
            full
            size="lg"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/(screens)/job/[taskId]',
                params: { taskId: task.id },
              } as any)
            }
          >
            Back to job
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Confirm & pay" subtitle={task.title} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5 px-5 pb-8 pt-4" style={{ gap: 20 }}>
          {/* Card: Payment Summary */}
          <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm">
            <Text className="text-[13px] font-geist-semibold uppercase tracking-[0.07em] text-ink-400">
              Payment summary
            </Text>

            <View className="mt-3 gap-2.5" style={{ gap: 10 }}>
              <SummaryLine
                label="Agreed task amount"
                value={money(task.budget)}
              />
              <SummaryLine
                label="Platform commission (12%)"
                value={money(commission)}
                muted
                note="Charged to the provider"
              />
              <View className="border-t border-ink-100 pt-2.5">
                <SummaryLine
                  label="Amount payable now"
                  value={money(task.budget)}
                  strong
                />
              </View>
            </View>

            <View className="mt-4 rounded-2xl bg-ink-100/70 p-3.5">
              <Text className="font-geist text-[12px] leading-relaxed text-ink-700">
                You pay {other.name.split(' ')[0]} {money(task.budget)} by{' '}
                {payment.label.toLowerCase()}. OpenTaskit deducts{' '}
                {money(commission)} commission from their wallet — you are never
                charged extra.
              </Text>
            </View>
          </View>

          {/* Card: Payment Method */}
          <View>
            <Text className="text-[15px] font-geist-semibold text-ink">
              Payment method
            </Text>
            <Text className="mt-1 font-geist text-[12.5px] leading-relaxed text-ink-500">
              Chosen by the poster before this task went live, so it cannot change
              at settlement.
            </Text>

            <View className="mt-3 gap-2.5" style={{ gap: 10 }}>
              {PAYMENT_METHODS.map((method) => {
                const active = method.id === (task.paymentMethod as PaymentMethod);
                return (
                  <View
                    key={method.id}
                    className={`flex-row items-center gap-3 rounded-3xl p-4 ${
                      active
                        ? 'border-2 border-brand bg-brand-tint/40'
                        : 'border border-ink-200 bg-white opacity-60'
                    }`}
                    style={{ gap: 12 }}
                  >
                    <View
                      className={`h-11 w-11 items-center justify-center rounded-2xl ${
                        active ? 'bg-white' : 'bg-ink-100'
                      }`}
                    >
                      {method.id === 'cash' ? (
                        <Banknote size={20} color="#0094F7" />
                      ) : method.id === 'card' ? (
                        <CreditCard size={20} color="#0094F7" />
                      ) : (
                        <Wallet2 size={20} color="#0094F7" />
                      )}
                    </View>

                    <View className="flex-1 min-w-0">
                      <Text
                        className={`text-[14.5px] ${
                          active
                            ? 'font-geist-semibold text-ink'
                            : 'font-geist-medium text-ink-700'
                        }`}
                      >
                        {method.label}
                      </Text>
                      <Text className="font-geist text-[12.5px] text-ink-500">
                        {method.description}
                      </Text>
                    </View>

                    {active && <CheckCircle2 size={20} color="#0094F7" />}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        <Button
          full
          size="lg"
          variant="brand"
          onPress={() => setConfirmOpen(true)}
        >
          Confirm completion & payment
        </Button>
      </View>

      {/* Release Payment Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          settlePayment(task.id);
          setDone(true);
        }}
        title="Release payment?"
        message={`Confirm the work is complete and that ${money(
          task.budget
        )} has been paid by ${payment.label.toLowerCase()}. This closes the task.`}
        confirmLabel="Confirm payment"
      />
    </Screen>
  );
}

function SummaryLine({
  label,
  value,
  muted,
  strong,
  note,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
  note?: string;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <Text
          className={`text-[13.5px] ${
            muted ? 'font-geist text-ink-500' : 'font-geist text-ink-700'
          }`}
        >
          {label}
        </Text>
        {note && (
          <Text className="mt-0.5 font-geist text-[11.5px] text-ink-400">
            {note}
          </Text>
        )}
      </View>
      <Text
        className={`shrink-0 font-geist-semibold ${
          strong ? 'text-[18px] text-ink' : 'text-[14px] text-ink'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
