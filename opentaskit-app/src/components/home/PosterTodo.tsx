import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Inbox,
  Play,
  UserPlus,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useAppSelector } from '@/store';
import {
  useGetMyPostedTasksQuery,
  useGetMyAssignedTasksQuery,
} from '@/store/api/apiSlice';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Feedback';

interface Todo {
  id: string;
  title: string;
  detail: string;
  cta: string;
  to: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  tone: 'brand' | 'warning' | 'danger' | 'success';
  count?: number;
}

const toneBoxClasses = {
  brand: 'bg-brand-tint',
  warning: 'bg-warning/15',
  danger: 'bg-danger/15',
  success: 'bg-success/15',
};

const toneColors = {
  brand: '#0094F7',
  warning: '#B4690E',
  danger: '#C7382F',
  success: '#0F8A5F',
};

interface PosterTodoProps {
  mode?: 'requester' | 'provider';
}

export function PosterTodo({ mode: propMode }: PosterTodoProps = {}) {
  const router = useRouter();
  const { mode: contextMode, requireAccount } = useApp();
  const mode = propMode ?? contextMode;
  const guest = useAppSelector((state) => state.auth.guest);

  const {
    data: postedTasks = [],
    isLoading: isPostedLoading,
  } = useGetMyPostedTasksQuery(undefined, { skip: guest });

  const {
    data: assignedTasks = [],
    isLoading: isAssignedLoading,
  } = useGetMyAssignedTasksQuery(undefined, { skip: guest });

  if (guest) {
    return (
      <View className="rounded-3xl border border-ink-200/70 bg-white p-5 items-center shadow-sm">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
          <UserPlus size={24} color="#0094F7" />
        </View>
        <Text className="mt-3 text-[15px] font-geist-bold font-bold text-ink">
          Sign in to track your tasks
        </Text>
        <Text className="font-geist mt-1 text-[12.5px] leading-relaxed text-ink-500 text-center max-w-[260px]">
          When offers arrive, work finishes, or a payment is due, you'll see all your action items right here.
        </Text>
        <Button
          size="md"
          variant="brand"
          className="mt-4"
          onPress={() => router.push('/(auth)/login' as any)}
        >
          Sign in or Register
        </Button>
      </View>
    );
  }

  if (isPostedLoading || isAssignedLoading) {
    return <ListSkeleton count={2} />;
  }

  const todos: Todo[] = [];

  if (mode === 'requester') {
    // 1. Tasks with incoming offers awaiting review
    const awaitingDecision = postedTasks.filter(
      (task) =>
        ['OPEN', 'posted', 'receiving_offers'].includes(task.status) &&
        (task._count?.offers ?? 0) > 0
    );

    if (awaitingDecision.length > 0) {
      const totalOffers = awaitingDecision.reduce(
        (sum, t) => sum + (t._count?.offers ?? 0),
        0
      );
      const single = awaitingDecision.length === 1 ? awaitingDecision[0] : null;
      todos.push({
        id: 'offers',
        title: single
          ? `Review ${totalOffers} ${totalOffers === 1 ? 'offer' : 'offers'} for your task`
          : `Review ${totalOffers} offers across ${awaitingDecision.length} tasks`,
        detail: single
          ? single.title
          : 'Taskers have sent proposals. Compare ratings, prices, and pick the best one.',
        cta: 'Review offers',
        to: single ? `/task/${single.id}/offers` : '/activity?tab=requests',
        icon: Inbox,
        tone: 'brand',
        count: totalOffers,
      });
    }

    // 2. Tasks marked finished by tasker, awaiting requester's confirmation
    const toConfirm = postedTasks.filter(
      (task) =>
        task.status === 'AWAITING_CONFIRMATION' ||
        task.status.toLowerCase() === 'awaiting_completion'
    );

    if (toConfirm.length > 0) {
      const single = toConfirm.length === 1 ? toConfirm[0] : null;
      todos.push({
        id: 'confirm',
        title: `Confirm ${toConfirm.length === 1 ? 'work is' : `${toConfirm.length} tasks are`} finished`,
        detail: single
          ? single.title
          : 'The tasker marked the work completed and is waiting for your confirmation.',
        cta: 'Confirm completion',
        to: single ? `/job/${single.id}` : '/activity?tab=requests',
        icon: ClipboardCheck,
        tone: 'warning',
        count: toConfirm.length,
      });
    }

    // 3. Open disputes requiring response
    const disputed = postedTasks.filter(
      (task) =>
        task.status === 'DISPUTED' ||
        task.status.toLowerCase() === 'disputed'
    );

    if (disputed.length > 0) {
      const single = disputed.length === 1 ? disputed[0] : null;
      todos.push({
        id: 'dispute',
        title: `${disputed.length === 1 ? 'A dispute needs' : `${disputed.length} disputes need`} your response`,
        detail: single ? single.title : 'Support is reviewing this case.',
        cta: 'Open dispute',
        to: single ? `/dispute/${single.id}` : '/activity?tab=requests',
        icon: AlertTriangle,
        tone: 'danger',
        count: disputed.length,
      });
    }

    // 4. Tasks currently in progress
    const inProgress = postedTasks.filter(
      (task) =>
        task.status === 'IN_PROGRESS' ||
        task.status.toLowerCase() === 'in_progress'
    );

    if (inProgress.length > 0) {
      const single = inProgress.length === 1 ? inProgress[0] : null;
      todos.push({
        id: 'in_progress',
        title: `${inProgress.length === 1 ? 'Task' : `${inProgress.length} tasks`} currently in progress`,
        detail: single ? single.title : 'Taskers are actively working on your jobs.',
        cta: 'View status',
        to: single ? `/job/${single.id}` : '/activity?tab=requests',
        icon: Play,
        tone: 'brand',
        count: inProgress.length,
      });
    }
  } else {
    // PROVIDER MODE:
    // 1. Newly assigned jobs ready to start
    const assignedJobs = assignedTasks.filter(
      (task) =>
        task.status === 'ASSIGNED' ||
        task.status.toLowerCase() === 'assigned'
    );

    if (assignedJobs.length > 0) {
      const single = assignedJobs.length === 1 ? assignedJobs[0] : null;
      todos.push({
        id: 'job_assigned',
        title: single ? 'You’ve been hired! Ready to start' : `${assignedJobs.length} new jobs assigned to you`,
        detail: single ? single.title : 'Review task requirements and begin work.',
        cta: 'Start job',
        to: single ? `/job/${single.id}` : '/activity?tab=jobs',
        icon: Play,
        tone: 'brand',
        count: assignedJobs.length,
      });
    }

    // 2. Ongoing jobs in progress
    const inProgressJobs = assignedTasks.filter(
      (task) =>
        task.status === 'IN_PROGRESS' ||
        task.status.toLowerCase() === 'in_progress'
    );

    if (inProgressJobs.length > 0) {
      const single = inProgressJobs.length === 1 ? inProgressJobs[0] : null;
      todos.push({
        id: 'job_in_progress',
        title: single ? 'Finish ongoing job' : `${inProgressJobs.length} jobs in progress`,
        detail: single ? single.title : 'Request completion when work is finished.',
        cta: 'View job',
        to: single ? `/job/${single.id}` : '/activity?tab=jobs',
        icon: ClipboardCheck,
        tone: 'warning',
        count: inProgressJobs.length,
      });
    }

    // 3. Waiting for client confirmation
    const awaitingConfirmationJobs = assignedTasks.filter(
      (task) =>
        task.status === 'AWAITING_CONFIRMATION' ||
        task.status.toLowerCase() === 'awaiting_completion'
    );

    if (awaitingConfirmationJobs.length > 0) {
      const single = awaitingConfirmationJobs.length === 1 ? awaitingConfirmationJobs[0] : null;
      todos.push({
        id: 'job_awaiting',
        title: 'Waiting for client confirmation',
        detail: single ? single.title : 'You requested completion. Waiting for the client to confirm.',
        cta: 'View status',
        to: single ? `/job/${single.id}` : '/activity?tab=jobs',
        icon: CheckCircle2,
        tone: 'success',
        count: awaitingConfirmationJobs.length,
      });
    }

    // 4. Disputed jobs
    const disputedJobs = assignedTasks.filter(
      (task) =>
        task.status === 'DISPUTED' ||
        task.status.toLowerCase() === 'disputed'
    );

    if (disputedJobs.length > 0) {
      const single = disputedJobs.length === 1 ? disputedJobs[0] : null;
      todos.push({
        id: 'job_dispute',
        title: 'Dispute on assigned job',
        detail: single ? single.title : 'Support is reviewing this case.',
        cta: 'View dispute',
        to: single ? `/dispute/${single.id}` : '/activity?tab=jobs',
        icon: AlertTriangle,
        tone: 'danger',
        count: disputedJobs.length,
      });
    }
  }

  if (todos.length === 0) {
    return (
      <View className="rounded-3xl border border-ink-200/70 bg-white p-5 items-center shadow-sm">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-success/15">
          <CheckCircle2 size={24} color="#0F8A5F" />
        </View>
        <Text className="mt-3 text-[15px] font-geist-bold font-bold text-ink">
          Nothing needs your attention right now
        </Text>
        <Text className="font-geist mt-1 text-[12.5px] leading-relaxed text-ink-500 text-center max-w-[270px]">
          {mode === 'requester'
            ? 'When offers arrive, work finishes, or a payment is due, you will see it here.'
            : 'When your offers are accepted or work is assigned, you will see it here.'}
        </Text>
        <Button
          size="md"
          variant="outline"
          className="mt-4"
          onPress={() => {
            if (mode === 'requester') {
              if (!requireAccount('post')) return;
              router.push('/create' as any);
            } else {
              router.push('/(tabs)/discover' as any);
            }
          }}
        >
          {mode === 'requester' ? 'Post a new task' : 'Browse available tasks'}
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-2.5">
      {todos.map((todo) => {
        const IconComponent = todo.icon;
        return (
          <Pressable
            key={todo.id}
            onPress={() => router.push(todo.to as any)}
            className="flex-row items-start gap-3 rounded-3xl border border-ink-200/70 bg-white p-4 shadow-sm active:bg-ink-50"
          >
            <View
              className={`h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                toneBoxClasses[todo.tone]
              }`}
            >
              <IconComponent size={20} color={toneColors[todo.tone]} />
            </View>

            <View className="flex-1 min-w-0">
              <Text className="text-[14px] font-geist-bold font-bold leading-snug text-ink">
                {todo.title}
              </Text>
              <Text
                numberOfLines={2}
                className="font-geist mt-0.5 text-[12.5px] leading-snug text-ink-500"
              >
                {todo.detail}
              </Text>
              <Text className="mt-1.5 text-[12.5px] font-geist-semibold font-semibold text-brand">
                {todo.cta}
              </Text>
            </View>

            <ChevronRight size={20} color="#8A959B" className="mt-1" />
          </Pressable>
        );
      })}
    </View>
  );
}
