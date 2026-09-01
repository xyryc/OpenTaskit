import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MessagesSquare } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { conversationList } from '@/utils/conversations';
import { timeAgo } from '@/utils/format';
import { statusLabel } from '@/components/ui/Chip';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/Feedback';

export default function ChatListScreen() {
  const router = useRouter();
  const { tasks, messages, offers, userById, taskById } = useApp();
  const conversations = conversationList(tasks, messages, offers);

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Messages"
        subtitle={`${conversations.length} ${
          conversations.length === 1 ? 'conversation' : 'conversations'
        }`}
      />

      {conversations.length === 0 ? (
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
        >
          <View className="gap-2.5">
            {conversations.map((conversation) => {
              const other = userById(conversation.otherId);
              const task = taskById(conversation.taskId);

              return (
                <Pressable
                  key={conversation.taskId}
                  onPress={() => router.push(`/chat/${conversation.taskId}` as any)}
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
                    user={other}
                    size="md"
                    showVerified
                    online={conversation.unread > 0}
                  />

                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text
                        numberOfLines={1}
                        className="flex-1 text-[14.5px] font-geist-bold font-bold text-ink"
                      >
                        {other.name}
                      </Text>
                      <Text className="font-geist shrink-0 text-[11px] text-ink-400">
                        {timeAgo(conversation.lastMessage.at)}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={1}
                      className="mt-0.5 text-[12px] font-geist-semibold font-semibold text-brand-dark"
                    >
                      {task?.title ?? 'Task'}
                    </Text>

                    <View className="mt-1 flex-row items-center justify-between gap-2">
                      <Text
                        numberOfLines={1}
                        className={`flex-1 text-[13px] ${
                          conversation.unread > 0
                            ? 'font-geist-semibold font-semibold text-ink'
                            : 'text-ink-500'
                        }`}
                      >
                        {conversation.lastMessage.attachment &&
                        !conversation.lastMessage.text
                          ? '📷 Photo'
                          : conversation.lastMessage.text}
                      </Text>

                      {conversation.unread > 0 && (
                        <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5">
                          <Text className="text-[11px] font-geist-bold font-bold text-white">
                            {conversation.unread}
                          </Text>
                        </View>
                      )}
                    </View>

                    {task && (
                      <View className="mt-1.5 self-start rounded-full bg-ink-100 px-2 py-0.5">
                        <Text className="text-[10.5px] font-geist-medium font-medium text-ink-500">
                          {statusLabel(task.status)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
