import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Headphones,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Screen } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';

interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Help with my wallet balance',
  'How to raise a task dispute?',
  'KYC ID verification status',
  'Cancel an open task',
];

export default function SupportChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { me } = useApp();
  const scrollViewRef = useRef<ScrollView | null>(null);

  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'msg-1',
      sender: 'support',
      text: `Hello ${me?.name?.split(' ')[0] || 'there'}! Welcome to OpenTaskit Help Support. How can our customer care team assist you today?`,
      timestamp: 'Just now',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isReplying]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || draft).trim();
    if (!text) return;

    const userMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setDraft('');

    // Simulate friendly auto-reply
    setIsReplying(true);
    setTimeout(() => {
      setIsReplying(false);
      const supportReply: SupportMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'support',
        text: 'Thank you for reaching out! A support specialist has received your message and will reply in under 3 minutes.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, supportReply]);
    }, 1200);
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-ink-200 bg-white px-4 py-3">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-ink-100"
          >
            <ChevronLeft size={22} color="#1C2024" />
          </Pressable>

          <View className="relative">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-tint border border-brand/20">
              <Headphones size={20} color="#0094F7" />
            </View>
            <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </View>

          <View>
            <Text className="font-geist-bold text-[15px] text-ink">
              OpenTaskit Support
            </Text>
            <View className="flex-row items-center gap-1">
              <ShieldCheck size={12} color="#0094F7" />
              <Text className="font-geist text-[11px] text-brand">
                Official Support · Online
              </Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Support Banner */}
          <View className="mb-4 rounded-2xl border border-brand/20 bg-brand-tint/60 p-3.5">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#0094F7" />
              <Text className="font-geist-semibold text-[13px] text-brand">
                Live Support Assistance
              </Text>
            </View>
            <Text className="mt-1 font-geist text-[12px] leading-relaxed text-ink-600">
              Customer support agents are active 24/7 to help resolve payments, task disputes, and account verifications.
            </Text>
          </View>

          {/* Messages Feed */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-brand-tint border border-brand/20">
                    <Headphones size={13} color="#0094F7" />
                  </View>
                )}

                <View
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? 'bg-brand rounded-br-xs'
                      : 'border border-ink-200 bg-white rounded-bl-xs'
                  }`}
                >
                  <Text
                    className={`font-geist text-[13.5px] leading-relaxed ${
                      isUser ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    className={`mt-1 font-geist text-[10px] text-right ${
                      isUser ? 'text-white/70' : 'text-ink-400'
                    }`}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {isReplying && (
            <View className="mb-3 flex-row justify-start items-center">
              <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-brand-tint border border-brand/20">
                <Headphones size={13} color="#0094F7" />
              </View>
              <View className="rounded-2xl border border-ink-200 bg-white px-3.5 py-2">
                <Text className="font-geist italic text-[12px] text-ink-400">
                  Agent typing…
                </Text>
              </View>
            </View>
          )}

          {/* Quick Suggestion Chips */}
          {messages.length <= 2 && (
            <View className="mt-4">
              <Text className="mb-2 font-geist-semibold text-[11px] uppercase tracking-wider text-ink-400">
                Suggested Topics
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => handleSend(prompt)}
                    className="rounded-full border border-ink-200 bg-white px-3 py-1.5 active:bg-ink-100"
                  >
                    <Text className="font-geist text-[12px] text-ink-700">
                      {prompt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="border-t border-ink-200 bg-white px-4 pt-2.5"
        >
          <View className="flex-row items-center gap-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Describe your issue..."
              placeholderTextColor="#8A959B"
              style={[{ fontFamily: 'Geist-Regular' }]}
              className="flex-1 rounded-full border border-ink-200 bg-ink-100/50 px-4 py-2.5 font-geist text-[14px] text-ink max-h-24"
              multiline
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={!draft.trim()}
              className={`h-10 w-10 items-center justify-center rounded-full ${
                draft.trim() ? 'bg-brand' : 'bg-ink-200'
              }`}
            >
              <Send size={16} color={draft.trim() ? '#FFFFFF' : '#8A959B'} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
