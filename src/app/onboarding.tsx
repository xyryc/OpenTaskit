import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

import { Button } from '@/components/ui/Button';

function PostArt() {
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180" fill="none">
      <Rect x="26" y="20" width="168" height="120" rx="18" fill="#FFFFFF" stroke="#E2E7E9" strokeWidth="1" />
      <Rect x="42" y="38" width="82" height="10" rx="5" fill="#0C1417" opacity={0.85} />
      <Rect x="42" y="58" width="136" height="8" rx="4" fill="#E2E7E9" />
      <Rect x="42" y="74" width="104" height="8" rx="4" fill="#E2E7E9" />
      <Rect x="42" y="98" width="56" height="24" rx="12" fill="#E6F4FE" />
      <Rect x="106" y="98" width="44" height="24" rx="12" fill="#F0F3F4" />
      <Circle cx="172" cy="132" r="24" fill="#0094F7" />
      <Path d="M172 122v20M162 132h20" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

function CompareArt() {
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180" fill="none">
      <Rect x="18" y="26" width="184" height="44" rx="14" fill="#FFFFFF" stroke="#E2E7E9" strokeWidth="1" />
      <Circle cx="42" cy="48" r="12" fill="#1D5FD8" opacity={0.85} />
      <Rect x="62" y="38" width="70" height="8" rx="4" fill="#0C1417" opacity={0.8} />
      <Rect x="62" y="52" width="46" height="7" rx="3.5" fill="#E2E7E9" />
      <Rect x="150" y="40" width="38" height="16" rx="8" fill="#E6F4FE" />
      <Rect x="18" y="80" width="184" height="44" rx="14" fill="#FFFFFF" stroke="#0094F7" strokeWidth="1" />
      <Circle cx="42" cy="102" r="12" fill="#B4690E" opacity={0.85} />
      <Rect x="62" y="92" width="82" height="8" rx="4" fill="#0C1417" opacity={0.8} />
      <Rect x="62" y="106" width="52" height="7" rx="3.5" fill="#E2E7E9" />
      <Rect x="150" y="94" width="38" height="16" rx="8" fill="#0094F7" />
      <Rect x="18" y="134" width="184" height="30" rx="14" fill="#FFFFFF" stroke="#E2E7E9" strokeWidth="1" />
      <Circle cx="42" cy="149" r="9" fill="#A03A82" opacity={0.7} />
      <Rect x="62" y="145" width="60" height="8" rx="4" fill="#E2E7E9" />
    </Svg>
  );
}

function ChooseArt() {
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180" fill="none">
      <Rect x="34" y="24" width="152" height="132" rx="20" fill="#FFFFFF" stroke="#E2E7E9" strokeWidth="1" />
      <Circle cx="110" cy="66" r="26" fill="#E6F4FE" />
      <Circle cx="110" cy="60" r="9" fill="#0094F7" />
      <Path d="M94 80c4-8 10-11 16-11s12 3 16 11" stroke="#0094F7" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="138" cy="86" r="11" fill="#0094F7" />
      <Path d="M133 86l3.5 3.5 6-6.5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="66" y="106" width="88" height="9" rx="4.5" fill="#0C1417" opacity={0.8} />
      <Rect x="80" y="124" width="60" height="8" rx="4" fill="#E2E7E9" />
      <Rect x="70" y="140" width="80" height="1.5" rx="1" fill="#F0F3F4" />
    </Svg>
  );
}

function SafeArt() {
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180" fill="none">
      <Path d="M110 20l52 20v46c0 32-22 58-52 70-30-12-52-38-52-70V40l52-20z" fill="#FFFFFF" stroke="#E2E7E9" strokeWidth="1" />
      <Path d="M110 32l40 15v38c0 25-17 45-40 55-23-10-40-30-40-55V47l40-15z" fill="#E6F4FE" />
      <Path d="M92 96l14 14 28-32" stroke="#0094F7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="70" y="146" width="80" height="10" rx="5" fill="#E2E7E9" />
    </Svg>
  );
}

const slides = [
  {
    key: 'post',
    heading: 'Post what you need',
    body: 'Describe the task, add a photo, set your budget and when it should happen. It takes about a minute.',
    art: <PostArt />,
  },
  {
    key: 'compare',
    heading: 'Compare real offers',
    body: 'People nearby send you a price and a plan. See ratings, distance and completed jobs side by side.',
    art: <CompareArt />,
  },
  {
    key: 'choose',
    heading: 'Choose the right person',
    body: 'Chat before you commit, check verified identity, then accept the offer that fits you best.',
    art: <ChooseArt />,
  },
  {
    key: 'safe',
    heading: 'Get it done safely',
    body: 'Track the job, confirm completion, and settle payment with a clear breakdown. Disputes are covered.',
    art: <SafeArt />,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const slide = slides[index];
  const last = index === slides.length - 1;

  const handleNext = () => {
    if (last) {
      router.push('/signup' as any);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    setIndex((i) => Math.max(0, i - 1));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Header: Step Indicators and Skip */}
      <View className="flex-row items-center justify-between px-6 pt-3 pb-2">
        <View className="flex-row items-center gap-1.5">
          {slides.map((s, i) => (
            <View
              key={s.key}
              className={`h-1.5 rounded-full ${
                i === index ? 'w-7 bg-brand' : 'w-1.5 bg-ink-200'
              }`}
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/signup' as any)}
          hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
        >
          <Text className="text-[13.5px] font-medium text-ink-500">Skip</Text>
        </Pressable>
      </View>

      {/* Middle Animated Slide Content */}
      <View className="flex-1 justify-center px-6">
        <Animated.View
          key={slide.key}
          entering={FadeInRight.duration(260)}
          exiting={FadeOutLeft.duration(180)}
        >
          {/* Card Art Canvas */}
          <View className="h-[260px] w-full items-center justify-center rounded-4xl bg-canvas">
            {slide.art}
          </View>

          {/* Heading */}
          <Text className="mt-8 text-[26px] font-bold leading-tight tracking-tight text-ink">
            {slide.heading}
          </Text>

          {/* Description */}
          <Text className="mt-2.5 text-[15px] leading-relaxed text-ink-500">
            {slide.body}
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Actions */}
      <View className="shrink-0 gap-2.5 px-6 pb-6 pt-3">
        <Button full size="lg" variant="brand" onPress={handleNext}>
          {last ? 'Create my account' : 'Continue'}
        </Button>

        {last ? (
          <Button
            full
            size="lg"
            variant="ghost"
            onPress={() => router.push('/login' as any)}
          >
            I already have an account
          </Button>
        ) : (
          <Button
            full
            size="lg"
            variant="ghost"
            onPress={handleBack}
            disabled={index === 0}
          >
            Back
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
