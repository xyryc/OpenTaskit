import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  Plus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import {
  useGetMyBankAccountsQuery,
  useCreateBankAccountMutation,
  useDeleteBankAccountMutation,
  useGetMyWalletQuery,
} from '@/store/api/apiSlice';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/Input';
import { BottomSheet, ConfirmDialog } from '@/components/ui/Overlay';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { toast } = useApp();

  const { data: bankAccounts = [], isLoading: isAccountsLoading } = useGetMyBankAccountsQuery();
  const { data: walletData } = useGetMyWalletQuery();
  const [createBankAccount, { isLoading: isCreating }] = useCreateBankAccountMutation();
  const [deleteBankAccount, { isLoading: isDeleting }] = useDeleteBankAccountMutation();

  const [addBankOpen, setAddBankOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [removeBankId, setRemoveBankId] = useState<string | null>(null);

  const handleAddBank = async () => {
    if (
      !newBankName.trim() ||
      !newBranch.trim() ||
      !newAccountNumber.trim() ||
      !newAccountName.trim()
    ) {
      Alert.alert('Incomplete details', 'Please fill in all bank account fields including branch.');
      return;
    }

    try {
      const created = await createBankAccount({
        bankName: newBankName.trim(),
        branch: newBranch.trim(),
        accountNumber: newAccountNumber.trim(),
        accountHolderName: newAccountName.trim(),
      }).unwrap();

      setAddBankOpen(false);
      setNewBankName('');
      setNewBranch('');
      setNewAccountNumber('');
      setNewAccountName('');

      toast({
        title: 'Bank account added',
        description: `${created.bankName} has been linked for withdrawals.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to link account',
        description: err?.data?.message || 'Could not add bank account. Please check details.',
        variant: 'error',
      });
    }
  };

  const handleConfirmRemoveBank = async () => {
    if (!removeBankId) return;
    try {
      await deleteBankAccount(removeBankId).unwrap();
      setRemoveBankId(null);
      toast({
        title: 'Bank account removed',
        variant: 'info',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to remove account',
        description: err?.data?.message || 'Could not remove bank account.',
        variant: 'error',
      });
    }
  };

  return (
    <Screen tone="canvas" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title="Payment methods"
        subtitle={`Wallet balance ${money(walletData?.availableBalance ?? 0)}`}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          {/* Active Payment Methods */}
          <View>
            <Text className="mb-2.5 px-1 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
              Active payment methods
            </Text>
            <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
              {/* Cash */}
              <View className="flex-row items-center gap-3.5 p-4" style={{ gap: 14 }}>
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-tint">
                  <Banknote size={20} color="#0094F7" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-semibold text-ink">
                    Cash
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                    Pay on completion · commission from wallet
                  </Text>
                </View>
                <CheckCircle2 size={20} color="#0094F7" />
              </View>

              {/* Saved Card */}
              <View className="flex-row items-center gap-3.5 p-4" style={{ gap: 14 }}>
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-tint">
                  <CreditCard size={20} color="#0094F7" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-semibold text-ink">
                    Card ····4417
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                    Charged when you confirm completion
                  </Text>
                </View>
                <CheckCircle2 size={20} color="#0094F7" />
              </View>

              {/* Digital Wallet */}
              <View className="flex-row items-center gap-3.5 p-4" style={{ gap: 14 }}>
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-tint">
                  <Wallet2 size={20} color="#0094F7" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-semibold text-ink">
                    Digital wallet
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                    {money(walletData?.availableBalance ?? 0)} available · instant task settlement
                  </Text>
                </View>
                <CheckCircle2 size={20} color="#0094F7" />
              </View>

              {/* Connected Bank Accounts */}
              {bankAccounts.length === 0 ? (
                <View className="p-4 items-center justify-center">
                  <Text className="font-geist text-[13px] text-ink-400 text-center">
                    No bank accounts linked yet. Add an account for withdrawals.
                  </Text>
                </View>
              ) : (
                bankAccounts.map((bank) => (
                  <View key={bank.id} className="flex-row items-center gap-3.5 p-4" style={{ gap: 14 }}>
                    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-ink-100">
                      <Landmark size={20} color="#2B3A41" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-[14.5px] font-geist-semibold text-ink">
                        {bank.bankName} {bank.branch ? `(${bank.branch})` : ''}
                      </Text>
                      <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                        ••••{bank.accountNumber.slice(-4) || '••••'} · {bank.accountHolderName}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setRemoveBankId(bank.id)}
                      hitSlop={8}
                      className="p-1 active:opacity-60"
                      disabled={isDeleting}
                    >
                      <Text className="font-geist-medium text-[12.5px] text-danger">
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Coming Soon Local Payment Rails */}
          <View>
            <Text className="mb-2.5 px-1 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
              Coming soon
            </Text>
            <View className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
              <View className="flex-row items-center gap-3.5 p-4 opacity-75" style={{ gap: 14 }}>
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-ink-100">
                  <Smartphone size={20} color="#5B6A72" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-medium text-ink-700">
                    eZ Cash & mCash
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12px] text-ink-400">
                    Mobile money carrier billing & wallets
                  </Text>
                </View>
                <Chip tone="neutral" icon={<Lock size={12} color="#5B6A72" />}>
                  Soon
                </Chip>
              </View>

              <View className="flex-row items-center gap-3.5 p-4 opacity-75" style={{ gap: 14 }}>
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-ink-100">
                  <QrCode size={20} color="#5B6A72" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14.5px] font-geist-medium text-ink-700">
                    LankaQR & Genie
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12px] text-ink-400">
                    Instant app-to-app QR payments
                  </Text>
                </View>
                <Chip tone="neutral" icon={<Lock size={12} color="#5B6A72" />}>
                  Soon
                </Chip>
              </View>
            </View>

            <Text className="mt-2.5 px-1 font-geist text-[12px] leading-relaxed text-ink-400">
              You choose cash, card or digital wallet on each task before you post it, so taskers know how they will be paid. Additional local payment rails are being certified.
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-2.5 pt-2" style={{ gap: 10 }}>
            <Button
              full
              size="lg"
              variant="outline"
              icon={<Plus size={18} color="#0C1417" />}
              onPress={() => setAddBankOpen(true)}
            >
              Add a payout account
            </Button>

            <Button
              full
              size="lg"
              variant="brand"
              icon={<Wallet2 size={18} color="#FFFFFF" />}
              onPress={() => router.push('/(screens)/wallet/topup')}
            >
              Top up wallet
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* MODAL: Add Payout Bank Account */}
      <BottomSheet
        open={addBankOpen}
        onClose={() => setAddBankOpen(false)}
        title="Add a payout account"
        description="Link a Sri Lankan bank account to withdraw your task earnings."
        footer={
          <Button full size="lg" variant="brand" loading={isCreating} onPress={handleAddBank}>
            Link bank account
          </Button>
        }
      >
        <View className="gap-4 pb-2" style={{ gap: 16 }}>
          <TextField
            label="Bank name"
            placeholder="e.g. Commercial Bank, HNB, Sampath"
            value={newBankName}
            onChangeText={setNewBankName}
          />
          <TextField
            label="Branch / City"
            placeholder="e.g. Colombo Fort, Kandy"
            value={newBranch}
            onChangeText={setNewBranch}
          />
          <TextField
            label="Account holder name"
            placeholder="Full name matching your ID"
            value={newAccountName}
            onChangeText={setNewAccountName}
          />
          <TextField
            label="Account number"
            placeholder="e.g. 1000849201"
            keyboardType="number-pad"
            value={newAccountNumber}
            onChangeText={setNewAccountNumber}
          />
          <View className="flex-row items-center gap-2 rounded-2xl bg-brand-tint/60 p-3" style={{ gap: 8 }}>
            <ShieldCheck size={16} color="#0094F7" />
            <Text className="flex-1 font-geist text-[12px] leading-snug text-brand-dark">
              Account verification is instantaneous. Your financial details are stored with end-to-end encryption.
            </Text>
          </View>
        </View>
      </BottomSheet>

      {/* CONFIRM DIALOG: Remove Bank Account */}
      <ConfirmDialog
        open={!!removeBankId}
        onClose={() => setRemoveBankId(null)}
        onConfirm={handleConfirmRemoveBank}
        title="Remove bank account?"
        message="You will need to link a valid bank account to make future withdrawals."
        confirmLabel="Remove"
        cancelLabel="Keep account"
        tone="danger"
      />
    </Screen>
  );
}
