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
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  LifeBuoy,
  LogOut,
  MapPin,
  Scale,
  ShieldCheck,
  Trash2,
  User,
  Wallet2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { LANGUAGES } from '@/utils/i18n';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { Toggle } from '@/components/ui/Input';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    language,
    kyc,
    signOut,
    locationPermission,
    setLocationPermission,
    available,
    toggleAvailable,
    toast,
  } = useApp();

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const languageLabel =
    LANGUAGES.find((item) => item.code === language)?.native ?? 'English';

  const kycStatusLabel =
    kyc === 'verified'
      ? 'Verified'
      : kyc === 'pending'
      ? 'In review'
      : kyc === 'rejected'
      ? 'Rejected'
      : 'Not started';

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Settings" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5 px-5 pb-12 pt-4" style={{ gap: 20 }}>
          {/* Group: Account */}
          <SettingsGroup title="Account">
            <SettingsItem
              icon={<User size={18} color="#2B3A41" />}
              label="Personal information"
              onPress={() => router.push('/(screens)/account-settings')}
            />
            <SettingsItem
              icon={<ShieldCheck size={18} color="#2B3A41" />}
              label="Identity verification"
              value={kycStatusLabel}
              onPress={() => router.push('/(screens)/kyc')}
            />
          </SettingsGroup>

          {/* Group: Preferences */}
          <SettingsGroup title="Preferences">
            <SettingsItem
              icon={<Globe size={18} color="#2B3A41" />}
              label="Language"
              value={languageLabel}
              onPress={() => router.push('/(screens)/language')}
            />
            <SettingsItem
              icon={<Bell size={18} color="#2B3A41" />}
              label="Notifications"
              value="Push & Email"
              onPress={() => router.push('/(screens)/notification-settings')}
            />
            <View className="px-4 py-3.5 border-t border-ink-100">
              <Toggle
                checked={locationPermission === 'granted'}
                onChange={(val) => {
                  setLocationPermission(val ? 'granted' : 'denied');
                  toast({
                    title: val ? 'Location enabled' : 'Location turned off',
                    variant: 'info',
                  });
                }}
                label="Location services"
                description="Used for distance, nearby tasks and radius filters."
              />
            </View>
            <View className="px-4 py-3.5 border-t border-ink-100">
              <Toggle
                checked={available}
                onChange={toggleAvailable}
                label="Available for work"
                description="Pause to stop receiving new opportunities as a provider."
              />
            </View>
          </SettingsGroup>

          {/* Group: Payments */}
          <SettingsGroup title="Payments">
            <SettingsItem
              icon={<Wallet2 size={18} color="#2B3A41" />}
              label="Wallet"
              onPress={() => router.push('/(screens)/wallet')}
            />
            <SettingsItem
              icon={<CreditCard size={18} color="#2B3A41" />}
              label="Payment methods"
              value="Cash · Card · Wallet"
              onPress={() =>
                toast({
                  title: 'Payment methods',
                  description: 'Cash, cards, and OpenTaskit Wallet are supported.',
                  variant: 'info',
                })
              }
            />
            <SettingsItem
              icon={<FileText size={18} color="#2B3A41" />}
              label="Transaction history"
              onPress={() => router.push('/(screens)/wallet')}
            />
          </SettingsGroup>

          {/* Group: Security */}
          <SettingsGroup title="Security">
            <SettingsItem
              icon={<ShieldCheck size={18} color="#2B3A41" />}
              label="Password & sessions"
              value="Protected"
              onPress={() => router.push('/(screens)/security-settings')}
            />
          </SettingsGroup>

          {/* Group: Legal */}
          <SettingsGroup title="Legal">
            <SettingsItem
              icon={<Scale size={18} color="#2B3A41" />}
              label="Terms of service"
              onPress={() =>
                router.push({
                  pathname: '/(screens)/legal/[doc]',
                  params: { doc: 'terms' },
                } as any)
              }
            />
            <SettingsItem
              icon={<Scale size={18} color="#2B3A41" />}
              label="Privacy policy"
              onPress={() =>
                router.push({
                  pathname: '/(screens)/legal/[doc]',
                  params: { doc: 'privacy' },
                } as any)
              }
            />
            <SettingsItem
              icon={<Scale size={18} color="#2B3A41" />}
              label="Community guidelines"
              onPress={() =>
                router.push({
                  pathname: '/(screens)/legal/[doc]',
                  params: { doc: 'community' },
                } as any)
              }
            />
          </SettingsGroup>

          {/* Group: Support */}
          <SettingsGroup title="Support">
            <SettingsItem
              icon={<LifeBuoy size={18} color="#2B3A41" />}
              label="Help centre"
              onPress={() => router.push('/(screens)/help-center')}
            />
            <SettingsItem
              icon={<MapPin size={18} color="#2B3A41" />}
              label="Report a problem"
              onPress={() => router.push('/(screens)/help-center')}
            />
          </SettingsGroup>

          {/* Group: Account Actions */}
          <SettingsGroup title="Account actions">
            <SettingsItem
              icon={<LogOut size={18} color="#2B3A41" />}
              label="Log out"
              onPress={() => setLogoutOpen(true)}
            />
            <SettingsItem
              icon={<Trash2 size={18} color="#C7382F" />}
              label="Delete account"
              danger
              onPress={() => setDeleteOpen(true)}
            />
          </SettingsGroup>

          {/* App Build Version */}
          <Text className="pt-2 text-center font-geist text-[11.5px] text-ink-400">
            OpenTaskit · version 1.0.0 (Expo React Native)
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Dialog: Logout */}
      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          signOut();
          router.replace('/(screens)/welcome');
        }}
        title="Log out of OpenTaskit?"
        message="You can log back in any time with your email or phone number."
        confirmLabel="Log out"
        cancelLabel="Stay logged in"
        tone="danger"
      />

      {/* Confirmation Dialog: Delete Account */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          signOut();
          toast({
            title: 'Account deleted',
            description: 'Your account data has been removed.',
            variant: 'info',
          });
          router.replace('/(screens)/welcome');
        }}
        title="Delete your account?"
        message="This permanently removes your tasks, offers, reviews and wallet history. This cannot be undone."
        confirmLabel="Delete permanently"
        cancelLabel="Keep account"
        tone="danger"
      />
    </Screen>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text className="mb-2 px-1 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
        {title}
      </Text>
      <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
        {children}
      </View>
    </View>
  );
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-ink-100/60"
      style={{ gap: 12 }}
    >
      <View
        className={`h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          danger ? 'bg-danger/10' : 'bg-ink-100'
        }`}
      >
        {icon}
      </View>
      <Text
        numberOfLines={1}
        className={`flex-1 min-w-0 text-[14.5px] font-geist-medium ${
          danger ? 'text-danger' : 'text-ink'
        }`}
      >
        {label}
      </Text>
      {value && (
        <Text className="shrink-0 font-geist text-[13px] text-ink-500">
          {value}
        </Text>
      )}
      <ChevronRight size={16} color="#B9C2C7" />
    </Pressable>
  );
}
