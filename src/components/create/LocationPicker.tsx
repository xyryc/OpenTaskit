import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { MapPin, Navigation, Search } from 'lucide-react-native';
import * as Location from 'expo-location';

import { useApp } from '@/contexts/AppContext';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/Segmented';
import { LeafletMap, Coordinates } from './LeafletMap';

const DEFAULT_AREAS = [
  'Kirulapone, Colombo 05',
  'Havelock Town, Colombo 05',
  'Ward Place, Colombo 07',
  'Wellawatte, Colombo 06',
  'Nugegoda, Western Province',
  'Rajagiriya, Western Province',
  'Battaramulla, Western Province',
  'Dehiwala, Western Province',
  'Mount Lavinia, Western Province',
];

export interface SearchResultItem {
  id: string;
  primaryText: string;
  secondaryText: string;
  fullAddress: string;
  lat: number;
  lng: number;
}

export interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
}

export function LocationPicker({ open, onClose, onSelect }: LocationPickerProps) {
  const {
    currentLocation,
    setCurrentLocation,
    locationPermission,
    setLocationPermission,
    toast,
  } = useApp();

  const [mode, setMode] = useState<'search' | 'map'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Map state
  const [mapCoords, setMapCoords] = useState<Coordinates>({
    lat: 6.9271,
    lng: 79.8612,
  });
  const [resolvedMapLocation, setResolvedMapLocation] = useState('Colombo 05, Sri Lanka');
  const [isResolvingMap, setIsResolvingMap] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const choose = useCallback(
    (loc: string) => {
      onSelect(loc);
      onClose();
    },
    [onSelect, onClose]
  );

  // 1. Live GPS Location Detection
  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);

      // Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission('denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access in your device settings to detect your current position.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLocationPermission('granted');

      // Fetch GPS position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const coords = { lat: latitude, lng: longitude };
      setMapCoords(coords);

      // Reverse geocode via OpenStreetMap Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'OpenTaskit/1.0 (contact@opentaskit.com)',
          Accept: 'application/json',
        },
      });

      let resolved = 'Current Location';
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const parts: string[] = [];
        if (addr.road) parts.push(addr.road);
        const neighborhood = addr.suburb || addr.neighbourhood || addr.residential;
        if (neighborhood && !parts.includes(neighborhood)) parts.push(neighborhood);
        const city = addr.city || addr.town || addr.village || addr.county;
        if (city && !parts.includes(city)) parts.push(city);

        resolved =
          parts.length > 0
            ? parts.join(', ')
            : data.display_name.split(',').slice(0, 3).join(',').trim();
      }

      // Update app-wide state and confirm selection
      setCurrentLocation(resolved);
      setResolvedMapLocation(resolved);
      toast({
        title: 'Location detected',
        description: resolved,
        variant: 'success',
      });
      choose(resolved);
    } catch (err) {
      console.error('Error detecting location:', err);
      Alert.alert(
        'Unable to Fetch Location',
        'Could not determine your current position. Please make sure location services are turned on, or select an area manually.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  // 2. Live Nominatim Search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query.trim()
        )}&format=json&addressdetails=1&countrycodes=lk&limit=8`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'OpenTaskit/1.0 (contact@opentaskit.com)',
            Accept: 'application/json',
          },
        });

        if (!res.ok) throw new Error('Search failed');

        const data = await res.json();
        const items: SearchResultItem[] = data.map((item: any) => {
          const addr = item.address || {};
          const primary =
            addr.suburb ||
            addr.neighbourhood ||
            addr.road ||
            addr.town ||
            addr.city ||
            item.name ||
            item.display_name.split(',')[0];

          const secondaryParts = [
            addr.city || addr.town || addr.county,
            addr.state,
          ].filter(Boolean);

          const secondary = secondaryParts.join(', ') || 'Sri Lanka';

          return {
            id: String(item.place_id),
            primaryText: primary,
            secondaryText: secondary,
            fullAddress: `${primary}, ${secondary}`,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });

        setSearchResults(items);
      } catch (err) {
        console.error('Nominatim search error:', err);
        // Fallback to filtering default areas
        const localMatches = DEFAULT_AREAS.filter((a) =>
          a.toLowerCase().includes(query.toLowerCase())
        ).map((a, idx) => ({
          id: `local-${idx}`,
          primaryText: a.split(',')[0],
          secondaryText: a.split(',').slice(1).join(',').trim() || 'Sri Lanka',
          fullAddress: a,
          lat: 6.9271,
          lng: 79.8612,
        }));
        setSearchResults(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query]);

  // 3. Map Center Change & Reverse Geocoding
  const handleMapMoveStart = useCallback(() => {
    setIsResolvingMap(true);
  }, []);

  const handleMapCenterChange = useCallback((coords: Coordinates) => {
    setMapCoords(coords);

    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
    }

    setIsResolvingMap(true);
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'OpenTaskit/1.0 (contact@opentaskit.com)',
            Accept: 'application/json',
          },
        });

        if (!res.ok) throw new Error('Reverse geocode failed');

        const data = await res.json();
        const addr = data.address || {};

        const parts: string[] = [];
        if (addr.road) parts.push(addr.road);
        const neighborhood = addr.suburb || addr.neighbourhood || addr.residential;
        if (neighborhood && !parts.includes(neighborhood)) parts.push(neighborhood);
        const city = addr.city || addr.town || addr.village || addr.county;
        if (city && !parts.includes(city)) parts.push(city);

        const resolved =
          parts.length > 0
            ? parts.join(', ')
            : data.display_name.split(',').slice(0, 3).join(',').trim();

        setResolvedMapLocation(resolved);
      } catch (err) {
        console.error('Reverse geocode error:', err);
        setResolvedMapLocation('Pinned location · Colombo 05');
      } finally {
        setIsResolvingMap(false);
      }
    }, 400);
  }, []);

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
          {/* Use Current Location Card (when not searching) */}
          {!query && (
            <Pressable
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
              className="mb-3 flex-row items-center gap-3 rounded-2xl border border-brand/40 bg-brand-tint/50 p-4 active:bg-brand-tint"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                {isLocating ? (
                  <ActivityIndicator size="small" color="#0094F7" />
                ) : (
                  <Navigation size={18} color="#0094F7" />
                )}
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[14px] font-geist-semibold text-ink">
                  {isLocating ? 'Locating your position…' : 'Use my current location'}
                </Text>
                <Text numberOfLines={1} className="mt-0.5 text-[12.5px] font-geist text-ink-500">
                  {isLocating
                    ? 'Accessing GPS and resolving address…'
                    : locationPermission === 'granted'
                    ? currentLocation
                    : 'Tap to allow location access'}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Search Input Field */}
          <View>
            <SearchInput
              placeholder="Search area, street or city in Sri Lanka…"
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
            />
          </View>

          {/* Loading Indicator */}
          {isSearching && (
            <View className="flex-row items-center justify-center py-4 gap-2">
              <ActivityIndicator size="small" color="#0094F7" />
              <Text className="font-geist text-[13px] text-ink-400">
                Searching OpenStreetMap…
              </Text>
            </View>
          )}

          {/* Search Results / Default Areas */}
          <ScrollView
            className="mt-2 max-h-[280px]"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {query.trim().length >= 2 ? (
              searchResults.length > 0 ? (
                <View className="divide-y divide-ink-100">
                  {searchResults.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => choose(item.fullAddress)}
                      className="flex-row items-center gap-3 py-3.5 active:bg-ink-100/60 rounded-xl px-1"
                    >
                      <View className="h-8 w-8 items-center justify-center rounded-lg bg-ink-100">
                        <MapPin size={16} color="#5B6A72" />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text numberOfLines={1} className="font-geist-medium text-[14px] text-ink">
                          {item.primaryText}
                        </Text>
                        <Text numberOfLines={1} className="font-geist text-[12px] text-ink-400">
                          {item.secondaryText}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : !isSearching ? (
                <View className="py-6 items-center">
                  <Text className="font-geist text-[13.5px] text-ink-500">
                    No matching places found. Try another search.
                  </Text>
                </View>
              ) : null
            ) : (
              <View className="divide-y divide-ink-100">
                <Text className="mb-1 mt-2 text-[12px] font-geist-medium uppercase tracking-[0.06em] text-ink-400">
                  Popular areas
                </Text>
                {DEFAULT_AREAS.map((area) => (
                  <Pressable
                    key={area}
                    onPress={() => choose(area)}
                    className="flex-row items-center gap-3 py-3.5 active:bg-ink-100/60 rounded-xl px-1"
                  >
                    <MapPin size={17} color="#8A959B" />
                    <Text className="flex-1 font-geist text-[14px] text-ink">
                      {area}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        /* Map Mode: Interactive Leaflet CARTO Map with Center Pin & Live Reverse Geocoding */
        <View className="mt-4 pb-2">
          <LeafletMap
            height={240}
            initialCenter={mapCoords}
            onMoveStart={handleMapMoveStart}
            onCenterChange={handleMapCenterChange}
          />

          {/* Resolved Address Box */}
          <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3.5">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-tint">
              <MapPin size={18} color="#0072C4" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[11px] font-geist-medium uppercase tracking-wider text-ink-400">
                Selected area
              </Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 text-[14px] font-geist-semibold text-ink"
              >
                {isResolvingMap ? 'Locating area…' : resolvedMapLocation}
              </Text>
            </View>
            {isResolvingMap && <ActivityIndicator size="small" color="#0094F7" />}
          </View>

          <Text className="mt-2 text-center font-geist text-[12px] text-ink-500">
            Drag the map to move the pin to your task area.
          </Text>

          <View className="mt-3">
            <Button
              full
              variant="brand"
              disabled={isResolvingMap}
              onPress={() => choose(resolvedMapLocation)}
            >
              Use this location
            </Button>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
