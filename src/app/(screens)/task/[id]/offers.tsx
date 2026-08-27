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
import { GitCompare, Inbox } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { bestMatchId } from '@/utils/offerScore';
import { money } from '@/utils/format';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { OfferCard } from '@/components/task/OfferCard';
import { SelectChip } from '@/components/ui/Chip';

type SortKey = 'best' | 'lowest' | 'rating';

export default function TaskOffersScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskById, offersForTask, userById, acceptOffer, rejectOffer } = useApp();

  const [sort, setSort] = useState<SortKey>('best');
  const [pendingAccept, setPendingAccept] = useState<string | null>(null);
  const [pendingReject, setPendingReject] = useState<string | null>(null);

  const task = taskById(id);
  const offers = offersForTask(id);
  const best = useMemo(
    () => bestMatchId(offers, userById, task?.budget ?? 0),
    [offers, userById, task?.budget]
  );

  const sorted = useMemo(() => {
    const list = [...offers];
    if (sort === 'lowest') list.sort((a, b) => a.price - b.price);
    if (sort === 'rating') {
      list.sort(
        (a, b) => userById(b.providerId).rating - userById(a.providerId).rating
      );
    }
    if (sort === 'best') {
      list.sort((a, b) => (a.id === best ? -1 : b.id === best ? 1 : 0));
    }
    return list;
  }, [offers, sort, best, userById]);

  if (!task) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Offers" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-geist text-[14px] text-ink-500">
            Task not found.
          </Text>
        </View>
      </Screen>
    );
  }

  const acceptTarget = offers.find((offer) => offer.id === pendingAccept);

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title={`${offers.length} ${offers.length === 1 ? 'offer' : 'offers'}`}
        subtitle={task.title}
        actions={
          offers.length > 1 ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(screens)/task/[id]/compare',
                  params: { id: task.id },
                } as any)
              }
              className="flex-row items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 active:bg-ink-700"
              style={{ gap: 6 }}
            >
              <GitCompare size={14} color="#FFFFFF" />
              <Text className="font-geist-medium text-[12.5px] text-white">
                Compare
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-4">
          {offers.length === 0 ? (
            <View className="py-12">
              <EmptyState
                icon={<Inbox size={32} color="#8A959B" />}
                title="No offers yet"
                message="Most tasks get their first offer within an hour. Sharing your task speeds it up."
                actionLabel="Back to task"
                onAction={() => router.push(`/task/${task.id}` as any)}
              />
            </View>
          ) : (
            <View className="gap-4" style={{ gap: 16 }}>
              {/* Sort Chips */}
              <View className="flex-row items-center gap-2" style={{ gap: 8 }}>
                <Text className="font-geist text-[12.5px] text-ink-500">
                  Sort:
                </Text>
                <SelectChip
                  selected={sort === 'best'}
                  onPress={() => setSort('best')}
                >
                  Best match
                </SelectChip>
                <SelectChip
                  selected={sort === 'lowest'}
                  onPress={() => setSort('lowest')}
                >
                  Lowest price
                </SelectChip>
                <SelectChip
                  selected={sort === 'rating'}
                  onPress={() => setSort('rating')}
                >
                  Top rated
                </SelectChip>
              </View>

              {/* Offer Cards */}
              <View className="gap-3" style={{ gap: 12 }}>
                {sorted.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    bestMatch={offer.id === best && offer.status === 'pending'}
                    onAccept={() => setPendingAccept(offer.id)}
                    onReject={() => setPendingReject(offer.id)}
                  />
                ))}
              </View>

              {offers.length > 1 && (
                <View className="mt-2">
                  <Button
                    full
                    size="lg"
                    variant="outline"
                    icon={<GitCompare size={16} color="#0C1417" />}
                    onPress={() =>
                      router.push({
                        pathname: '/(screens)/task/[id]/compare',
                        params: { id: task.id },
                      } as any)
                    }
                  >
                    Compare all offers side by side
                  </Button>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirm Accept Dialog */}
      <ConfirmDialog
        open={!!pendingAccept}
        onClose={() => setPendingAccept(null)}
        onConfirm={() => {
          if (pendingAccept) {
            acceptOffer(pendingAccept);
            setPendingAccept(null);
            router.push({
              pathname: '/(screens)/job/[taskId]',
              params: { taskId: task.id },
            } as any);
          }
        }}
        title="Accept this offer?"
        message={
          acceptTarget
            ? `${userById(acceptTarget.providerId).name} will be assigned at ${money(
                acceptTarget.price
              )}. All other offers are declined automatically.`
            : ''
        }
        confirmLabel="Accept and assign"
      />

      {/* Confirm Decline Dialog */}
      <ConfirmDialog
        open={!!pendingReject}
        onClose={() => setPendingReject(null)}
        onConfirm={() => {
          if (pendingReject) {
            rejectOffer(pendingReject);
            setPendingReject(null);
          }
        }}
        title="Decline this offer?"
        message="They will be told the offer was not accepted. You can still message them afterwards."
        confirmLabel="Decline offer"
        tone="danger"
      />
    </Screen>
  );
}
