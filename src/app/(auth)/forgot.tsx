import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyRound, Mail } from 'lucide-react-native';

import { ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Input';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!value.trim()) {
      setError('Enter the email or phone number on your account');
      return;
    }
    setError(undefined);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.push({
        pathname: '/verify',
        params: { flow: 'reset', phone: value },
      } as any);
    }, 800);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Reset password" border={false} />

      {/* Body */}
      <ScrollView
        className="flex-1 px-6 pb-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
          <KeyRound size={24} color="#0072C4" />
        </View>

        <Text className="mt-4 text-[24px] font-geist-bold font-bold leading-tight tracking-tight text-ink">
          Let’s get you back in
        </Text>
        <Text className="font-geist mt-2 text-[14.5px] leading-relaxed text-ink-500">
          Enter the email or phone number linked to your account and we will send a verification code.
        </Text>

        <View className="mt-6">
          <TextField
            label="Email or phone"
            value={value}
            onChangeText={setValue}
            error={error}
            autoCapitalize="none"
            placeholder="you@example.com"
            leading={<Mail size={18} color="#8A959B" />}
          />
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="gap-2.5 px-6 pb-6 pt-3 border-t border-ink-100 bg-white">
        <Button full size="lg" variant="brand" loading={loading} onPress={handleSubmit}>
          Send code
        </Button>
        <Button full size="lg" variant="ghost" onPress={() => router.push('/login')}>
          Back to log in
        </Button>
      </View>
    </SafeAreaView>
  );
}
