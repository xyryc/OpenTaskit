import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { MapPin, Navigation, ShieldOff } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useApp } from '@/contexts/AppContext';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/Segmented';
import { LeafletMap, Coordinates } from '@/components/create/LeafletMap';

const DEFAULT_AREAS = [
  'Kirulapone, Colombo 05',
  'Havelock Town, Colombo 05',
  'Ward Place, Colombo 07',
  'Wellawatte, Colombo 06',
  'Nugegoda, Western Province',
  'Rajagiriya, Western Province',
];

interface SearchResultItem {
  id: string;
  primaryText: string;
  secondaryText: string;
  fullAddress: string;
}

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locationPermission, setLocationPermission, currentLocation, setCurrentLocation, toast } = useApp();
  const [mode, setMode] = useState<'search' | 'map'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map mode state
  const [mapCoords, setMapCoords] = useState<Coordinates>({ lat: 6.9271, lng: 79.8612 });
  const [resolvedMapLocation, setResolvedMapLocation] = useState('Colombo, Sri Lanka');
  const [isResolvingMap, setIsResolvingMap] = useState(false);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const choose = (location: string) => {
    setCurrentLocation(location);
    toast({ title: `Showing tasks near ${location}`, variant: 'success' });
    onClose();
  };

  const handleMapMoveStart = useCallback(() => {
    setIsResolvingMap(true);
  }, []);

  const handleMapCenterChange = useCallback((coords: Coordinates) => {
    setMapCoords(coords);

    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);

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

        setResolvedMapLocation(
          parts.length > 0
            ? parts.join(', ')
            : data.display_name.split(',').slice(0, 3).join(',').trim()
        );
      } catch (err) {
        console.warn('Reverse geocode error:', err);
        setResolvedMapLocation('Pinned location');
      } finally {
        setIsResolvingMap(false);
      }
    }, 400);
  }, []);

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);

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

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'OpenTaskit/1.0 (contact@opentaskit.com)',
          Accept: 'application/json',
        },
      });

      let resolved = 'Current location';
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

      setCurrentLocation(resolved);
      toast({ title: 'Location detected', description: resolved, variant: 'success' });
      onClose();
    } catch (err) {
      // Expected when GPS/location services are off or the fix times out -
      // console.warn (not .error) so it doesn't surface as a fatal LogBox screen.
      console.warn('Error detecting location:', err);
      const message = err instanceof Error ? err.message : '';
      if (/location services/i.test(message)) {
        Alert.alert(
          'Location Services Disabled',
          'Turn on Location Services for this device in your system settings, then try again.'
        );
      } else {
        Alert.alert(
          'Unable to Fetch Location',
          'Could not determine your current position. Please make sure location services are turned on, or search for an area manually.'
        );
      }
    } finally {
      setIsLocating(false);
    }
  };

  // Live Nominatim search, same pattern as the task-location picker.
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

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
            addr.suburb || addr.neighbourhood || addr.road || addr.town || addr.city ||
            item.name || item.display_name.split(',')[0];
          const secondaryParts = [addr.city || addr.town || addr.county, addr.state].filter(Boolean);
          const secondary = secondaryParts.join(', ') || 'Sri Lanka';

          return {
            id: String(item.place_id),
            primaryText: primary,
            secondaryText: secondary,
            fullAddress: `${primary}, ${secondary}`,
          };
        });
        setSearchResults(items);
      } catch (err) {
        console.warn('Nominatim search error:', err);
        const localMatches = DEFAULT_AREAS.filter((a) =>
          a.toLowerCase().includes(query.toLowerCase())
        ).map((a, idx) => ({
          id: `local-${idx}`,
          primaryText: a.split(',')[0],
          secondaryText: a.split(',').slice(1).join(',').trim() || 'Sri Lanka',
          fullAddress: a,
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

  const listItems: SearchResultItem[] =
    query.trim().length >= 2
      ? searchResults
      : DEFAULT_AREAS.map((a, idx) => ({
          id: `default-${idx}`,
          primaryText: a.split(',')[0],
          secondaryText: a.split(',').slice(1).join(',').trim() || 'Sri Lanka',
          fullAddress: a,
        }));

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
            loading={isLocating}
            onPress={handleUseCurrentLocation}
          >
            Allow location access
          </Button>
        </View>
      ) : (
        <View className="flex-row items-center gap-3 rounded-3xl border border-brand/40 bg-brand-tint/60 p-4">
          <Pressable
            onPress={handleUseCurrentLocation}
            disabled={isLocating}
            className="flex-1 flex-row items-center gap-3"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
              {isLocating ? (
                <ActivityIndicator size="small" color="#0094F7" />
              ) : (
                <Navigation size={20} color="#0094F7" />
              )}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[11.5px] font-geist-bold font-bold uppercase tracking-wider text-brand-dark">
                Current location
              </Text>
              <Text numberOfLines={1} className="text-[14.5px] font-geist-semibold font-semibold text-ink">
                {isLocating ? 'Locating…' : currentLocation}
              </Text>
            </View>
          </Pressable>
          <Pressable
            hitSlop={8}
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
        <SegmentedControl
          options={[
            { value: 'search', label: 'Search' },
            { value: 'map', label: 'Pick on map' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {mode === 'search' ? (
        <>
          <View className="mt-4">
            <SearchInput
              placeholder="Search an area or city"
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
            />
          </View>

          {isSearching && (
            <View className="flex-row items-center justify-center gap-2 py-4">
              <ActivityIndicator size="small" color="#0094F7" />
              <Text className="font-geist text-[13px] text-ink-400">Searching…</Text>
            </View>
          )}

          <View className="mt-2 divide-y divide-ink-100">
            {!isSearching &&
              listItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => choose(item.fullAddress)}
                  className="flex-row items-center gap-3 py-3.5"
                >
                  <MapPin size={18} color="#8A959B" />
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="font-geist text-[14.5px] text-ink">
                      {item.primaryText}
                    </Text>
                    <Text numberOfLines={1} className="font-geist text-[12px] text-ink-400">
                      {item.secondaryText}
                    </Text>
                  </View>
                </Pressable>
              ))}

            {!isSearching && query.trim().length >= 2 && listItems.length === 0 && (
              <View className="py-6 items-center">
                <Text className="font-geist text-[13.5px] text-ink-500">No areas match "{query}".</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View className="mt-4 pb-1">
          <LeafletMap
            height={220}
            initialCenter={mapCoords}
            onMoveStart={handleMapMoveStart}
            onCenterChange={handleMapCenterChange}
          />

          <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3.5">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-tint">
              <MapPin size={18} color="#0072C4" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[11px] font-geist-medium uppercase tracking-wider text-ink-400">
                Selected area
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-[14px] font-geist-semibold text-ink">
                {isResolvingMap ? 'Locating area…' : resolvedMapLocation}
              </Text>
            </View>
            {isResolvingMap && <ActivityIndicator size="small" color="#0094F7" />}
          </View>

          <Text className="mt-2 text-center font-geist text-[12px] text-ink-500">
            Drag the map to move the pin to your area.
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
