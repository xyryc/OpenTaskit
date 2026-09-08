import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  BadgeCheck,
  Bookmark,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Share2,
  ShieldCheck,
  Users,
  Wallet2,
  X,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { useSavedTasks } from '@/hooks/useSavedTasks';
import { useAppSelector } from '@/store';
import { useGetTaskByIdQuery } from '@/store/api/apiSlice';
import { mapApiTaskToTask } from '@/utils/taskFilters';
import { distance, money, scheduleLabel, timeAgo } from '@/utils/format';
import { paymentMethodMeta } from '@/utils/payment';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip, StatusChip } from '@/components/ui/Chip';
import { SelectChip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Feedback';
import { BottomSheet, ConfirmDialog } from '@/components/ui/Overlay';
import { CategoryBadge } from '@/components/CategoryIcon';
import { LeafletMap } from '@/components/create/LeafletMap';
import { resolveImageSource } from '@/utils/images';

const ETA_PRESETS = [
  'Today · 2-3 hrs',
  'Tomorrow morning',
  'This weekend',
  'Flexible anytime',
];

export default function TaskDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const authUser = useAppSelector((state) => state.auth.user);

  const {
    myOffer,
    toast,
    cancelTask,
    withdrawOffer,
    submitOffer,
    requireAccount,
  } = useApp();

  const { isTaskSaved, toggleSave, isLoggedIn } = useSavedTasks();

  const { data: apiTask, isLoading: loading, isError: taskError } = useGetTaskByIdQuery(id, {
    skip: !id,
  });
  const task = useMemo(() => (apiTask ? mapApiTaskToTask(apiTask) : undefined), [apiTask]);

  const [photoIndex, setPhotoIndex] = useState(0);

  // Modals state
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [makeOfferOpen, setMakeOfferOpen] = useState(false);

  // Make offer form state
  const [offerPrice, setOfferPrice] = useState('');
  const [offerEta, setOfferEta] = useState(ETA_PRESETS[0]);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerError, setOfferError] = useState('');

  useEffect(() => {
    if (task) {
      setOfferPrice(String(task.budget));
    }
  }, [task]);

  if (!loading && (!task || taskError)) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8 text-center">
          <Text className="text-[18px] font-geist-semibold text-ink">
            Task not found
          </Text>
          <Text className="mt-2 text-center font-geist text-[13.5px] text-ink-500">
            This task may have been removed by the requester.
          </Text>
          <View className="mt-6 w-48">
            <Button
              full
              variant="brand"
              onPress={() => router.replace('/(tabs)/discover')}
            >
              Back to discover
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  if (loading || !task) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <View className="gap-4 p-5">
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-6 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-1/2 rounded-xl" />
          <View className="flex-row gap-2.5">
            <Skeleton className="h-20 flex-1 rounded-2xl" />
            <Skeleton className="h-20 flex-1 rounded-2xl" />
          </View>
          <Skeleton className="h-24 w-full rounded-2xl" />
        </View>
      </Screen>
    );
  }

  const mine = !!(authUser?.id && task.requesterId === authUser.id);
  const existingOffer = myOffer(task.id);
  const saved = isTaskSaved(task.id);

  const handleToggleSaved = async () => {
    if (!isLoggedIn) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to bookmark tasks',
        variant: 'info',
      });
      router.push('/(auth)/login' as any);
      return;
    }

    const res = await toggleSave(task.id);
    if (res.success) {
      toast({
        title: res.action === 'saved' ? 'Saved for later' : 'Removed from saved',
        variant: res.action === 'saved' ? 'success' : 'info',
      });
    }
  };
  const categoryName = task.category?.name || 'Category';
  const categoryIcon = task.category?.icon;
  const payment = paymentMethodMeta(task.paymentMethod);

  const posterName = task.user?.fullName || 'Requester';
  const posterInitials =
    posterName
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  const posterAvatarUser = {
    name: posterName,
    initials: posterInitials,
    tone: 'bg-brand-tint text-brand-dark',
    verified: false,
  };
  const memberSince = task.user?.createdAt
    ? new Date(task.user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : undefined;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this task on OpenTaskit: ${task.title} (${money(task.budget)}) in ${task.location}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMakeOffer = () => {
    if (!requireAccount('offer')) return;
    setOfferPrice(String(task.budget));
    setOfferMessage('I saw your task and I am available to help. I bring my own tools and can get it done cleanly.');
    setOfferError('');
    setMakeOfferOpen(true);
  };

  const handleOpenEditOffer = () => {
    if (!requireAccount('offer')) return;
    if (existingOffer) {
      setOfferPrice(String(existingOffer.price));
      setOfferMessage(existingOffer.message || '');
      setOfferEta(existingOffer.eta || 'Tomorrow afternoon');
    } else {
      setOfferPrice(String(task.budget));
      setOfferMessage('I saw your task and I am available to help. I bring my own tools and can get it done cleanly.');
    }
    setOfferError('');
    setMakeOfferOpen(true);
  };

  const handleSubmitOffer = () => {
    const num = Number(offerPrice);
    if (!num || num < 500) {
      setOfferError('Enter a valid offer price (minimum Rs 500)');
      return;
    }

    submitOffer({
      taskId: task.id,
      price: num,
      eta: offerEta,
      message: offerMessage.trim(),
    });

    setMakeOfferOpen(false);
    toast({
      title: 'Offer submitted!',
      description: `Your offer of ${money(num)} has been sent to ${posterName}.`,
      variant: 'success',
    });
  };

  const handleScrollPhoto = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index >= 0 && index < task.images.length) {
      setPhotoIndex(index);
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION: Photos / Category Banner */}
        <View className="relative w-full bg-white">
          {task.images.length > 0 ? (
            <View className="relative h-64 w-full bg-ink-900">
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScrollPhoto}
                scrollEventThrottle={16}
              >
                {task.images.map((imgUri, index) => (
                  <Image
                    key={index}
                    source={resolveImageSource(imgUri)}
                    style={{ width: screenWidth, height: 256 }}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>

              {/* Photo Count Badge */}
              {task.images.length > 1 && (
                <>
                  <View className="absolute bottom-3 right-4 flex-row items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1">
                    <ImageIcon size={14} color="#FFFFFF" />
                    <Text className="text-[11.5px] font-geist-medium text-white">
                      {photoIndex + 1} / {task.images.length}
                    </Text>
                  </View>

                  {/* Dot Indicators */}
                  <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex-row gap-1.5">
                    {task.images.map((_, i) => (
                      <View
                        key={i}
                        className={`h-1.5 rounded-full ${
                          i === photoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/55'
                        }`}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : (
            <View className="h-44 w-full items-center justify-center bg-brand-tint">
              <CategoryBadge categoryId={task.categoryId} iconName={categoryIcon} size="lg" />
            </View>
          )}

          {/* Floating Navigation Controls */}
          <View className="absolute inset-x-4 top-3 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-white shadow-sm active:bg-white"
            >
              <ChevronLeft size={22} color="#0C1417" />
            </Pressable>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={handleToggleSaved}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-white shadow-sm active:bg-white"
              >
                <Bookmark
                  size={18}
                  color={saved ? '#0094F7' : '#0C1417'}
                  fill={saved ? '#0094F7' : 'transparent'}
                />
              </Pressable>

              <Pressable
                onPress={handleShare}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-white shadow-sm active:bg-white"
              >
                <Share2 size={18} color="#0C1417" />
              </Pressable>

              <Pressable
                onPress={() => setMoreOpen(true)}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-white shadow-sm active:bg-white"
              >
                <MoreHorizontal size={18} color="#0C1417" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* TASK DETAILS BODY */}
        <View className="px-5 pt-5 pb-8">
          {/* Provider's Submitted Offer Card (Top) */}
          {!mine && existingOffer && (
            <View className="mb-4 rounded-3xl border border-brand/40 bg-brand-tint/60 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[12.5px] font-geist-semibold uppercase tracking-[0.07em] text-brand-dark">
                  Your submitted offer
                </Text>
                <Chip tone="brand">{existingOffer.status}</Chip>
              </View>
              <Text className="mt-2 text-[22px] font-geist-bold tracking-[-0.03em] text-ink">
                {money(existingOffer.price)}
              </Text>
              {existingOffer.eta ? (
                <Text className="mt-0.5 font-geist-medium text-[13px] text-ink-700">
                  {existingOffer.eta}
                </Text>
              ) : null}
              {existingOffer.message ? (
                <Text className="mt-2 font-geist text-[13px] leading-relaxed text-ink-600">
                  {existingOffer.message}
                </Text>
              ) : null}
              <View className="mt-3 w-36">
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => setConfirmWithdraw(true)}
                >
                  Withdraw offer
                </Button>
              </View>
            </View>
          )}

          {/* Category, Status, Time Chips */}
          <View className="flex-row flex-wrap items-center gap-2">
            <Chip tone="brand">{categoryName}</Chip>
            <StatusChip status={task.status} />
            <Text className="font-geist text-[12px] text-ink-400">
              Posted {timeAgo(task.postedAt)}
            </Text>
          </View>

          {/* Task Title */}
          <Text className="mt-3 text-[22px] font-geist-semibold leading-tight tracking-[-0.03em] text-ink">
            {task.title}
          </Text>

          {/* 2-Column Facts Grid */}
          <View className="mt-4 gap-2.5" style={{ gap: 10 }}>
            <View className="flex-row gap-2.5" style={{ gap: 10 }}>
              <FactCard
                icon={<Wallet2 size={16} color="#0094F7" />}
                label="Budget"
                value={money(task.budget)}
                note={task.flexibleBudget ? 'Flexible' : 'Fixed'}
              />
              <FactCard
                icon={<MapPin size={16} color="#0094F7" />}
                label="Distance"
                value={distance(task.distanceKm)}
                note={task.location}
              />
            </View>

            <View className="flex-row gap-2.5" style={{ gap: 10 }}>
              <FactCard
                icon={<CalendarDays size={16} color="#0094F7" />}
                label="Preferred date"
                value={scheduleLabel(task.schedule)}
                note={task.schedule.time}
              />
              <FactCard
                icon={<Users size={16} color="#0094F7" />}
                label="Offers"
                value={String(task.offersCount ?? 0)}
                note={(task.offersCount ?? 0) > 0 ? undefined : 'Be the first'}
              />
            </View>

            <FactCard
              icon={<CreditCard size={16} color="#0094F7" />}
              label="Payment"
              value={payment.label}
              note={payment.taskerNote}
              wide
            />
          </View>

          {/* Description Section */}
          <View className="mt-6">
            <Text className="text-[15px] font-geist-semibold text-ink">
              Description
            </Text>
            <Text className="mt-2 font-geist text-[14px] leading-relaxed text-ink-700">
              {task.description}
            </Text>
          </View>

          {/* Location & Map Preview Section */}
          <View className="mt-6">
            <Text className="text-[15px] font-geist-semibold text-ink">
              Location
            </Text>
            <View className="mt-2.5 overflow-hidden rounded-3xl border border-ink-200 bg-white">
              <LeafletMap height={144} />
              <View className="flex-row items-center gap-2 bg-white px-4 py-3 border-t border-ink-100">
                <MapPin size={16} color="#0094F7" />
                <Text
                  numberOfLines={1}
                  className="flex-1 font-geist-medium text-[13.5px] text-ink truncate"
                >
                  {task.location}
                </Text>
                <Text className="shrink-0 font-geist text-[12.5px] text-ink-500">
                  {distance(task.distanceKm)} away
                </Text>
              </View>
            </View>
            <Text className="mt-2 font-geist text-[12px] text-ink-400">
              Exact address is shared with the person you hire, after you accept their offer.
            </Text>
          </View>

          {/* About Requester Section */}
          <View className="mt-6">
            <Text className="text-[15px] font-geist-semibold text-ink">
              {mine ? 'Posted by you' : 'About the requester'}
            </Text>
            <View
              className="mt-2.5 flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-4"
              style={{ gap: 12 }}
            >
              <Avatar user={posterAvatarUser} size="lg" />
              <View className="flex-1 min-w-0">
                <Text
                  numberOfLines={1}
                  className="text-[15px] font-geist-semibold text-ink truncate"
                >
                  {posterName}
                </Text>
                {memberSince && (
                  <Text className="mt-1 font-geist text-[12px] text-ink-500">
                    Member since {memberSince}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Trust & Dispute Protection Box */}
          <View
            className="mt-5 flex-row items-start rounded-3xl bg-ink-100/80 p-4"
            style={{ gap: 10 }}
          >
            <ShieldCheck size={18} color="#0094F7" />
            <Text className="flex-1 font-geist text-[12.5px] leading-relaxed text-ink-700">
              Keep everything inside OpenTaskit. Chat, agree the price and confirm completion in the app so you are covered by dispute protection.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* STICKY FOOTER ACTIONS */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        {mine ? (
          /* Poster View: View & Manage Offers */
          <View className="flex-row gap-2.5" style={{ gap: 10 }}>
            <View className="flex-1">
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onPress={() => {
                  router.push({
                    pathname: '/(screens)/task/[id]/offers',
                    params: { id: task.id },
                  } as any);
                }}
              >
                Offers ({task.offersCount ?? 0})
              </Button>
            </View>
            <View className="flex-[1.5]">
              <Button
                size="lg"
                variant="brand"
                className="w-full"
                onPress={() => {
                  router.push({
                    pathname: '/(screens)/task/[id]/offers',
                    params: { id: task.id },
                  } as any);
                }}
              >
                Review offers
              </Button>
            </View>
          </View>
        ) : task.status === 'assigned' || task.status === 'in_progress' ? (
          /* Already Assigned View */
          <View className="flex-row items-center gap-3">
            <Text className="flex-1 font-geist text-[13px] text-ink-500">
              This task is already assigned to someone.
            </Text>
            <Button
              size="md"
              variant="outline"
              onPress={() => router.replace('/(tabs)/discover')}
            >
              Find similar
            </Button>
          </View>
        ) : existingOffer ? (
          /* Provider has already submitted offer: 2 Actions (Message & Edit your offer) */
          <View className="flex-row gap-2.5" style={{ gap: 10 }}>
            <View className="flex-1">
              <Button
                full
                size="lg"
                variant="outline"
                icon={<MessageCircle size={18} color="#0C1417" />}
                onPress={() => {
                  router.push({
                    pathname: '/(screens)/chat/[taskId]',
                    params: { taskId: task.id },
                  } as any);
                }}
              >
                Message
              </Button>
            </View>
            <View className="flex-[1.4]">
              <Button
                full
                size="lg"
                variant="brand"
                icon={<Pencil size={16} color="#FFFFFF" />}
                onPress={handleOpenEditOffer}
              >
                Edit your offer
              </Button>
            </View>
          </View>
        ) : (
          /* Provider: Make an offer & bookmark */
          <View className="flex-row gap-2.5" style={{ gap: 10 }}>
            <Pressable
              onPress={handleToggleSaved}
              className="h-12 w-12 items-center justify-center rounded-2xl border border-ink-200 bg-white active:bg-ink-100"
            >
              <Bookmark
                size={20}
                color={saved ? '#0094F7' : '#2B3A41'}
                fill={saved ? '#0094F7' : 'transparent'}
              />
            </Pressable>
            <View className="flex-1">
              <Button
                full
                size="lg"
                variant="brand"
                onPress={handleOpenMakeOffer}
              >
                Make an offer
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* MODAL 1: Make An Offer Bottom Sheet (In-place) */}
      <BottomSheet
        open={makeOfferOpen}
        onClose={() => setMakeOfferOpen(false)}
        title="Make an offer"
        description={`Send your price and availability to ${posterName}.`}
        footer={
          <Button full size="lg" variant="brand" onPress={handleSubmitOffer}>
            Submit offer ({money(Number(offerPrice) || 0)})
          </Button>
        }
      >
        <View className="pb-3">
          {/* Price input */}
          <Text className="mb-1.5 text-[13px] font-geist-medium text-ink-700">
            Your price
          </Text>
          <View
            className={`flex-row items-center rounded-2xl border bg-white px-4 h-[56px] ${
              offerError ? 'border-danger' : 'border-ink-200'
            }`}
          >
            <Text className="mr-2 text-[18px] font-geist-semibold text-ink-400">
              Rs
            </Text>
            <TextInput
              value={offerPrice}
              onChangeText={(val) => {
                setOfferPrice(val.replace(/\D/g, ''));
                if (offerError) setOfferError('');
              }}
              keyboardType="numeric"
              style={[{ fontFamily: 'Geist-Bold' }]}
              className="flex-1 text-[22px] font-geist-bold text-ink"
            />
          </View>
          {offerError && (
            <Text className="mt-1.5 text-[12px] font-geist-medium text-danger">
              {offerError}
            </Text>
          )}

          {/* Quick budget suggestion chips */}
          <View className="mt-2.5 flex-row flex-wrap gap-2" style={{ gap: 8 }}>
            {[
              task.budget,
              Math.round((task.budget * 0.9) / 50) * 50,
              Math.round((task.budget * 1.1) / 50) * 50,
            ].map((amount) => (
              <SelectChip
                key={amount}
                selected={offerPrice === String(amount)}
                onPress={() => {
                  setOfferPrice(String(amount));
                  if (offerError) setOfferError('');
                }}
              >
                {money(amount)}
              </SelectChip>
            ))}
          </View>

          {/* Availability ETA */}
          <Text className="mb-2 mt-5 text-[13px] font-geist-medium text-ink-700">
            When can you do it?
          </Text>
          <View className="flex-row flex-wrap gap-2" style={{ gap: 8 }}>
            {ETA_PRESETS.map((preset) => (
              <SelectChip
                key={preset}
                selected={offerEta === preset}
                onPress={() => setOfferEta(preset)}
              >
                {preset}
              </SelectChip>
            ))}
          </View>

          {/* Message to poster */}
          <View className="mt-5">
            <Text className="mb-1.5 text-[13px] font-geist-medium text-ink-700">
              Message to requester
            </Text>
            <TextInput
              value={offerMessage}
              onChangeText={setOfferMessage}
              multiline
              numberOfLines={3}
              placeholder="Tell the requester why you're a good fit, what tools you bring..."
              placeholderTextColor="#8A959B"
              style={[{ fontFamily: 'Geist-Regular' }]}
              className="min-h-[80px] rounded-2xl border border-ink-200 bg-white p-3.5 text-[14px] font-geist text-ink"
            />
          </View>
        </View>
      </BottomSheet>

      {/* MODAL 3: More Options Menu Bottom Sheet */}
      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Task options"
      >
        <View className="pb-4 divide-y divide-ink-100">
          <Pressable
            onPress={() => {
              setMoreOpen(false);
              handleShare();
            }}
            className="flex-row items-center gap-3 py-3.5 px-2 active:bg-ink-100 rounded-2xl"
          >
            <Share2 size={18} color="#2B3A41" />
            <Text className="font-geist-medium text-[15px] text-ink">
              Share task
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMoreOpen(false);
              handleToggleSaved();
            }}
            className="flex-row items-center gap-3 py-3.5 px-2 active:bg-ink-100 rounded-2xl"
          >
            <Bookmark size={18} color="#2B3A41" />
            <Text className="font-geist-medium text-[15px] text-ink">
              {saved ? 'Remove from saved' : 'Save for later'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMoreOpen(false);
              router.push({
                pathname: '/(screens)/chat/[taskId]',
                params: { taskId: task.id },
              } as any);
            }}
            className="flex-row items-center gap-3 py-3.5 px-2 active:bg-ink-100 rounded-2xl"
          >
            <MessageSquare size={18} color="#2B3A41" />
            <Text className="font-geist-medium text-[15px] text-ink">
              Open chat
            </Text>
          </Pressable>

          {mine ? (
            <Pressable
              onPress={() => {
                setMoreOpen(false);
                setConfirmCancel(true);
              }}
              className="flex-row items-center gap-3 py-3.5 px-2 active:bg-danger/10 rounded-2xl"
            >
              <X size={18} color="#C7382F" />
              <Text className="font-geist-medium text-[15px] text-danger">
                Cancel this task
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                setMoreOpen(false);
                toast({
                  title: 'Report sent to support',
                  description: 'Our team will review this task within 24 hours.',
                  variant: 'info',
                });
              }}
              className="flex-row items-center gap-3 py-3.5 px-2 active:bg-danger/10 rounded-2xl"
            >
              <X size={18} color="#C7382F" />
              <Text className="font-geist-medium text-[15px] text-danger">
                Report this task
              </Text>
            </Pressable>
          )}
        </View>
      </BottomSheet>

      {/* DIALOG 1: Confirm Cancel Task */}
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          cancelTask(task.id);
          toast({ title: 'Task cancelled', variant: 'info' });
          router.replace('/(tabs)/activity');
        }}
        title="Cancel this task?"
        message="Offers you have received will be withdrawn and the task will no longer be visible to anyone."
        confirmLabel="Cancel task"
        cancelLabel="Keep task"
        tone="danger"
      />

      {/* DIALOG 2: Confirm Withdraw Offer */}
      <ConfirmDialog
        open={confirmWithdraw}
        onClose={() => setConfirmWithdraw(false)}
        onConfirm={() => {
          if (existingOffer) {
            withdrawOffer(existingOffer.id);
            toast({ title: 'Offer withdrawn', variant: 'info' });
          }
        }}
        title="Withdraw your offer?"
        message="The requester will no longer see your price. You can send a new offer later while the task is open."
        confirmLabel="Withdraw offer"
        cancelLabel="Keep offer"
        tone="danger"
      />
    </Screen>
  );
}

function FactCard({
  icon,
  label,
  value,
  note,
  wide = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  wide?: boolean;
}) {
  return (
    <View
      className={`rounded-2xl border border-ink-200 bg-white px-3.5 py-3 ${
        wide ? 'w-full' : 'flex-1'
      }`}
    >
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-[11.5px] font-geist-medium uppercase tracking-[0.06em] text-ink-400">
          {label}
        </Text>
      </View>
      <Text className="mt-1 text-[16px] font-geist-semibold tracking-[-0.02em] text-ink">
        {value}
      </Text>
      {note && (
        <Text
          numberOfLines={wide ? 2 : 1}
          className="mt-0.5 text-[11.5px] font-geist text-ink-500"
        >
          {note}
        </Text>
      )}
    </View>
  );
}
