import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useGetMyWalletQuery, useInitiateTopUpMutation } from '@/store/api/apiSlice';
import { money } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/apiError';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { SelectChip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/Overlay';

const AMOUNTS = [1000, 2500, 5000, 10000];
const MIN_AMOUNT = 100;

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useApp();
  const { data: wallet } = useGetMyWalletQuery();
  const [initiateTopUp, { isLoading }] = useInitiateTopUpMutation();

  const [amount, setAmount] = useState('2500');
  const [error, setError] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const value = Number(amount) || 0;

  const handleStart = () => {
    if (value < MIN_AMOUNT) {
      setError(`Minimum top-up is ${money(MIN_AMOUNT)}`);
      return;
    }
    setError(undefined);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      const result = await initiateTopUp({ amount: value }).unwrap();
      setConfirmOpen(false);
      router.push({
        pathname: '/(screens)/payments/checkout',
        params: { checkoutParams: JSON.stringify(result), mode: 'topup' },
      } as any);
    } catch (err) {
      toast({
        title: 'Could not start top-up',
        description: getApiErrorMessage(err),
        variant: 'error',
      });
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title="Top up wallet"
        subtitle={`Current balance ${money(wallet?.availableBalance ?? 0)}`}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
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

          {/* Payment Method */}
          <View>
            <Text className="mb-2.5 text-[15px] font-geist-semibold text-ink">
              How are you paying?
            </Text>

            <View className="flex-row items-center gap-3.5 rounded-3xl border-2 border-brand bg-brand-tint/40 p-4" style={{ gap: 14 }}>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                <CreditCard size={20} color="#0094F7" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[14.5px] font-geist-semibold text-ink">
                  Card payment
                </Text>
                <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                  Visa & Mastercard via PayHere · instant
                </Text>
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
          loading={isLoading}
          disabled={value < MIN_AMOUNT || isLoading}
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
        title="Proceed to payment?"
        message={`You'll be taken to a secure card payment screen to add ${money(value)} to your wallet.`}
        confirmLabel={isLoading ? 'Starting payment...' : 'Continue'}
      />
    </Screen>
  );
}
