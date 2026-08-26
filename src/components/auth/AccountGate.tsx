import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BadgeCheck, ShieldCheck, Sparkles, UserRound } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';

const copy = {
  offer: {
    title: 'Create an account to send an offer',
    description:
      'Browsing is open to everyone. To send a price to a job poster we need an account so they can see who they are hiring.',
    points: [
      'Your offers, chats and payments stay in one place',
      'Job posters can check your rating and verified badge',
      'Takes about a minute — you keep browsing after',
    ],
  },
  post: {
    title: 'Create an account to post a job',
    description:
      'Posting a job needs an account so taskers can reach you, and so payment and dispute protection apply to the work.',
    points: [
      'Receive and compare offers from people nearby',
      'Chat, agree a price and confirm completion in the app',
      'Covered by OpenTaskit dispute protection',
    ],
  },
};

export function AccountGate() {
  const router = useRouter();
  const { gateIntent, closeGate } = useApp();
  const content = copy[gateIntent ?? 'post'];

  const handleNavigate = (to: string) => {
    closeGate();
    router.push(to as any);
  };

  return (
    <BottomSheet
      open={gateIntent !== null}
      onClose={closeGate}
      title={content.title}
      description={content.description}
    >
      <View className="gap-4 pb-2">
        <View className="gap-2.5 rounded-2xl bg-brand-tint/60 p-4">
          {content.points.map((point) => (
            <View key={point} className="flex-row items-start gap-2.5">
              <BadgeCheck size={16} color="#0094F7" className="mt-0.5" />
              <Text className="flex-1 text-[13px] leading-snug text-ink-700">
                {point}
              </Text>
            </View>
          ))}
        </View>

        <View className="gap-2.5">
          <Button
            full
            icon={<Sparkles size={16} color="#FFFFFF" />}
            onPress={() => handleNavigate('/signup')}
          >
            Create an account
          </Button>

          <Button
            full
            variant="outline"
            onPress={() => handleNavigate('/login')}
          >
            I already have an account
          </Button>

          <Button
            full
            variant="ghost"
            onPress={closeGate}
          >
            Keep browsing as a guest
          </Button>
        </View>

        <View className="flex-row items-start gap-2 pt-1">
          <ShieldCheck size={14} color="#8A959B" className="mt-0.5" />
          <Text className="flex-1 text-[11.5px] leading-relaxed text-ink-400">
            Nothing you have looked at is lost — you come straight back here after signing in.
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}

export function GuestBanner() {
  const router = useRouter();
  const { guest } = useApp();
  if (!guest) return null;

  return (
    <View className="mx-5 mt-4 flex-row items-center gap-3 rounded-3xl border border-brand/30 bg-brand-tint/50 p-4">
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white">
        <BadgeCheck size={20} color="#0094F7" />
      </View>

      <View className="flex-1 min-w-0">
        <Text className="text-[13.5px] font-semibold text-ink">
          You are browsing as a guest
        </Text>
        <Text className="mt-0.5 text-[12px] leading-snug text-ink-500">
          Look around freely. You will need an account to post a job or send an offer.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/signup')}
        className="rounded-full bg-ink px-3.5 py-2"
      >
        <Text className="text-[12.5px] font-semibold text-white">Sign up</Text>
      </Pressable>
    </View>
  );
}

export function GuestProfile() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-canvas p-6 items-center justify-center">
      <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-brand-tint">
        <UserRound size={36} color="#0094F7" />
      </View>

      <Text className="mt-6 text-[24px] font-bold text-ink text-center">
        You are browsing as a guest
      </Text>
      <Text className="mt-2 text-[14px] text-ink-500 text-center">
        Create an account to build a profile, post jobs, send offers and keep your chats and payments in one place.
      </Text>

      <View className="mt-8 w-full gap-2.5">
        <Button full variant="brand" onPress={() => router.push('/signup')}>
          Create an account
        </Button>
        <Button full variant="outline" onPress={() => router.push('/login')}>
          Log in
        </Button>
      </View>
    </View>
  );
}
