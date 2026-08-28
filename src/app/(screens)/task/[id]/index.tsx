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
import { ME } from '@/data/users';
import { categoryById } from '@/data/categories';
import { distance, money, scheduleLabel, timeAgo } from '@/utils/format';
import { paymentMethodMeta } from '@/utils/payment';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip, StatusChip } from '@/components/ui/Chip';
import { SelectChip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/Rating';
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

  const {
    taskById,
    userById,
    offersForTask,
    myOffer,
    savedTaskIds,
    toggleSaved,
    toast,
    cancelTask,
    withdrawOffer,
    submitOffer,
    acceptOffer,
    rejectOffer,
    requireAccount,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Modals state
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [makeOfferOpen, setMakeOfferOpen] = useState(false);
  const [offersSheetOpen, setOffersSheetOpen] = useState(false);

  // Make offer form state
  const [offerPrice, setOfferPrice] = useState('');
  const [offerEta, setOfferEta] = useState(ETA_PRESETS[0]);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerError, setOfferError] = useState('');

  const task = taskById(id);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (task) {
      setOfferPrice(String(task.budget));
    }
  }, [task]);

  if (!task && !loading) {
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

  const requester = userById(task.requesterId);
  const offers = offersForTask(task.id);
  const mine = task.requesterId === ME;
  const existingOffer = myOffer(task.id);
  const saved = savedTaskIds.includes(task.id);
  const category = categoryById(task.categoryId);
  const payment = paymentMethodMeta(task.paymentMethod);

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
      description: `Your offer of ${money(num)} has been sent to ${requester.name}.`,
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
              <CategoryBadge categoryId={task.categoryId} size="lg" />
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
                onPress={() => toggleSaved(task.id)}
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
            <Chip tone="brand">{category.name}</Chip>
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
                value={
                  task.schedule.type === 'asap'
                    ? 'ASAP'
                    : task.schedule.date ?? 'Flexible'
                }
                note={task.schedule.time}
              />
              <FactCard
                icon={<Users size={16} color="#0094F7" />}
                label="Offers"
                value={String(offers.length)}
                note={offers.length ? undefined : 'Be the first'}
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
            <Pressable
              onPress={() => {
                if (mine) {
                  router.push('/(tabs)/profile');
                } else {
                  router.push({
                    pathname: '/(screens)/provider/[userId]',
                    params: { userId: requester.id },
                  } as any);
                }
              }}
              className="mt-2.5 flex-row items-center gap-3 rounded-3xl border border-ink-200 bg-white p-4 active:bg-ink-100"
              style={{ gap: 12 }}
            >
              <Avatar user={requester} size="lg" showVerified />
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5">
                  <Text
                    numberOfLines={1}
                    className="text-[15px] font-geist-semibold text-ink truncate"
                  >
                    {requester.name}
                  </Text>
                  {requester.verified && (
                    <BadgeCheck size={16} color="#0094F7" />
                  )}
                </View>
                <View className="mt-0.5">
                  <StarRating
                    value={requester.rating}
                    count={requester.reviewCount}
                  />
                </View>
                <Text className="mt-1 font-geist text-[12px] text-ink-500">
                  {requester.completedJobs} tasks · member since{' '}
                  {requester.memberSince}
                </Text>
              </View>
              <ChevronRight size={20} color="#B9C2C7" />
            </Pressable>
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
                onPress={() => setOffersSheetOpen(true)}
              >
                Offers ({offers.length})
              </Button>
            </View>
            <View className="flex-[1.5]">
              <Button
                size="lg"
                variant="brand"
                className="w-full"
                onPress={() => setOffersSheetOpen(true)}
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
              onPress={() => toggleSaved(task.id)}
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
        description={`Send your price and availability to ${requester.name}.`}
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

      {/* MODAL 2: Received Offers Bottom Sheet (Poster View) */}
      <BottomSheet
        open={offersSheetOpen}
        onClose={() => setOffersSheetOpen(false)}
        title={`Received offers (${offers.length})`}
        description="Review proposals from nearby taskers and choose who to hire."
      >
        <View className="pb-4">
          {offers.length === 0 ? (
            <View className="py-8 items-center text-center">
              <Users size={32} color="#8A959B" />
              <Text className="mt-3 text-[15px] font-geist-semibold text-ink">
                No offers yet
              </Text>
              <Text className="mt-1 text-center font-geist text-[13px] text-ink-500">
                Taskers nearby will receive notifications and send proposals shortly.
              </Text>
            </View>
          ) : (
            <View className="gap-3.5" style={{ gap: 14 }}>
              {offers.map((offer) => {
                const provider = userById(offer.providerId);
                const isPending = offer.status === 'pending';

                return (
                  <View
                    key={offer.id}
                    className="rounded-3xl border border-ink-200 bg-white p-4"
                  >
                    {/* Provider row */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3" style={{ gap: 10 }}>
                        <Avatar user={provider} size="md" showVerified />
                        <View>
                          <Text className="text-[14.5px] font-geist-semibold text-ink">
                            {provider.name}
                          </Text>
                          <StarRating
                            value={provider.rating}
                            count={provider.reviewCount}
                          />
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-[18px] font-geist-bold text-ink">
                          {money(offer.price)}
                        </Text>
                        <Text className="text-[11.5px] font-geist-medium text-brand-dark">
                          {offer.eta}
                        </Text>
                      </View>
                    </View>

                    {/* Offer message */}
                    {offer.message && (
                      <Text className="mt-3 font-geist text-[13px] leading-relaxed text-ink-700">
                        "{offer.message}"
                      </Text>
                    )}

                    {/* Action buttons */}
                    {isPending ? (
                      <View
                        className="mt-4 flex-row items-center gap-2 border-t border-ink-100 pt-3"
                        style={{ gap: 8 }}
                      >
                        <View className="flex-1">
                          <Button
                            size="md"
                            variant="brand"
                            className="w-full"
                            onPress={() => {
                              acceptOffer(offer.id);
                              setOffersSheetOpen(false);
                              toast({
                                title: 'Offer accepted!',
                                description: `You hired ${provider.name} for ${money(offer.price)}.`,
                                variant: 'success',
                              });
                            }}
                          >
                            Accept offer
                          </Button>
                        </View>
                        <Pressable
                          onPress={() => {
                            setOffersSheetOpen(false);
                            router.push({
                              pathname: '/(screens)/chat/[taskId]',
                              params: { taskId: task.id },
                            } as any);
                          }}
                          className="h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white active:bg-ink-100"
                        >
                          <MessageSquare size={17} color="#2B3A41" />
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            rejectOffer(offer.id);
                            toast({ title: 'Offer declined', variant: 'info' });
                          }}
                          className="h-10 px-3 items-center justify-center rounded-xl active:bg-ink-100"
                        >
                          <Text className="font-geist-medium text-[12.5px] text-danger">
                            Decline
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View className="mt-3 pt-2 border-t border-ink-100 flex-row items-center justify-between">
                        <Chip
                          tone={offer.status === 'accepted' ? 'success' : 'neutral'}
                        >
                          {offer.status.toUpperCase()}
                        </Chip>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => {
                            setOffersSheetOpen(false);
                            router.push({
                              pathname: '/(screens)/chat/[taskId]',
                              params: { taskId: task.id },
                            } as any);
                          }}
                        >
                          Open chat
                        </Button>
                      </View>
                    )}
                  </View>
                );
              })}
              {offers.length > 0 && (
                <View className="mt-2">
                  <Button
                    variant="outline"
                    size="md"
                    onPress={() => {
                      setOffersSheetOpen(false);
                      router.push({
                        pathname: '/(screens)/task/[id]/offers',
                        params: { id: task.id },
                      } as any);
                    }}
                  >
                    View all offers & compare
                  </Button>
                </View>
              )}
            </View>
          )}
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
              toggleSaved(task.id);
              toast({
                title: saved ? 'Removed from saved' : 'Saved for later',
                variant: 'info',
              });
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
