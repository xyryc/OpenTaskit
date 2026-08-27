import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  Plus,
  ShieldAlert,
  X,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { PhotoPicker } from '@/components/create/PhotoPicker';
import { CategoryBadge } from '@/components/CategoryIcon';

const REASONS = [
  'Service not completed',
  'Poor quality',
  'Payment issue',
  'Incorrect service',
  'Provider did not arrive',
  'Requester unavailable',
  'Other',
];

export default function RaiseDisputeScreen() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskById, raiseDispute } = useApp();

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const task = taskById(taskId);
  if (!task) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Raise a dispute" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-ink-500">
            Task not found.
          </Text>
        </View>
      </Screen>
    );
  }

  const validate = () => {
    const next: Record<string, string> = {};
    if (!reason) next.reason = 'Choose the reason closest to the problem';
    if (description.trim().length < 30) {
      next.description = 'Describe what happened in at least 30 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleOpenConfirm = () => {
    if (validate()) {
      setConfirmOpen(true);
    }
  };

  const handleConfirmSubmit = () => {
    raiseDispute({
      taskId: task.id,
      reason,
      description: description.trim(),
      evidence,
    });
    setConfirmOpen(false);
    router.replace({
      pathname: '/(screens)/dispute/[taskId]',
      params: { taskId: task.id },
    } as any);
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title="Raise a dispute" subtitle={task.title} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          {/* Warning Banner */}
          <View
            className="flex-row items-start gap-2.5 rounded-3xl border border-warning/30 bg-warning/10 p-4"
            style={{ gap: 10 }}
          >
            <ShieldAlert size={18} color="#B4690E" className="mt-0.5 shrink-0" />
            <Text className="flex-1 font-geist text-[12.5px] leading-relaxed text-ink-700">
              Payment for this job is put on hold while support reviews the
              case. Most disputes are decided within 48 hours.
            </Text>
          </View>

          {/* Task Info Header */}
          <View
            className="flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-4"
            style={{ gap: 12 }}
          >
            <CategoryBadge categoryId={task.categoryId} size="lg" />
            <View className="flex-1 min-w-0">
              <Text
                numberOfLines={2}
                className="text-[14px] font-geist-semibold leading-snug text-ink"
              >
                {task.title}
              </Text>
              <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                Job value {money(task.budget)}
              </Text>
            </View>
          </View>

          {/* What went wrong? */}
          <View>
            <Text className="mb-2.5 text-[15px] font-geist-semibold text-ink">
              What went wrong?
            </Text>
            <View className="gap-2" style={{ gap: 8 }}>
              {REASONS.map((item) => {
                const active = reason === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setReason(item)}
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                      active
                        ? 'border-brand bg-brand-tint/50'
                        : 'border-ink-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-[14.5px] ${
                        active
                          ? 'font-geist-semibold text-ink'
                          : 'font-geist text-ink-800'
                      }`}
                    >
                      {item}
                    </Text>
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full border ${
                        active ? 'border-brand bg-brand' : 'border-ink-300'
                      }`}
                    >
                      {active && <Check size={12} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {errors.reason && (
              <Text className="mt-1.5 font-geist-medium text-[12px] text-danger">
                {errors.reason}
              </Text>
            )}
          </View>

          {/* Describe what happened */}
          <View>
            <TextArea
              label="Describe what happened"
              value={description}
              onChangeText={setDescription}
              error={errors.description}
              placeholder="Explain what was agreed, what was delivered and what you would like as an outcome."
            />
            <Text className="mt-1 text-right font-geist text-[11.5px] text-ink-400">
              {description.trim().length} / 30 min chars
            </Text>
          </View>

          {/* Evidence Photos */}
          <View>
            <Text className="mb-2 text-[15px] font-geist-semibold text-ink">
              Evidence photos
            </Text>
            <Text className="mb-3 font-geist text-[12.5px] text-ink-500">
              Upload photos of incomplete work, receipts, or chat agreements.
            </Text>

            <View className="flex-row flex-wrap gap-2.5" style={{ gap: 10 }}>
              {evidence.map((uri) => (
                <View
                  key={uri}
                  className="relative h-20 w-20 overflow-hidden rounded-2xl border border-ink-200"
                >
                  <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() =>
                      setEvidence((prev) => prev.filter((x) => x !== uri))
                    }
                    className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-ink/70"
                  >
                    <X size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}

              {evidence.length < 5 && (
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  className="h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white active:bg-ink-100"
                >
                  <Plus size={20} color="#5A676E" />
                  <Text className="mt-1 font-geist text-[11px] text-ink-500">
                    Add photo
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        <Button full size="lg" variant="brand" onPress={handleOpenConfirm}>
          Submit dispute
        </Button>
      </View>

      {/* Photo Picker Sheet */}
      <PhotoPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={evidence}
        onToggle={(uri) =>
          setEvidence((prev) =>
            prev.includes(uri) ? prev.filter((x) => x !== uri) : [...prev, uri]
          )
        }
        onAddImages={(uris) => {
          setEvidence((prev) => [...prev, ...uris]);
          setPickerOpen(false);
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit dispute?"
        message="Job funds will be held securely in escrow while support investigates. Both parties will be contacted."
        confirmLabel="Submit dispute"
      />
    </Screen>
  );
}
