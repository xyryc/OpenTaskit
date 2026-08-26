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
  ShieldAlert,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useAppDispatch } from '@/store';
import { setAuthed, continueAsGuest as reduxContinueAsGuest } from '@/store/slices/authSlice';
import { BrandLockup } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Input';

type Problem = 'none' | 'invalid' | 'suspended';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { signIn, continueAsGuest: appContinueAsGuest, toast } = useApp();

  const [email, setEmail] = useState('kavindu@opentaskit.lk');
  const [password, setPassword] = useState('password123');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [problem, setProblem] = useState<Problem>('none');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = 'Enter your email or phone number';
    if (!password.trim()) nextErrors.password = 'Enter your password';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setProblem('none');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (email.startsWith('suspended')) {
        setProblem('suspended');
        return;
      }
      if (password.length < 4) {
        setProblem('invalid');
        return;
      }

      signIn();
      dispatch(setAuthed(true));
      toast({ title: 'Welcome back, Kavindu', variant: 'success' });
      router.replace('/home');
    }, 800);
  };

  const handleBrowseAsGuest = () => {
    dispatch(reduxContinueAsGuest());
    appContinueAsGuest();
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

        <Text className="mt-8 text-[26px] font-bold leading-tight tracking-tight text-ink">
          Welcome back
        </Text>
        <Text className="mt-2 text-[14.5px] text-ink-500">
          Log in to pick up where you left off.
        </Text>

        {/* Problem Banners */}
        {problem === 'invalid' && (
          <View className="mt-5 flex-row gap-2.5 rounded-2xl bg-danger/10 p-3.5 items-start">
            <AlertTriangle size={18} color="#C7382F" className="mt-0.5" />
            <Text className="text-[13px] leading-snug text-danger flex-1">
              <Text className="font-bold">Incorrect password.</Text> Try again or reset your password.
            </Text>
          </View>
        )}

        {problem === 'suspended' && (
          <View className="mt-5 flex-row gap-2.5 rounded-2xl bg-warning/10 p-3.5 items-start">
            <ShieldAlert size={18} color="#B4690E" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-[13px] leading-snug text-warning">
                <Text className="font-bold">This account is suspended.</Text> Contact support to review your account.
              </Text>
            </View>
          </View>
        )}

        {/* Form Fields */}
        <View className="mt-6 gap-4">
          <TextField
            label="Email or phone"
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
                {remember && <Text className="text-white text-[11px] font-bold">✓</Text>}
              </View>
              <Text className="text-[13.5px] text-ink-700">Remember me</Text>
            </Pressable>

            <Pressable onPress={() => toast({ title: 'Password reset link sent to email', variant: 'info' })}>
              <Text className="text-[13.5px] font-medium text-brand">
                Forgot password?
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Prototype tip */}
        <View className="mt-6 rounded-2xl bg-ink-100 p-3.5">
          <Text className="text-[12px] leading-snug text-ink-500">
            Prototype tip: log in with any details. Use a password shorter than 4 characters to see the error state, or start the email with “suspended” for the suspended-account state.
          </Text>
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
