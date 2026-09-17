import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, Minus, Sparkles } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { bestMatchId } from '@/utils/offerScore';
import { distance, money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { EmptyState, TaskCardSkeleton } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/Rating';
import {
  useGetTaskByIdQuery,
  useGetOffersForTaskQuery,
  useAcceptOfferMutation,
} from '@/store/api/apiSlice';
import { mapApiTaskToTask, mapApiOfferToOffer } from '@/utils/taskFilters';

const ROWS = [
  { key: 'price', label: 'Price' },
  { key: 'eta', label: 'Completion' },
  { key: 'rating', label: 'Rating' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'jobs', label: 'Completed jobs' },
  { key: 'distance', label: 'Distance' },
  { key: 'experience', label: 'Experience' },
  { key: 'verified', label: 'Verified ID' },
  { key: 'portfolio', label: 'Portfolio' },
] as const;

export default function CompareOffersScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskById, offersForTask, userById, acceptOffer: localAcceptOffer, toast } = useApp();

  const { data: apiTaskData, isLoading: isTaskLoading } = useGetTaskByIdQuery(id, { skip: !id });
  const { data: apiOffersData, isLoading: isOffersLoading } = useGetOffersForTaskQuery(id, { skip: !id });
  const [acceptOfferApi] = useAcceptOfferMutation();

  const task = useMemo(
    () => (apiTaskData ? mapApiTaskToTask(apiTaskData) : taskById(id)),
    [apiTaskData, taskById, id]
  );

  const offers = useMemo(() => {
    if (apiOffersData) {
      return apiOffersData.map(mapApiOfferToOffer).filter((offer) => offer.status === 'pending');
    }
    return offersForTask(id).filter((offer) => offer.status === 'pending');
  }, [apiOffersData, offersForTask, id]);

  const best = useMemo(
    () => bestMatchId(offers, userById, task?.budget ?? 0),
    [offers, userById, task?.budget]
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(best ?? offers[0]?.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const resolveProvider = (offer: (typeof offers)[number]) => {
    const fallback = userById(offer.providerId);
    const offerUser = (offer as any).user;
    return offerUser
      ? {
          ...fallback,
          id: offerUser.id,
          name: offerUser.fullName || fallback.name,
          avatarUrl: offerUser.avatarUrl ?? fallback.avatarUrl,
          rating: offerUser.rating ?? fallback.rating,
          reviewCount: offerUser.reviewCount ?? fallback.reviewCount,
          verified: offerUser.isVerified ?? fallback.verified,
        }
      : fallback;
  };

  if (isTaskLoading || isOffersLoading) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Compare offers" />
        <View className="p-5 gap-3" style={{ gap: 12 }}>
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </View>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Compare offers" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-ink-500">
            Task not found.
          </Text>
        </View>
      </Screen>
    );
  }

  const selectedOffer = offers.find((o) => o.id === selectedId);

  if (offers.length === 0) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Compare offers" subtitle={task.title} />
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            icon={<Minus size={32} color="#8A959B" />}
            title="Nothing to compare yet"
            message="Once you have two or more open offers you can line them up side by side here."
            actionLabel="Back to task"
            onAction={() => router.push(`/task/${task.id}` as any)}
          />
        </View>
      </Screen>
    );
  }

  const renderCellValue = (
    offerId: string,
    key: (typeof ROWS)[number]['key']
  ) => {
    const offer = offers.find((o) => o.id === offerId)!;
    const provider = resolveProvider(offer);
    switch (key) {
      case 'price':
        return (
          <Text className="text-[15px] font-geist-bold text-ink">
            {money(offer.price)}
          </Text>
        );
      case 'eta':
        return (
          <Text className="font-geist text-[12.5px] text-ink-700">
            {offer.eta}
          </Text>
        );
      case 'rating':
        return <StarRating value={provider.rating} showValue size="sm" />;
      case 'reviews':
        return (
          <Text className="font-geist text-[13px] text-ink-700">
            {provider.reviewCount} reviews
          </Text>
        );
      case 'jobs':
        return (
          <Text className="font-geist text-[13px] text-ink-700">
            {provider.completedJobs}
          </Text>
        );
      case 'distance':
        return (
          <Text className="font-geist text-[13px] text-ink-700">
            {distance(provider.distanceKm)}
          </Text>
        );
      case 'experience':
        return (
          <Text className="font-geist text-[13px] text-ink-700">
            {provider.experienceYears} yrs
          </Text>
        );
      case 'verified':
        return provider.verified ? (
          <BadgeCheck size={18} color="#0094F7" />
        ) : (
          <Text className="font-geist text-[12.5px] text-ink-400">Not yet</Text>
        );
      case 'portfolio':
        return (
          <Text className="font-geist text-[13px] text-ink-700">
            {provider.portfolio.length
              ? `${provider.portfolio.length} items`
              : '—'}
          </Text>
        );
      default:
        return null;
    }
  };

  const selectedProvider = selectedOffer ? resolveProvider(selectedOffer) : undefined;
  const selectedProviderName = selectedProvider?.name ?? 'Tasker';

  const handleConfirmAccept = async () => {
    if (!selectedId || !task) return;
    const offerIdToAccept = selectedId;
    try {
      const res = await acceptOfferApi({ offerId: offerIdToAccept, taskId: task.id }).unwrap();
      toast({
        title: 'Offer accepted!',
        description: res.message || 'Task has been assigned.',
        variant: 'success',
      });
      localAcceptOffer(offerIdToAccept);
      setConfirmOpen(false);
      router.push({
        pathname: '/(screens)/job/[taskId]',
        params: { taskId: task.id },
      } as any);
    } catch (err: any) {
      toast({
        title: 'Could not accept offer',
        description: err?.data?.message || err?.message || 'Something went wrong',
        variant: 'error',
      });
    }
  };

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title="Compare offers"
        subtitle={`${offers.length} open offers · ${task.title}`}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-4"
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          <View>
            {/* Header row with provider columns */}
            <View className="flex-row items-end gap-2.5" style={{ gap: 10 }}>
              <View className="w-[104px] shrink-0" />
              {offers.map((offer) => {
                const provider = resolveProvider(offer);
                const isBest = offer.id === best;
                const isSelected = offer.id === selectedId;

                return (
                  <Pressable
                    key={offer.id}
                    onPress={() => setSelectedId(offer.id)}
                    className={`w-[136px] shrink-0 items-center rounded-3xl border p-3.5 shadow-sm active:opacity-80 ${
                      isSelected
                        ? 'border-brand bg-brand-tint/60'
                        : 'border-ink-200 bg-white'
                    }`}
                  >
                    {isBest && (
                      <View
                        className="mb-1.5 flex-row items-center gap-1 rounded-full bg-brand px-2 py-0.5"
                        style={{ gap: 4 }}
                      >
                        <Sparkles size={10} color="#FFFFFF" />
                        <Text className="text-[9.5px] font-geist-bold uppercase tracking-[0.06em] text-white">
                          Best
                        </Text>
                      </View>
                    )}
                    <Avatar user={provider} size="md" showVerified />
                    <Text
                      numberOfLines={1}
                      className="mt-2 text-center text-[13px] font-geist-semibold text-ink"
                    >
                      {provider.name}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <StarRating value={provider.rating} size="sm" />
                      <Text className="font-geist text-[11px] text-ink-500">
                        ({provider.reviewCount})
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Comparison Rows */}
            <View className="mt-4 gap-2" style={{ gap: 8 }}>
              {ROWS.map((row) => (
                <View
                  key={row.key}
                  className="flex-row items-center gap-2.5"
                  style={{ gap: 10 }}
                >
                  <View className="w-[104px] shrink-0 justify-center">
                    <Text className="font-geist-medium text-[12.5px] text-ink-500">
                      {row.label}
                    </Text>
                  </View>

                  {offers.map((offer) => (
                    <View
                      key={offer.id}
                      className={`h-12 w-[136px] shrink-0 items-center justify-center rounded-2xl border ${
                        offer.id === selectedId
                          ? 'border-brand/40 bg-brand-tint/30'
                          : 'border-ink-200 bg-white'
                      }`}
                    >
                      {renderCellValue(offer.id, row.key)}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* Sticky Footer */}
      {selectedOffer && (
        <View
          className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
        >
          <Button
            full
            size="lg"
            variant="brand"
            onPress={() => setConfirmOpen(true)}
          >
            Accept {selectedProviderName.split(' ')[0]} (
            {money(selectedOffer.price)})
          </Button>
        </View>
      )}

      {/* Confirm Accept Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAccept}
        title="Accept this offer?"
        message={
          selectedOffer
            ? `${selectedProviderName} will be assigned at ${money(
                selectedOffer.price
              )}. All other offers are declined automatically.`
            : ''
        }
        confirmLabel="Accept and assign"
      />
    </Screen>
  );
}
