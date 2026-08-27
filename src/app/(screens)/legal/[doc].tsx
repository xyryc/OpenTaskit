import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Screen, ScreenHeader } from '@/components/layout/Screen';

const LEGAL_DOCS: Record<
  string,
  {
    title: string;
    updated: string;
    sections: { heading: string; body: string }[];
  }
> = {
  terms: {
    title: 'Terms of service',
    updated: 'Updated 1 August 2026',
    sections: [
      {
        heading: '1. Who we are',
        body: 'OpenTaskit is a marketplace that connects people who need a service with people who can provide it. We are not the provider of the services listed and do not employ the people offering them.',
      },
      {
        heading: '2. One account, two roles',
        body: 'A single OpenTaskit account can request services and provide services. You are responsible for everything done under your account in either role.',
      },
      {
        heading: '3. Offers and agreements',
        body: 'When you accept an offer you enter into a direct agreement with that member for the price and scope shown. Changes should be agreed in the task chat so both sides have a record.',
      },
      {
        heading: '4. Payments and commission',
        body: 'For cash jobs the requester pays the provider directly. OpenTaskit charges the provider a 12% commission, deducted from their wallet when the job is settled.',
      },
      {
        heading: '5. Disputes',
        body: 'If something goes wrong either side can open a dispute. Payment is placed on hold while our team reviews the chat history and evidence, and we may decide full payment, partial payment, refund or no refund.',
      },
      {
        heading: '6. Prohibited conduct',
        body: 'No harassment, discrimination, off-platform payment requests, fake reviews or unsafe work. Accounts that break these rules can be suspended.',
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    updated: 'Updated 1 August 2026',
    sections: [
      {
        heading: 'What we collect',
        body: 'Account details, task content, approximate location, device information and — if you verify your identity — your document and selfie images.',
      },
      {
        heading: 'How location is used',
        body: 'We show the area of a task publicly, never the exact address. Distances are calculated on the fly and your precise location is never shared with other members.',
      },
      {
        heading: 'Identity documents',
        body: 'Verification documents are encrypted, used only to confirm who you are, and are never visible to other members. Only your “Verified” badge is public.',
      },
      {
        heading: 'Your controls',
        body: 'You can edit your details, turn location off, adjust notifications and delete your account at any time from Settings.',
      },
    ],
  },
  community: {
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
  },
};

export default function LegalDocScreen() {
  const { doc = 'terms' } = useLocalSearchParams<{ doc: string }>();
  const content = LEGAL_DOCS[doc] ?? LEGAL_DOCS.terms;

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader title={content.title} subtitle={content.updated} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-5 pb-12 pt-4" style={{ gap: 24 }}>
          {content.sections.map((section) => (
            <View key={section.heading}>
              <Text className="text-[15px] font-geist-semibold tracking-[-0.01em] text-ink">
                {section.heading}
              </Text>
              <Text className="mt-1.5 font-geist text-[13.5px] leading-relaxed text-ink-700">
                {section.body}
              </Text>
            </View>
          ))}

          <View className="mt-4 rounded-2xl bg-ink-100/70 p-4">
            <Text className="font-geist text-[12px] leading-relaxed text-ink-500">
              This is prototype copy written to show structure and tone — not final legal text.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
