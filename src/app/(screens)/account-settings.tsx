import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  BadgeCheck,
  ChevronRight,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/Overlay';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { me, kyc, updateMe, toast, signOut } = useApp();

  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState('kavindu@opentaskit.lk');
  const [phone, setPhone] = useState('+94 77 123 4567');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSave = () => {
    if (name.trim().length < 3) {
      toast({ title: 'Enter a valid name', variant: 'error' });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      updateMe({ name: name.trim() });
      setSaving(false);
      toast({ title: 'Details saved', variant: 'success' });
      router.back();
    }, 600);
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Personal information" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-10 pt-4" style={{ gap: 20 }}>
          {/* Input Fields */}
          <View className="gap-4" style={{ gap: 16 }}>
            <TextField
              label="Full name"
              value={name}
              onChangeText={setName}
            />

            <View>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View className="absolute right-3 top-[34px]">
                <Chip tone="success">Verified</Chip>
              </View>
            </View>

            <View>
              <TextField
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Pressable
                onPress={() => toast({ title: 'Phone verified', variant: 'success' })}
                hitSlop={8}
                className="absolute right-3 top-[38px]"
              >
                <Text className="font-geist-semibold text-[13px] text-brand">
                  Verify
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Security & KYC Links Card */}
          <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
            <Pressable
              onPress={() => router.push('/(screens)/kyc')}
              className="flex-row items-center gap-3 p-4 active:bg-ink-100/60"
              style={{ gap: 12 }}
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-tint">
                {kyc === 'verified' ? (
                  <BadgeCheck size={18} color="#0094F7" />
                ) : (
                  <ShieldCheck size={18} color="#0094F7" />
                )}
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[14.5px] font-geist-semibold text-ink">
                  Identity verification
                </Text>
                <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                  {kyc === 'verified'
                    ? 'Verified — badge visible on your profile'
                    : 'Verify to unlock higher-value jobs'}
                </Text>
              </View>
              <ChevronRight size={18} color="#B9C2C7" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(screens)/security-settings')}
              className="flex-row items-center gap-3 p-4 active:bg-ink-100/60"
              style={{ gap: 12 }}
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink-100">
                <ShieldCheck size={18} color="#2B3A41" />
              </View>
              <Text className="flex-1 text-[14.5px] font-geist-semibold text-ink">
                Change password
              </Text>
              <ChevronRight size={18} color="#B9C2C7" />
            </Pressable>
          </View>

          {/* Actions */}
          <View className="gap-2.5 pt-2" style={{ gap: 10 }}>
            <Button
              full
              size="lg"
              variant="brand"
              loading={saving}
              onPress={handleSave}
            >
              Save changes
            </Button>

            <Button
              full
              size="lg"
              variant="ghost"
              icon={<Trash2 size={16} color="#C7382F" />}
              onPress={() => setDeleteOpen(true)}
            >
              Delete account
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          signOut();
          toast({ title: 'Account deleted', variant: 'info' });
          router.replace('/(screens)/welcome');
        }}
        title="Delete your account?"
        message="This permanently removes your tasks, offers, reviews and wallet history. This cannot be undone."
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        tone="danger"
      />
    </Screen>
  );
}
