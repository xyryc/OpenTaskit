import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { BrandMark } from '@/components/brand/BrandMark';

export default function SplashScreen() {
  const router = useRouter();

  // Logo spring entrance
  const logoScale = useSharedValue(0.9);

  // Pulse ripple ring
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  // Progress bar filling (0.10 -> 1.0)
  const progress = useSharedValue(0.1);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 180 });

    ringScale.value = withRepeat(
      withTiming(1.65, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    progress.value = withTiming(1, {
      duration: 1900,
      easing: Easing.inOut(Easing.ease),
    });

    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="relative flex-1 items-center justify-center overflow-hidden bg-brand-deep">
      <StatusBar style="light" />

      {/* Ambient background glow orbs */}
      <View className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-brand/20" />
      <View className="absolute -right-12 bottom-24 h-72 w-72 rounded-full bg-brand/15" />

      {/* Brand mark with pulsing ripple */}
      <Animated.View style={logoAnimatedStyle} className="relative items-center justify-center">
        <Animated.View
          style={ringAnimatedStyle}
          className="absolute h-[76px] w-[76px] rounded-[22px] border border-white/35"
        />
        <BrandMark size={76} tone="white" />
      </Animated.View>

      {/* Brand Title */}
      <Animated.Text
        entering={FadeInDown.delay(250).duration(500)}
        className="mt-6 text-[30px] font-geist-bold font-bold tracking-tight text-white"
      >
        OpenTaskit
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        entering={FadeIn.delay(450).duration(600)}
        className="font-geist mt-1.5 text-[13.5px] tracking-wide text-white/60"
      >
        Local services, done right.
      </Animated.Text>

      {/* Bottom Progress Bar */}
      <View className="absolute bottom-16 h-1 w-40 overflow-hidden rounded-full bg-white/20">
        <Animated.View
          style={progressAnimatedStyle}
          className="h-full rounded-full bg-white"
        />
      </View>
    </View>
  );
}
