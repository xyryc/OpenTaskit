import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { KeyboardAvoidingView, useKeyboardState } from 'react-native-keyboard-controller';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  CalendarClock,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useAppSelector } from '@/store';
import {
  useGetCategoriesQuery,
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useUploadImagesMutation,
} from '@/store/api/apiSlice';
import { getApiErrorMessage, parseApiError } from '@/utils/apiError';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Feedback';
import { TextField, TextArea, Toggle } from '@/components/ui/Input';
import { SelectChip } from '@/components/ui/Chip';
import { BottomSheet } from '@/components/ui/Overlay';
import { CategoryBadge, CategoryIcon } from '@/components/CategoryIcon';
import { PhotoPicker } from '@/components/create/PhotoPicker';
import { LocationPicker } from '@/components/create/LocationPicker';
import { DatePickerSheet } from '@/components/create/DatePickerSheet';
import { TimePickerSheet } from '@/components/create/TimePickerSheet';
import { PAYMENT_METHODS, paymentMethodMeta } from '@/utils/payment';
import { money, scheduleDateLabel, startOfToday } from '@/utils/format';
import type { LocationApiType, PaymentApiMethod, TimeApiType, UpdateTaskPayload } from '@/types/api';

const PRESET_AMOUNTS = [3000, 5000, 8000, 12000, 20000];

const SCHEDULE_OPTIONS: { key: TimeApiType; title: string; body: string }[] = [
  {
    key: 'ASAP',
    title: 'As soon as possible',
    body: 'Urgent — today if someone is free',
  },
  {
    key: 'SPECIFIC_DATE',
    title: 'On a specific date',
    body: 'Choose the day and preferred time',
  },
  {
    key: 'FLEXIBLE',
    title: 'I am flexible',
    body: 'Within the next few weeks',
  },
];

const TIME_OPTIONS = [
  'Any time of day',
  'Morning (8am – 12pm)',
  'Afternoon (12pm – 5pm)',
  'Evening (5pm – 8pm)',
];

export default function EditTaskScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const authUser = useAppSelector((state) => state.auth.user);
  const { toast } = useApp();
  const [headerHeight, setHeaderHeight] = useState(0);

  const { data: apiTask, isLoading: isTaskLoading } = useGetTaskByIdQuery(id, { skip: !id });
  const { data: categories = [], isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const [updateTaskApi, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [uploadImagesApi, { isLoading: isUploadingImages }] = useUploadImagesMutation();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [budget, setBudget] = useState('');
  const [flexibleBudget, setFlexibleBudget] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat?: number; lng?: number }>({});
  const [scheduleType, setScheduleType] = useState<TimeApiType>('ASAP');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('Any time of day');
  const [paymentMethod, setPaymentMethod] = useState<PaymentApiMethod>('CASH');
  const [images, setImages] = useState<string[]>([]);

  // Dialog & sheet states
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('09:00 AM');
  const [customEndTime, setCustomEndTime] = useState('05:00 PM');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Pre-fill once apiTask is loaded
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (apiTask && !hasInitialized) {
      setTitle(apiTask.title || '');
      setDescription(apiTask.details || '');
      setCategoryId(apiTask.categoryId || '');
      setBudget(apiTask.budget ? String(apiTask.budget) : '');
      setFlexibleBudget(!!apiTask.isBudgetFlexible);
      setIsRemote(apiTask.locationType === 'REMOTE');
      setLocation(apiTask.address || '');
      setCoordinates({
        lat: apiTask.latitude ?? undefined,
        lng: apiTask.longitude ?? undefined,
      });
      setScheduleType(apiTask.timeType || 'ASAP');
      setScheduleDate(
        apiTask.scheduledDate
          ? scheduleDateLabel(new Date(apiTask.scheduledDate))
          : ''
      );
      setScheduleTime(apiTask.scheduledTime || 'Any time of day');
      setPaymentMethod(apiTask.paymentMethod || 'CASH');
      setImages(apiTask.images || []);
      setHasInitialized(true);
    }
  }, [apiTask, hasInitialized]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAddLocalImages = (newUris: string[]) => {
    setImages((prev) => [...prev, ...newUris]);
    setPhotoPickerOpen(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    else if (title.trim().length < 5) errs.title = 'Title must be at least 5 characters';

    if (!description.trim()) errs.details = 'Description is required';
    else if (description.trim().length < 10) errs.details = 'Description must be at least 10 characters';

    if (!categoryId) errs.categoryId = 'Please select a category';

    const numBudget = Number(budget.replace(/[^0-9]/g, ''));
    if (!budget || isNaN(numBudget) || numBudget < 100) {
      errs.budget = 'Minimum budget is LKR 100';
    }

    if (!isRemote && !location.trim()) {
      errs.location = 'Please provide a location for in-person tasks';
    }

    if (scheduleType === 'SPECIFIC_DATE' && !scheduleDate) {
      errs.scheduleDate = 'Please pick a date for the task';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast({
        title: 'Missing information',
        description: 'Please review highlighted fields before saving.',
        variant: 'error',
      });
      return;
    }

    try {
      // Handle image uploads if any are local URIs
      const localUris = images.filter(
        (u) =>
          u.startsWith('file:') ||
          u.startsWith('content:') ||
          u.startsWith('ph:')
      );
      const remoteUris = images.filter((u) => !localUris.includes(u));

      let finalImages = remoteUris;
      if (localUris.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < localUris.length; i++) {
          const uri = localUris[i];
          const filename = uri.split('/').pop() || `photo_${i}.jpg`;
          const ext = filename.split('.').pop()?.toLowerCase();
          const type = ext === 'png' ? 'image/png' : 'image/jpeg';
          formData.append('files', {
            uri,
            name: filename,
            type,
          } as any);
        }

        try {
          const uploadRes = await uploadImagesApi(formData).unwrap();
          finalImages = [...remoteUris, ...uploadRes.urls];
        } catch (uploadErr) {
          toast({
            title: 'Image Upload Failed',
            description: 'Could not upload new photos. Please try again.',
            variant: 'error',
          });
          return;
        }
      }

      const numBudget = Number(budget.replace(/[^0-9]/g, ''));
      const payload: UpdateTaskPayload = {
        title: title.trim(),
        details: description.trim(),
        categoryId,
        images: finalImages,
        locationType: isRemote ? 'REMOTE' : 'IN_PERSON',
        address: isRemote ? undefined : location.trim(),
        latitude: isRemote ? undefined : coordinates.lat,
        longitude: isRemote ? undefined : coordinates.lng,
        budget: numBudget,
        isBudgetFlexible: flexibleBudget,
        paymentMethod,
        timeType: scheduleType,
        scheduledDate:
          scheduleType === 'SPECIFIC_DATE' && scheduleDate
            ? new Date().toISOString()
            : undefined,
        scheduledTime: scheduleType === 'SPECIFIC_DATE' ? scheduleTime : undefined,
      };

      await updateTaskApi({ taskId: id, ...payload }).unwrap();
      toast({
        title: 'Task updated',
        description: 'Your changes have been saved successfully.',
        variant: 'success',
      });
      router.back();
    } catch (err: any) {
      const parsed = parseApiError(err);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setFieldErrors(parsed.fieldErrors);
      }
      toast({
        title: 'Failed to update task',
        description: parsed.generalMessage || getApiErrorMessage(err),
        variant: 'error',
      });
    }
  };

  if (isTaskLoading) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Edit task" />
        <View className="flex-1 gap-5 p-5" style={{ gap: 20 }}>
          <View className="gap-2" style={{ gap: 8 }}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-full" />
          </View>
          <View className="gap-2" style={{ gap: 8 }}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-24 w-full" />
          </View>
          <View className="gap-2" style={{ gap: 8 }}>
            <Skeleton className="h-3 w-20" />
            <View className="flex-row gap-2" style={{ gap: 8 }}>
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </View>
          </View>
          <View className="gap-2" style={{ gap: 8 }}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-full" />
          </View>
          <View className="gap-2" style={{ gap: 8 }}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-12 w-full" />
          </View>
        </View>
      </Screen>
    );
  }

  if (!apiTask) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Edit task" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-ink-500">
            Task not found.
          </Text>
        </View>
      </Screen>
    );
  }

  const isOwner = authUser?.id === apiTask.userId;
  if (!isOwner && authUser?.role !== 'ADMIN') {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Edit task" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-danger">
            You do not have permission to edit this task.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <ScreenHeader title="Edit task" subtitle={apiTask.title} />
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="gap-6" style={{ gap: 24 }}>
            {/* Section: Category */}
            <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm">
              <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
                Category
              </Text>
              <Pressable
                onPress={() => setCategorySheetOpen(true)}
                className="mt-3 flex-row items-center justify-between rounded-2xl border border-ink-200 bg-ink-50/50 p-3.5 active:bg-ink-100"
              >
                <View className="flex-row items-center gap-3" style={{ gap: 12 }}>
                  <CategoryBadge categoryId={categoryId} size="md" />
                  <View>
                    <Text className="font-geist-medium text-[15px] text-ink">
                      {selectedCategory?.name || 'Select a category'}
                    </Text>
                    <Text className="font-geist text-[12px] text-ink-500">
                      Tap to change category
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#8A959B" />
              </Pressable>
              {fieldErrors.categoryId && (
                <Text className="mt-1.5 font-geist text-[12px] text-danger">
                  {fieldErrors.categoryId}
                </Text>
              )}
            </View>

            {/* Section: Title & Details */}
            <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm gap-4" style={{ gap: 16 }}>
              <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
                Task details
              </Text>
              <TextField
                label="Task title"
                placeholder="e.g. Clean 2-bedroom apartment"
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
                }}
                error={fieldErrors.title}
              />
              <TextArea
                label="Description & requirements"
                placeholder="Describe what needs to be done, special instructions, materials provided, etc."
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (fieldErrors.details) setFieldErrors((prev) => ({ ...prev, details: '' }));
                }}
                numberOfLines={5}
                error={fieldErrors.details}
              />
            </View>

            {/* Section: Location */}
            <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm gap-4" style={{ gap: 16 }}>
              <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
                Location
              </Text>
              <View className="flex-row gap-2">
                <SelectChip
                  selected={!isRemote}
                  onPress={() => setIsRemote(false)}
                  className="flex-1 items-center justify-center py-2.5"
                >
                  In-Person
                </SelectChip>
                <SelectChip
                  selected={isRemote}
                  onPress={() => setIsRemote(true)}
                  className="flex-1 items-center justify-center py-2.5"
                >
                  Remote / Online
                </SelectChip>
              </View>

              {!isRemote && (
                <View className="mt-1">
                  <Pressable
                    onPress={() => setLocationPickerOpen(true)}
                    className="flex-row items-center justify-between rounded-2xl border border-ink-200 bg-ink-50/50 p-3.5 active:bg-ink-100"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2" style={{ gap: 12 }}>
                      <MapPin size={18} color="#0094F7" />
                      <Text
                        numberOfLines={1}
                        className={`font-geist text-[14px] ${
                          location ? 'text-ink font-geist-medium' : 'text-ink-400'
                        }`}
                      >
                        {location || 'Search address or tap on map'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#8A959B" />
                  </Pressable>
                  {fieldErrors.location && (
                    <Text className="mt-1.5 font-geist text-[12px] text-danger">
                      {fieldErrors.location}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Section: Budget & Payment */}
            <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm gap-4" style={{ gap: 16 }}>
              <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
                Budget & payment
              </Text>
              <TextField
                label="Estimated budget (LKR)"
                placeholder="e.g. 5,000"
                keyboardType="numeric"
                value={budget}
                onChangeText={(val) => {
                  setBudget(val);
                  if (fieldErrors.budget) setFieldErrors((prev) => ({ ...prev, budget: '' }));
                }}
                error={fieldErrors.budget}
              />

              {/* Preset Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {PRESET_AMOUNTS.map((amt) => (
                  <SelectChip
                    key={amt}
                    selected={Number(budget.replace(/[^0-9]/g, '')) === amt}
                    onPress={() => {
                      setBudget(String(amt));
                      if (fieldErrors.budget) setFieldErrors((prev) => ({ ...prev, budget: '' }));
                    }}
                  >
                    {money(amt)}
                  </SelectChip>
                ))}
              </ScrollView>

              <Toggle
                label="Budget is flexible / open to offers"
                checked={flexibleBudget}
                onChange={setFlexibleBudget}
              />

              {/* Payment Method */}
              <View className="mt-2">
                <Text className="mb-2.5 font-geist-medium text-[13px] text-ink-700">
                  Payment Method
                </Text>
                <View className="flex-row gap-2">
                  {(['CASH', 'CARD', 'WALLET'] as PaymentApiMethod[]).map((method) => {
                    const active = paymentMethod === method;
                    return (
                      <SelectChip
                        key={method}
                        selected={active}
                        onPress={() => setPaymentMethod(method)}
                        className="flex-1 items-center justify-center py-2"
                      >
                        {method.charAt(0) + method.slice(1).toLowerCase()}
                      </SelectChip>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Section: Schedule */}
            <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm gap-4" style={{ gap: 16 }}>
              <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
                Schedule
              </Text>
              <View className="gap-2.5" style={{ gap: 10 }}>
                {SCHEDULE_OPTIONS.map((opt) => {
                  const selected = scheduleType === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setScheduleType(opt.key)}
                      className={`flex-row items-center justify-between rounded-2xl border p-3.5 ${
                        selected
                          ? 'border-brand bg-brand-tint/30'
                          : 'border-ink-200 bg-white'
                      }`}
                    >
                      <View className="flex-1 pr-3">
                        <Text
                          className={`text-[14px] font-geist-semibold ${
                            selected ? 'text-brand-dark' : 'text-ink'
                          }`}
                        >
                          {opt.title}
                        </Text>
                        <Text className="mt-0.5 font-geist text-[12px] text-ink-500">
                          {opt.body}
                        </Text>
                      </View>
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-brand bg-brand'
                            : 'border-ink-300 bg-white'
                        }`}
                      >
                        {selected && <Check size={12} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {scheduleType === 'SPECIFIC_DATE' && (
                <View className="mt-2 gap-3" style={{ gap: 12 }}>
                  {/* Date Picker Button */}
                  <Pressable
                    onPress={() => setDatePickerOpen(true)}
                    className="flex-row items-center justify-between rounded-2xl border border-ink-200 bg-ink-50/50 p-3.5 active:bg-ink-100"
                  >
                    <View className="flex-row items-center gap-3" style={{ gap: 12 }}>
                      <CalendarDays size={18} color="#0094F7" />
                      <Text
                        className={`font-geist text-[14px] ${
                          scheduleDate ? 'font-geist-medium text-ink' : 'text-ink-400'
                        }`}
                      >
                        {scheduleDate || 'Select scheduled date'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#8A959B" />
                  </Pressable>
                  {fieldErrors.scheduleDate && (
                    <Text className="font-geist text-[12px] text-danger">
                      {fieldErrors.scheduleDate}
                    </Text>
                  )}

                  {/* Time Picker Button */}
                  <Pressable
                    onPress={() => setTimePickerOpen(true)}
                    className="flex-row items-center justify-between rounded-2xl border border-ink-200 bg-ink-50/50 p-3.5 active:bg-ink-100"
                  >
                    <View className="flex-row items-center gap-3" style={{ gap: 12 }}>
                      <Clock size={18} color="#0094F7" />
                      <Text className="font-geist-medium text-[14px] text-ink">
                        {scheduleTime}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#8A959B" />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Section: Photos */}
            <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm gap-4" style={{ gap: 16 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-geist-medium uppercase tracking-[0.08em] text-ink-400">
                  Photos ({images.length})
                </Text>
                <Pressable
                  onPress={() => setPhotoPickerOpen(true)}
                  className="flex-row items-center gap-1.5 active:opacity-75"
                >
                  <Plus size={16} color="#0094F7" />
                  <Text className="font-geist-medium text-[13px] text-brand">
                    Add photo
                  </Text>
                </Pressable>
              </View>

              {images.length > 0 ? (
                <View className="flex-row flex-wrap gap-3" style={{ gap: 12 }}>
                  {images.map((imgUri, idx) => (
                    <View
                      key={`${imgUri}-${idx}`}
                      className="relative h-24 w-24 overflow-hidden rounded-2xl border border-ink-200 bg-ink-50"
                    >
                      <Image
                        source={{ uri: imgUri }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                      <Pressable
                        onPress={() => handleRemoveImage(idx)}
                        className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-black/60 active:bg-black"
                      >
                        <X size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Pressable
                  onPress={() => setPhotoPickerOpen(true)}
                  className="items-center justify-center rounded-2xl border border-dashed border-ink-300 py-6 active:bg-ink-50"
                >
                  <Camera size={24} color="#8A959B" />
                  <Text className="mt-2 font-geist text-[13px] text-ink-500">
                    No photos yet. Tap to upload.
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Actions */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3.5"
        style={{ paddingBottom: isKeyboardVisible ? 4 : Math.max(insets.bottom, 16) + 4 }}
      >
        <Button
          full
          size="lg"
          variant="brand"
          loading={isUpdating || isUploadingImages}
          onPress={handleSave}
        >
          Save changes
        </Button>
      </View>

      {/* Category Selection Sheet */}
      <BottomSheet
        open={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title="Select Category"
      >
        <ScrollView
          className="max-h-[380px]"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2 py-2" style={{ gap: 8 }}>
            {categories.map((cat) => {
              const active = cat.id === categoryId;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setCategorySheetOpen(false);
                    if (fieldErrors.categoryId) {
                      setFieldErrors((prev) => ({ ...prev, categoryId: '' }));
                    }
                  }}
                  className={`flex-row items-center justify-between rounded-2xl p-3.5 ${
                    active ? 'bg-brand-tint/40' : 'bg-ink-50 active:bg-ink-100'
                  }`}
                >
                  <View className="flex-row items-center gap-3" style={{ gap: 12 }}>
                    <CategoryBadge categoryId={cat.id} size="sm" />
                    <Text
                      className={`text-[14.5px] ${
                        active
                          ? 'font-geist-semibold text-brand-dark'
                          : 'font-geist-medium text-ink'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </View>
                  {active && <Check size={18} color="#0094F7" />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Location Picker Sheet */}
      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={(loc, coords) => {
          setLocation(loc);
          if (coords) setCoordinates(coords);
          setLocationPickerOpen(false);
          if (fieldErrors.location) {
            setFieldErrors((prev) => ({ ...prev, location: '' }));
          }
        }}
      />

      {/* Date Picker Sheet */}
      <DatePickerSheet
        open={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        value={scheduleDate}
        onSelect={(label) => {
          setScheduleDate(label);
          setDatePickerOpen(false);
          if (fieldErrors.scheduleDate) {
            setFieldErrors((prev) => ({ ...prev, scheduleDate: '' }));
          }
        }}
      />

      {/* Time Picker Sheet */}
      <TimePickerSheet
        open={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        startTime={customStartTime}
        endTime={customEndTime}
        onConfirm={(start, end) => {
          setCustomStartTime(start);
          setCustomEndTime(end);
          setScheduleTime(`${start} – ${end}`);
          setTimePickerOpen(false);
        }}
      />

      {/* Photo Picker Sheet */}
      <PhotoPicker
        open={photoPickerOpen}
        onClose={() => setPhotoPickerOpen(false)}
        selected={images}
        onToggle={() => {}}
        onAddImages={handleAddLocalImages}
      />
    </Screen>
  );
}
