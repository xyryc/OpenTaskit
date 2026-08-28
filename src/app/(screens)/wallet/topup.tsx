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
import {
  AlertTriangle,
  Banknote,
  Check,
  CreditCard,
  Landmark,
  Lock,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip, SelectChip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/Overlay';

const AMOUNTS = [1000, 2500, 5000, 10000];

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { topUp, wallet, toast } = useApp();

  const [amount, setAmount] = useState('2500');
  const [method, setMethod] = useState<'bank' | 'cash'>('bank');
  const [error, setError] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setConfirmOpen(false);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (value === 999999) {
        setFailed(true);
        return;
      }

      topUp(
        value,
        method === 'bank' ? 'Bank transfer · ****4417' : 'Cash deposit agent'
      );
      toast({
        title: 'Wallet topped up!',
        description: `Added ${money(value)} to your balance.`,
        variant: 'success',
      });
      router.back();
    }, 800);
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
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          {/* Failed Warning Banner (if triggered) */}
          {failed && (
            <View className="flex-row gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-3.5" style={{ gap: 10 }}>
              <AlertTriangle size={18} color="#C7382F" />
              <View className="flex-1">
                <Text className="font-geist-semibold text-[13.5px] text-danger">
                  Top-up failed
                </Text>
                <Text className="mt-0.5 font-geist text-[12.5px] leading-snug text-danger">
                  Your bank declined the transfer. No money was taken — try again or use another payment method.
                </Text>
                <Pressable onPress={() => setFailed(false)} className="mt-2 self-start">
                  <Text className="font-geist-semibold text-[12.5px] text-danger underline">
                    Try again
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Amount Section */}
          <View>
            <Text className="mb-2 text-[13.5px] font-geist-semibold text-ink-700">
              Amount
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
                onChangeText={(val) => {
                  setError(undefined);
                  setAmount(val.replace(/\D/g, ''));
                }}
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
                  onPress={() => {
                    setError(undefined);
                    setAmount(String(opt));
                  }}
                >
                  {money(opt)}
                </SelectChip>
              ))}
            </View>
          </View>

          {/* Payment Method Section (Matches Web) */}
          <View>
            <Text className="mb-2.5 text-[15px] font-geist-semibold text-ink">
              How are you paying?
            </Text>

            <View className="gap-2.5" style={{ gap: 10 }}>
              {/* Option 1: Bank transfer */}
              <Pressable
                onPress={() => setMethod('bank')}
                className={`flex-row items-center gap-3.5 rounded-3xl p-4 ${
                  method === 'bank'
                    ? 'border-2 border-brand bg-brand-tint/40'
                    : 'border border-ink-200 bg-white'
                }`}
                style={{ gap: 14 }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Landmark size={20} color="#0094F7" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-semibold text-ink">
                    Bank transfer
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                    Commercial Bank ····4417 · instant
                  </Text>
                </View>
                {method === 'bank' && <Check size={20} color="#0094F7" />}
              </Pressable>

              {/* Option 2: Cash deposit agent */}
              <Pressable
                onPress={() => setMethod('cash')}
                className={`flex-row items-center gap-3.5 rounded-3xl p-4 ${
                  method === 'cash'
                    ? 'border-2 border-brand bg-brand-tint/40'
                    : 'border border-ink-200 bg-white'
                }`}
                style={{ gap: 14 }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-ink-100">
                  <Banknote size={20} color="#2B3A41" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-semibold text-ink">
                    Cash deposit agent
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                    Pay at any partner agent · same day
                  </Text>
                </View>
                {method === 'cash' && <Check size={20} color="#0094F7" />}
              </Pressable>

              {/* Option 3: Card top-up (Coming soon) */}
              <View
                className="flex-row items-center gap-3.5 rounded-3xl border border-ink-200 bg-white p-4 opacity-70"
                style={{ gap: 14 }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-ink-100">
                  <CreditCard size={20} color="#5B6A72" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-medium text-ink-700">
                    Card top-up
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12px] text-ink-400">
                    Visa & Mastercard
                  </Text>
                </View>
                <Chip tone="neutral" icon={<Lock size={12} color="#5B6A72" />}>
                  Coming soon
                </Chip>
              </View>
            </View>
          </View>

          {/* Helper Note */}
          <View className="rounded-2xl bg-ink-100/70 p-3.5">
            <Text className="font-geist text-[12.5px] leading-relaxed text-ink-700">
              Your wallet covers platform commissions on cash jobs. Keeping a small balance means jobs settle instantly.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        <Button
          full
          size="lg"
          variant="brand"
          loading={loading}
          disabled={value < 500 || loading}
          onPress={handleStart}
        >
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
          method === 'bank' ? 'Commercial Bank transfer' : 'Cash Deposit Agent'
        }?`}
        confirmLabel="Add funds"
      />
    </Screen>
  );
}
