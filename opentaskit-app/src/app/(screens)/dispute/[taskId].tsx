import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Gavel,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useAppSelector } from '@/store';
import { useGetTaskByIdQuery, useGetDisputesForTaskQuery } from '@/store/api/apiSlice';
import { mapApiTaskToTask } from '@/utils/taskFilters';
import { money, timeAgo } from '@/utils/format';
import { resolveImageSource } from '@/utils/images';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/Feedback';
import { DISPUTE_REASON_LABELS, DISPUTE_RESOLUTION_LABELS, DISPUTE_STATUS_META } from '@/utils/disputes';

export default function DisputeDetailScreen() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskById } = useApp();
  const authUser = useAppSelector((state) => state.auth.user);

  const { data: apiTaskData } = useGetTaskByIdQuery(taskId, { skip: !taskId });
  const { data: disputes, isLoading } = useGetDisputesForTaskQuery(taskId, { skip: !taskId });

  const task = useMemo(
    () => (apiTaskData ? mapApiTaskToTask(apiTaskData) : taskById(taskId)),
    [apiTaskData, taskById, taskId]
  );
  const dispute = disputes?.[0];

  if (!isLoading && (!task || !dispute)) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Dispute" />
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            icon={<Gavel size={32} color="#8A959B" />}
            title="No dispute on this task"
            message="If something went wrong with a job you can open a dispute from the job screen."
            actionLabel="Back to activity"
            onAction={() => router.push('/(tabs)/activity')}
          />
        </View>
      </Screen>
    );
  }

  if (!task || !dispute) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Dispute" />
      </Screen>
    );
  }

  const isRaiser = authUser?.id === dispute.raisedById;
  const otherPartyName = isRaiser
    ? dispute.againstUser?.fullName ?? 'the other party'
    : dispute.raisedBy?.fullName ?? 'the other party';
  const statusMeta = DISPUTE_STATUS_META[dispute.status];
  const isFinalized = dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED';

  const timeline = [
    {
      id: 'filed',
      label: 'Dispute filed',
      detail: isRaiser
        ? `You raised this dispute against ${otherPartyName}.`
        : `${otherPartyName} raised this dispute against you.`,
      done: true,
      at: dispute.createdAt,
    },
    {
      id: 'review',
      label: 'Support reviewing your case',
      detail: 'Our mediation team is looking into the evidence from both parties.',
      done: dispute.status !== 'OPEN',
      at: null as string | null,
    },
    {
      id: 'resolved',
      label: dispute.status === 'DISMISSED' ? 'Dispute dismissed' : 'Case resolved',
      detail: dispute.resolution
        ? DISPUTE_RESOLUTION_LABELS[dispute.resolution]
        : 'You will be notified as soon as a decision is made.',
      done: isFinalized,
      at: dispute.resolvedAt,
    },
  ];

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Dispute" subtitle={task.title} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 24,
        }}
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          {/* Dispute Case Summary Card */}
          <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
                  Case #{dispute.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text className="mt-1 text-[18px] font-geist-bold text-ink">
                  {DISPUTE_REASON_LABELS[dispute.reason]}
                </Text>
              </View>
              <Chip tone={statusMeta.tone}>{statusMeta.label}</Chip>
            </View>

            <Text className="mt-3 text-[13.5px] font-geist leading-relaxed text-ink-700">
              {dispute.description}
            </Text>

            <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-ink-100/70 px-3.5 py-3">
              <Text className="font-geist text-[13px] text-ink-500">
                Job value on hold
              </Text>
              <Text className="font-geist-bold text-[14px] text-ink">
                {money(task.budget)}
              </Text>
            </View>
          </View>

          {/* Evidence Photos */}
          {dispute.evidenceUrls.length > 0 && (
            <View>
              <Text className="mb-2.5 text-[15px] font-geist-semibold text-ink">
                Evidence photos ({dispute.evidenceUrls.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {dispute.evidenceUrls.map((src) => (
                  <Image
                    key={src}
                    source={resolveImageSource(src) as any}
                    style={{ width: 140, height: 100, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Timeline */}
          <View>
            <Text className="mb-3 text-[15px] font-geist-semibold text-ink">
              Resolution timeline
            </Text>
            <View>
              {timeline.map((event, index) => (
                <View key={event.id} className="flex-row gap-3" style={{ gap: 12 }}>
                  <View className="items-center">
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full ${
                        event.done
                          ? 'bg-brand'
                          : 'border-2 border-ink-200 bg-white'
                      }`}
                    >
                      {event.done && (
                        <CheckCircle2 size={14} color="#FFFFFF" />
                      )}
                    </View>
                    {index < timeline.length - 1 && (
                      <View
                        className={`min-h-[30px] w-0.5 flex-1 ${
                          event.done ? 'bg-brand/40' : 'bg-ink-200'
                        }`}
                      />
                    )}
                  </View>

                  <View className="flex-1 pb-5">
                    <Text
                      className={`text-[14px] font-geist-medium ${
                        event.done ? 'text-ink' : 'text-ink-400'
                      }`}
                    >
                      {event.label}
                    </Text>
                    <Text className="mt-0.5 font-geist text-[12.5px] leading-snug text-ink-500">
                      {event.detail}
                    </Text>
                    {event.done && event.at && (
                      <Text className="mt-0.5 font-geist text-[11px] text-ink-400">
                        {timeAgo(event.at)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Resolution Notes (if finalized) */}
          {isFinalized && dispute.resolutionNotes && (
            <View className="rounded-3xl border border-ink-200 bg-white p-4">
              <Text className="mb-1.5 text-[13px] font-geist-semibold text-ink">
                Mediation notes
              </Text>
              <Text className="font-geist text-[13px] leading-relaxed text-ink-700">
                {dispute.resolutionNotes}
              </Text>
              {dispute.resolvedBy && (
                <Text className="mt-2 font-geist text-[11.5px] text-ink-400">
                  — {dispute.resolvedBy.fullName}, OpenTaskit support
                </Text>
              )}
            </View>
          )}

          {/* Follow-up Note */}
          {!isFinalized && (
            <View className="rounded-2xl bg-ink-100/70 p-3.5">
              <Text className="font-geist text-[13px] leading-relaxed text-ink-700">
                Our support team may reach out to you and {otherPartyName} directly
                for more details while this case is reviewed.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
