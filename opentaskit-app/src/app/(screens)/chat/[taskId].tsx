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
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  MapPin,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from 'lucide-react-native';

import { useAppSelector } from '@/store';
import {
  useGetMessageThreadQuery,
  useSendMessageMutation,
  useUploadImagesMutation,
} from '@/store/api/apiSlice';
import { getApiErrorMessage } from '@/utils/apiError';
import { money, timeAgo } from '@/utils/format';
import { API_TASK_STATUS_MAP } from '@/utils/taskFilters';
import { Screen } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/Overlay';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';
import { StatusChip } from '@/components/ui/Chip';
import { CategoryBadge } from '@/components/CategoryIcon';
import { ChatBubble } from '@/components/chat/ChatBubble';
import type { Message as MockMessage } from '@/types';
import type { MessageRecord } from '@/types';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

function toMockMessage(record: MessageRecord): MockMessage {
  return {
    id: record.id,
    taskId: record.taskId,
    senderId: record.senderId,
    text: record.text ?? '',
    at: record.createdAt,
    attachment: record.attachmentUrl ?? undefined,
    status: record.isRead ? 'seen' : 'delivered',
  };
}

export default function ChatThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId, otherUserId } = useLocalSearchParams<{
    taskId: string;
    otherUserId?: string;
  }>();
  const authUser = useAppSelector((s) => s.auth.user);

  const {
    data: thread,
    isLoading,
    error,
  } = useGetMessageThreadQuery(
    { taskId: taskId!, withUserId: otherUserId },
    { skip: !taskId, pollingInterval: 4000 }
  );
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [uploadImages, { isLoading: isUploading }] = useUploadImagesMutation();

  const [draft, setDraft] = useState('');
  const [localAttachment, setLocalAttachment] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [headerBlockHeight, setHeaderBlockHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const messages = thread?.messages.map(toMockMessage) ?? [];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  if (!taskId) {
    return null;
  }

  if (isLoading) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <StatusBar style="dark" />
        <View className="px-5 pt-4">
          <ListSkeleton count={5} />
        </View>
      </Screen>
    );
  }

  if (error || !thread) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center p-6">
          <EmptyState
            icon={<MessageCircle size={32} color="#8A959B" />}
            title="Can't open this conversation"
            message={getApiErrorMessage(error, 'Something went wrong.')}
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  const { task, otherUser } = thread;
  const canSend = Boolean(draft.trim() || localAttachment) && !isSending && !isUploading;
  const isOnline = Date.now() - new Date(otherUser.lastActiveAt).getTime() < ONLINE_THRESHOLD_MS;

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo access is required to attach an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) {
      setLocalAttachment(res.assets[0].uri);
    }
    setAttachOpen(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) {
      setLocalAttachment(res.assets[0].uri);
    }
    setAttachOpen(false);
  };

  const submit = async () => {
    if (!canSend) return;
    try {
      let attachmentUrl: string | undefined;
      if (localAttachment) {
        const formData = new FormData();
        const filename = localAttachment.split('/').pop() || `chat-${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        formData.append('files', { uri: localAttachment, name: filename, type } as any);
        const uploadRes = await uploadImages(formData).unwrap();
        attachmentUrl = uploadRes.urls[0];
      }

      await sendMessage({
        taskId,
        text: draft.trim() || undefined,
        attachmentUrl,
        toUserId: otherUserId,
      }).unwrap();

      setDraft('');
      setLocalAttachment(null);
    } catch (err) {
      Alert.alert('Message not sent', getApiErrorMessage(err, 'Please try again.'));
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      <View onLayout={(e) => setHeaderBlockHeight(e.nativeEvent.layout.height)}>
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
            onPress={() => router.push(`/(screens)/provider/${otherUser.id}` as any)}
            className="flex-1 flex-row items-center gap-2.5 min-w-0"
          >
            <Avatar
              user={{
                name: otherUser.fullName,
                initials: otherUser.fullName.slice(0, 2).toUpperCase(),
                avatarUrl: otherUser.avatarUrl ?? undefined,
                tone: 'bg-brand-tint',
                verified: false,
              }}
              online={isOnline}
              size="sm"
            />
            <View className="flex-1 min-w-0">
              <Text numberOfLines={1} className="text-[15px] font-geist-bold font-bold text-ink">
                {otherUser.fullName}
              </Text>
              <Text numberOfLines={1} className="font-geist text-[11px] text-ink-400">
                {isOnline ? 'Active now' : `Active ${timeAgo(otherUser.lastActiveAt)}`}
              </Text>
            </View>
          </Pressable>

          <StatusChip status={API_TASK_STATUS_MAP[task.status] ?? 'posted'} />
        </View>
      </View>

      {/* Fixed Task Reference Card */}
      <View className="z-10 shrink-0 border-b border-ink-100 bg-canvas px-4 pt-3 pb-3">
        <Pressable
          onPress={() => router.push(`/(screens)/task/${task.id}` as any)}
          className="flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-3.5"
          style={{
            gap: 12,
            elevation: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}
        >
          <CategoryBadge
            categoryId={task.category?.id}
            iconName={task.category?.icon}
            size="md"
          />

          <View className="flex-1 min-w-0">
            <Text numberOfLines={1} className="text-[13.5px] font-geist-bold font-bold text-ink">
              {task.title}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5" style={{ gap: 6 }}>
              <Text className="text-[12px] font-geist-semibold text-brand-dark">
                {money(task.budget)}
              </Text>
              <Text className="text-ink-300">·</Text>
              <MapPin size={11} color="#8A959B" />
              <Text numberOfLines={1} className="flex-1 font-geist text-[12px] text-ink-500">
                {task.address || (task.locationType === 'REMOTE' ? 'Remote' : 'In Person')}
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color="#8A959B" />
        </Pressable>
      </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + headerBlockHeight : 0}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-3"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Thread messages */}
          {messages.length === 0 ? (
            <View className="py-8">
              <EmptyState
                icon={<MessageCircle size={32} color="#0094F7" />}
                title="Start the conversation"
                message="Ask about access, timing or anything that helps you agree on the details."
                compact
              />
            </View>
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                mine={message.senderId === authUser?.id}
              />
            ))
          )}
        </ScrollView>

        {/* Bottom Input Toolbar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          {/* Attachment Preview if selected */}
          {localAttachment && (
            <View className="relative mb-2.5 ml-1 self-start">
              <Image
                source={{ uri: localAttachment }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setLocalAttachment(null)}
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
            onPress={takePhoto}
            className="flex-1 items-center gap-2 rounded-3xl border border-ink-200 bg-white py-6"
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
              <Camera size={22} color="#0072C4" />
            </View>
            <Text className="text-[13px] font-geist-semibold font-semibold text-ink">Take a photo</Text>
          </Pressable>

          <Pressable
            onPress={pickFromLibrary}
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
