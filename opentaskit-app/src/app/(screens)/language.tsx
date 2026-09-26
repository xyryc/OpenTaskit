import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Check, ChevronLeft, Languages } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { LANGUAGES } from '@/utils/i18n';
import { Button } from '@/components/ui/Button';
import type { Language } from '@/types';

export default function LanguageSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { language, setLanguage, toast } = useApp();
  const [selected, setSelected] = useState<Language>(language);

  const isFromWelcome = params.from === 'welcome';
  const canGoBack = router.canGoBack();

  const handleContinue = () => {
    setLanguage(selected);
    if (isFromWelcome) {
      router.push('/onboarding');
    } else {
      const langName = LANGUAGES.find((l) => l.code === selected)?.native || selected;
      toast({
        title: 'Language updated',
        description: `App language set to ${langName}.`,
        variant: 'success',
      });
      if (canGoBack) {
        router.back();
      } else {
        router.replace('/(tabs)/profile' as any);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header bar with Back button when navigated from in-app/settings */}
      {!isFromWelcome && canGoBack && (
        <View className="flex-row items-center justify-between px-6 pt-3 pb-2 border-b border-ink-100">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-ink-50 active:bg-ink-100"
          >
            <ChevronLeft size={22} color="#1C2024" />
          </Pressable>
          <Text className="text-[16px] font-geist-semibold font-semibold text-ink">
            Language
          </Text>
          <View className="w-9" />
        </View>
      )}

      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint">
          <Languages size={24} color="#0072C4" />
        </View>

        {/* Title & Subtitle */}
        <Text className="mt-5 text-[26px] font-geist-bold font-bold leading-tight tracking-tight text-ink">
          Choose your language
        </Text>
        <Text className="font-geist mt-2 text-[14.5px] leading-relaxed text-ink-500">
          {isFromWelcome
            ? 'You can change this any time in Settings. OpenTaskit works in English, Sinhala and Tamil.'
            : 'Select your preferred language. All menus and notifications will appear in your chosen language.'}
        </Text>

        {/* Language Options */}
        <View className="mt-7 gap-3">
          {LANGUAGES.map((item) => {
            const active = selected === item.code;
            return (
              <Pressable
                key={item.code}
                onPress={() => setSelected(item.code)}
                className={`flex-row items-center justify-between p-4 rounded-3xl border ${
                  active ? 'border-brand bg-brand-tint/50' : 'border-ink-200 bg-white'
                }`}
              >
                <View>
                  <Text className="text-[16px] font-geist-semibold font-semibold tracking-tight text-ink">
                    {item.native}
                  </Text>
                  <Text className="font-geist mt-0.5 text-[12.5px] text-ink-500">
                    {item.label}
                  </Text>
                </View>

                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${
                    active ? 'border-brand bg-brand' : 'border-ink-200 bg-white'
                  }`}
                >
                  {active && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View className="px-6 pb-6 pt-3 border-t border-ink-100 bg-white">
        <Button full size="lg" variant="brand" onPress={handleContinue}>
          {isFromWelcome ? 'Continue' : 'Save changes'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
