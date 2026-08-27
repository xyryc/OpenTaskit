import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useApp } from '@/contexts/AppContext';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Toggle } from '@/components/ui/Input';

const NOTIFICATION_GROUPS = [
  {
    title: 'Activity',
    items: [
      { key: 'offers', label: 'New offers', description: 'When someone sends an offer on your task.' },
      { key: 'messages', label: 'Messages', description: 'New messages in task conversations.' },
      { key: 'tasks', label: 'Task updates', description: 'Status changes, starts and completions.' },
      { key: 'payments', label: 'Payments & wallet', description: 'Commissions, top-ups and settlements.' },
      { key: 'disputes', label: 'Disputes', description: 'Responses and decisions on open cases.' },
      { key: 'reviews', label: 'Reviews', description: 'When someone rates you.' },
    ],
  },
  {
    title: 'Channels',
    items: [
      { key: 'push', label: 'Push notifications', description: 'On this device.' },
      { key: 'email', label: 'Email', description: 'Summaries and receipts.' },
      { key: 'sms', label: 'SMS', description: 'Only for urgent job updates.' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { key: 'promos', label: 'Tips & offers', description: 'Occasional product news. No more than once a month.' },
    ],
  },
];

export default function NotificationSettingsScreen() {
  const { toast } = useApp();
  const [values, setValues] = useState<Record<string, boolean>>({
    offers: true,
    messages: true,
    tasks: true,
    payments: true,
    disputes: true,
    reviews: true,
    push: true,
    email: true,
    sms: false,
    promos: false,
  });

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Notifications" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-10 pt-4" style={{ gap: 20 }}>
          {NOTIFICATION_GROUPS.map((group) => (
            <View key={group.title}>
              <Text className="mb-2 px-1 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
                {group.title}
              </Text>
              <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
                {group.items.map((item) => (
                  <View key={item.key} className="px-4 py-3.5">
                    <Toggle
                      checked={values[item.key] ?? false}
                      onChange={(val) => {
                        setValues((prev) => ({ ...prev, [item.key]: val }));
                        toast({
                          title: `${item.label} ${val ? 'enabled' : 'disabled'}`,
                          variant: 'info',
                        });
                      }}
                      label={item.label}
                      description={item.description}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Text className="px-1 font-geist text-[12px] leading-relaxed text-ink-400">
            Critical security and dispute notifications are always delivered, regardless of these settings.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
