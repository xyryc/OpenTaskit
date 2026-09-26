import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MessagesSquare } from 'lucide-react-native';

import { useAppDispatch } from '@/store';
import { apiSlice, useGetConversationsQuery } from '@/store/api/apiSlice';
import { timeAgo, initialsOf } from '@/utils/format';
import { API_TASK_STATUS_MAP } from '@/utils/taskFilters';
import { statusLabel } from '@/components/ui/Chip';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';

export default function ChatListScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: conversations, isLoading, refetch } = useGetConversationsQuery(undefined, {
    pollingInterval: 15000,
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        dispatch(apiSlice.util.invalidateTags([{ type: 'Message', id: 'UNREAD_COUNT' }])),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Messages"
        subtitle={
          conversations
            ? `${conversations.length} ${conversations.length === 1 ? 'conversation' : 'conversations'}`
            : undefined
        }
      />

      {isLoading ? (
        <View className="flex-1 px-5 pt-4">
          <ListSkeleton count={5} />
        </View>
      ) : !conversations || conversations.length === 0 ? (
        <View className="flex-1 justify-center px-6">
          <EmptyState
            icon={<MessagesSquare size={32} color="#0094F7" />}
            title="No messages yet"
            message="Every conversation is tied to a task. Send an offer or accept one to start chatting."
            actionLabel="Discover tasks"
            onAction={() => router.push('/discover' as any)}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-3"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="gap-2.5">
            {conversations.map((conversation) => (
              <Pressable
                key={`${conversation.taskId}:${conversation.otherUser.id}`}
                onPress={() =>
                  router.push({
                    pathname: '/(screens)/chat/[taskId]',
                    params: {
                      taskId: conversation.taskId,
                      otherUserId: conversation.otherUser.id,
                    },
                  } as any)
                }
                className="flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-3.5"
                style={{
                  elevation: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                }}
              >
                <Avatar
                  user={{
                    name: conversation.otherUser.fullName,
                    initials: initialsOf(conversation.otherUser.fullName),
                    avatarUrl: conversation.otherUser.avatarUrl ?? undefined,
                    tone: 'bg-brand-tint',
                    verified: false,
                  }}
                  size="md"
                />

                <View className="flex-1 min-w-0">
                  <View className="flex-row items-baseline justify-between gap-2">
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-[14.5px] font-geist-bold font-bold text-ink"
                    >
                      {conversation.otherUser.fullName}
                    </Text>
                    <Text className="font-geist shrink-0 text-[11px] text-ink-400">
                      {timeAgo(conversation.lastMessage.createdAt)}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-[12px] font-geist-semibold font-semibold text-brand-dark"
                  >
                    {conversation.task.title}
                  </Text>

                  <View className="mt-1 flex-row items-center justify-between gap-2">
                    <Text
                      numberOfLines={1}
                      className={`flex-1 text-[13px] ${
                        conversation.unreadCount > 0
                          ? 'font-geist-semibold font-semibold text-ink'
                          : 'text-ink-500'
                      }`}
                    >
                      {conversation.lastMessage.attachmentUrl && !conversation.lastMessage.text
                        ? '📷 Photo'
                        : conversation.lastMessage.text}
                    </Text>

                    {conversation.unreadCount > 0 && (
                      <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5">
                        <Text className="text-[11px] font-geist-bold font-bold text-white">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="mt-1.5 self-start rounded-full bg-ink-100 px-2 py-0.5">
                    <Text className="text-[10.5px] font-geist-medium font-medium text-ink-500">
                      {statusLabel(API_TASK_STATUS_MAP[conversation.task.status] ?? 'posted')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
