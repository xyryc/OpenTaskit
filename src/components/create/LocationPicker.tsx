import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useApp } from '@/contexts/AppContext';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/Segmented';

const areas = [
  'Kirulapone, Colombo 05',
  'Havelock Town, Colombo 05',
  'Ward Place, Colombo 07',
  'Wellawatte, Colombo 06',
  'Nugegoda',
  'Rajagiriya',
  'Battaramulla',
  'Dehiwala',
  'Mount Lavinia',
];

export interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
}

export function LocationPicker({ open, onClose, onSelect }: LocationPickerProps) {
  const { currentLocation, locationPermission, setLocationPermission } = useApp();
  const [mode, setMode] = useState<'search' | 'map'>('search');
  const [query, setQuery] = useState('');

  const choose = (loc: string) => {
    onSelect(loc);
    onClose();
  };

  const filteredAreas = areas.filter((area) =>
    area.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Set task location"
      description="Choose where this task needs to happen."
    >
      <SegmentedControl
        options={[
          { value: 'search', label: 'Search' },
          { value: 'map', label: 'Pick on map' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'search' ? (
        <View className="mt-4 pb-2">
          {/* Use Current Location Card */}
          <Pressable
            onPress={() => {
              if (locationPermission !== 'granted') {
                setLocationPermission('granted');
              }
              choose(currentLocation === 'Location off' ? areas[0] : currentLocation);
            }}
            className="flex-row items-center gap-3 rounded-2xl border border-brand/40 bg-brand-tint/50 p-4 active:bg-brand-tint"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
              <Navigation size={18} color="#0094F7" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[14px] font-geist-semibold text-ink">
                Use my current location
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-[12.5px] font-geist text-ink-500">
                {locationPermission === 'granted'
                  ? currentLocation
                  : 'Tap to allow location access'}
              </Text>
            </View>
          </Pressable>

          {/* Search Input */}
          <View className="mt-3">
            <SearchInput
              placeholder="Search area, street or city"
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
            />
          </View>

          {/* Suggested Areas List */}
          <View className="mt-2 divide-y divide-ink-100">
            {filteredAreas.map((area) => (
              <Pressable
                key={area}
                onPress={() => choose(area)}
                className="flex-row items-center gap-3 py-3.5 active:bg-ink-100/60 rounded-xl px-1"
              >
                <MapPin size={18} color="#8A959B" />
                <Text className="flex-1 font-geist text-[14.5px] text-ink">
                  {area}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View className="mt-4 pb-2">
          {/* Visual Map Canvas with Centered Pin */}
          <View className="relative h-56 w-full overflow-hidden rounded-3xl border border-ink-200 bg-[#e8f1ed]">
            <Svg
              height="100%"
              width="100%"
              viewBox="0 0 400 220"
              preserveAspectRatio="xMidYMid slice"
            >
              <Path
                d="M-20 60 L200 30 L420 100"
                stroke="#ffffff"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M-20 160 L160 150 L420 190"
                stroke="#ffffff"
                strokeWidth="9"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M100 -20 L130 120 L80 260"
                stroke="#ffffff"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M260 -20 L240 110 L300 260"
                stroke="#ffffff"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
              />
              <Rect x="20" y="70" width="60" height="40" rx="6" fill="#dfeae7" />
              <Rect x="160" y="110" width="70" height="50" rx="6" fill="#e2ebe9" />
              <Rect x="200" y="40" width="50" height="35" rx="6" fill="#e4ecea" />
            </Svg>

            <View className="pointer-events-none absolute inset-0 items-center justify-center">
              <View className="items-center" style={{ marginBottom: 16 }}>
                <MapPin size={34} color="#0094F7" fill="#0094F7" />
              </View>
            </View>
          </View>

          <Text className="mt-3 font-geist text-[13px] text-ink-500">
            Drag the map to move the pin. We use this to show distance to nearby helpers.
          </Text>

          <View className="mt-3">
            <Button
              full
              variant="brand"
              onPress={() => choose('Pinned location · Colombo 05')}
            >
              Use this location
            </Button>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
