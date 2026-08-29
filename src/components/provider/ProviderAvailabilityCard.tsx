import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { Toggle } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { shadows } from '@/utils/shadows';

export interface ProviderAvailabilityCardProps {
  className?: string;
  showDashboardButton?: boolean;
}

export function ProviderAvailabilityCard({
  className = '',
  showDashboardButton = true,
}: ProviderAvailabilityCardProps) {
  const router = useRouter();
  const { available, toggleAvailable } = useApp();

  return (
    <View
      className={`rounded-3xl border border-ink-200 bg-white p-4 ${className}`}
      style={[shadows.card, { gap: showDashboardButton ? 12 : 0 }]}
    >
      <Toggle
        checked={available}
        onChange={toggleAvailable}
        label={available ? 'Available for work' : 'Not accepting work'}
        description={
          available
            ? 'You appear in nearby searches and can send offers.'
            : 'You will not receive new opportunities until you switch back on.'
        }
      />
      {showDashboardButton && (
        <Button
          full
          size="md"
          variant="outline"
          icon={<LayoutDashboard size={16} color="#0C1417" />}
          onPress={() => router.push('/(screens)/provider-dashboard')}
        >
          Provider dashboard
        </Button>
      )}
    </View>
  );
}
