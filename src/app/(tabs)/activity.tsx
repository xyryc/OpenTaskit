import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Bookmark,
  Briefcase,
  FileText,
  MessageCircle,
  Send,
  Trash2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { DELETION_PENALTY_RATE, deletionPenaltyFor, money } from '@/utils/format';
import type { Task, TaskStatus } from '@/types';
import { Screen } from '@/components/layout/Screen';
import { TabBar } from '@/components/ui/Segmented';
import { Chip, SelectChip, StatusChip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { TaskCard } from '@/components/task/TaskCard';
import { CategoryBadge } from '@/components/CategoryIcon';

type Tab = 'requests' | 'offers' | 'jobs';

const statusFilters: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'receiving_offers', label: 'Receiving offers' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'awaiting_completion', label: 'Awaiting' },
  { key: 'completed', label: 'Completed' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const {
    tasks,
    offers,
    unreadMessages,
    savedTaskIds,
    taskById,
    deleteTask,
    requireAccount,
  } = useApp();

  const [tab, setTab] = useState<Tab>(params.tab || 'requests');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const myRequests = tasks.filter((task) => task.requesterId === ME);
  const myJobs = tasks.filter((task) => task.assignedProviderId === ME);

  /**
   * Once an offer is accepted it is a job, not an offer — accepted offers are
   * only shown under Jobs, so a piece of work never appears in two places.
   */
  const myOffers = useMemo(
    () =>
      offers.filter(
        (offer) => offer.providerId === ME && offer.status !== 'accepted'
      ),
    [offers]
  );

  const filtered = (list: Task[]) =>
    status === 'all' ? list : list.filter((task) => task.status === status);

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
              {savedTaskIds.length > 0 && (
                <View className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1">
                  <Text className="text-[10px] font-geist-bold font-bold text-white">
                    {savedTaskIds.length}
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
              { value: 'requests', label: 'Requests', count: myRequests.length },
              {
                value: 'offers',
                label: 'Offers',
                count: myOffers.filter((o) => o.status === 'pending').length,
              },
              { value: 'jobs', label: 'Jobs', count: myJobs.length },
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
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* REQUESTS TAB */}
        {tab === 'requests' && (
          filtered(myRequests).length > 0 ? (
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
                      <Pressable
                        onPress={() => setPendingDelete(task)}
                        hitSlop={8}
                        className="flex-row items-center gap-1.5 rounded-full"
                        style={{
                          borderColor: 'rgba(199, 56, 47, 0.35)',
                          borderWidth: 1,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: 'rgba(199, 56, 47, 0.05)',
                        }}
                      >
                        <Trash2 size={13} color="#C7382F" />
                        <Text className="text-[12.5px] font-geist-medium font-medium text-danger">
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  }
                  onClick={() => router.push(`/task/${task.id}` as any)}
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
          myOffers.length > 0 ? (
            <View className="gap-3">
              {myOffers.map((offer) => {
                const task = taskById(offer.taskId);
                if (!task) return null;
                return (
                  <TaskCard
                    key={offer.id}
                    task={task}
                    badge={
                      <Chip
                        tone={
                          offer.status === 'pending'
                            ? 'warning'
                            : offer.status === 'rejected'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {offer.status === 'pending'
                          ? 'Pending'
                          : offer.status === 'rejected'
                          ? 'Declined'
                          : 'Withdrawn'}
                      </Chip>
                    }
                    footer={
                      <View className="font-geist flex-row items-center justify-between text-[12px]">
                        <Text className="font-geist text-[12px] text-ink-500">Your offer</Text>
                        <Text className="text-[14px] font-geist-semibold font-semibold text-ink">
                          {money(offer.price)}
                        </Text>
                      </View>
                    }
                    onClick={() => router.push(`/task/${task.id}` as any)}
                  />
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={<Send size={32} color="#0094F7" />}
              title="No offers sent yet"
              message="Browse tasks nearby and send your price. You keep control until the requester accepts."
              actionLabel="Find tasks"
              onAction={() => router.push('/discover' as any)}
            />
          )
        )}

        {/* JOBS TAB */}
        {tab === 'jobs' && (
          filtered(myJobs).length > 0 ? (
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
                        {task.schedule.date ?? 'Flexible'} · {task.location}
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
                        Open job
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Briefcase size={32} color="#0094F7" />}
              title="No upcoming jobs"
              message="Jobs you win appear here with their schedule, chat and completion steps."
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
        onConfirm={() => {
          if (pendingDelete) deleteTask(pendingDelete.id);
          setPendingDelete(null);
        }}
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
