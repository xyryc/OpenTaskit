import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Gavel,
  MapPin,
  MessageCircle,
  Phone,
  PlayCircle,
  Star,
  Wallet2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { paymentMethodMeta } from '@/utils/payment';
import {
  commissionFor,
  earningsFor,
  money,
  scheduleLabel,
} from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/Rating';
import { ConfirmDialog } from '@/components/ui/Overlay';

const STEPS = [
  'Assigned',
  'In progress',
  'Work completed',
  'Payment',
  'Reviewed',
];

function getStepIndex(status: string, paid?: boolean, reviewed?: boolean): number {
  if (reviewed) return 5;
  if (paid || status === 'completed') return 4;
  if (status === 'awaiting_completion') return 3;
  if (status === 'in_progress') return 2;
  return 1;
}

export default function JobDetailScreen() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    taskById,
    userById,
    startJob,
    markCompleted,
    disputeForTask,
    toast,
  } = useApp();

  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const task = taskById(taskId);
  if (!task) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Job details" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-ink-500">
            Task not found.
          </Text>
        </View>
      </Screen>
    );
  }

  const isProvider = task.assignedProviderId === ME;
  const other = userById(
    isProvider
      ? task.requesterId
      : task.assignedProviderId ?? task.requesterId
  );
  const dispute = disputeForTask(task.id);
  const reviewed = isProvider
    ? task.reviewedByProvider
    : task.reviewedByRequester;
  const currentStep = getStepIndex(task.status, task.paid, reviewed);

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title={isProvider ? 'Your job' : 'Your task'}
        subtitle={task.title}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5 px-5 pb-8 pt-4" style={{ gap: 20 }}>
          {/* Card: Price & Progress Stepper */}
          <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
                  Agreed price
                </Text>
                <Text className="mt-1 text-[28px] font-geist-bold tracking-[-0.03em] text-ink">
                  {money(task.budget)}
                </Text>
                {isProvider && (
                  <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                    You keep {money(earningsFor(task.budget))} after {money(commissionFor(task.budget))} commission
                  </Text>
                )}
              </View>
              <StatusChip status={task.status} />
            </View>

            {/* Stepper Steps */}
            <View className="mt-5 gap-3" style={{ gap: 12 }}>
              {STEPS.map((step, index) => {
                const position = index + 1;
                const done = position < currentStep;
                const active = position === currentStep;

                return (
                  <View key={step} className="flex-row items-start gap-3" style={{ gap: 12 }}>
                    <View className="items-center">
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full ${
                          done
                            ? 'bg-brand'
                            : active
                            ? 'border-2 border-brand bg-white'
                            : 'bg-ink-100'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 size={14} color="#FFFFFF" />
                        ) : (
                          <Text
                            className={`text-[11px] font-geist-semibold ${
                              active ? 'text-brand' : 'text-ink-400'
                            }`}
                          >
                            {position}
                          </Text>
                        )}
                      </View>
                      {position < STEPS.length && (
                        <View
                          className={`mt-1 h-5 w-0.5 rounded-full ${
                            done ? 'bg-brand' : 'bg-ink-200'
                          }`}
                        />
                      )}
                    </View>

                    <View className="flex-1 pt-0.5">
                      <Text
                        className={`text-[13.5px] font-geist-medium ${
                          active
                            ? 'text-ink'
                            : done
                            ? 'text-ink-700'
                            : 'text-ink-400'
                        }`}
                      >
                        {step}
                      </Text>
                      {active && (
                        <Text className="mt-0.5 font-geist text-[12px] text-ink-500">
                          {task.status === 'assigned' &&
                            (isProvider
                              ? 'Start the job when you arrive.'
                              : 'Waiting for your provider to start.')}
                          {task.status === 'in_progress' &&
                            (isProvider
                              ? 'Mark complete when the work is done.'
                              : 'Work is underway — follow progress in chat.')}
                          {task.status === 'awaiting_completion' &&
                            (isProvider
                              ? 'Waiting for confirmation from the requester.'
                              : 'Confirm the work is done to release payment.')}
                          {task.status === 'completed' &&
                            'Payment settled. Leave a review to close it out.'}
                          {task.status === 'disputed' &&
                            'A dispute is open on this job.'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card: Other Person (Client or Tasker) */}
          <View className="flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-4 shadow-sm" style={{ gap: 12 }}>
            <Avatar user={other} size="lg" showVerified />
            <View className="flex-1 min-w-0">
              <Text numberOfLines={1} className="text-[15px] font-geist-semibold text-ink">
                {other.name}
              </Text>
              <Text numberOfLines={1} className="text-[12px] font-geist text-ink-500">
                {isProvider ? 'Requester' : other.headline}
              </Text>
              <View className="mt-0.5">
                <StarRating value={other.rating} count={other.reviewCount} size="sm" />
              </View>
            </View>

            <View className="flex-row shrink-0 gap-2" style={{ gap: 8 }}>
              <Pressable
                onPress={() => router.push(`/chat/${task.id}` as any)}
                className="h-10 w-10 items-center justify-center rounded-full bg-brand shadow-sm active:bg-brand-dark"
              >
                <MessageCircle size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => {
                  Linking.openURL('tel:+94771234567').catch(() => {
                    toast({ title: 'Calling ' + other.name, variant: 'info' });
                  });
                }}
                className="h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white active:bg-ink-100"
              >
                <Phone size={18} color="#0C1417" />
              </Pressable>
            </View>
          </View>

          {/* Card: Logistics & Original Task */}
          <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white p-4 shadow-sm">
            <View className="flex-row items-start justify-between gap-3 pb-3">
              <View className="flex-row items-center gap-2" style={{ gap: 8 }}>
                <CalendarClock size={16} color="#8A959B" />
                <Text className="font-geist text-[13px] text-ink-500">Schedule</Text>
              </View>
              <Text className="flex-1 text-right font-geist-medium text-[13.5px] text-ink">
                {scheduleLabel(task.schedule)}
              </Text>
            </View>

            <View className="flex-row items-start justify-between gap-3 py-3">
              <View className="flex-row items-center gap-2" style={{ gap: 8 }}>
                <MapPin size={16} color="#8A959B" />
                <Text className="font-geist text-[13px] text-ink-500">Location</Text>
              </View>
              <Text className="flex-1 text-right font-geist-medium text-[13.5px] text-ink">
                {task.location}
              </Text>
            </View>

            <View className="flex-row items-start justify-between gap-3 py-3">
              <View className="flex-row items-center gap-2" style={{ gap: 8 }}>
                <Wallet2 size={16} color="#8A959B" />
                <Text className="font-geist text-[13px] text-ink-500">Payment</Text>
              </View>
              <Text className="flex-1 text-right font-geist-medium text-[13.5px] text-ink">
                {task.paid
                  ? `${paymentMethodMeta(task.paymentMethod).label} · settled`
                  : `${paymentMethodMeta(task.paymentMethod).label} on completion`}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push(`/task/${task.id}` as any)}
              className="flex-row items-center justify-between pt-3 active:opacity-75"
            >
              <Text className="font-geist-medium text-[13.5px] text-brand">
                View original task details
              </Text>
              <ChevronRight size={16} color="#0094F7" />
            </Pressable>
          </View>

          {/* Dispute Banner (if active) */}
          {dispute && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(screens)/dispute/[taskId]',
                  params: { taskId: task.id },
                } as any)
              }
              className="flex-row items-center gap-3 rounded-3xl border border-danger/30 bg-danger/10 p-4 active:bg-danger/20"
              style={{ gap: 12 }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Gavel size={18} color="#C7382F" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[14px] font-geist-semibold text-danger">
                  Dispute in progress
                </Text>
                <Text className="text-[12.5px] font-geist text-ink-600">
                  {dispute.reason} · {dispute.status.replace(/_/g, ' ')}
                </Text>
              </View>
              <ChevronRight size={18} color="#C7382F" />
            </Pressable>
          )}

          {/* Review Banner (if completed and not yet reviewed) */}
          {task.status === 'completed' && !reviewed && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(screens)/review/[taskId]',
                  params: { taskId: task.id },
                } as any)
              }
              className="flex-row items-center gap-3 rounded-3xl border border-brand/40 bg-brand-tint/50 p-4 active:bg-brand-tint"
              style={{ gap: 12 }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Star size={18} color="#E3A008" fill="#E3A008" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[14px] font-geist-semibold text-ink">
                  How was your experience?
                </Text>
                <Text className="text-[12.5px] font-geist text-ink-500">
                  Leave a review for {other.name.split(' ')[0]}
                </Text>
              </View>
              <ChevronRight size={18} color="#0094F7" />
            </Pressable>
          )}

          {/* Raise Dispute Button */}
          {!dispute &&
            ['in_progress', 'awaiting_completion', 'completed'].includes(
              task.status
            ) && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(screens)/dispute/new/[taskId]',
                    params: { taskId: task.id },
                  } as any)
                }
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white py-3.5 active:bg-ink-100"
                style={{ gap: 8 }}
              >
                <AlertTriangle size={16} color="#B4690E" />
                <Text className="font-geist-medium text-[13.5px] text-ink-700">
                  Something went wrong — raise a dispute
                </Text>
              </Pressable>
            )}
        </View>
      </ScrollView>

      {/* Sticky Footer Actions */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        {task.status === 'assigned' &&
          (isProvider ? (
            <Button
              full
              size="lg"
              variant="brand"
              icon={<PlayCircle size={18} color="#FFFFFF" />}
              onPress={() => setConfirmStart(true)}
            >
              Start job
            </Button>
          ) : (
            <View className="flex-row gap-2.5" style={{ gap: 10 }}>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={() => router.push(`/chat/${task.id}` as any)}
              >
                Message
              </Button>
              <Button size="lg" className="flex-1" disabled>
                Waiting to start
              </Button>
            </View>
          ))}

        {task.status === 'in_progress' &&
          (isProvider ? (
            <Button
              full
              size="lg"
              variant="brand"
              onPress={() => setConfirmComplete(true)}
            >
              Mark as completed
            </Button>
          ) : (
            <View className="flex-row gap-2.5" style={{ gap: 10 }}>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={() => router.push(`/chat/${task.id}` as any)}
              >
                Message
              </Button>
              <Button
                size="lg"
                variant="brand"
                className="flex-1"
                onPress={() =>
                  router.push({
                    pathname: '/(screens)/job/[taskId]/payment',
                    params: { taskId: task.id },
                  } as any)
                }
              >
                Confirm completion
              </Button>
            </View>
          ))}

        {task.status === 'awaiting_completion' &&
          (isProvider ? (
            <Button full size="lg" disabled>
              Waiting for confirmation
            </Button>
          ) : (
            <Button
              full
              size="lg"
              variant="brand"
              onPress={() =>
                router.push({
                  pathname: '/(screens)/job/[taskId]/payment',
                  params: { taskId: task.id },
                } as any)
              }
            >
              Confirm completion & pay
            </Button>
          ))}

        {task.status === 'completed' && (
          <View className="flex-row gap-2.5" style={{ gap: 10 }}>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onPress={() => router.push('/(screens)/wallet')}
            >
              View payment
            </Button>
            <Button
              size="lg"
              variant="brand"
              className="flex-1"
              disabled={!!reviewed}
              onPress={() =>
                router.push({
                  pathname: '/(screens)/review/[taskId]',
                  params: { taskId: task.id },
                } as any)
              }
            >
              {reviewed ? 'Review submitted' : 'Leave a review'}
            </Button>
          </View>
        )}

        {task.status === 'disputed' && (
          <Button
            full
            size="lg"
            variant="ink"
            onPress={() =>
              router.push({
                pathname: '/(screens)/dispute/[taskId]',
                params: { taskId: task.id },
              } as any)
            }
          >
            Track dispute
          </Button>
        )}
      </View>

      {/* Confirm Start Dialog */}
      <ConfirmDialog
        open={confirmStart}
        onClose={() => setConfirmStart(false)}
        onConfirm={() => startJob(task.id)}
        title="Start this job?"
        message="The requester is notified that you have started. Keep them updated in chat as you work."
        confirmLabel="Start job"
      />

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={() => markCompleted(task.id)}
        title="Mark work as completed?"
        message="The requester will be asked to confirm and settle payment. Make sure everything agreed is finished."
        confirmLabel="Mark completed"
      />
    </Screen>
  );
}
