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
  ArrowRight,
  BadgeCheck,
  Bell,
  Bookmark,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Pencil,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { money } from '@/utils/format';
import { Screen, SectionHeader } from '@/components/layout/Screen';
import { Avatar, VerifiedPill } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/Rating';
import { TrustStats } from '@/components/task/TrustStats';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { Toggle } from '@/components/ui/Input';
import { CardBackgroundPattern } from '@/components/ui/CardBackgroundPattern';
import { ProviderAvailabilityCard } from '@/components/provider/ProviderAvailabilityCard';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    me,
    guest,
    kyc,
    wallet,
    savedTaskIds,
    unreadNotifications,
    unreadMessages,
    available,
    toggleAvailable,
    signOut,
    toast,
  } = useApp();

  const [logoutOpen, setLogoutOpen] = useState(false);

  // Guest view
  if (guest) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <StatusBar style="dark" />
        <ScrollView className="flex-1 px-6 pt-12 pb-8" showsVerticalScrollIndicator={false}>
          <View className="mx-auto h-20 w-20 items-center justify-center rounded-[28px] bg-brand-tint">
            <UserRound size={36} color="#0094F7" />
          </View>

          <Text className="mt-6 text-center text-[24px] font-geist-semibold leading-tight tracking-[-0.03em] text-ink">
            You are browsing as a guest
          </Text>
          <Text className="mx-auto mt-2.5 max-w-[300px] text-center font-geist text-[14px] leading-relaxed text-ink-500">
            Create an account to build a profile, post jobs, send offers and keep your chats and payments in one place.
          </Text>

          <View className="mt-7 gap-2.5" style={{ gap: 10 }}>
            {[
              'Post jobs and compare offers from people nearby',
              'Send offers on jobs and get hired',
              'A verified profile with ratings and reviews',
              'Wallet, payments and dispute protection',
            ].map((point) => (
              <View
                key={point}
                className="flex-row items-start gap-2.5 rounded-2xl border border-ink-200 bg-white p-3.5"
                style={{ gap: 10 }}
              >
                <BadgeCheck size={16} color="#0094F7" />
                <Text className="flex-1 font-geist text-[13px] leading-snug text-ink-700">
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="shrink-0 border-t border-ink-100 bg-white px-6 pb-8 pt-4 gap-2.5" style={{ gap: 10 }}>
          <Button
            full
            size="lg"
            variant="brand"
            icon={<Sparkles size={16} color="#FFFFFF" />}
            onPress={() => router.push('/(auth)/signup')}
          >
            Create an account
          </Button>
          <Button
            full
            size="lg"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
          >
            Log in
          </Button>
        </View>
      </Screen>
    );
  }

  // Dynamic KYC Card config
  const kycCard = {
    verified: {
      tone: 'success' as const,
      title: 'Identity verified',
      body: 'Your verified badge is visible to everyone.',
    },
    pending: {
      tone: 'warning' as const,
      title: 'Verification in review',
      body: 'Usually done within 24 hours.',
    },
    none: {
      tone: 'info' as const,
      title: 'Verify your identity',
      body: 'Verified members get 2× more offers accepted.',
    },
    rejected: {
      tone: 'danger' as const,
      title: 'Verification rejected',
      body: 'Your document photo was unclear. Resubmit to continue.',
    },
  }[kyc];

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Identity Card */}
        <View className="border-b border-ink-100 bg-white px-5 pb-5 pt-6">
          <View className="flex-row items-start gap-4" style={{ gap: 14 }}>
            <Avatar user={me} size="xl" showVerified />
            <View className="flex-1 min-w-0">
              <Text
                numberOfLines={1}
                className="text-[20px] font-geist-semibold tracking-[-0.03em] text-ink"
              >
                {me.name}
              </Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 font-geist text-[13px] text-ink-500"
              >
                {me.headline}
              </Text>
              <View className="mt-1.5 flex-row flex-wrap items-center gap-2" style={{ gap: 8 }}>
                <StarRating value={me.rating} count={me.reviewCount} />
                <VerifiedPill verified={me.verified} />
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/(screens)/edit-profile')}
              hitSlop={10}
              className="h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200 active:bg-ink-100"
            >
              <Pencil size={16} color="#0C1417" />
            </Pressable>
          </View>

          <Text className="mt-3 font-geist text-[12.5px] text-ink-500">
            {me.location} · member since {me.memberSince}
          </Text>

          {/* Public Profile View Shortcut */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(screens)/provider/[userId]',
                params: { userId: ME },
              } as any)
            }
            className="mt-4 flex-row items-center rounded-2xl border border-ink-200 bg-canvas p-3.5 active:bg-ink-100"
            style={{ gap: 12 }}
          >
            <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint">
              <UserRound size={18} color="#0072C4" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[14px] font-geist-semibold text-ink">
                Public profile
              </Text>
              <Text className="text-[12px] font-geist leading-snug text-ink-500">
                See your profile the way others see it
              </Text>
            </View>
            <ArrowRight size={18} color="#8A959B" />
          </Pressable>
        </View>

        {/* Profile Content Sections */}
        <View className="gap-5 px-5 py-5 pb-12" style={{ gap: 20 }}>
          {/* KYC Status Banner */}
          <Pressable
            onPress={() => {
              if (kyc === 'verified') {
                toast({ title: 'Identity Verified', description: 'Your National ID has been verified.', variant: 'success' });
              } else {
                toast({ title: 'KYC Verification', description: 'Document verification portal.', variant: 'info' });
              }
            }}
            className={`flex-row items-center rounded-3xl border p-4 active:bg-ink-100/60 ${
              kycCard.tone === 'success'
                ? 'border-success/30 bg-success/8'
                : kycCard.tone === 'danger'
                ? 'border-danger/30 bg-danger/8'
                : kycCard.tone === 'warning'
                ? 'border-warning/30 bg-warning/8'
                : 'border-brand/30 bg-brand-tint/50'
            }`}
            style={{ gap: 12 }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
              {kycCard.tone === 'success' ? (
                <BadgeCheck size={20} color="#0F8A5F" />
              ) : (
                <ShieldCheck size={20} color="#0094F7" />
              )}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[14.5px] font-geist-semibold text-ink">
                {kycCard.title}
              </Text>
              <Text className="text-[12.5px] font-geist leading-snug text-ink-500">
                {kycCard.body}
              </Text>
            </View>
            <ChevronRight size={18} color="#B9C2C7" />
          </Pressable>

          {/* 4-Tile Quick Nav Grid */}
          <View className="flex-row gap-2" style={{ gap: 8 }}>
            <Tile
              icon={<Wallet2 size={18} color="#0072C4" />}
              label="Wallet"
              note={money(wallet.available)}
              onPress={() => router.push('/(screens)/wallet')}
            />
            <Tile
              icon={<Bookmark size={18} color="#0072C4" />}
              label="Saved"
              note={`${savedTaskIds.length}`}
              onPress={() => router.push('/(screens)/saved')}
            />
            <Tile
              icon={<Bell size={18} color="#0072C4" />}
              label="Alerts"
              note={`${unreadNotifications}`}
              onPress={() => toast({ title: 'Notifications', description: `You have ${unreadNotifications} unread notification(s).`, variant: 'info' })}
            />
            <Tile
              icon={<MessageCircle size={18} color="#0072C4" />}
              label="Chats"
              note={`${unreadMessages}`}
              onPress={() => router.push('/(screens)/chats')}
            />
          </View>

          {/* Availability & Provider Dashboard Card */}
          <ProviderAvailabilityCard />

          {/* Trust & Performance */}
          <View>
            <SectionHeader title="Trust & performance" />
            <TrustStats
              stats={[
                { label: 'Completed', value: `${me.completedJobs} jobs` },
                { label: 'Success rate', value: `${me.successRate}%` },
                { label: 'Response rate', value: `${me.responseRate}%` },
                { label: 'Experience', value: `${me.experienceYears} yrs` },
              ]}
            />
          </View>

          {/* Virtual Wallet Card */}
          <View>
            <SectionHeader
              title="Virtual wallet"
              action="Open wallet"
              onAction={() => router.push('/(screens)/wallet')}
            />
            <View className="relative overflow-hidden rounded-3xl bg-brand p-5 shadow-md border border-[#0074CB]/30">
              <CardBackgroundPattern />
              <Text className="text-[12px] font-geist-semibold uppercase tracking-[0.09em] text-white">
                Available balance
              </Text>
              <Text className="mt-1 text-[32px] font-geist-bold tracking-[-0.04em] text-white">
                {money(wallet.available)}
              </Text>

              <View className="mt-4 flex-row gap-2" style={{ gap: 8 }}>
                <View className="flex-1 rounded-2xl bg-white/20 border border-white/30 px-3.5 py-2.5">
                  <Text className="text-[11px] font-geist-medium text-white">
                    Pending
                  </Text>
                  <Text className="mt-0.5 text-[16px] font-geist-bold tracking-[-0.02em] text-white">
                    {money(wallet.pending)}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-white/20 border border-white/30 px-3.5 py-2.5">
                  <Text className="text-[11px] font-geist-medium text-white">
                    Total earned
                  </Text>
                  <Text className="mt-0.5 text-[16px] font-geist-bold tracking-[-0.02em] text-white">
                    {money(wallet.earnings)}
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row gap-2.5" style={{ gap: 10 }}>
                <Pressable
                  onPress={() => router.push('/(screens)/wallet/topup')}
                  className="flex-1 items-center justify-center rounded-2xl bg-white px-4 py-3 shadow-sm active:bg-white/90"
                >
                  <Text className="font-geist-semibold text-[14px] text-brand-dark">
                    Top up
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(screens)/wallet')}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-white/50 bg-white/20 px-4 py-3 active:bg-white/30"
                  style={{ gap: 6 }}
                >
                  <Text className="font-geist-semibold text-[14px] text-white">
                    Transactions
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Account Settings & Log Out Actions */}
          <View className="gap-2.5 pt-2" style={{ gap: 10 }}>
            <Button
              full
              size="lg"
              variant="outline"
              icon={<Settings size={18} color="#0C1417" />}
              onPress={() => router.push('/(screens)/settings')}
            >
              Settings & preferences
            </Button>

            <Button
              full
              size="lg"
              variant="ghost"
              icon={<LogOut size={18} color="#C7382F" />}
              onPress={() => setLogoutOpen(true)}
            >
              Log out
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Log Out Confirmation Dialog */}
      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          signOut();
          router.replace('/(screens)/welcome');
        }}
        title="Log out of OpenTaskit?"
        message="You will need your password to log back in. Your tasks and offers stay exactly as they are."
        confirmLabel="Log out"
        cancelLabel="Stay logged in"
        tone="danger"
      />
    </Screen>
  );
}

function Tile({
  icon,
  label,
  note,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  note: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-1.5 rounded-3xl border border-ink-200 bg-white py-3.5 active:bg-ink-100"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-tint">
        {icon}
      </View>
      <Text className="font-geist-medium text-[11.5px] text-ink">{label}</Text>
      <Text
        numberOfLines={1}
        className="px-1 text-center font-geist text-[10.5px] text-ink-400"
      >
        {note}
      </Text>
    </Pressable>
  );
}
