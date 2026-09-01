import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Gavel,
  Send,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { money, timeAgo } from '@/utils/format';
import { resolveImageSource } from '@/utils/images';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/Feedback';

export default function DisputeDetailScreen() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskById, disputeForTask, userById, respondToDispute, toast } = useApp();

  const [reply, setReply] = useState('');

  const task = taskById(taskId);
  const dispute = disputeForTask(taskId);

  if (!task || !dispute) {
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

  const handleSendReply = () => {
    if (!reply.trim()) return;
    respondToDispute(dispute.id, reply.trim());
    setReply('');
    toast({ title: 'Response submitted', variant: 'success' });
  };

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
                  Case NX-{dispute.id.toUpperCase()}
                </Text>
                <Text className="mt-1 text-[18px] font-geist-bold text-ink">
                  {dispute.reason}
                </Text>
              </View>
              <Chip
                tone={
                  dispute.status === 'resolved'
                    ? 'success'
                    : dispute.status === 'decision_made'
                    ? 'warning'
                    : 'info'
                }
              >
                {dispute.status.replace(/_/g, ' ')}
              </Chip>
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
          {dispute.evidence.length > 0 && (
            <View>
              <Text className="mb-2.5 text-[15px] font-geist-semibold text-ink">
                Evidence photos ({dispute.evidence.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {dispute.evidence.map((src, index) => (
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
              {dispute.timeline.map((event, index) => (
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
                    {index < dispute.timeline.length - 1 && (
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
                    {event.done && (
                      <Text className="mt-0.5 font-geist text-[11px] text-ink-400">
                        {timeAgo(event.at)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Responses Thread */}
          <View>
            <Text className="mb-2.5 text-[15px] font-geist-semibold text-ink">
              Case statements & responses
            </Text>

            <View className="gap-2.5" style={{ gap: 10 }}>
              {dispute.responses.length === 0 ? (
                <View className="rounded-2xl bg-ink-100/70 p-3.5">
                  <Text className="font-geist text-[13px] text-ink-500">
                    No responses yet. Both parties can state their case here for
                    support to review.
                  </Text>
                </View>
              ) : (
                dispute.responses.map((res) => {
                  const author = userById(res.authorId);
                  return (
                    <View
                      key={res.id}
                      className="rounded-3xl border border-ink-200 bg-white p-4 shadow-sm"
                    >
                      <View className="flex-row items-center gap-2.5" style={{ gap: 10 }}>
                        <Avatar user={author} size="xs" />
                        <Text className="font-geist-semibold text-[13px] text-ink">
                          {res.authorId === ME ? 'You' : author.name}
                        </Text>
                        <Text className="ml-auto font-geist text-[11.5px] text-ink-400">
                          {timeAgo(res.at)}
                        </Text>
                      </View>
                      <Text className="mt-2 font-geist text-[13.5px] leading-relaxed text-ink-700">
                        {res.text}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>

            {/* Reply Input */}
            {dispute.status !== 'resolved' && (
              <View className="mt-3 flex-row items-center gap-2" style={{ gap: 8 }}>
                <TextInput
                  value={reply}
                  onChangeText={setReply}
                  placeholder="Add details or reply to support…"
                  placeholderTextColor="#8A959B"
                  style={[{ fontFamily: 'Geist-Regular' }]}
                  className="flex-1 h-12 rounded-2xl border border-ink-200 bg-white px-4 text-[14px] text-ink font-geist"
                />
                <Pressable
                  onPress={handleSendReply}
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-brand active:bg-brand-dark"
                >
                  <Send size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
