import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeftRight, BadgeCheck, Compass, Star } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

import { useAppDispatch } from '@/store';
import { continueAsGuest } from '@/store/slices/authSlice';
import { useApp } from '@/contexts/AppContext';
import { BrandLockup } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { continueAsGuest: appContinueAsGuest } = useApp();

  const browseAsGuest = () => {
    dispatch(continueAsGuest());
    appContinueAsGuest();
    router.replace('/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Main scrollable body */}
      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View className="pt-2">
          <BrandLockup size={36} />
        </View>

        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="mt-9"
        >
          <Text className="text-[32px] font-bold leading-[38px] tracking-tight text-ink">
            Need something done?{'\n'}Find the right person.
          </Text>
          <Text className="mt-3.5 text-[15px] leading-6 text-ink-500">
            Post a task, compare real offers from verified people nearby, and pay only when the work is done.
          </Text>
        </Animated.View>

        {/* Dual-Sided Feature Card */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(450)}
          className="mt-8 rounded-4xl border border-ink-200 bg-canvas p-5"
        >
          {/* Tag */}
          <View className="flex-row items-center gap-2">
            <ArrowLeftRight size={16} color="#0072C4" />
            <Text className="text-[12px] font-bold uppercase tracking-wider text-brand-dark">
              One account, both sides
            </Text>
          </View>

          {/* Description */}
          <Text className="mt-2.5 text-[14px] leading-relaxed text-ink-700">
            Hire help when you need it, and earn by taking on tasks when you have time. Switch between{' '}
            <Text className="font-semibold text-ink">“I need a service”</Text> and{' '}
            <Text className="font-semibold text-ink">“I provide services”</Text> any time — no second account.
          </Text>

          {/* Stats Grid */}
          <View className="mt-4 flex-row gap-2.5">
            <View className="flex-1 rounded-2xl bg-white p-3.5 shadow-sm">
              <Text className="text-[19px] font-bold tracking-tight text-ink">12k+</Text>
              <Text className="mt-0.5 text-[11.5px] text-ink-500">tasks completed</Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white p-3.5 shadow-sm">
              <View className="flex-row items-center gap-1">
                <Text className="text-[19px] font-bold tracking-tight text-ink">4.9</Text>
                <Star size={16} color="#E0A400" fill="#E0A400" />
              </View>
              <Text className="mt-0.5 text-[11.5px] text-ink-500">average rating</Text>
            </View>
          </View>

          {/* Trust Badge */}
          <View className="mt-3.5 flex-row items-center gap-2">
            <BadgeCheck size={16} color="#0094F7" />
            <Text className="text-[12.5px] text-ink-500 flex-1">
              Identity-verified members and protected payments
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions CTA */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        className="px-6 pb-6 pt-3 gap-2.5 border-t border-ink-100 bg-white"
      >
        <Button
          full
          size="lg"
          variant="brand"
          onPress={() => router.push('/language' as any)}
        >
          Get started
        </Button>

        <Button
          full
          size="lg"
          variant="outline"
          onPress={() => router.push('/login' as any)}
        >
          Log in
        </Button>

        <Button
          full
          size="lg"
          variant="ghost"
          icon={<Compass size={18} color="#2B3A41" />}
          onPress={browseAsGuest}
        >
          Continue as guest
        </Button>

        <Text className="mt-1 text-center text-[11.5px] text-ink-400">
          Browse every posted job first. An account is only needed to post a job or send an offer.
        </Text>

        <Text className="text-center text-[11.5px] leading-relaxed text-ink-400">
          By continuing you agree to our{' '}
          <Text
            onPress={() => router.push('/settings/legal/terms' as any)}
            className="font-medium text-ink-700 underline"
          >
            Terms
          </Text>{' '}
          and{' '}
          <Text
            onPress={() => router.push('/settings/legal/privacy' as any)}
            className="font-medium text-ink-700 underline"
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}
