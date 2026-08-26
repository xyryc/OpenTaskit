import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Inbox,
  Star,
  Wallet2,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { money } from '@/utils/format';
import { Button } from '@/components/ui/Button';

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

export function PosterTodo() {
  const router = useRouter();
  const { tasks, offers, requireAccount } = useApp();

  const myTasks = tasks.filter((task) => task.requesterId === ME);

  const awaitingDecision = myTasks
    .map((task) => ({
      task,
      pending: offers.filter(
        (offer) => offer.taskId === task.id && offer.status === 'pending'
      ).length,
    }))
    .filter(
      (entry) =>
        entry.pending > 0 &&
        ['posted', 'receiving_offers'].includes(entry.task.status)
    );

  const toConfirm = myTasks.filter(
    (task) => task.status === 'awaiting_completion' && !task.paid
  );
  const toPay = myTasks.filter(
    (task) => task.status === 'completed' && !task.paid
  );
  const toReview = myTasks.filter(
    (task) => task.status === 'completed' && task.paid && !task.reviewedByRequester
  );
  const disputed = myTasks.filter((task) => task.status === 'disputed');

  const todos: Todo[] = [];

  if (awaitingDecision.length) {
    const offerTotal = awaitingDecision.reduce((sum, entry) => sum + entry.pending, 0);
    const single = awaitingDecision.length === 1 ? awaitingDecision[0] : null;
    todos.push({
      id: 'offers',
      title: `Review ${offerTotal} ${offerTotal === 1 ? 'offer' : 'offers'} and accept one`,
      detail: single
        ? single.task.title
        : `Across ${awaitingDecision.length} of your tasks. Compare price, rating and distance before you choose.`,
      cta: 'Review offers',
      to: single ? `/task/${single.task.id}/offers` : '/activity?tab=requests',
      icon: Inbox,
      tone: 'brand',
      count: offerTotal,
    });
  }

  if (toConfirm.length) {
    const single = toConfirm.length === 1 ? toConfirm[0] : null;
    todos.push({
      id: 'confirm',
      title: `Confirm ${toConfirm.length === 1 ? 'a task is' : `${toConfirm.length} tasks are`} finished`,
      detail: single ? single.title : 'The tasker has marked the work done and is waiting on you.',
      cta: 'Confirm completion',
      to: single ? `/job/${single.id}` : '/activity?tab=requests',
      icon: ClipboardCheck,
      tone: 'warning',
      count: toConfirm.length,
    });
  }

  if (toPay.length) {
    const single = toPay.length === 1 ? toPay[0] : null;
    const total = toPay.reduce((sum, task) => sum + task.budget, 0);
    todos.push({
      id: 'pay',
      title: `Release payment for ${toPay.length === 1 ? 'a completed task' : `${toPay.length} completed tasks`}`,
      detail: single ? `${single.title} · ${money(single.budget)}` : `${money(total)} owed in total.`,
      cta: 'Release payment',
      to: single ? `/job/${single.id}/payment` : '/activity?tab=requests',
      icon: Wallet2,
      tone: 'warning',
      count: toPay.length,
    });
  }

  if (disputed.length) {
    const single = disputed.length === 1 ? disputed[0] : null;
    todos.push({
      id: 'dispute',
      title: `${disputed.length === 1 ? 'A dispute needs' : `${disputed.length} disputes need`} your response`,
      detail: single ? single.title : 'Support is waiting on your side of the story.',
      cta: 'Open dispute',
      to: single ? `/dispute/${single.id}` : '/activity?tab=requests',
      icon: AlertTriangle,
      tone: 'danger',
      count: disputed.length,
    });
  }

  if (toReview.length) {
    const single = toReview.length === 1 ? toReview[0] : null;
    todos.push({
      id: 'review',
      title: `Leave a review for ${toReview.length === 1 ? 'your tasker' : `${toReview.length} taskers`}`,
      detail: single ? single.title : 'Ratings keep the marketplace honest for everyone.',
      cta: 'Write a review',
      to: single ? `/review/${single.id}` : '/activity?tab=requests',
      icon: Star,
      tone: 'success',
      count: toReview.length,
    });
  }

  if (todos.length === 0) {
    return (
      <View className="rounded-3xl border border-ink-200/70 bg-white p-5 items-center shadow-sm">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-success/15">
          <CheckCircle2 size={24} color="#0F8A5F" />
        </View>
        <Text className="mt-3 text-[15px] font-bold text-ink">
          Nothing needs you right now
        </Text>
        <Text className="mt-1 text-[12.5px] leading-relaxed text-ink-500 text-center max-w-[260px]">
          When offers arrive, work finishes or a payment is due, it will show up here.
        </Text>
        <Button
          size="md"
          variant="outline"
          className="mt-4"
          onPress={() => {
            if (!requireAccount('post')) return;
            router.push('/create' as any);
          }}
        >
          Post a new task
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
            className="flex-row items-start gap-3 rounded-3xl border border-ink-200/70 bg-white p-4 shadow-sm"
          >
            <View
              className={`h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                toneBoxClasses[todo.tone]
              }`}
            >
              <IconComponent size={20} color={toneColors[todo.tone]} />
            </View>

            <View className="flex-1 min-w-0">
              <Text className="text-[14px] font-bold leading-snug text-ink">
                {todo.title}
              </Text>
              <Text numberOfLines={2} className="mt-0.5 text-[12.5px] leading-snug text-ink-500">
                {todo.detail}
              </Text>
              <Text className="mt-1.5 text-[12.5px] font-semibold text-brand">
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
