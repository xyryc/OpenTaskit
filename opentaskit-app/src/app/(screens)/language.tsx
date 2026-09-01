import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Check, Languages } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { LANGUAGES } from '@/utils/i18n';
import { Button } from '@/components/ui/Button';
import type { Language } from '@/types';

export default function LanguageSelectScreen() {
  const router = useRouter();
  const { language, setLanguage } = useApp();
  const [selected, setSelected] = useState<Language>(language);

  const handleContinue = () => {
    setLanguage(selected);
    router.push('/onboarding');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView
        className="flex-1 px-6 pt-10"
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
          You can change this any time in Settings. OpenTaskit works in English, Sinhala and Tamil.
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

      {/* Bottom Continue Button */}
      <View className="px-6 pb-6 pt-3 border-t border-ink-100 bg-white">
        <Button full size="lg" variant="brand" onPress={handleContinue}>
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}
