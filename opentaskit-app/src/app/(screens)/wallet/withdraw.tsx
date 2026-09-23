import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Landmark, Plus, CheckCircle2 } from 'lucide-react-native';

import {
  useGetMyWalletQuery,
  useGetMyBankAccountsQuery,
  useCreateBankAccountMutation,
  useCreatePayoutRequestMutation,
} from '@/store/api/apiSlice';
import { useApp } from '@/contexts/AppContext';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Feedback';
import type { BankAccountItem } from '@/types';

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useApp();

  const { data: wallet } = useGetMyWalletQuery();
  const { data: bankAccounts, isLoading: isLoadingAccounts } = useGetMyBankAccountsQuery();
  const [createBankAccount, { isLoading: isSavingAccount }] = useCreateBankAccountMutation();
  const [createPayoutRequest, { isLoading: isSubmitting }] = useCreatePayoutRequestMutation();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const activeAccountId =
    selectedAccountId ?? bankAccounts?.find((a) => a.isDefault)?.id ?? bankAccounts?.[0]?.id ?? null;

  const handleAddBankAccount = async () => {
    setError(null);
    if (!bankName.trim() || !branch.trim() || !accountHolderName.trim() || !accountNumber.trim()) {
      setError('Please fill in all bank account fields.');
      return;
    }
    try {
      const created = await createBankAccount({
        bankName: bankName.trim(),
        branch: branch.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
      }).unwrap();
      setSelectedAccountId(created.id);
      setShowAddForm(false);
      setBankName('');
      setBranch('');
      setAccountHolderName('');
      setAccountNumber('');
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to save bank account.');
    }
  };

  const handleSubmitWithdrawal = async () => {
    setError(null);
    const numericAmount = Number(amount);

    if (!activeAccountId) {
      setError('Add a bank account to withdraw to.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (wallet && numericAmount > wallet.availableBalance) {
      setError('Amount exceeds your available balance.');
      return;
    }

    try {
      await createPayoutRequest({ bankAccountId: activeAccountId, amount: numericAmount }).unwrap();
      toast({
        title: 'Withdrawal requested',
        description: 'Our team will review and transfer funds to your bank account.',
        variant: 'success',
      });
      router.back();
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to submit withdrawal request.');
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Withdraw funds" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 24 }}
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          <View className="rounded-3xl border border-ink-200 bg-white p-4">
            <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
              Available balance
            </Text>
            <Text className="mt-1 text-[24px] font-geist-bold text-ink">
              {money(wallet?.availableBalance ?? 0)}
            </Text>
          </View>

          <TextField
            label="Amount to withdraw"
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <View>
            <Text className="mb-2.5 text-[15px] font-geist-semibold text-ink">
              Bank account
            </Text>

            {isLoadingAccounts ? (
              <ListSkeleton count={1} />
            ) : (
              <View className="gap-2.5" style={{ gap: 10 }}>
                {(bankAccounts ?? []).map((account: BankAccountItem) => (
                  <Pressable
                    key={account.id}
                    onPress={() => setSelectedAccountId(account.id)}
                    className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
                      activeAccountId === account.id
                        ? 'border-brand bg-brand-tint/40'
                        : 'border-ink-200 bg-white'
                    }`}
                    style={{ gap: 12 }}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-tint">
                      <Landmark size={18} color="#0072C4" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-[14px] font-geist-semibold text-ink">
                        {account.bankName} — {account.branch}
                      </Text>
                      <Text className="text-[12px] font-geist text-ink-500">
                        {account.accountHolderName} · {account.accountNumber}
                      </Text>
                    </View>
                    {activeAccountId === account.id && (
                      <CheckCircle2 size={20} color="#0094F7" />
                    )}
                  </Pressable>
                ))}

                {!showAddForm && (
                  <Pressable
                    onPress={() => setShowAddForm(true)}
                    className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-300 bg-white py-3.5 active:bg-ink-100"
                    style={{ gap: 8 }}
                  >
                    <Plus size={16} color="#0072C4" />
                    <Text className="font-geist-medium text-[13.5px] text-brand-dark">
                      Add bank account
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {showAddForm && (
            <View className="gap-3.5 rounded-3xl border border-ink-200 bg-white p-4" style={{ gap: 14 }}>
              <TextField label="Bank name" placeholder="e.g. Commercial Bank" value={bankName} onChangeText={setBankName} />
              <TextField label="Branch" placeholder="e.g. Colombo Main" value={branch} onChangeText={setBranch} />
              <TextField label="Account holder name" value={accountHolderName} onChangeText={setAccountHolderName} />
              <TextField label="Account number" keyboardType="numeric" value={accountNumber} onChangeText={setAccountNumber} />
              <Button variant="outline" loading={isSavingAccount} onPress={handleAddBankAccount}>
                Save bank account
              </Button>
            </View>
          )}

          {error && (
            <Text className="text-[13px] font-geist-medium text-danger">{error}</Text>
          )}

          <Button variant="brand" size="lg" loading={isSubmitting} onPress={handleSubmitWithdrawal}>
            Request withdrawal
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
