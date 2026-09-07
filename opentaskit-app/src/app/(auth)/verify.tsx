import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { CheckCircle2, Mail } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useForgotPasswordMutation, useVerifyOtpMutation } from '@/store/api/apiSlice';
import { getApiErrorMessage } from '@/utils/apiError';
import { ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string; email?: string; phone?: string }>();
  const { toast } = useApp();

  const flow = params.flow ?? 'reset';
  const email = params.email || params.phone || 'your email';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(60);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'error' | 'done'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const [verifyOtp] = useVerifyOtpMutation();
  const [forgotPassword, { isLoading: resending }] = useForgotPasswordMutation();

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const code = digits.join('');

  const verifyCode = async (enteredCode: string) => {
    if (enteredCode.length !== 6) return;
    setStatus('verifying');
    setErrorMessage('');

    try {
      await verifyOtp({ email, otp: enteredCode }).unwrap();
      setStatus('done');
      setTimeout(() => {
        if (flow === 'reset') {
          router.push({
            pathname: '/reset',
            params: { email, otp: enteredCode },
          } as any);
        } else {
          router.replace('/login');
        }
      }, 800);
    } catch (err) {
      setStatus('error');
      setErrorMessage(getApiErrorMessage(err, 'Invalid or expired verification code.'));
    }
  };

  const handleResendOtp = async () => {
    if (seconds > 0 || resending) return;
    try {
      await forgotPassword({ email }).unwrap();
      setSeconds(60);
      setDigits(['', '', '', '', '', '']);
      setStatus('idle');
      setErrorMessage('');
      toast({ title: 'New code sent', description: 'Check your email inbox', variant: 'info' });
    } catch (err) {
      toast({ title: 'Failed to resend code', description: getApiErrorMessage(err), variant: 'error' });
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setStatus('idle');
    setErrorMessage('');

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
      <ScreenHeader title="Verify code" border={false} />

      {/* Body */}
      <ScrollView
        className="flex-1 px-6 pb-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
          <Mail size={24} color="#0072C4" />
        </View>

        <Text className="mt-4 text-[24px] font-geist-bold font-bold leading-tight tracking-tight text-ink">
          Enter the 6-digit code
        </Text>
        <Text className="font-geist mt-2 text-[14.5px] leading-relaxed text-ink-500">
          We sent it to <Text className="font-geist-semibold font-semibold text-ink">{email}</Text>. It expires in 10 minutes.
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
            {errorMessage || 'That code is not valid. Request a new one and try again.'}
          </Text>
        )}

        {status === 'done' && (
          <Animated.View entering={FadeInUp.duration(300)} className="mt-3 flex-row items-center gap-1.5">
            <CheckCircle2 size={16} color="#0F8A5F" />
            <Text className="text-[13px] font-geist-medium font-medium text-success">
              Verified — continuing…
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
            disabled={seconds > 0 || resending}
            onPress={handleResendOtp}
          >
            <Text
              className={`text-[13.5px] font-geist-semibold font-semibold ${
                seconds > 0 || resending ? 'text-ink-300' : 'text-brand'
              }`}
            >
              {resending ? 'Sending…' : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>

        {/* Change email button */}
        <Pressable
          onPress={() => router.back()}
          className="mt-4 w-full rounded-2xl border border-ink-200 py-3.5 items-center justify-center active:bg-ink-100"
        >
          <Text className="text-[13.5px] font-geist-semibold font-semibold text-ink-700">
            Change email
          </Text>
        </Pressable>
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

