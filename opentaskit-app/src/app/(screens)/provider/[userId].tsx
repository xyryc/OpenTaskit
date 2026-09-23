import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  BadgeCheck,
  CalendarCheck,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { useAppSelector } from '@/store';
import { useGetPublicProfileQuery } from '@/store/api/apiSlice';
import { distance, initialsOf, monthYear, money, timeAgo } from '@/utils/format';
import { resolveImageSource } from '@/utils/images';
import { Screen, ScreenHeader, SectionHeader } from '@/components/layout/Screen';
import { Avatar, VerifiedPill } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { StarRating, StarRow } from '@/components/ui/Rating';
import { TrustStats } from '@/components/task/TrustStats';
import { BottomSheet } from '@/components/ui/Overlay';

export default function ProviderProfileScreen() {
  const { userId = '' } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { userById, offers, tasks, toast, requireAccount } = useApp();
  const authUser = useAppSelector((state) => state.auth.user);
  const [inviteOpen, setInviteOpen] = useState(false);

  const targetId = userId || authUser?.id || ME;
  const isMe = !!authUser?.id && targetId === authUser.id;

  const { data: profile } = useGetPublicProfileQuery(targetId, { skip: !targetId });
  const fallbackUser = userById(targetId);

  // Merge the real public-profile card onto the mock user so fields the
  // backend doesn't return yet (response/success rate, distance,
  // availability) stay as clearly-dummy placeholders.
  const user = React.useMemo(() => {
    if (!profile) return fallbackUser;
    return {
      ...fallbackUser,
      id: profile.id,
      name: profile.fullName || fallbackUser.name,
      avatarUrl: profile.avatarUrl ?? fallbackUser.avatarUrl,
      headline: profile.headline ?? fallbackUser.headline,
      about: profile.bio ?? fallbackUser.about,
      location: profile.location ?? fallbackUser.location,
      skills: profile.skills?.length ? profile.skills : fallbackUser.skills,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
      completedJobs: profile.stats.tasksCompleted,
      memberSince: monthYear(profile.memberSince),
    };
  }, [profile, fallbackUser]);

  const services = profile?.services ?? [];
  const portfolio = profile?.portfolio ?? [];

  const reviews = profile?.recentReviews ?? [];

  // Check if provider sent an offer to any of my tasks
  const theirOffer = offers.find(
    (offer) =>
      offer.providerId === targetId &&
      tasks.find((task) => task.id === offer.taskId)?.requesterId === ME
  );

  // My open tasks for inviting
  const myOpenTasks = tasks.filter(
    (task) =>
      task.requesterId === ME &&
      ['posted', 'receiving_offers'].includes(task.status)
  );

  const firstName = user.name.split(' ')[0] ?? 'Provider';
  // Dummy until the backend has real KYC/identity verification - every profile shows verified for now.
  const isVerified = true;

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title={user.name} subtitle={user.headline} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8 pt-4" style={{ gap: 20 }}>
          {/* Hero Identity Card */}
          <View className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm">
            <View className="flex-row items-start gap-4" style={{ gap: 14 }}>
              <Avatar user={{ ...user, verified: isVerified }} size="xl" showVerified />
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5">
                  <Text
                    numberOfLines={1}
                    className="text-[19px] font-geist-semibold tracking-[-0.03em] text-ink"
                  >
                    {user.name}
                  </Text>
                  {isVerified && (
                    <BadgeCheck size={18} color="#0094F7" />
                  )}
                </View>

                <View className="mt-1">
                  <StarRating
                    value={user.rating}
                    count={user.reviewCount}
                    size="md"
                  />
                </View>

                <View className="mt-1.5 flex-row items-center gap-1">
                  <MapPin size={13} color="#8A959B" />
                  <Text
                    numberOfLines={1}
                    className="font-geist text-[12.5px] text-ink-500"
                  >
                    {user.location} · {distance(user.distanceKm)} away
                  </Text>
                </View>
              </View>
            </View>

            {/* Badges / Chips Row */}
            <View className="mt-4 flex-row flex-wrap gap-2" style={{ gap: 8 }}>
              <VerifiedPill verified={isVerified} />
              <Chip tone={user.available ? 'success' : 'neutral'}>
                {user.available ? 'Available now' : 'Not accepting work'}
              </Chip>
              <Chip
                tone="outline"
                icon={<Clock size={13} color="#5B6A72" />}
              >
                Replies {user.respondsIn}
              </Chip>
              <Chip
                tone="outline"
                icon={<CalendarCheck size={13} color="#5B6A72" />}
              >
                Member since {user.memberSince}
              </Chip>
            </View>
          </View>

          {/* Trust & Performance */}
          <TrustStats
            stats={[
              { label: 'Completed', value: `${user.completedJobs} jobs` },
              { label: 'Success rate', value: `${user.successRate}%` },
              { label: 'Response rate', value: `${user.responseRate}%` },
              { label: 'Experience', value: `${user.experienceYears} yrs` },
            ]}
          />

          {/* Their Offer Banner (if they bid on my task) */}
          {theirOffer && (
            <View className="rounded-3xl border border-brand/40 bg-brand-tint/60 p-4">
              <Text className="text-[12px] font-geist-semibold uppercase tracking-[0.07em] text-brand-dark">
                Their offer to you
              </Text>
              <Text className="mt-1.5 text-[22px] font-geist-bold tracking-[-0.03em] text-ink">
                {money(theirOffer.price)}
              </Text>
              <Text className="font-geist-medium text-[13px] text-ink-700">
                {theirOffer.eta}
              </Text>
              <View className="mt-3">
                <Button
                  full
                  size="md"
                  variant="brand"
                  onPress={() =>
                    router.push({
                      pathname: '/(screens)/task/[id]',
                      params: { id: theirOffer.taskId },
                    } as any)
                  }
                >
                  Review this offer
                </Button>
              </View>
            </View>
          )}

          {/* About Section */}
          <View>
            <SectionHeader title="About" />
            <View className="rounded-3xl border border-ink-200 bg-white p-4">
              <Text className="font-geist text-[13.5px] leading-relaxed text-ink-700">
                {user.about}
              </Text>
            </View>
          </View>

          {/* Skills Section */}
          {user.skills.length > 0 && (
            <View>
              <SectionHeader title="Skills" />
              <View className="flex-row flex-wrap gap-2" style={{ gap: 8 }}>
                {user.skills.map((skill) => (
                  <Chip key={skill} tone="outline">
                    {skill}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Services Offered Section */}
          {services.length > 0 && (
            <View>
              <SectionHeader title="Services & rates" />
              <View className="divide-y divide-ink-100 rounded-3xl border border-ink-200 bg-white px-4">
                {services.map((service) => (
                  <View
                    key={service.id}
                    className="flex-row items-center justify-between py-3.5"
                  >
                    <Text className="font-geist text-[14px] text-ink">
                      {service.name}
                    </Text>
                    <Text className="font-geist-medium text-[13px] text-ink-500">
                      from {money(service.fromPrice)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="mt-2 px-1 font-geist text-[12px] leading-relaxed text-ink-400">
                Final price depends on the details of your task.
              </Text>
            </View>
          )}

          {/* Portfolio Section */}
          {portfolio.length > 0 && (
            <View>
              <SectionHeader title="Portfolio" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-5 px-5"
              >
                <View className="flex-row gap-2.5" style={{ gap: 10 }}>
                  {portfolio.map((item) => (
                    <View key={item.id} className="w-[170px]">
                      <Image
                        source={resolveImageSource(item.imageUrl)}
                        style={{ width: 170, height: 112, borderRadius: 16 }}
                        contentFit="cover"
                      />
                      <Text
                        numberOfLines={1}
                        className="mt-1.5 font-geist text-[12px] text-ink-500"
                      >
                        {item.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Reviews Section */}
          <View>
            <SectionHeader
              title={`Reviews (${profile?.reviewCount ?? reviews.length})`}
            />
            {reviews.length > 0 ? (
              <View className="gap-3" style={{ gap: 12 }}>
                {reviews.map((review) => (
                  <View
                    key={review.id}
                    className="rounded-3xl border border-ink-200 bg-white p-4"
                  >
                    <View className="flex-row items-start gap-3" style={{ gap: 12 }}>
                      <Pressable
                        onPress={() => {
                          if (review.fromUser?.id) {
                            router.push({
                              pathname: '/(screens)/provider/[userId]',
                              params: { userId: review.fromUser.id },
                            } as any);
                          }
                        }}
                        hitSlop={6}
                        className="active:opacity-80"
                      >
                        <Avatar
                          user={{
                            name: review.fromUser.fullName,
                            initials: initialsOf(review.fromUser.fullName),
                            tone: 'bg-brand-tint',
                            verified: false,
                            avatarUrl: review.fromUser.avatarUrl,
                          }}
                          size="sm"
                        />
                      </Pressable>
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-baseline justify-between gap-2">
                          <Pressable
                            className="flex-1 min-w-0"
                            onPress={() => {
                              if (review.fromUser?.id) {
                                router.push({
                                  pathname: '/(screens)/provider/[userId]',
                                  params: { userId: review.fromUser.id },
                                } as any);
                              }
                            }}
                            hitSlop={6}
                          >
                            <Text
                              numberOfLines={1}
                              className="text-[14px] font-geist-semibold text-ink active:text-brand"
                            >
                              {review.fromUser.fullName}
                            </Text>
                          </Pressable>
                          <Text className="shrink-0 font-geist text-[11.5px] text-ink-400">
                            {timeAgo(review.createdAt)}
                          </Text>
                        </View>
                        <View className="mt-1">
                          <StarRow value={review.rating} size={13} />
                        </View>
                        {review.task?.title && (
                          <Pressable
                            onPress={() => {
                              if (review.task?.id) {
                                router.push({
                                  pathname: '/(screens)/task/[id]',
                                  params: { id: review.task.id },
                                } as any);
                              }
                            }}
                            className="mt-1 active:opacity-75"
                          >
                            <Text
                              numberOfLines={1}
                              className="font-geist text-[12px] text-ink-500"
                            >
                              {review.task.title}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>

                    <Text className="mt-3 font-geist text-[13.5px] leading-relaxed text-ink-700">
                      {review.text}
                    </Text>

                    {review.task?.images && review.task.images.length > 0 && (
                      <View className="mt-3">
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="-mx-1"
                        >
                          <View className="flex-row gap-2 px-1" style={{ gap: 8 }}>
                            {review.task.images.map((imgUri, idx) => (
                              <Pressable
                                key={idx}
                                onPress={() => {
                                  if (review.task?.id) {
                                    router.push({
                                      pathname: '/(screens)/task/[id]',
                                      params: { id: review.task.id },
                                    } as any);
                                  }
                                }}
                                className="overflow-hidden rounded-2xl border border-ink-100 active:opacity-85"
                              >
                                <Image
                                  source={{ uri: imgUri }}
                                  style={{ width: 72, height: 72 }}
                                  contentFit="cover"
                                />
                              </Pressable>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    {review.tags.length > 0 && (
                      <View className="mt-3 flex-row flex-wrap gap-1.5" style={{ gap: 6 }}>
                        {review.tags.map((tag) => (
                          <Chip key={tag} tone="brand">
                            {tag}
                          </Chip>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="flex-row items-center gap-2 rounded-3xl border border-ink-200 bg-white p-4">
                <Star size={16} color="#8A959B" />
                <Text className="flex-1 font-geist text-[13.5px] text-ink-500">
                  No reviews yet on this profile.
                </Text>
              </View>
            )}
          </View>

          {/* Safety & Trust Callout */}
          <View
            className="flex-row items-start rounded-3xl bg-ink-100/80 p-4"
            style={{ gap: 10 }}
          >
            <ShieldCheck size={18} color="#0094F7" />
            <Text className="flex-1 font-geist text-[12.5px] leading-relaxed text-ink-700">
              Identity, phone and email are checked by OpenTaskit. Keep payments and chat in the app so you stay protected.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer Action */}
      <View
        className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        {isMe ? (
          <Button
            full
            size="lg"
            variant="brand"
            onPress={() => router.push('/(screens)/edit-profile')}
          >
            Edit my profile
          </Button>
        ) : (
          <Button
            full
            size="lg"
            variant="brand"
            onPress={() => {
              if (!requireAccount('post')) return;
              setInviteOpen(true);
            }}
          >
            Invite to a task
          </Button>
        )}
      </View>

      {/* MODAL: Invite to Task Bottom Sheet */}
      <BottomSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={`Invite ${firstName}`}
        description="Pick one of your open tasks and we will ask them to send an offer."
      >
        <View className="gap-2.5 pb-4" style={{ gap: 10 }}>
          {myOpenTasks.length === 0 ? (
            <View className="rounded-2xl bg-ink-100/70 p-4">
              <Text className="font-geist text-[13.5px] text-ink-500">
                You have no open tasks yet. Post one first and invite them to it.
              </Text>
            </View>
          ) : (
            myOpenTasks.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  setInviteOpen(false);
                  toast({
                    title: 'Invitation sent',
                    description: `${firstName} was invited to your task.`,
                    variant: 'success',
                  });
                }}
                className="flex-row items-center justify-between rounded-2xl border border-ink-200 bg-white p-4 active:bg-ink-100"
              >
                <View className="flex-1 min-w-0 mr-3">
                  <Text
                    numberOfLines={1}
                    className="font-geist-medium text-[14px] text-ink"
                  >
                    {t.title}
                  </Text>
                  <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                    {money(t.budget)} · {t.location}
                  </Text>
                </View>
                <Text className="font-geist-semibold text-[13px] text-brand">
                  Invite
                </Text>
              </Pressable>
            ))
          )}

          <Button
            full
            size="lg"
            variant="outline"
            onPress={() => {
              setInviteOpen(false);
              router.push('/(screens)/create');
            }}
          >
            Post a new task
          </Button>
        </View>
      </BottomSheet>
    </Screen>
  );
}
