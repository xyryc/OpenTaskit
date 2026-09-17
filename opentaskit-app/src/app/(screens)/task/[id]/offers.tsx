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
import { EmptyState, TaskCardSkeleton } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { OfferCard } from '@/components/task/OfferCard';
import { SelectChip } from '@/components/ui/Chip';
import {
  useGetTaskByIdQuery,
  useGetOffersForTaskQuery,
  useAcceptOfferMutation,
  useRejectOfferMutation,
} from '@/store/api/apiSlice';
import { mapApiTaskToTask, mapApiOfferToOffer } from '@/utils/taskFilters';

type SortKey = 'best' | 'lowest' | 'rating';

export default function TaskOffersScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskById, offersForTask, userById, acceptOffer: localAcceptOffer, rejectOffer: localRejectOffer, toast } = useApp();

  const { data: apiTaskData, isLoading: isTaskLoading } = useGetTaskByIdQuery(id, { skip: !id });
  const { data: apiOffersData, isLoading: isOffersLoading } = useGetOffersForTaskQuery(id, { skip: !id });

  const [acceptOfferApi] = useAcceptOfferMutation();
  const [rejectOfferApi] = useRejectOfferMutation();

  const [sort, setSort] = useState<SortKey>('best');
  const [pendingAccept, setPendingAccept] = useState<string | null>(null);
  const [pendingReject, setPendingReject] = useState<string | null>(null);

  const task = useMemo(
    () => (apiTaskData ? mapApiTaskToTask(apiTaskData) : taskById(id)),
    [apiTaskData, taskById, id]
  );

  const offers = useMemo(() => {
    if (apiOffersData) {
      return apiOffersData.map(mapApiOfferToOffer);
    }
    return offersForTask(id);
  }, [apiOffersData, offersForTask, id]);

  const best = useMemo(
    () => bestMatchId(offers, userById, task?.budget ?? 0),
    [offers, userById, task?.budget]
  );

  const sorted = useMemo(() => {
    const list = [...offers];
    if (sort === 'lowest') list.sort((a, b) => a.price - b.price);
    if (sort === 'rating') {
      list.sort((a, b) => {
        const ratingB = (b as any).user?.rating ?? userById(b.providerId).rating;
        const ratingA = (a as any).user?.rating ?? userById(a.providerId).rating;
        return ratingB - ratingA;
      });
    }
    if (sort === 'best') {
      list.sort((a, b) => (a.id === best ? -1 : b.id === best ? 1 : 0));
    }
    return list;
  }, [offers, sort, best, userById]);

  if (isTaskLoading || isOffersLoading) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <ScreenHeader title="Offers" />
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
  const acceptTargetName =
    (acceptTarget as any)?.user?.fullName ||
    userById(acceptTarget?.providerId ?? '')?.name ||
    'Tasker';

  const handleConfirmAccept = async () => {
    if (!pendingAccept || !task) return;
    const offerIdToAccept = pendingAccept;
    try {
      const res = await acceptOfferApi({ offerId: offerIdToAccept, taskId: task.id }).unwrap();
      toast({
        title: 'Offer accepted!',
        description: res.message || 'Task is now assigned.',
        variant: 'success',
      });
      localAcceptOffer(offerIdToAccept);
      setPendingAccept(null);
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

  const handleConfirmReject = async () => {
    if (!pendingReject || !task) return;
    const offerIdToReject = pendingReject;
    try {
      const res = await rejectOfferApi({ offerId: offerIdToReject, taskId: task.id }).unwrap();
      toast({
        title: 'Offer declined',
        description: res.message || 'Offer has been declined.',
        variant: 'info',
      });
      localRejectOffer(offerIdToReject);
      setPendingReject(null);
    } catch (err: any) {
      toast({
        title: 'Could not decline offer',
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
        onConfirm={handleConfirmAccept}
        title="Accept this offer?"
        message={
          acceptTarget
            ? `${acceptTargetName} will be assigned at ${money(
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
        onConfirm={handleConfirmReject}
        title="Decline this offer?"
        message="They will be told the offer was not accepted. You can still message them afterwards."
        confirmLabel="Decline offer"
        tone="danger"
      />
    </Screen>
  );
}
