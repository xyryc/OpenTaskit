import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  Flag,
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

import { useAuthActions } from '@/hooks/useAuthActions';
import { useApp } from '@/contexts/AppContext';
import {
  clearStoredPushToken,
  getStoredNotificationsEnabled,
  getStoredPushToken,
  setStoredNotificationsEnabled,
  setStoredPushToken,
  useGetMyKycQuery,
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
} from '@/store/api/apiSlice';
import { ensureAndroidChannel, getDeviceFcmToken } from '@/utils/pushNotifications';
import { LANGUAGES } from '@/utils/i18n';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { Toggle } from '@/components/ui/Input';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const {
    language,
    locationPermission,
    setLocationPermission,
    available,
    toggleAvailable,
    toast,
  } = useApp();
  const { data: kycData } = useGetMyKycQuery();

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [registerPushToken] = useRegisterPushTokenMutation();
  const [unregisterPushToken] = useUnregisterPushTokenMutation();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    getStoredNotificationsEnabled()
  );
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const perms = await Notifications.getPermissionsAsync();
        const userPref = getStoredNotificationsEnabled();
        if (isMounted) {
          if (perms.status !== 'granted') {
            setNotificationsEnabled(false);
          } else {
            setNotificationsEnabled(userPref);
          }
        }
      } catch {
        // Ignored
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleNotifications = async (enable: boolean) => {
    if (isUpdatingNotifications) return;
    setIsUpdatingNotifications(true);

    try {
      if (enable) {
        const currentPerms = await Notifications.getPermissionsAsync();
        let status = currentPerms.status;

        if (status !== 'granted') {
          if (currentPerms.canAskAgain !== false) {
            const requested = await Notifications.requestPermissionsAsync();
            status = requested.status;
          } else {
            Alert.alert(
              'Notifications Disabled',
              'Notifications for OpenTaskit are disabled in your system settings. Please enable them to receive alerts.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ]
            );
            return;
          }
        }

        if (status !== 'granted') {
          setNotificationsEnabled(false);
          setStoredNotificationsEnabled(false);
          toast({
            title: 'Permission denied',
            description: 'Enable notifications in device settings anytime.',
            variant: 'info',
          });
          return;
        }

        setNotificationsEnabled(true);
        setStoredNotificationsEnabled(true);

        try {
          await ensureAndroidChannel();
          const token = await getDeviceFcmToken();
          if (token) {
            await registerPushToken({
              token,
              platform: Platform.OS === 'ios' ? 'ios' : 'android',
            }).unwrap();
            setStoredPushToken(token);
          }
        } catch {
          // Non-fatal if offline
        }

        toast({
          title: 'Notifications turned on',
          description: 'You will receive alerts for offers, messages, and task updates.',
          variant: 'success',
        });
      } else {
        setNotificationsEnabled(false);
        setStoredNotificationsEnabled(false);

        const token = getStoredPushToken();
        if (token) {
          try {
            await unregisterPushToken({ token }).unwrap();
          } catch {
            // Ignore unregister network error
          }
          clearStoredPushToken();
        }

        toast({
          title: 'Notifications turned off',
          description: 'Push notifications are now disabled on this device.',
          variant: 'info',
        });
      }
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleToggleLocation = async (enable: boolean) => {
    if (isUpdatingLocation) return;
    setIsUpdatingLocation(true);

    try {
      if (enable) {
        const currentPerms = await Location.getForegroundPermissionsAsync();
        let status = currentPerms.status;

        if (status !== 'granted') {
          if (currentPerms.canAskAgain !== false) {
            const requested = await Location.requestForegroundPermissionsAsync();
            status = requested.status;
          } else {
            Alert.alert(
              'Location Disabled',
              'Location access for OpenTaskit is disabled in your device settings. Please enable it to see nearby tasks and distances.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ]
            );
            return;
          }
        }

        if (status !== 'granted') {
          setLocationPermission('denied');
          toast({
            title: 'Permission denied',
            description: 'Enable location in device settings anytime.',
            variant: 'info',
          });
          return;
        }

        setLocationPermission('granted');
        toast({ title: 'Location enabled', variant: 'info' });
      } else {
        setLocationPermission('denied');
        toast({ title: 'Location turned off', variant: 'info' });
      }
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const languageLabel =
    LANGUAGES.find((item) => item.code === language)?.native ?? 'English';

  const kycStatusLabel =
    kycData?.status === 'VERIFIED'
      ? 'Verified'
      : kycData?.status === 'PENDING'
      ? 'In review'
      : kycData?.status === 'REJECTED'
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
              onPress={() =>
                router.push({
                  pathname: '/(screens)/language',
                  params: { from: 'settings' },
                } as any)
              }
            />
            <SettingsToggleItem
              icon={<Bell size={18} color="#2B3A41" />}
              label="Notifications"
              description="Alerts for messages, offers and job updates"
              checked={notificationsEnabled}
              onChange={handleToggleNotifications}
            />
            <View className="px-4 py-3.5 border-t border-ink-100">
              <Toggle
                checked={locationPermission === 'granted'}
                onChange={handleToggleLocation}
                label="Location services"
                description="Used for distance, nearby tasks and radius filters."
              />
            </View>
            <View className="px-4 py-3.5 border-t border-ink-100">
              <Toggle
                checked={available}
                onChange={toggleAvailable}
                label={available ? 'Available for work' : 'Not accepting work'}
                description={
                  available
                    ? 'You appear in nearby searches and can send offers.'
                    : 'You will not receive new opportunities until you switch back on.'
                }
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
              onPress={() => router.push('/(screens)/payment-methods')}
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
              label="Password & security"
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
          </SettingsGroup>

          {/* Group: Support */}
          <SettingsGroup title="Support">
            <SettingsItem
              icon={<LifeBuoy size={18} color="#2B3A41" />}
              label="Help centre"
              onPress={() => router.push('/(screens)/help-center')}
            />
            <SettingsItem
              icon={<Flag size={18} color="#2B3A41" />}
              label="Report a problem"
              onPress={() => router.push('/(screens)/report-problem')}
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
        onConfirm={async () => {
          await signOut();
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
        onConfirm={async () => {
          await signOut();
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

function SettingsToggleItem({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-ink-100/60"
      style={{ gap: 12 }}
    >
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100">
        {icon}
      </View>
      <View className="flex-1 min-w-0 pr-1">
        <Text numberOfLines={1} className="text-[14.5px] font-geist-medium text-ink">
          {label}
        </Text>
        {description && (
          <Text className="mt-0.5 text-[12px] leading-snug font-geist text-ink-500">
            {description}
          </Text>
        )}
      </View>
      <View
        className={`h-7 w-12 rounded-full p-0.5 justify-center ${
          checked ? 'bg-brand items-end' : 'bg-ink-200 items-start'
        }`}
      >
        <View className="h-6 w-6 rounded-full bg-white shadow-sm" />
      </View>
    </Pressable>
  );
}
