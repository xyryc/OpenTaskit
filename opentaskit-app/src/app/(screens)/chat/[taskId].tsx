import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Camera,
  ChevronLeft,
  ImagePlus,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { counterpartyId } from '@/utils/conversations';
import { money } from '@/utils/format';
import { IMG } from '@/data/images';
import { Screen } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/Overlay';
import { EmptyState } from '@/components/ui/Feedback';
import { ChatBubble, TypingBubble } from '@/components/chat/ChatBubble';
import { CategoryBadge } from '@/components/CategoryIcon';

export default function ChatThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { taskById, offers, userById, messagesForTask, sendMessage } = useApp();

  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const task = taskId ? taskById(taskId) : undefined;
  const thread = taskId ? messagesForTask(taskId) : [];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [thread.length, typing]);

  if (!task) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-[16px] font-geist-bold font-bold text-ink">Task not found</Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 rounded-xl bg-brand px-4 py-2"
          >
            <Text className="font-geist-semibold font-semibold text-white">Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const other = userById(counterpartyId(task, offers));
  const canSend = Boolean(draft.trim() || attachment);

  const submit = () => {
    if (!canSend) return;
    sendMessage(task.id, draft.trim(), attachment ?? undefined);
    setDraft('');
    setAttachment(null);
    setTyping(true);
    setTimeout(() => setTyping(false), 2600);
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <View className="z-20 shrink-0 bg-white border-b border-ink-100 px-3 py-3">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-ink-100"
          >
            <ChevronLeft size={24} color="#0C1417" />
          </Pressable>

          <Pressable
            onPress={() => router.push(`/provider/${other.id}` as any)}
            className="flex-1 flex-row items-center gap-2.5 min-w-0"
          >
            <Avatar user={other} size="sm" showVerified online />
            <View className="flex-1 min-w-0">
              <Text numberOfLines={1} className="text-[15px] font-geist-bold font-bold text-ink">
                {other.name}
              </Text>
              <Text className="text-[11.5px] font-geist-medium font-medium text-success">
                Online now
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-3"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Task Reference Card */}
          <Pressable
            onPress={() => router.push(`/task/${task.id}` as any)}
            className="mb-4 flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-3.5"
            style={{
              elevation: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
            }}
          >
            <CategoryBadge categoryId={task.categoryId} size="md" />
            <View className="flex-1 min-w-0">
              <Text numberOfLines={1} className="text-[13.5px] font-geist-bold font-bold text-ink">
                {task.title}
              </Text>
              <Text className="font-geist mt-0.5 text-[12px] text-ink-500">
                {money(task.budget)} · {task.location}
              </Text>
            </View>
            <Text className="text-[12.5px] font-geist-semibold font-semibold text-brand">Open</Text>
          </Pressable>

          {/* Thread messages */}
          {thread.length === 0 ? (
            <View className="py-8">
              <EmptyState
                icon={<MessageCircle size={32} color="#0094F7" />}
                title="Start the conversation"
                message="Ask about access, timing or anything that helps you agree on the details."
                compact
              />
            </View>
          ) : (
            <>
              <Text className="my-2 text-center text-[11px] font-geist-bold font-bold uppercase tracking-wider text-ink-400">
                Today
              </Text>

              {thread.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  mine={message.senderId === ME}
                />
              ))}
            </>
          )}

          {typing && <TypingBubble name={other.name} />}
        </ScrollView>

        {/* Bottom Input Toolbar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          {/* Attachment Preview if selected */}
          {attachment && (
            <View className="relative mb-2.5 ml-1 self-start">
              <Image
                source={{ uri: attachment }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setAttachment(null)}
                hitSlop={6}
                className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-ink"
              >
                <X size={13} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          <View style={styles.toolbarRow}>
            {/* Attachment Button */}
            <Pressable
              onPress={() => setAttachOpen(true)}
              hitSlop={8}
              style={styles.attachButton}
            >
              <Paperclip size={20} color="#5B6A72" />
            </Pressable>

            {/* Message Input Box */}
            <View style={styles.inputContainer}>
              <TextInput
                multiline
                value={draft}
                onChangeText={setDraft}
                placeholder="Write a message…"
                placeholderTextColor="#8A959B"
                style={styles.input}
              />
            </View>

            {/* Send Button */}
            <Pressable
              onPress={submit}
              disabled={!canSend}
              hitSlop={8}
              style={[
                styles.sendButton,
                {
                  backgroundColor: canSend ? '#0094F7' : '#E2E7E9',
                  elevation: canSend ? 2 : 0,
                  shadowColor: '#0094F7',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: canSend ? 0.25 : 0,
                  shadowRadius: 3,
                },
              ]}
            >
              <Send size={18} color={canSend ? '#FFFFFF' : '#8A959B'} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Selection Sheet */}
      <BottomSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Add to message"
      >
        <View className="flex-row gap-3 pb-4">
          <Pressable
            onPress={() => {
              setAttachment(IMG.plumbing);
              setAttachOpen(false);
            }}
            className="flex-1 items-center gap-2 rounded-3xl border border-ink-200 bg-white py-6"
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
              <Camera size={22} color="#0072C4" />
            </View>
            <Text className="text-[13px] font-geist-semibold font-semibold text-ink">Take a photo</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setAttachment(IMG.cleaning);
              setAttachOpen(false);
            }}
            className="flex-1 items-center gap-2 rounded-3xl border border-ink-200 bg-white py-6"
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
              <ImagePlus size={22} color="#0072C4" />
            </View>
            <Text className="text-[13px] font-geist-semibold font-semibold text-ink">Upload image</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewImage: {
    height: 72,
    width: 72,
    borderRadius: 14,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#E2E7E9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    minHeight: 44,
    maxHeight: 112,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E7E9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14.5,
    fontFamily: 'Geist-Regular',
    color: '#0C1417',
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
