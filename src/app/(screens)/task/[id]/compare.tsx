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
import { EmptyState } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/Rating';

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
  const { taskById, offersForTask, userById, acceptOffer } = useApp();

  const task = taskById(id);
  const offers = offersForTask(id).filter((offer) => offer.status === 'pending');
  const best = useMemo(
    () => bestMatchId(offers, userById, task?.budget ?? 0),
    [offers, userById, task?.budget]
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(best ?? offers[0]?.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    const provider = userById(offer.providerId);
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
                const provider = userById(offer.providerId);
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
                      {provider.name.split(' ')[0]}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-center text-[11px] font-geist text-ink-500"
                    >
                      {provider.headline}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Comparison matrix data rows */}
            <View className="mt-3 gap-2" style={{ gap: 8 }}>
              {ROWS.map((row) => (
                <View
                  key={row.key}
                  className="flex-row items-center gap-2.5"
                  style={{ gap: 10 }}
                >
                  <View className="w-[104px] shrink-0 justify-center">
                    <Text className="text-[12px] font-geist-medium uppercase tracking-[0.05em] text-ink-400">
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
            Accept {userById(selectedOffer.providerId).name.split(' ')[0]} (
            {money(selectedOffer.price)})
          </Button>
        </View>
      )}

      {/* Confirm Accept Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (selectedId) {
            acceptOffer(selectedId);
            setConfirmOpen(false);
            router.push({
              pathname: '/(screens)/job/[taskId]',
              params: { taskId: task.id },
            } as any);
          }
        }}
        title="Accept this offer?"
        message={
          selectedOffer
            ? `${
                userById(selectedOffer.providerId).name
              } will be assigned at ${money(
                selectedOffer.price
              )}. All other offers are declined automatically.`
            : ''
        }
        confirmLabel="Accept and assign"
      />
    </Screen>
  );
}
