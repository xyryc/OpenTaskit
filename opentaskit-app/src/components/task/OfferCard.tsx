import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Sparkles,
} from 'lucide-react-native';

import type { Offer } from '@/types';
import { distance, initialsOf, money, timeAgo } from '@/utils/format';
import { resolveImageSource } from '@/utils/images';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

interface OfferCardProps {
  offer: Offer;
  bestMatch?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export function OfferCard({
  offer,
  bestMatch,
  onAccept,
  onReject,
  showActions = true,
}: OfferCardProps) {
  const router = useRouter();
  const offerUser = (offer as any).user;
  const rawPortfolio = offerUser?.portfolio ?? offerUser?.portfolioItems;
  const providerName = offerUser?.fullName || 'Tasker';
  const provider = {
    id: offerUser?.id || offer.providerId || '',
    name: providerName,
    initials: initialsOf(providerName),
    avatarUrl: offerUser?.avatarUrl ?? undefined,
    rating: offerUser?.rating ?? 5.0,
    reviewCount: offerUser?.reviewCount ?? 0,
    verified: offerUser?.isVerified ?? false,
    distanceKm: 2.5,
    location: offerUser?.location || 'Colombo',
    respondsIn: 'within 1h',
    completedJobs: 0,
    tone: 'bg-brand text-white',
    portfolio: Array.isArray(rawPortfolio)
      ? rawPortfolio.map((item: any) => ({
          id: item.id,
          title: item.title || '',
          image: item.imageUrl || item.image,
        }))
      : [],
  };

  const navigateToProfile = () => {
    router.push({
      pathname: '/(screens)/provider/[userId]',
      params: { userId: provider.id },
    } as any);
  };

  return (
    <View
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
        bestMatch ? 'border-brand' : 'border-ink-200'
      }`}
    >
      {bestMatch && (
        <View
          className="flex-row items-center gap-1.5 bg-brand-tint px-4 py-2"
          style={{ gap: 6 }}
        >
          <Sparkles size={14} color="#0094F7" />
          <Text className="text-[11.5px] font-geist-bold uppercase tracking-[0.07em] text-brand">
            Best match
          </Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-start gap-3" style={{ gap: 12 }}>
          <Pressable onPress={navigateToProfile}>
            <Avatar user={provider} size="md" showVerified />
          </Pressable>

          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5">
              <Pressable onPress={navigateToProfile}>
                <Text
                  numberOfLines={1}
                  className="text-[15px] font-geist-semibold tracking-[-0.01em] text-ink"
                >
                  {provider.name}
                </Text>
              </Pressable>
              {provider.verified && (
                <BadgeCheck size={16} color="#0094F7" />
              )}
            </View>

            <View className="mt-1 flex-row flex-wrap items-center gap-1">
              <StarRating value={provider.rating} count={provider.reviewCount} size="sm" />
              <Text className="font-geist text-[12px] text-ink-500">
                · {provider.completedJobs} jobs · {distance(provider.distanceKm)}
              </Text>
            </View>
          </View>

          <View className="shrink-0 items-end">
            <Text className="text-[18px] font-geist-bold text-ink">
              {money(offer.price)}
            </Text>
            <Text className="text-[11px] font-geist text-ink-400">
              {timeAgo(offer.createdAt)}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-1.5" style={{ gap: 6 }}>
          {offer.eta ? (
            <Chip tone="outline" icon={<Clock size={12} color="#5A676E" />}>
              {offer.eta}
            </Chip>
          ) : null}
          {provider.completedJobs > 0 ? (
            <Chip tone="neutral">{provider.completedJobs} completed</Chip>
          ) : null}
          <Chip tone="neutral">Replies {provider.respondsIn}</Chip>
        </View>

        <Text
          numberOfLines={3}
          className="mt-3 text-[13.5px] font-geist leading-relaxed text-ink-700"
        >
          {offer.message}
        </Text>

        {offer.note && (
          <View className="mt-2 rounded-2xl bg-ink-100/70 px-3 py-2">
            <Text className="text-[12.5px] font-geist text-ink-700">
              Note: {offer.note}
            </Text>
          </View>
        )}

        {provider.portfolio.length > 0 && (
          <View className="mt-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-geist-medium text-[12px] text-ink-500">
                Portfolio ({provider.portfolio.length})
              </Text>
              <Pressable
                hitSlop={8}
                onPress={navigateToProfile}
                className="flex-row items-center"
              >
                <Text className="font-geist-medium text-[11.5px] text-brand">
                  View all →
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {provider.portfolio.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={navigateToProfile}
                  className="overflow-hidden rounded-xl border border-ink-100 bg-ink-50 active:opacity-90"
                >
                  <Image
                    source={resolveImageSource(item.image)}
                    style={{ width: 80, height: 58, borderRadius: 10 }}
                    contentFit="cover"
                    transition={200}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {offer.status === 'accepted' && (
          <View
            className="mt-3 flex-row items-center gap-2 rounded-2xl bg-success/10 px-3 py-2.5"
            style={{ gap: 8 }}
          >
            <CheckCircle2 size={16} color="#0E9F6E" />
            <Text className="font-geist-semibold text-[13px] text-success">
              Offer accepted
            </Text>
          </View>
        )}

        {offer.status === 'rejected' && (
          <View className="mt-3 rounded-2xl bg-ink-100 px-3 py-2.5">
            <Text className="font-geist-medium text-[13px] text-ink-500">
              Offer declined
            </Text>
          </View>
        )}

        {showActions && offer.status === 'pending' && (
          <View className="mt-4 gap-2" style={{ gap: 8 }}>
            <View className="flex-row gap-2" style={{ gap: 8 }}>
              <Button
                size="md"
                variant="outline"
                className="flex-1"
                onPress={navigateToProfile}
              >
                Profile
              </Button>
              <Button
                size="md"
                variant="outline"
                className="flex-1"
                icon={<MessageCircle size={16} color="#0C1417" />}
                onPress={() =>
                  router.push({
                    pathname: '/(screens)/chat/[taskId]',
                    params: { taskId: offer.taskId, otherUserId: provider.id },
                  } as any)
                }
              >
                Chat
              </Button>
            </View>

            <View className="flex-row gap-2" style={{ gap: 8 }}>
              {onReject && (
                <Button
                  size="md"
                  variant="ghost"
                  className="flex-1"
                  onPress={onReject}
                >
                  Decline
                </Button>
              )}
              {onAccept && (
                <Button
                  size="md"
                  variant="brand"
                  className="flex-1"
                  onPress={onAccept}
                >
                  Accept offer
                </Button>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
