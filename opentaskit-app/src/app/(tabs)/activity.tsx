import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Bookmark,
  Briefcase,
  FileText,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { DELETION_PENALTY_RATE, deletionPenaltyFor, money, scheduleLabel } from '@/utils/format';
import { mapApiTaskToTask } from '@/utils/taskFilters';
import type { MyOfferItem, Task, TaskStatus } from '@/types';
import { Screen } from '@/components/layout/Screen';
import { TabBar } from '@/components/ui/Segmented';
import { Chip, SelectChip, StatusChip } from '@/components/ui/Chip';
import { EmptyState, TaskCardSkeleton } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { TaskCard } from '@/components/task/TaskCard';
import { CategoryBadge } from '@/components/CategoryIcon';
import { useAppSelector } from '@/store';
import {
  useGetMyPostedTasksQuery,
  useGetMyAssignedTasksQuery,
  useGetMyOffersQuery,
  useGetTaskByIdQuery,
  useDeleteTaskMutation,
} from '@/store/api/apiSlice';
import { useSavedTasks } from '@/hooks/useSavedTasks';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

type Tab = 'requests' | 'offers' | 'jobs';

const statusFilters: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'receiving_offers', label: 'Open' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const { savedCount } = useSavedTasks();
  const {
    tasks,
    deleteTask,
    requireAccount,
    toast,
  } = useApp();
  const guest = useAppSelector((state) => state.auth.guest);
  const unreadMessages = useUnreadMessages();

  const [tab, setTab] = useState<Tab>(params.tab || 'requests');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const {
    data: apiPostedTasks,
    isLoading: isPostedLoading,
    refetch: refetchPosted,
  } = useGetMyPostedTasksQuery(undefined, { skip: guest });
  const {
    data: apiAssignedTasks,
    isLoading: isAssignedLoading,
    refetch: refetchAssigned,
  } = useGetMyAssignedTasksQuery(undefined, { skip: guest });
  const {
    data: apiMyOffers,
    isLoading: isOffersLoading,
    refetch: refetchOffers,
  } = useGetMyOffersQuery(undefined, { skip: guest });
  const [deleteTaskApi] = useDeleteTaskMutation();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (guest) return;
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPosted(),
        refetchAssigned(),
        refetchOffers(),
      ]);
    } catch {
      // Ignored
    } finally {
      setRefreshing(false);
    }
  };

  const myRequests: Task[] = useMemo(() => {
    if (apiPostedTasks) {
      return apiPostedTasks.map(mapApiTaskToTask);
    }
    return tasks.filter((task) => task.requesterId === ME);
  }, [apiPostedTasks, tasks]);

  const myJobs: Task[] = useMemo(() => {
    if (apiAssignedTasks) {
      return apiAssignedTasks.map(mapApiTaskToTask);
    }
    return tasks.filter((task) => task.assignedProviderId === ME);
  }, [apiAssignedTasks, tasks]);

  /**
   * Once an offer is accepted it is a job, not an offer — accepted offers are
   * only shown under Jobs, so a piece of work never appears in two places.
   */
  const myOffers = useMemo(
    () => (apiMyOffers ?? []).filter((offer) => offer.status !== 'ACCEPTED'),
    [apiMyOffers]
  );

  const filtered = (list: Task[]) => {
    if (status === 'all') return list;
    if (status === 'receiving_offers') {
      return list.filter((task) => task.status === 'receiving_offers' || task.status === 'posted');
    }
    return list.filter((task) => task.status === status);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const taskToDelete = pendingDelete;
    try {
      const res = await deleteTaskApi(taskToDelete.id).unwrap();
      toast({
        title: 'Task deleted',
        description: res.message || 'Task has been deleted.',
        variant: 'success',
      });
      deleteTask(taskToDelete.id);
    } catch (err: any) {
      toast({
        title: 'Failed to delete task',
        description: err?.data?.message || err?.message || 'Something went wrong',
        variant: 'error',
      });
    } finally {
      setPendingDelete(null);
    }
  };

  const deletePenalty = pendingDelete
    ? deletionPenaltyFor(pendingDelete.budget, pendingDelete.status)
    : 0;

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <View className="z-20 shrink-0 bg-white px-5 pt-4 pb-0 border-b border-ink-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-[22px] font-geist-bold font-bold tracking-tight text-ink">
            Activity
          </Text>

          <View className="flex-row items-center gap-2">
            {/* Bookmarks */}
            <Pressable
              onPress={() => router.push('/saved' as any)}
              hitSlop={8}
              className="relative h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white"
            >
              <Bookmark size={18} color="#0C1417" />
              {savedCount > 0 && (
                <View className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1">
                  <Text className="text-[10px] font-geist-bold font-bold text-white">
                    {savedCount}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Messages */}
            <Pressable
              onPress={() => router.push('/chats' as any)}
              hitSlop={8}
              className="relative h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white"
            >
              <MessageCircle size={18} color="#0C1417" />
              {unreadMessages > 0 && (
                <View className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1">
                  <Text className="text-[10px] font-geist-bold font-bold text-white">
                    {unreadMessages}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* TabBar */}
        <View className="mt-3">
          <TabBar
            tabs={[
              { value: 'requests', label: 'Hiring', count: myRequests.length },
              {
                value: 'offers',
                label: 'My bids',
                count: myOffers.filter((o) => o.status === 'PENDING').length,
              },
              { value: 'jobs', label: 'Assigned', count: myJobs.length },
            ]}
            value={tab}
            onChange={(val) => {
              setTab(val);
              setStatus('all');
            }}
          />
        </View>
      </View>

      {/* Horizontal Status Filters (Requests & Jobs only) */}
      {tab !== 'offers' && (
        <View className="shrink-0 bg-white border-b border-ink-100 py-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {statusFilters.map((filter) => (
              <SelectChip
                key={filter.key}
                selected={status === filter.key}
                onClick={() => setStatus(filter.key)}
              >
                {filter.label}
              </SelectChip>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Scrollable Body Content */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 110, flexGrow: 1 }}
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
        {/* REQUESTS TAB */}
        {tab === 'requests' && (
          isPostedLoading ? (
            <View className="gap-3" style={{ gap: 12 }}>
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </View>
          ) : filtered(myRequests).length > 0 ? (
            <View className="gap-3">
              {filtered(myRequests).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showStatus
                  mine
                  hideRequester
                  footer={
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="font-geist text-[12px] text-ink-500 flex-1">
                        {deletionPenaltyFor(task.budget, task.status) > 0
                          ? `Deleting now costs ${money(
                              deletionPenaltyFor(task.budget, task.status)
                            )}`
                          : 'Free to delete — nobody assigned yet'}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        {(task.status === 'posted' || task.status === 'receiving_offers') && (
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: '/(screens)/task/[id]/edit',
                                params: { id: task.id },
                              } as any)
                            }
                            hitSlop={8}
                            className="flex-row items-center gap-1.5 rounded-full border border-brand/30 bg-brand-tint/40 px-3 py-1.5"
                          >
                            <Pencil size={13} color="#0094F7" />
                            <Text className="text-[12.5px] font-geist-medium font-medium text-brand">
                              Edit
                            </Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => setPendingDelete(task)}
                          hitSlop={8}
                          className="flex-row items-center gap-1.5 rounded-full border border-danger/30 bg-danger/5 px-3 py-1.5"
                        >
                          <Trash2 size={13} color="#C7382F" />
                          <Text className="text-[12.5px] font-geist-medium font-medium text-danger">
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  }
                  onClick={() => {
                    if (task.status === 'posted' || task.status === 'receiving_offers') {
                      router.push(`/task/${task.id}` as any);
                    } else {
                      router.push(`/job/${task.id}` as any);
                    }
                  }}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<FileText size={32} color="#0094F7" />}
              title={status === 'all' ? 'No tasks yet' : 'Nothing in this status'}
              message={
                status === 'all'
                  ? 'Post your first task and start receiving offers from people nearby.'
                  : 'Try another status filter to see the rest of your tasks.'
              }
              actionLabel="Post a task"
              onAction={() => {
                if (!requireAccount('post')) return;
                router.push('/create' as any);
              }}
            />
          )
        )}

        {/* OFFERS TAB */}
        {tab === 'offers' && (
          isOffersLoading ? (
            <View className="gap-3" style={{ gap: 12 }}>
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </View>
          ) : myOffers.length > 0 ? (
            <View className="gap-3">
              {myOffers.map((offer) => (
                <MyOfferCard key={offer.id} offer={offer} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Send size={32} color="#0094F7" />}
              title="No bids sent yet"
              message="Browse tasks nearby and send your price. You keep control until the requester accepts."
              actionLabel="Find tasks"
              onAction={() => router.push('/discover' as any)}
            />
          )
        )}

        {/* JOBS TAB */}
        {tab === 'jobs' && (
          isAssignedLoading ? (
            <View className="gap-3" style={{ gap: 12 }}>
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </View>
          ) : filtered(myJobs).length > 0 ? (
            <View className="gap-3">
              {filtered(myJobs).map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push(`/job/${task.id}` as any)}
                  className="w-full rounded-3xl border border-ink-200 bg-white p-4"
                  style={{
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                  }}
                >
                  <View className="flex-row items-start gap-3">
                    <CategoryBadge categoryId={task.categoryId} size="lg" />
                    <View className="min-w-0 flex-1">
                      <Text
                        numberOfLines={2}
                        className="text-[14.5px] font-geist-semibold font-semibold leading-snug tracking-tight text-ink"
                      >
                        {task.title}
                      </Text>
                      <Text className="font-geist mt-1 text-[12.5px] text-ink-500">
                        {scheduleLabel(task.schedule)} · {task.location}
                      </Text>
                    </View>
                    <Text className="shrink-0 text-[16px] font-geist-semibold font-semibold tracking-tight text-ink">
                      {money(task.budget)}
                    </Text>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-ink-100 pt-3">
                    <StatusChip status={task.status} />
                    <View className="flex-row items-center gap-1.5">
                      <Briefcase size={14} color="#0094F7" />
                      <Text className="text-[12.5px] font-geist-medium font-medium text-brand">
                        View task
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Briefcase size={32} color="#0094F7" />}
              title="No assigned tasks"
              message="Tasks assigned to you appear here with their schedule, chat and completion steps."
              actionLabel="Find tasks"
              onAction={() => router.push('/discover' as any)}
            />
          )
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={deletePenalty > 0 ? 'Delete and pay the penalty?' : 'Delete this task?'}
        message={
          deletePenalty > 0
            ? `Someone is already assigned to “${pendingDelete?.title}”. Deleting it now charges a ${Math.round(
                DELETION_PENALTY_RATE * 100
              )}% penalty of ${money(deletePenalty)}, and the tasker is told the job is off.`
            : `“${pendingDelete?.title}” will be removed along with any offers on it. Nobody has been assigned, so there is no penalty.`
        }
        confirmLabel={
          deletePenalty > 0
            ? `Delete · pay ${money(deletePenalty)}`
            : 'Delete task'
        }
        cancelLabel="Keep task"
        tone="danger"
        icon={<Trash2 size={20} color="#C7382F" />}
      />
    </Screen>
  );
}

const offerStatusMeta: Record<MyOfferItem['status'], { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral' }> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  REJECTED: { label: 'Declined', tone: 'danger' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
};

function MyOfferCard({ offer }: { offer: MyOfferItem }) {
  const router = useRouter();
  const { data: apiTask } = useGetTaskByIdQuery(offer.task.id);
  const task = useMemo(() => {
    if (apiTask) return mapApiTaskToTask(apiTask);
    if (offer.task) {
      return {
        id: offer.task.id,
        title: offer.task.title,
        categoryId: '',
        budget: offer.task.budget,
        flexibleBudget: false,
        location: offer.task.address || (offer.task.locationType === 'REMOTE' ? 'Remote' : 'In Person'),
        distanceKm: offer.task.locationType === 'REMOTE' ? 0 : 2.5,
        pin: { x: 50, y: 50 },
        schedule: { type: 'asap' as const },
        paymentMethod: 'cash' as const,
        postedAt: offer.createdAt,
        status: (offer.task.status?.toLowerCase() as any) || 'posted',
        requesterId: offer.task.user?.id || '',
        description: '',
        images: [],
        user: offer.task.user
          ? {
              id: offer.task.user.id,
              fullName: offer.task.user.fullName,
              avatarUrl: offer.task.user.avatarUrl,
              isVerified: offer.task.user.isVerified,
            }
          : undefined,
      } as Task;
    }
    return undefined;
  }, [apiTask, offer]);

  if (!task) {
    return <TaskCardSkeleton />;
  }

  const meta = offerStatusMeta[offer.status];

  return (
    <TaskCard
      task={task}
      hideRequester={false}
      // Poster rating isn't returned by any offers/tasks endpoint yet - placeholder until a real profile lookup is wired in, same as the dummy distance already baked into mapApiTaskToTask.
      posterRating={4.8}
      posterReviewCount={24}
      badge={<Chip tone={meta.tone}>{meta.label}</Chip>}
      footer={
        <View className="flex-row items-center justify-between">
          <Text className="font-geist text-[12px] text-ink-500">Your offer</Text>
          <Text className="text-[14px] font-geist-semibold text-ink">{money(offer.amount)}</Text>
        </View>
      }
      onClick={() => router.push(`/task/${offer.task.id}` as any)}
    />
  );
}
