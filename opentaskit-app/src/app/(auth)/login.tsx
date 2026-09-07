import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  AlertTriangle,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useLoginMutation } from '@/store/api/apiSlice';
import { getApiErrorMessage } from '@/utils/apiError';
import { BrandLockup } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuthActions();
  const { toast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [login, { isLoading: loading }] = useLoginMutation();

  const handleSubmit = async () => {
    if (loading) return;
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = 'Enter your email address';
    if (!password.trim()) nextErrors.password = 'Enter your password';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError('');
    try {
      await login({ email: email.trim().toLowerCase(), password, rememberMe: remember }).unwrap();
      toast({ title: 'Welcome back', variant: 'success' });
      router.replace('/home');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  const handleBrowseAsGuest = () => {
    continueAsGuest();
    router.replace('/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <BrandLockup size={34} />

        <Text className="mt-8 text-[26px] font-geist-bold font-bold leading-tight tracking-tight text-ink">
          Welcome back
        </Text>
        <Text className="font-geist mt-2 text-[14.5px] text-ink-500">
          Log in to pick up where you left off.
        </Text>

        {/* Problem Banners */}
        {!!submitError && (
          <View className="mt-5 flex-row gap-2.5 rounded-2xl bg-danger/10 p-3.5 items-start">
            <AlertTriangle size={18} color="#C7382F" className="mt-0.5" />
            <Text className="font-geist text-[13px] leading-snug text-danger flex-1">
              {submitError}
            </Text>
          </View>
        )}

        {/* Form Fields */}
        <View className="mt-6 gap-4">
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            leading={<Mail size={18} color="#8A959B" />}
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry={!show}
            placeholder="Enter your password"
            leading={<Lock size={18} color="#8A959B" />}
            trailing={
              <Pressable
                onPress={() => setShow(!show)}
                hitSlop={8}
                className="h-8 w-8 items-center justify-center rounded-full active:bg-ink-100"
              >
                {show ? (
                  <EyeOff size={18} color="#8A959B" />
                ) : (
                  <Eye size={18} color="#8A959B" />
                )}
              </Pressable>
            }
          />

          {/* Remember me & Forgot password */}
          <View className="flex-row items-center justify-between pt-1">
            <Pressable
              onPress={() => setRemember(!remember)}
              className="flex-row items-center gap-2"
            >
              <View
                className={`h-5 w-5 rounded-md border items-center justify-center ${
                  remember ? 'border-brand bg-brand' : 'border-ink-300 bg-white'
                }`}
              >
                {remember && <Text className="text-white text-[11px] font-geist-bold font-bold">✓</Text>}
              </View>
              <Text className="font-geist text-[13.5px] text-ink-700">Remember me</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/forgot')}>
              <Text className="text-[13.5px] font-geist-medium font-medium text-brand">
                Forgot password?
              </Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Action CTA */}
      <View className="gap-2.5 px-6 pb-6 pt-3 border-t border-ink-100 bg-white">
        <Button full size="lg" variant="brand" loading={loading} onPress={handleSubmit}>
          Log in
        </Button>

        <Button
          full
          size="lg"
          variant="outline"
          onPress={() => router.push('/signup')}
        >
          Create an account
        </Button>

        <Button
          full
          size="lg"
          variant="ghost"
          icon={<Compass size={18} color="#2B3A41" />}
          onPress={handleBrowseAsGuest}
        >
          Continue as guest
        </Button>
      </View>
    </SafeAreaView>
  );
}
