import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
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
import { useAppSelector } from '@/store';
import {
  useUploadImagesMutation,
  useSubmitProblemReportMutation,
  useGetMyProfileQuery,
  useGetMyReportsQuery,
  useGetContactConfigQuery,
} from '@/store/api/apiSlice';
import type { ReportCategoryValue, ProblemReportResponse } from '@/types';

const CATEGORIES = [
  'Task or provider issue',
  'Payment or wallet',
  'Account & login',
  'Safety & trust',
  'App bug / technical',
  'Other',
];

const CATEGORY_MAP: Record<string, ReportCategoryValue> = {
  'Task or provider issue': 'TASK_OR_PROVIDER_ISSUE',
  'Payment or wallet': 'PAYMENT_OR_WALLET',
  'Account & login': 'ACCOUNT_AND_LOGIN',
  'Safety & trust': 'SAFETY_AND_TRUST',
  'App bug / technical': 'APP_BUG_TECHNICAL',
  'Other': 'OTHER',
};

const CATEGORY_LABELS: Record<string, string> = {
  TASK_OR_PROVIDER_ISSUE: 'Task / Provider',
  PAYMENT_OR_WALLET: 'Payment & Wallet',
  ACCOUNT_AND_LOGIN: 'Account & Login',
  SAFETY_AND_TRUST: 'Safety & Trust',
  APP_BUG_TECHNICAL: 'Bug / Technical',
  OTHER: 'General',
};

export default function ReportProblemScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { me, toast } = useApp();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>(
    tab === 'history' ? 'history' : 'create'
  );

  const authUser = useAppSelector((state) => state.auth.user);
  const { data: profile } = useGetMyProfileQuery();
  const {
    data: myReports = [],
    isLoading: isLoadingReports,
    isFetching: isFetchingReports,
    refetch: refetchReports,
  } = useGetMyReportsQuery();
  const { data: contactConfig } = useGetContactConfigQuery();

  const displayName = profile?.fullName || authUser?.fullName || me.name;
  const userPhone = profile?.phoneNumber || authUser?.phoneNumber || '';
  const userEmail = profile?.email || authUser?.email || '';

  const [uploadImagesApi, { isLoading: isUploading }] = useUploadImagesMutation();
  const [submitProblemReportApi, { isLoading: isSubmittingReport }] = useSubmitProblemReportMutation();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [taskRef, setTaskRef] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isBusy = isUploading || isSubmittingReport;

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

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      Alert.alert('More detail needed', 'Please provide at least 10 characters describing what went wrong.');
      return;
    }

    try {
      const localUris = images.filter((uri) => !uri.startsWith('http://') && !uri.startsWith('https://'));
      const remoteUris = images.filter((uri) => uri.startsWith('http://') || uri.startsWith('https://'));
      let finalImages = [...remoteUris];

      if (localUris.length > 0) {
        const formData = new FormData();
        for (const uri of localUris) {
          const filename = uri.split('/').pop() || `report-${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const ext = match ? match[1].toLowerCase() : 'jpg';
          const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          formData.append('files', {
            uri,
            name: filename,
            type,
          } as any);
        }

        const uploadRes = await uploadImagesApi(formData).unwrap();
        if (uploadRes?.urls) {
          finalImages = [...finalImages, ...uploadRes.urls];
        }
      }

      await submitProblemReportApi({
        category: CATEGORY_MAP[category] || 'OTHER',
        description: description.trim(),
        taskRef: taskRef.trim() || undefined,
        images: finalImages,
      }).unwrap();

      setSubmitted(true);
      setDescription('');
      setTaskRef('');
      setImages([]);
      toast({
        title: 'Report submitted',
        description: 'Our support team will follow up within 24 hours.',
        variant: 'success',
      });
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err?.data?.message.join(', ') : err?.message) ||
        'Failed to submit problem report. Please try again.';
      Alert.alert('Submission Failed', typeof errorMsg === 'string' ? errorMsg : 'Unable to submit report');
    }
  };

  const handleOpenWhatsApp = (reportId?: string) => {
    const rawNumber = contactConfig?.whatsappSupportNumber || '+94 77 123 4567';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const text = reportId
      ? `Hello OpenTaskit Support, I am following up on my problem report #${reportId.slice(0, 8)}.`
      : 'Hello OpenTaskit Support, I need help with my account.';
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      toast({
        title: 'Could not open WhatsApp',
        description: `Please contact us at ${rawNumber}`,
        variant: 'error',
      });
    });
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

          <View className="mt-8 w-full gap-3" style={{ gap: 12 }}>
            <Button
              full
              size="lg"
              variant="brand"
              onPress={() => {
                setSubmitted(false);
                setActiveTab('history');
              }}
            >
              Track this report
            </Button>
            <Button
              full
              size="lg"
              variant="outline"
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
        subtitle="Submit an issue or track the resolution status of existing reports."
      />

      {/* Tab Switcher: Submit vs My Reports */}
      <View className="px-5 pt-3 pb-1">
        <View className="flex-row rounded-2xl bg-ink-100/80 p-1">
          <Pressable
            onPress={() => setActiveTab('create')}
            className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
              activeTab === 'create' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-[13px] font-geist-semibold ${
                activeTab === 'create' ? 'text-ink' : 'text-ink-500'
              }`}
            >
              Submit report
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('history')}
            className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
              activeTab === 'history' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5" style={{ gap: 6 }}>
              <Text
                className={`text-[13px] font-geist-semibold ${
                  activeTab === 'history' ? 'text-ink' : 'text-ink-500'
                }`}
              >
                My reports
              </Text>
              {myReports.length > 0 && (
                <View className="rounded-full bg-[#0094F7]/15 px-2 py-0.5">
                  <Text className="text-[10.5px] font-geist-bold text-[#0094F7]">
                    {myReports.length}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </View>

      {activeTab === 'create' ? (
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
            <View className="rounded-3xl border border-ink-200 bg-white p-4">
              <View className="flex-row items-center gap-3" style={{ gap: 12 }}>
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-tint">
                  <Phone size={18} color="#0094F7" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="font-geist-medium text-[11.5px] text-ink-400">
                    Account follow-up
                  </Text>
                  <Text numberOfLines={1} className="font-geist-semibold text-[13.5px] text-ink truncate">
                    {displayName}
                  </Text>
                  {userPhone ? (
                    <Text numberOfLines={1} className="font-geist text-[12px] text-ink-600 mt-0.5">
                      {userPhone} {userEmail ? `· ${userEmail}` : ''}
                    </Text>
                  ) : (
                    <Text numberOfLines={1} className="font-geist text-[11.5px] text-amber-600 font-medium mt-0.5">
                      No phone number set ({userEmail || 'email only'})
                    </Text>
                  )}
                </View>
              </View>

              {!userPhone && (
                <View className="mt-3 pt-3 border-t border-ink-100 flex-row items-center justify-between">
                  <Text className="flex-1 font-geist text-[11px] text-ink-500 mr-2">
                    Add phone number so support can reach you on WhatsApp.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(screens)/account-settings')}
                    className="rounded-xl bg-brand/10 px-2.5 py-1 active:bg-brand/20"
                  >
                    <Text className="font-geist-semibold text-[11.5px] text-brand">
                      Add phone
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <View className="pt-2">
              <Button
                full
                size="lg"
                variant="brand"
                loading={isBusy}
                disabled={description.trim().length < 10 || isBusy}
                onPress={handleSubmit}
              >
                Submit report
              </Button>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* My Reports Tracking List */
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetchingReports}
              onRefresh={refetchReports}
              tintColor="#0094F7"
            />
          }
        >
          <View className="gap-4 px-5 pt-4" style={{ gap: 16 }}>
            {isLoadingReports ? (
              <View className="py-16 items-center justify-center">
                <ActivityIndicator size="small" color="#0094F7" />
                <Text className="mt-3 font-geist text-[13px] text-ink-400">
                  Loading your reports...
                </Text>
              </View>
            ) : myReports.length === 0 ? (
              <View className="py-16 items-center justify-center px-6">
                <View className="h-16 w-16 items-center justify-center rounded-3xl bg-ink-100 mb-4">
                  <LifeBuoy size={32} color="#8A959B" />
                </View>
                <Text className="text-center font-geist-bold text-[17px] text-ink">
                  No reports yet
                </Text>
                <Text className="mt-1 text-center font-geist text-[13.5px] leading-relaxed text-ink-500">
                  Any problems or issues you submit will appear here so you can track our team's response and resolution.
                </Text>
                <View className="mt-6 w-full max-w-xs">
                  <Button
                    full
                    size="md"
                    variant="brand"
                    onPress={() => setActiveTab('create')}
                  >
                    Submit a problem
                  </Button>
                </View>
              </View>
            ) : (
              myReports.map((item) => {
                const isOpen = item.status === 'OPEN';
                const isInProgress = item.status === 'IN_PROGRESS';
                const isResolved = item.status === 'RESOLVED';

                return (
                  <View
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-ink-200 bg-white p-4 shadow-xs"
                  >
                    {/* Header */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-mono text-[12px] font-geist-bold text-ink">
                          #{item.id.slice(0, 8)}
                        </Text>
                        <View className="rounded-lg bg-ink-100 px-2 py-0.5">
                          <Text className="font-geist-medium text-[11px] text-ink-600">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        className={`rounded-full px-2.5 py-1 ${
                          isOpen
                            ? 'bg-amber-500/15'
                            : isInProgress
                            ? 'bg-[#0094F7]/15'
                            : isResolved
                            ? 'bg-emerald-500/15'
                            : 'bg-ink-100'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-geist-bold ${
                            isOpen
                              ? 'text-amber-700'
                              : isInProgress
                              ? 'text-[#0094F7]'
                              : isResolved
                              ? 'text-emerald-700'
                              : 'text-ink-600'
                          }`}
                        >
                          {isOpen
                            ? 'Under review'
                            : isInProgress
                            ? 'In progress'
                            : isResolved
                            ? 'Resolved'
                            : 'Dismissed'}
                        </Text>
                      </View>
                    </View>

                    {/* Date & Task Ref */}
                    <View className="mt-1.5 flex-row items-center gap-2 text-ink-400">
                      <Clock size={12} color="#8A959B" />
                      <Text className="font-geist text-[11.5px] text-ink-400">
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {item.taskRef && (
                        <>
                          <Text className="text-ink-300">·</Text>
                          <Text className="font-mono text-[11.5px] text-ink-500">
                            Task: {item.taskRef}
                          </Text>
                        </>
                      )}
                    </View>

                    {/* Description */}
                    <Text className="mt-3 font-geist text-[13.5px] leading-relaxed text-ink-800">
                      {item.description}
                    </Text>

                    {/* Photos */}
                    {item.images && item.images.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mt-3"
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {item.images.map((imgUri, imgIdx) => (
                          <View
                            key={imgIdx}
                            className="h-16 w-16 overflow-hidden rounded-xl border border-ink-200 bg-ink-100"
                          >
                            <Image
                              source={{ uri: imgUri }}
                              style={{ width: 64, height: 64 }}
                              contentFit="cover"
                            />
                          </View>
                        ))}
                      </ScrollView>
                    )}

                    {/* Admin Resolution Note if provided */}
                    {item.adminNotes && (
                      <View className="mt-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                        <View className="flex-row items-center gap-1.5">
                          <CheckCircle2 size={14} color="#059669" />
                          <Text className="font-geist-bold text-[12px] text-emerald-800">
                            Support Team Response
                          </Text>
                        </View>
                        <Text className="mt-1 font-geist text-[13px] leading-relaxed text-emerald-900">
                          {item.adminNotes}
                        </Text>
                      </View>
                    )}

                    {/* Follow-up on WhatsApp button */}
                    <View className="mt-3.5 pt-3 border-t border-ink-100 flex-row items-center justify-between">
                      <Text className="font-geist text-[11.5px] text-ink-400">
                        Need quick updates?
                      </Text>
                      <Pressable
                        onPress={() => handleOpenWhatsApp(item.id)}
                        className="flex-row items-center gap-1.5 py-1 px-2.5 rounded-xl bg-emerald-50 active:bg-emerald-100"
                      >
                        <MessageCircle size={14} color="#059669" />
                        <Text className="font-geist-semibold text-[12px] text-emerald-700">
                          WhatsApp follow-up
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

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
