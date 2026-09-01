import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Fingerprint,
  Laptop,
  Lock,
  LogOut,
  Smartphone,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField, Toggle } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/Overlay';

interface SessionItem {
  id: string;
  device: string;
  place: string;
  current: boolean;
  type: 'mobile' | 'laptop';
}

const INITIAL_SESSIONS: SessionItem[] = [
  {
    id: 's1',
    device: 'iPhone 15 · this device',
    place: 'Colombo, LK · now',
    current: true,
    type: 'mobile',
  },
  {
    id: 's2',
    device: 'Chrome · MacBook Pro',
    place: 'Colombo, LK · 2 days ago',
    current: false,
    type: 'laptop',
  },
  {
    id: 's3',
    device: 'Android · Pixel 7',
    place: 'Kandy, LK · 3 weeks ago',
    current: false,
    type: 'mobile',
  },
];

export default function SecuritySettingsScreen() {
  const { toast } = useApp();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [biometric, setBiometric] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUpdatePassword = () => {
    const problems: Record<string, string> = {};
    if (!current) problems.current = 'Enter your current password';
    if (next.length < 8) problems.next = 'Use at least 8 characters';
    if (confirm !== next) problems.confirm = 'Passwords do not match';

    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setCurrent('');
      setNext('');
      setConfirm('');
      toast({ title: 'Password updated', variant: 'success' });
    }, 700);
  };

  const handleConfirmRevoke = () => {
    if (!revokeId) return;
    setSessions((prev) => prev.filter((s) => s.id !== revokeId));
    setRevokeId(null);
    toast({ title: 'Session revoked', variant: 'success' });
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Security" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-5 pb-10 pt-4" style={{ gap: 24 }}>
          {/* Change Password */}
          <View>
            <Text className="mb-2 px-1 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
              Change password
            </Text>
            <View className="gap-3.5" style={{ gap: 14 }}>
              <TextField
                label="Current password"
                value={current}
                onChangeText={(val) => {
                  setCurrent(val);
                  if (errors.current) setErrors((prev) => ({ ...prev, current: '' }));
                }}
                secureTextEntry
                error={errors.current}
              />

              <TextField
                label="New password"
                value={next}
                onChangeText={(val) => {
                  setNext(val);
                  if (errors.next) setErrors((prev) => ({ ...prev, next: '' }));
                }}
                secureTextEntry
                error={errors.next}
              />

              <TextField
                label="Confirm new password"
                value={confirm}
                onChangeText={(val) => {
                  setConfirm(val);
                  if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: '' }));
                }}
                secureTextEntry
                error={errors.confirm}
              />

              <Button
                full
                size="lg"
                variant="brand"
                loading={saving}
                onPress={handleUpdatePassword}
              >
                Update password
              </Button>
            </View>
          </View>

          {/* Sign-in Security */}
          <View>
            <Text className="mb-2 px-1 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
              Sign-in
            </Text>
            <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
              <View className="flex-row items-center gap-3 px-4 py-3.5" style={{ gap: 12 }}>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink-100">
                  <Fingerprint size={18} color="#2B3A41" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-semibold text-ink">
                    Biometric login
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                    Face ID or fingerprint
                  </Text>
                </View>
                <Chip tone="neutral">Coming soon</Chip>
              </View>

              <View className="px-4 py-3.5">
                <Toggle
                  checked={twoFactor}
                  onChange={setTwoFactor}
                  label="Two-step verification"
                  description="Require an SMS code when logging in from a new device."
                />
              </View>

              <View className="px-4 py-3.5">
                <Toggle
                  checked={biometric}
                  onChange={setBiometric}
                  label="Require code for payments"
                  description="Confirm wallet actions with a one-time code."
                />
              </View>
            </View>
          </View>

          {/* Active Sessions */}
          <View>
            <Text className="mb-2 px-1 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
              Active sessions
            </Text>
            <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
              {sessions.map((session) => (
                <View
                  key={session.id}
                  className="flex-row items-center gap-3 px-4 py-3.5"
                  style={{ gap: 12 }}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink-100">
                    {session.type === 'laptop' ? (
                      <Laptop size={18} color="#2B3A41" />
                    ) : (
                      <Smartphone size={18} color="#2B3A41" />
                    )}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text
                      numberOfLines={1}
                      className="text-[14px] font-geist-medium text-ink"
                    >
                      {session.device}
                    </Text>
                    <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                      {session.place}
                    </Text>
                  </View>
                  {session.current ? (
                    <Chip tone="success">Active</Chip>
                  ) : (
                    <Pressable
                      onPress={() => setRevokeId(session.id)}
                      hitSlop={8}
                    >
                      <Text className="font-geist-medium text-[12.5px] text-danger">
                        Revoke
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            <Button
              full
              variant="ghost"
              className="mt-2 text-danger"
              icon={<LogOut size={16} color="#C7382F" />}
              onPress={() => {
                setSessions((prev) => prev.filter((s) => s.current));
                toast({ title: 'Signed out of other devices', variant: 'success' });
              }}
            >
              Log out of all other devices
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Revoke Session Confirmation */}
      <ConfirmDialog
        open={!!revokeId}
        onClose={() => setRevokeId(null)}
        onConfirm={handleConfirmRevoke}
        title="Revoke this session?"
        message="That device will need to log in again with your password."
        confirmLabel="Revoke access"
        tone="danger"
      />
    </Screen>
  );
}
