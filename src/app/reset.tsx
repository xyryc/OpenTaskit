import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Check, CheckCircle2, Lock } from 'lucide-react-native';

import { ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Input';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const rules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One number', ok: /\d/.test(password) },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
  ];

  const handleSubmit = () => {
    const nextErrors: { password?: string; confirm?: string } = {};
    if (!rules.every((r) => r.ok)) {
      nextErrors.password = 'Password does not meet the requirements yet';
    }
    if (confirm !== password) {
      nextErrors.confirm = 'Passwords do not match';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 900);
  };

  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8" edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <Animated.View
          entering={ZoomIn.duration(400)}
          className="h-20 w-20 items-center justify-center rounded-[28px] bg-brand-tint"
        >
          <CheckCircle2 size={40} color="#0094F7" />
        </Animated.View>

        <Text className="mt-6 text-[24px] font-bold tracking-tight text-ink text-center">
          Password updated
        </Text>
        <Text className="mt-2 text-[14.5px] leading-relaxed text-ink-500 text-center">
          Your password has been changed. Log in with your new password to continue.
        </Text>

        <Button
          full
          size="lg"
          variant="brand"
          className="mt-8"
          onPress={() => router.replace('/login')}
        >
          Back to log in
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScreenHeader title="New password" border={false} />

      <ScrollView
        className="flex-1 px-6 pb-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          <TextField
            label="New password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            placeholder="Enter your new password"
            leading={<Lock size={18} color="#8A959B" />}
          />

          <TextField
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            secureTextEntry
            placeholder="Re-enter your password"
            leading={<Lock size={18} color="#8A959B" />}
          />

          {/* Rules list */}
          <View className="rounded-2xl bg-canvas p-4 gap-2.5">
            {rules.map((rule) => (
              <View key={rule.label} className="flex-row items-center gap-2.5">
                <View
                  className={`h-5 w-5 rounded-full items-center justify-center ${
                    rule.ok ? 'bg-brand' : 'bg-ink-200'
                  }`}
                >
                  <Check size={12} color={rule.ok ? '#FFFFFF' : '#8A959B'} strokeWidth={2.5} />
                </View>
                <Text
                  className={`text-[13px] ${
                    rule.ok ? 'font-medium text-ink' : 'text-ink-500'
                  }`}
                >
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-6 pb-6 pt-3 border-t border-ink-100 bg-white">
        <Button full size="lg" variant="brand" loading={loading} onPress={handleSubmit}>
          Save new password
        </Button>
      </View>
    </SafeAreaView>
  );
}
