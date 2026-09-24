import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  RefreshControl,
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
  Play,
  Star,
  Wallet2,
  X,
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
import { EmptyState, TaskCardSkeleton } from '@/components/ui/Feedback';
import { useAppSelector } from '@/store';
import {
  useGetTaskByIdQuery,
  useGetOffersForTaskQuery,
  useGetReviewsForTaskQuery,
  useGetDisputesForTaskQuery,
  useStartTaskMutation,
  useCompleteTaskMutation,
  useCancelTaskMutation,
} from '@/store/api/apiSlice';
import { getApiErrorMessage } from '@/utils/apiError';
import { mapApiTaskToTask } from '@/utils/taskFilters';
import { DISPUTE_REASON_LABELS, DISPUTE_STATUS_META } from '@/utils/disputes';

const STEPS = [
  'Assigned',
  'In progress',
  'Work completed',
  'Payment',
  'Reviewed',
];

function getStepIndex(status: string, paid?: boolean, reviewed?: boolean): number {
  if (status === 'cancelled') return 0;
  if (reviewed) return 5;
  if (paid) return 5;
  if (status === 'completed') return 4;
  if (status === 'awaiting_completion') return 3;
  if (status === 'in_progress') return 2;
  return 1;
}

export default function JobDetailScreen() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authUser = useAppSelector((state) => state.auth.user);
  const {
    taskById,
    userById,
    toast,
  } = useApp();

  const [startTaskApi, { isLoading: isStarting }] = useStartTaskMutation();
  const [completeTaskApi, { isLoading: isCompleting }] = useCompleteTaskMutation();
  const [cancelTaskApi, { isLoading: isCancelling }] = useCancelTaskMutation();

  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: apiTaskData,
    isLoading: isTaskLoading,
    refetch: refetchTask,
  } = useGetTaskByIdQuery(taskId, { skip: !taskId });
  const { data: taskOffers, refetch: refetchOffers } = useGetOffersForTaskQuery(taskId, { skip: !taskId });
  const { data: taskReviews, refetch: refetchReviews } = useGetReviewsForTaskQuery(taskId, { skip: !taskId });
  const { data: taskDisputes, refetch: refetchDisputes } = useGetDisputesForTaskQuery(taskId, { skip: !taskId });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchTask(),
        refetchOffers(),
        refetchReviews(),
        refetchDisputes(),
      ]);
    } catch {
      // Ignored
    } finally {
      setRefreshing(false);
    }
  };

  const task = useMemo(
    () => (apiTaskData ? mapApiTaskToTask(apiTaskData) : taskById(taskId)),
    [apiTaskData, taskById, taskId]
  );

  const acceptedOffer = taskOffers?.find((o) => o.status === 'ACCEPTED');
  const isOwner = !!(
    authUser?.id &&
    ((task as any)?.userId === authUser.id ||
      task?.requesterId === authUser.id ||
      apiTaskData?.userId === authUser.id)
  );
  const isAdmin = authUser?.role === 'ADMIN';
  // Once the tasker has started the task, only an admin can still cancel it.
  const canCancel =
    (isOwner || isAdmin) &&
    task?.status !== 'completed' &&
    task?.status !== 'cancelled' &&
    (isAdmin ||
      (task?.status !== 'in_progress' && task?.status !== 'awaiting_completion'));

  const isProvider = authUser?.id
    ? (acceptedOffer ? acceptedOffer.userId === authUser.id : task?.assignedProviderId === ME)
    : task?.assignedProviderId === ME;

  const handleConfirmStart = async () => {
    if (!task) return;
    try {
      await startTaskApi(task.id).unwrap();
      setConfirmStart(false);
      toast({
        title: 'Task started',
        description: 'You have started working on this task. Status is now In progress.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Failed to start task',
        description: getApiErrorMessage(err),
        variant: 'error',
      });
    }
  };

  const handleConfirmComplete = async () => {
    if (!task) return;
    try {
      const result = await completeTaskApi(task.id).unwrap();
      setConfirmComplete(false);
      const isNowCompleted = result.task.status === 'COMPLETED';
      toast({
        title: isNowCompleted ? 'Task completed' : 'Marked as done',
        description: result.message,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Failed to complete task',
        description: getApiErrorMessage(err),
        variant: 'error',
      });
    }
  };

  const handleConfirmCancel = async () => {
    if (!task) return;
    try {
      await cancelTaskApi(task.id).unwrap();
      setConfirmCancel(false);
      toast({
        title: 'Task cancelled',
        description: 'The task has been cancelled and active offers withdrawn.',
        variant: 'info',
      });
    } catch (err) {
      toast({
        title: 'Failed to cancel task',
        description: getApiErrorMessage(err),
        variant: 'error',
      });
    }
  };

  const fallbackOther = userById(
    isProvider
      ? task?.requesterId ?? ''
      : acceptedOffer?.userId ?? task?.assignedProviderId ?? task?.requesterId ?? ''
  );

  const other = isProvider
    ? ((task as any)?.user
        ? {
            ...fallbackOther,
            id: (task as any).user.id,
            name: (task as any).user.fullName || fallbackOther.name,
            phoneNumber: (task as any).user.phoneNumber || '',
            avatarUrl: (task as any).user.avatarUrl || fallbackOther.avatarUrl,
            verified: (task as any).user.isVerified ?? fallbackOther.verified,
          }
        : fallbackOther)
    : (acceptedOffer?.user
        ? {
            ...fallbackOther,
            id: acceptedOffer.user.id,
            name: acceptedOffer.user.fullName || fallbackOther.name,
            phoneNumber: acceptedOffer.user.phoneNumber || '',
            avatarUrl: acceptedOffer.user.avatarUrl || fallbackOther.avatarUrl,
            rating: acceptedOffer.user.rating ?? fallbackOther.rating,
            reviewCount: acceptedOffer.user.reviewCount ?? fallbackOther.reviewCount,
            verified: acceptedOffer.user.isVerified ?? fallbackOther.verified,
          }
        : fallbackOther);

  if (isTaskLoading) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Job details" />
        <View className="p-5 gap-3" style={{ gap: 12 }}>
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </View>
      </Screen>
    );
  }

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

  const dispute = taskDisputes?.[0];
  const activeDispute = dispute && (dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') ? dispute : undefined;
  const reviewed = !!(authUser?.id && taskReviews?.some((r) => r.fromUserId === authUser.id));
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
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0094F7"
            colors={['#0094F7']}
          />
        }
      >
        <View className="gap-5 px-5 pb-8 pt-4" style={{ gap: 20 }}>
          {/* Cancelled Banner */}
          {task.status === 'cancelled' && (
            <View
              className="flex-row items-center gap-3 rounded-3xl border border-danger/30 bg-danger/10 p-4"
              style={{ gap: 12 }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                <AlertTriangle size={18} color="#C7382F" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[14px] font-geist-semibold text-danger">
                  Task Cancelled
                </Text>
                <Text className="text-[12.5px] font-geist text-ink-600">
                  This task was cancelled and offers were withdrawn.
                </Text>
              </View>
            </View>
          )}

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
                              ? 'Work on the task and mark complete when finished.'
                              : 'Waiting for your provider to finish work.')}
                          {task.status === 'in_progress' &&
                            (isProvider
                              ? 'Mark complete when the work is done.'
                              : 'Work is underway — follow progress in chat.')}
                          {task.status === 'awaiting_completion' &&
                            (isProvider
                              ? 'Waiting for confirmation from the requester.'
                              : 'Confirm the work is done to release payment.')}
                          {task.status === 'completed' &&
                            'Task completed. Leave a review to close it out.'}
                          {task.status === 'cancelled' &&
                            'This task has been cancelled.'}
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

          {/* Dispute Banner — stays visible after resolution so both parties
              can still reach the dispute history, not just while it's active */}
          {dispute && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(screens)/dispute/[taskId]',
                  params: { taskId: task.id },
                } as any)
              }
              className={
                activeDispute
                  ? 'flex-row items-center gap-3 rounded-3xl border border-danger/30 bg-danger/10 p-4 active:bg-danger/20'
                  : 'flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-ink-50 p-4 active:bg-ink-100'
              }
              style={{ gap: 12 }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Gavel size={18} color={activeDispute ? '#C7382F' : '#6B7280'} />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className={
                    activeDispute
                      ? 'text-[14px] font-geist-semibold text-danger'
                      : 'text-[14px] font-geist-semibold text-ink'
                  }
                >
                  {activeDispute ? 'Dispute in progress' : 'Dispute history'}
                </Text>
                <Text className="text-[12.5px] font-geist text-ink-600">
                  {DISPUTE_REASON_LABELS[dispute.reason]} · {DISPUTE_STATUS_META[dispute.status].label}
                </Text>
              </View>
              <ChevronRight size={18} color={activeDispute ? '#C7382F' : '#6B7280'} />
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
          {/* Allowed once a tasker is assigned - covers issues reported while
              work is ongoing, awaiting confirmation, or after completion. */}
          {!activeDispute &&
            ['assigned', 'in_progress', 'awaiting_completion', 'completed'].includes(
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
          {/* Cancel Task Button (Owner or Admin) */}
          {canCancel && (
            <Pressable
              onPress={() => setConfirmCancel(true)}
              className="flex-row items-center justify-center gap-2 rounded-2xl border border-danger/20 bg-danger/5 py-3.5 active:bg-danger/10"
              style={{ gap: 8 }}
            >
              <X size={16} color="#C7382F" />
              <Text className="font-geist-medium text-[13.5px] text-danger">
                Cancel this task
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
        {task.status === 'cancelled' && (
          <Button
            full
            size="lg"
            variant="outline"
            onPress={() => router.replace('/(tabs)/activity')}
          >
            Back to activity
          </Button>
        )}

        {task.status === 'assigned' &&
          (isProvider ? (
            <Button
              full
              size="lg"
              variant="brand"
              icon={<Play size={18} color="#FFFFFF" />}
              loading={isStarting}
              onPress={() => setConfirmStart(true)}
            >
              Start task
            </Button>
          ) : (
            <View className="flex-row gap-2.5" style={{ gap: 10 }}>
              {canCancel && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onPress={() => setConfirmCancel(true)}
                >
                  Cancel task
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                disabled
              >
                Waiting for tasker to start
              </Button>
            </View>
          ))}

        {task.status === 'in_progress' &&
          (isProvider ? (
            <Button
              full
              size="lg"
              variant="brand"
              icon={<CheckCircle2 size={18} color="#FFFFFF" />}
              loading={isCompleting}
              onPress={() => setConfirmComplete(true)}
            >
              Mark as completed
            </Button>
          ) : (
            <Button full size="lg" variant="outline" disabled>
              Waiting for tasker to mark complete
            </Button>
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
              Confirm completion
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
        onConfirm={handleConfirmStart}
        title="Start this task?"
        message="Let the requester know that you have begun work on this task. The status will move to In Progress."
        confirmLabel={isStarting ? 'Starting...' : 'Start task'}
      />

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={handleConfirmComplete}
        title={isProvider ? 'Mark work as done?' : 'Confirm task completion?'}
        message={
          isProvider
            ? 'The requester will be asked to confirm before the task is marked completed. Make sure all agreed deliverables are finished first.'
            : 'Confirm that the work is finished. This marks the task as completed and releases payment.'
        }
        confirmLabel={isCompleting ? 'Submitting...' : isProvider ? 'Mark as done' : 'Confirm completion'}
      />

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel this task?"
        message="Are you sure you want to cancel this task? Active offers will be withdrawn and the task will be cancelled."
        confirmLabel={isCancelling ? 'Cancelling...' : 'Cancel task'}
        cancelLabel="Keep task"
        tone="danger"
      />
    </Screen>
  );
}
