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
import { Image } from 'expo-image';
import {
  CheckCircle2,
  Mail,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Input';
import { SelectChip } from '@/components/ui/Chip';
import { PhotoPicker } from '@/components/create/PhotoPicker';

const CATEGORIES = [
  'Task or provider issue',
  'Payment or wallet',
  'Account & login',
  'Safety & trust',
  'App bug / technical',
  'Other',
];

export default function ReportProblemScreen() {
  const router = useRouter();
  const { me, toast } = useApp();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [taskRef, setTaskRef] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleTogglePhoto = (src: string) => {
    if (images.includes(src)) {
      setImages(images.filter((img) => img !== src));
    } else {
      setImages([...images, src]);
    }
  };

  const handleAddPhotos = (uris: string[]) => {
    const combined = [...images, ...uris];
    setImages(combined.slice(0, 4));
  };

  const handleSubmit = () => {
    if (description.trim().length < 10) {
      Alert.alert('More detail needed', 'Please provide at least 10 characters describing what went wrong.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast({
        title: 'Report submitted',
        description: 'Our support team will follow up within 24 hours.',
        variant: 'success',
      });
    }, 600);
  };

  if (submitted) {
    return (
      <Screen tone="canvas" edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-success/15 mb-4">
            <CheckCircle2 size={36} color="#0E9F6E" />
          </View>
          <Text className="text-center text-[22px] font-geist-bold text-ink">
            Report received
          </Text>
          <Text className="mt-2 text-center font-geist text-[14px] leading-relaxed text-ink-600">
            Thank you for bringing this to our attention. A member of our support team is reviewing your report and will follow up with your account.
          </Text>

          <View className="mt-8 w-full">
            <Button
              full
              size="lg"
              variant="brand"
              onPress={() => router.back()}
            >
              Done
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen tone="canvas" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title="Report a problem"
        subtitle="Tell us what went wrong so we can help."
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="gap-5 px-5 pt-4" style={{ gap: 20 }}>
          {/* Advisory Notice */}
          <View
            className="flex-row items-start gap-3 rounded-3xl border border-warning/30 bg-warning/10 p-4"
            style={{ gap: 12 }}
          >
            <ShieldAlert size={20} color="#D97706" />
            <Text className="flex-1 font-geist text-[13px] leading-relaxed text-ink-700">
              For urgent safety emergencies, please contact local emergency services immediately. For billing and task issues, our team investigates within 24 hours.
            </Text>
          </View>

          {/* Problem Category */}
          <View>
            <Text className="mb-2.5 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
              What type of issue is this?
            </Text>
            <View className="flex-row flex-wrap gap-2" style={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <SelectChip
                  key={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                >
                  {cat}
                </SelectChip>
              ))}
            </View>
          </View>

          {/* Task / Reference Number (Optional) */}
          <View>
            <TextField
              label="Related task title or ID (optional)"
              placeholder="e.g. Living room AC repair or #TSK-842"
              value={taskRef}
              onChangeText={setTaskRef}
            />
          </View>

          {/* Description Textarea */}
          <View>
            <TextArea
              label="What went wrong?"
              placeholder="Provide as much detail as possible, including what happened, when it occurred, and who was involved."
              value={description}
              onChangeText={setDescription}
              error={
                description.length > 0 && description.trim().length < 10
                  ? 'Please write at least 10 characters.'
                  : undefined
              }
            />
            <Text className="mt-1 text-right font-geist text-[11.5px] text-ink-400">
              {description.trim().length} characters (min 10)
            </Text>
          </View>

          {/* Attach Screenshots / Photos */}
          <View>
            <Text className="mb-2 text-[12px] font-geist-semibold uppercase tracking-[0.08em] text-ink-400">
              Screenshots or photos (optional)
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {images.map((uri, idx) => (
                <View
                  key={idx}
                  className="relative h-20 w-20 overflow-hidden rounded-2xl border border-ink-200 bg-ink-100"
                >
                  <Image
                    source={{ uri }}
                    style={{ width: 80, height: 80 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-ink/75"
                  >
                    <Trash2 size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}

              {images.length < 4 && (
                <Pressable
                  onPress={() => setPhotoPickerOpen(true)}
                  className="h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-white active:bg-ink-100/60"
                >
                  <Plus size={20} color="#0094F7" />
                  <Text className="mt-1 font-geist-medium text-[10.5px] text-ink-600">
                    Add photo
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* Contact Follow-up Card */}
          <View className="flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-4" style={{ gap: 12 }}>
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-tint">
              <Mail size={18} color="#0094F7" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="font-geist-medium text-[11.5px] text-ink-400">
                Account follow-up
              </Text>
              <Text numberOfLines={1} className="font-geist-semibold text-[13.5px] text-ink truncate">
                {me.name} ({me.location})
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <View className="pt-2">
            <Button
              full
              size="lg"
              variant="brand"
              loading={submitting}
              disabled={description.trim().length < 10 || submitting}
              onPress={handleSubmit}
            >
              Submit report
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Photo Picker Modal */}
      <PhotoPicker
        open={photoPickerOpen}
        onClose={() => setPhotoPickerOpen(false)}
        selected={images}
        onToggle={handleTogglePhoto}
        onAddImages={handleAddPhotos}
      />
    </Screen>
  );
}
