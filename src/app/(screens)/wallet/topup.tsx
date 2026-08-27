import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banknote, Check, Landmark } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { SelectChip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/Overlay';

const AMOUNTS = [1000, 2500, 5000, 10000];

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { topUp, wallet } = useApp();

  const [amount, setAmount] = useState('2500');
  const [method, setMethod] = useState<'bank' | 'cash'>('bank');
  const [error, setError] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const value = Number(amount) || 0;

  const handleStart = () => {
    if (value < 500) {
      setError('Minimum top-up is Rs 500');
      return;
    }
    setError(undefined);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    topUp(
      value,
      method === 'bank' ? 'Bank transfer · ****4417' : 'Cash deposit agent'
    );
    setConfirmOpen(false);
    router.back();
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title="Top up wallet"
        subtitle={`Current balance ${money(wallet.available)}`}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="gap-6 px-5 pt-4" style={{ gap: 24 }}>
          {/* Amount Section */}
          <View>
            <Text className="mb-2 text-[13.5px] font-geist-semibold text-ink-700">
              Amount to add
            </Text>

            <View
              className={`flex-row items-center rounded-3xl border bg-white px-5 py-2 ${
                error ? 'border-danger' : 'border-ink-200'
              }`}
            >
              <Text className="text-[20px] font-geist-bold text-ink-400">Rs</Text>
              <TextInput
                inputMode="numeric"
                value={amount}
                onChangeText={(val) => setAmount(val.replace(/\D/g, ''))}
                className="ml-2 flex-1 text-[26px] font-geist-bold tracking-tight text-ink"
                style={[{ fontFamily: 'Geist-Bold' }]}
              />
            </View>

            {error && (
              <Text className="mt-1.5 font-geist-medium text-[12px] text-danger">
                {error}
              </Text>
            )}

            {/* Quick Amount Chips */}
            <View className="mt-3 flex-row flex-wrap gap-2" style={{ gap: 8 }}>
              {AMOUNTS.map((opt) => (
                <SelectChip
                  key={opt}
                  selected={amount === String(opt)}
                  onPress={() => setAmount(String(opt))}
                >
                  {money(opt)}
                </SelectChip>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View>
            <Text className="mb-2.5 text-[15px] font-geist-semibold text-ink">
              How are you paying?
            </Text>

            <View className="gap-2.5" style={{ gap: 10 }}>
              {/* Bank option */}
              <Pressable
                onPress={() => setMethod('bank')}
                className={`flex-row items-center gap-3 rounded-3xl p-4 ${
                  method === 'bank'
                    ? 'border-2 border-brand bg-brand-tint/40'
                    : 'border border-ink-200 bg-white'
                }`}
                style={{ gap: 12 }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Landmark size={20} color="#0094F7" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-semibold text-ink">
                    Commercial Bank · ****4417
                  </Text>
                  <Text className="font-geist text-[12px] text-ink-500">
                    Instant transfer · Zero fees
                  </Text>
                </View>
                {method === 'bank' && <Check size={18} color="#0094F7" />}
              </Pressable>

              {/* Cash deposit option */}
              <Pressable
                onPress={() => setMethod('cash')}
                className={`flex-row items-center gap-3 rounded-3xl p-4 ${
                  method === 'cash'
                    ? 'border-2 border-brand bg-brand-tint/40'
                    : 'border border-ink-200 bg-white'
                }`}
                style={{ gap: 12 }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Banknote size={20} color="#0094F7" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-semibold text-ink">
                    Cash Deposit Agent
                  </Text>
                  <Text className="font-geist text-[12px] text-ink-500">
                    Over the counter at 400+ partner stores
                  </Text>
                </View>
                {method === 'cash' && <Check size={18} color="#0094F7" />}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        <Button full size="lg" variant="brand" onPress={handleStart}>
          Top up {money(value)}
        </Button>
      </View>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Confirm top up?"
        message={`Add ${money(value)} to your OpenTaskit wallet via ${
          method === 'bank' ? 'Commercial Bank transfer' : 'Cash Deposit'
        }?`}
        confirmLabel="Add funds"
      />
    </Screen>
  );
}
