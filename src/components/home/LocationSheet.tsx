import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MapPin, Navigation, ShieldOff } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';

const suggestions = [
  'Kirulapone, Colombo 05',
  'Ward Place, Colombo 07',
  'Wellawatte',
  'Nugegoda',
  'Rajagiriya',
];

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locationPermission, setLocationPermission, currentLocation, toast } = useApp();
  const [query, setQuery] = useState('');

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Your location"
      description="Used to show tasks and people near you."
    >
      {locationPermission !== 'granted' ? (
        <View className="rounded-3xl border border-ink-200 bg-canvas p-4">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-warning/15">
            <ShieldOff size={22} color="#B4690E" />
          </View>
          <Text className="mt-3 text-[15px] font-geist-bold font-bold text-ink">
            Location is turned off
          </Text>
          <Text className="font-geist mt-1 text-[13px] leading-relaxed text-ink-500">
            Without location we cannot show distance or nearby tasks. You can still search by area name below.
          </Text>
          <Button
            size="md"
            className="mt-3"
            full
            variant="brand"
            onPress={() => {
              setLocationPermission('granted');
              toast({ title: 'Location enabled', variant: 'success' });
            }}
          >
            Allow location access
          </Button>
        </View>
      ) : (
        <View className="flex-row items-center gap-3 rounded-3xl border border-brand/40 bg-brand-tint/60 p-4">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            <Navigation size={20} color="#0094F7" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-[11.5px] font-geist-bold font-bold uppercase tracking-wider text-brand-dark">
              Current location
            </Text>
            <Text numberOfLines={1} className="text-[14.5px] font-geist-semibold font-semibold text-ink">
              {currentLocation}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setLocationPermission('denied');
              toast({ title: 'Location turned off', description: 'Distances are hidden now.', variant: 'info' });
            }}
          >
            <Text className="text-[12.5px] font-geist-semibold font-semibold text-ink-500">Turn off</Text>
          </Pressable>
        </View>
      )}

      <View className="mt-4">
        <SearchInput
          placeholder="Search an area or city"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
        />
      </View>

      <View className="mt-2 divide-y divide-ink-100">
        {filtered.map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              toast({ title: `Showing tasks near ${item}`, variant: 'success' });
              onClose();
            }}
            className="flex-row items-center gap-3 py-3.5"
          >
            <MapPin size={18} color="#8A959B" />
            <Text className="font-geist text-[14.5px] text-ink">{item}</Text>
          </Pressable>
        ))}

        {filtered.length === 0 && (
          <View className="py-6 items-center">
            <Text className="font-geist text-[13.5px] text-ink-500">No areas match "{query}".</Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}
