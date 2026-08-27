import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  List,
  Map as MapIcon,
  SlidersHorizontal,
  Telescope,
} from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import {
  applyFilters,
  activeFilterCount,
  defaultFilters,
  type TaskFilters,
} from '@/utils/taskFilters';
import { distance, money } from '@/utils/format';
import { Screen } from '@/components/layout/Screen';
import { SearchInput } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/Segmented';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { TaskCard } from '@/components/task/TaskCard';
import { DiscoverMap } from '@/components/task/DiscoverMap';
import { FilterSheet } from '@/components/task/FilterSheet';
import { CategoryBadge } from '@/components/CategoryIcon';

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, toast, requireAccount } = useApp();

  const [view, setView] = useState<'list' | 'map'>('list');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const openTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.requesterId !== ME &&
          ['posted', 'receiving_offers'].includes(task.status)
      ),
    [tasks]
  );

  const results = useMemo(
    () => applyFilters(openTasks, filters, query),
    [openTasks, filters, query]
  );

  const filterCount = activeFilterCount(filters);
  const selected = results.find((task) => task.id === selectedId);

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <View className="border-b border-ink-100 bg-white/95 px-5 pb-3 pt-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-[22px] font-geist-bold tracking-[-0.03em] text-ink">
            Discover tasks
          </Text>

          {/* List / Map Switcher */}
          <View className="w-[130px]">
            <SegmentedControl
              options={[
                {
                  value: 'list',
                  label: 'List',
                  icon: <List size={14} color="#0C1417" />,
                },
                {
                  value: 'map',
                  label: 'Map',
                  icon: <MapIcon size={14} color="#0C1417" />,
                },
              ]}
              value={view}
              onChange={setView}
            />
          </View>
        </View>

        {/* Search Bar & Filter Button Row */}
        <View className="mt-3 flex-row items-center gap-2.5" style={{ gap: 10 }}>
          <View className="flex-1">
            <SearchInput
              placeholder="Search nearby tasks"
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
            />
          </View>

          <Pressable
            onPress={() => setFiltersOpen(true)}
            className="relative h-12 w-12 items-center justify-center rounded-2xl border border-ink-200 bg-white active:bg-ink-100"
          >
            <SlidersHorizontal size={18} color="#0C1417" />
            {filterCount > 0 && (
              <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1">
                <Text className="text-[10.5px] font-geist-bold text-white">
                  {filterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Results Count & Clear Filter */}
        <View className="mt-2.5 flex-row items-center justify-between">
          <Text className="font-geist text-[12.5px] text-ink-500">
            {results.length} {results.length === 1 ? 'task' : 'tasks'} within{' '}
            {filters.maxDistanceKm} km
          </Text>
          {filterCount > 0 && (
            <Pressable
              onPress={() => {
                setFilters(defaultFilters);
                toast({ title: 'Filters cleared', variant: 'info' });
              }}
              hitSlop={8}
            >
              <Text className="font-geist-semibold text-[12.5px] text-brand">
                Clear all
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Main Content: List vs Map */}
      {view === 'list' ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-4">
            {loading ? (
              <ListSkeleton count={4} />
            ) : results.length === 0 ? (
              <EmptyState
                icon={<Telescope size={32} color="#0094F7" />}
                title="No tasks match these filters"
                message="Try widening the distance, raising the budget range or clearing the category filter."
                actionLabel="Clear filters"
                onAction={() => setFilters(defaultFilters)}
                secondaryLabel="Post a task instead"
                onSecondary={() => {
                  if (!requireAccount('post')) return;
                  router.push('/(screens)/create');
                }}
              />
            ) : (
              <View className="gap-3" style={{ gap: 12 }}>
                {results.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                <Text className="pt-2 text-center font-geist text-[12px] text-ink-400">
                  That’s everything nearby right now.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View className="relative flex-1">
          {/* CARTO Leaflet Map */}
          <DiscoverMap
            tasks={results}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRecenter={() =>
              toast({ title: 'Centred on your location', variant: 'info' })
            }
          />

          {/* Floating Task Preview Card at the bottom of the map */}
          {selected ? (
            <View
              className="absolute inset-x-4 rounded-3xl border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur-md"
              style={{ bottom: Math.max(insets.bottom, 16) + 12 }}
            >
              <View className="flex-row items-start gap-3" style={{ gap: 12 }}>
                <CategoryBadge categoryId={selected.categoryId} size="lg" />
                <View className="flex-1 min-w-0">
                  <Text
                    numberOfLines={2}
                    className="text-[14.5px] font-geist-semibold leading-snug text-ink"
                  >
                    {selected.title}
                  </Text>
                  <Text className="mt-1 font-geist text-[12.5px] text-ink-500">
                    {money(selected.budget)} · {distance(selected.distanceKm)} away · {selected.location}
                  </Text>
                </View>
              </View>

              <View className="mt-3.5 flex-row gap-2" style={{ gap: 8 }}>
                <Button
                  size="md"
                  variant="outline"
                  className="flex-1"
                  onPress={() => setSelectedId(undefined)}
                >
                  Dismiss
                </Button>
                <Button
                  size="md"
                  variant="brand"
                  className="flex-1"
                  onPress={() => router.push(`/task/${selected.id}` as any)}
                >
                  View task
                </Button>
              </View>
            </View>
          ) : (
            <View
              className="absolute inset-x-8 rounded-full border border-white/70 bg-white/90 px-4 py-2.5 shadow-md backdrop-blur-md"
              style={{ bottom: Math.max(insets.bottom, 16) + 16 }}
            >
              <Text className="text-center font-geist-medium text-[12.5px] text-ink">
                Tap a price pin to preview the task
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Filter Bottom Sheet */}
      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={(next) => {
          setFilters(next);
          toast({ title: 'Filters applied', variant: 'success' });
        }}
        resultCount={results.length}
      />
    </Screen>
  );
}
