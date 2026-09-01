import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { CheckCircle2, MessageSquare } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useAppDispatch } from '@/store';
import { setAuthed } from '@/store/slices/authSlice';
import { ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string; phone?: string }>();
  const dispatch = useAppDispatch();
  const { signIn, toast } = useApp();

  const flow = params.flow ?? 'signup';
  const phone = params.phone || '+94 77 123 4567';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(42);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'error' | 'done'>('idle');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const code = digits.join('');

  const verifyCode = (enteredCode: string) => {
    setStatus('verifying');
    setTimeout(() => {
      if (enteredCode === '000000') {
        setStatus('error');
        return;
      }
      setStatus('done');
      setTimeout(() => {
        if (flow === 'reset') {
          router.push('/reset' as any);
        } else {
          signIn();
          dispatch(setAuthed(true));
          toast({ title: 'Account verified', description: 'Welcome to OpenTaskit.', variant: 'success' });
          router.replace('/home');
        }
      }, 800);
    }, 900);
  };

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setStatus('idle');

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const joined = next.join('');
    if (joined.length === 6 && !next.includes('')) {
      verifyCode(joined);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Verify your number" border={false} />

      {/* Body */}
      <ScrollView
        className="flex-1 px-6 pb-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
          <MessageSquare size={24} color="#0072C4" />
        </View>

        <Text className="mt-4 text-[24px] font-geist-bold font-bold leading-tight tracking-tight text-ink">
          Enter the 6-digit code
        </Text>
        <Text className="font-geist mt-2 text-[14.5px] leading-relaxed text-ink-500">
          We sent it to <Text className="font-geist-semibold font-semibold text-ink">{phone}</Text>. It expires in 10 minutes.
        </Text>

        {/* 6 Digit Inputs */}
        <View className="mt-7 flex-row gap-2">
          {digits.map((digit, index) => {
            const hasError = status === 'error';
            return (
              <TextInput
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                value={digit}
                onChangeText={(val) => handleDigitChange(index, val)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                className={`h-14 flex-1 rounded-2xl border text-center text-[20px] font-geist-bold font-bold text-ink bg-white ${
                  hasError
                    ? 'border-danger bg-danger/5'
                    : digit
                    ? 'border-brand'
                    : 'border-ink-200'
                }`}
              />
            );
          })}
        </View>

        {/* Status Messages */}
        {status === 'error' && (
          <Text className="mt-3 text-[13px] font-geist-medium font-medium text-danger">
            That code is not valid. Request a new one and try again.
          </Text>
        )}

        {status === 'done' && (
          <Animated.View entering={FadeInUp.duration(300)} className="mt-3 flex-row items-center gap-1.5">
            <CheckCircle2 size={16} color="#0F8A5F" />
            <Text className="text-[13px] font-geist-medium font-medium text-success">
              Verified — taking you in…
            </Text>
          </Animated.View>
        )}

        {/* Resend OTP */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text className="font-geist text-[13.5px] text-ink-500">
            {seconds > 0
              ? `Resend code in 0:${seconds.toString().padStart(2, '0')}`
              : 'Did not get the code?'}
          </Text>

          <Pressable
            disabled={seconds > 0}
            onPress={() => {
              setSeconds(42);
              setDigits(['', '', '', '', '', '']);
              setStatus('idle');
              toast({ title: 'New code sent', variant: 'info' });
            }}
          >
            <Text
              className={`text-[13.5px] font-geist-semibold font-semibold ${
                seconds > 0 ? 'text-ink-300' : 'text-brand'
              }`}
            >
              Resend OTP
            </Text>
          </Pressable>
        </View>

        {/* Change phone button */}
        <Pressable
          onPress={() => router.back()}
          className="mt-4 w-full rounded-2xl border border-ink-200 py-3.5 items-center justify-center active:bg-ink-100"
        >
          <Text className="text-[13.5px] font-geist-semibold font-semibold text-ink-700">
            Change phone number
          </Text>
        </Pressable>

        {/* Prototype tip */}
        <View className="mt-6 rounded-2xl bg-ink-100 p-3.5">
          <Text className="font-geist text-[12px] leading-snug text-ink-500">
            Prototype tip: any 6 digits verify successfully. Enter 000000 to see the invalid-code state.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-6 pb-6 pt-3 border-t border-ink-100 bg-white">
        <Button
          full
          size="lg"
          variant="brand"
          loading={status === 'verifying'}
          disabled={code.length < 6}
          onPress={() => verifyCode(code)}
        >
          Verify
        </Button>
      </View>
    </SafeAreaView>
  );
}
