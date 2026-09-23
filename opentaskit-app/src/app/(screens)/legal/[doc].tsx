import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FileWarning } from 'lucide-react-native';

import { useGetLegalDocumentQuery } from '@/store/api/apiSlice';
import { getApiErrorMessage } from '@/utils/apiError';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';

// Community guidelines aren't managed from the admin CMS (only Terms and
// Privacy are) so they stay as static in-app copy.
const COMMUNITY_GUIDELINES = {
  title: 'Community guidelines',
  updated: 'Updated 1 August 2026',
  sections: [
    {
      heading: 'Be clear and honest',
      body: 'Describe tasks accurately and only offer on work you can genuinely do at the price you quote.',
    },
    {
      heading: 'Show up and communicate',
      body: 'Arrive when you said you would. If plans change, say so in the task chat as early as you can.',
    },
    {
      heading: 'Keep it in the app',
      body: 'Chat, agreements and completion confirmations belong in OpenTaskit so both sides are protected if a dispute happens.',
    },
    {
      heading: 'Review fairly',
      body: 'Rate the experience you actually had. Reviews cannot be traded, bought or used to pressure someone.',
    },
  ],
};

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function LegalDocScreen() {
  const { doc = 'terms' } = useLocalSearchParams<{ doc: string }>();
  const isCommunity = doc === 'community';

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetLegalDocumentQuery(doc, { skip: isCommunity });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isCommunity) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title={COMMUNITY_GUIDELINES.title} subtitle={COMMUNITY_GUIDELINES.updated} />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="gap-6 px-5 pb-12 pt-4" style={{ gap: 24 }}>
            {COMMUNITY_GUIDELINES.sections.map((section) => (
              <View key={section.heading}>
                <Text className="text-[15px] font-geist-semibold tracking-[-0.01em] text-ink">
                  {section.heading}
                </Text>
                <Text className="mt-1.5 font-geist text-[13.5px] leading-relaxed text-ink-700">
                  {section.body}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title={doc === 'privacy' ? 'Privacy policy' : 'Terms of service'} />
        <View className="px-5 pt-4">
          <ListSkeleton count={5} />
        </View>
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen tone="canvas" edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title={doc === 'privacy' ? 'Privacy policy' : 'Terms of service'} />
        <View className="flex-1 items-center justify-center p-6">
          <EmptyState
            icon={<FileWarning size={32} color="#8A959B" />}
            title="Couldn't load this document"
            message={getApiErrorMessage(error, 'Please check your connection and try again.')}
            actionLabel="Retry"
            onAction={handleRefresh}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      <ScreenHeader
        title={data.title}
        subtitle={`Updated ${formatUpdated(data.updatedAt)} · v${data.version}`}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="gap-6 px-5 pb-12 pt-4" style={{ gap: 24 }}>
          {data.sections.map((section) => (
            <View key={section.id}>
              <Text className="text-[15px] font-geist-semibold tracking-[-0.01em] text-ink">
                {section.heading}
              </Text>
              <Text className="mt-1.5 font-geist text-[13.5px] leading-relaxed text-ink-700">
                {section.body}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
