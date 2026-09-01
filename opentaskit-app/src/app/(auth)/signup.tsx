import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Compass, Lock, Mail, Phone, User } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useAppDispatch } from '@/store';
import { setAuthed, continueAsGuest as reduxContinueAsGuest } from '@/store/slices/authSlice';
import { ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Input';

interface Form {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}

export default function SignUpScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { signIn, continueAsGuest: appContinueAsGuest, toast } = useApp();

  const [form, setForm] = useState<Form>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });

  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Form | 'terms', string>>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (key: keyof Form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBrowseAsGuest = () => {
    dispatch(reduxContinueAsGuest());
    appContinueAsGuest();
    router.replace('/home');
  };

  const handleSubmit = () => {
    const nextErrors: Partial<Record<keyof Form | 'terms', string>> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address';
    if (form.phone.replace(/\D/g, '').length < 9) nextErrors.phone = 'Enter a valid phone number';
    if (form.password.length < 6) nextErrors.password = 'Use at least 6 characters';
    if (form.confirm !== form.password) nextErrors.confirm = 'Passwords do not match';
    if (!terms) nextErrors.terms = 'Please accept the Terms and Privacy Policy';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push({
        pathname: '/verify',
        params: { flow: 'signup', phone: form.phone },
      } as any);
    }, 800);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title="Create your account"
        subtitle="One account for hiring and earning"
        border={false}
      />

      {/* Form Body */}
      <ScrollView
        className="flex-1 px-6 pt-2"
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          <TextField
            label="Full name"
            value={form.name}
            onChangeText={updateField('name')}
            error={errors.name}
            placeholder="Kavindu Perera"
            leading={<User size={18} color="#8A959B" />}
          />

          <TextField
            label="Email"
            value={form.email}
            onChangeText={updateField('email')}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            leading={<Mail size={18} color="#8A959B" />}
          />

          <TextField
            label="Phone number"
            value={form.phone}
            onChangeText={updateField('phone')}
            error={errors.phone}
            keyboardType="phone-pad"
            placeholder="+94 77 123 4567"
            hint="We send a one-time code to verify this number."
            leading={<Phone size={18} color="#8A959B" />}
          />

          <TextField
            label="Password"
            value={form.password}
            onChangeText={updateField('password')}
            error={errors.password}
            secureTextEntry
            placeholder="At least 6 characters"
            leading={<Lock size={18} color="#8A959B" />}
          />

          <TextField
            label="Confirm password"
            value={form.confirm}
            onChangeText={updateField('confirm')}
            error={errors.confirm}
            secureTextEntry
            placeholder="Re-enter your password"
            leading={<Lock size={18} color="#8A959B" />}
          />

          {/* Terms checkbox */}
          <View className="pt-1">
            <Pressable
              onPress={() => setTerms(!terms)}
              className="flex-row items-start gap-2.5"
            >
              <View
                className={`mt-0.5 h-5 w-5 rounded-md border items-center justify-center ${
                  terms
                    ? 'border-brand bg-brand'
                    : errors.terms
                    ? 'border-danger'
                    : 'border-ink-300 bg-white'
                }`}
              >
                {terms && <Text className="text-white text-[11px] font-geist-bold font-bold">✓</Text>}
              </View>

              <Text className="font-geist text-[13px] leading-snug text-ink-700 flex-1">
                I agree to the{' '}
                <Text className="font-geist-semibold font-semibold underline text-ink">Terms of Service</Text> and{' '}
                <Text className="font-geist-semibold font-semibold underline text-ink">Privacy Policy</Text>, including how my identity is verified.
              </Text>
            </Pressable>

            {errors.terms && (
              <Text className="mt-1.5 text-[12px] font-geist-medium font-medium text-danger">
                {errors.terms}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action CTA */}
      <View className="gap-2.5 px-6 pb-6 pt-3 border-t border-ink-100 bg-white">
        <Button full size="lg" variant="brand" loading={loading} onPress={handleSubmit}>
          Continue
        </Button>

        <Button
          full
          size="lg"
          variant="outline"
          onPress={() => router.push('/login')}
        >
          I already have an account
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
