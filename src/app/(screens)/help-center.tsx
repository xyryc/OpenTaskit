import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronDown,
  MessageCircle,
  Phone,
  Search,
  X,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Screen, ScreenHeader } from '@/components/layout/Screen';

const FAQS = [
  {
    q: 'How do offers work?',
    a: 'People send you a price, a completion estimate and a short plan. You can chat with them, compare offers side by side, then accept the one that fits. Nothing is committed until you accept.',
  },
  {
    q: 'When do I pay?',
    a: 'For cash jobs you pay the provider directly once you have checked the work and confirmed completion in the app. Your price never includes a platform fee.',
  },
  {
    q: 'How is commission calculated?',
    a: 'OpenTaskit charges the provider 12% of the agreed job value. It is deducted from their wallet balance when the job is settled, so cash amounts stay simple.',
  },
  {
    q: 'What if the work is not done properly?',
    a: 'Open a dispute from the job screen within 7 days. Payment goes on hold, both sides can add evidence, and our team decides on full payment, partial payment or a refund.',
  },
  {
    q: 'Can I both hire and work?',
    a: 'Yes — one account does both. Switch between “I need a service” and “I provide services” on Home or your profile at any time.',
  },
];

export default function HelpCenterScreen() {
  const { toast } = useApp();
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = FAQS.filter((faq) =>
    `${faq.q} ${faq.a}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Help centre" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-12 pt-4" style={{ gap: 20 }}>
          {/* Search Input */}
          <View className="flex-row items-center rounded-2xl border border-ink-200 bg-white px-3.5 h-12">
            <Search size={18} color="#8A959B" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search help articles"
              placeholderTextColor="#8A959B"
              style={[{ fontFamily: 'Geist-Regular' }]}
              className="ml-2.5 flex-1 font-geist text-[14px] text-ink"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <X size={16} color="#8A959B" />
              </Pressable>
            )}
          </View>

          {/* Quick Contact Cards */}
          <View className="flex-row gap-2.5" style={{ gap: 10 }}>
            <Pressable
              onPress={() =>
                toast({
                  title: 'Support chat opening…',
                  description: 'Average reply time is under 4 minutes.',
                  variant: 'info',
                })
              }
              className="flex-1 rounded-3xl border border-ink-200 bg-white p-4 active:bg-ink-100/60"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-tint">
                <MessageCircle size={18} color="#0094F7" />
              </View>
              <Text className="mt-3 font-geist-semibold text-[14px] text-ink">
                Chat with support
              </Text>
              <Text className="mt-0.5 font-geist text-[12px] text-ink-500">
                Replies in ~4 min
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Linking.openURL('tel:+94112345678').catch(() => {
                  toast({ title: 'Calling +94 11 234 5678', variant: 'info' });
                });
              }}
              className="flex-1 rounded-3xl border border-ink-200 bg-white p-4 active:bg-ink-100/60"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-ink-100">
                <Phone size={18} color="#2B3A41" />
              </View>
              <Text className="mt-3 font-geist-semibold text-[14px] text-ink">
                Call us
              </Text>
              <Text className="mt-0.5 font-geist text-[12px] text-ink-500">
                8am – 8pm daily
              </Text>
            </Pressable>
          </View>

          {/* Common Questions Accordion */}
          <View>
            <Text className="mb-2 px-1 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
              Common questions
            </Text>
            <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
              {filtered.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <View key={faq.q}>
                    <Pressable
                      onPress={() => setOpenIndex(isOpen ? null : index)}
                      className="flex-row items-center gap-3 p-4 active:bg-ink-100/50"
                      style={{ gap: 12 }}
                    >
                      <Text className="flex-1 font-geist-medium text-[14px] text-ink">
                        {faq.q}
                      </Text>
                      <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                        <ChevronDown size={18} color="#8A959B" />
                      </View>
                    </Pressable>
                    {isOpen && (
                      <View className="px-4 pb-4">
                        <Text className="font-geist text-[13.5px] leading-relaxed text-ink-700">
                          {faq.a}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {filtered.length === 0 && (
                <View className="p-6 items-center">
                  <Text className="font-geist text-[13.5px] text-ink-500">
                    No articles match “{query}”.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
