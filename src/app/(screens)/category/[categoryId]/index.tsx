import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inbox, SlidersHorizontal } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';
import { ME } from '@/data/users';
import { categoryById } from '@/data/categories';
import {
  applyFilters,
  defaultFilters,
  sortOptions,
  activeFilterCount,
  type TaskFilters,
} from '@/utils/taskFilters';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/Feedback';
import { TaskCard } from '@/components/task/TaskCard';
import { FilterSheet } from '@/components/task/FilterSheet';
import { CategoryBadge } from '@/components/CategoryIcon';

export default function CategoryTasksScreen() {
  const { categoryId = 'cleaning' } = useLocalSearchParams<{
    categoryId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks } = useApp();

  const category = categoryById(categoryId);
  const [filters, setFilters] = useState<TaskFilters>({
    ...defaultFilters,
    categoryIds: [categoryId],
  });
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () =>
      applyFilters(
        tasks.filter(
          (task) =>
            task.requesterId !== ME &&
            ['posted', 'receiving_offers'].includes(task.status)
        ),
        filters
      ),
    [tasks, filters]
  );

  const filterCount = activeFilterCount(filters);

  return (
    <Screen tone="canvas" edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <ScreenHeader
        title={category.name}
        subtitle={`${results.length} open ${
          results.length === 1 ? 'task' : 'tasks'
        }`}
        actions={
          <Pressable
            onPress={() => setOpen(true)}
            className="relative h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white active:bg-ink-100"
          >
            <SlidersHorizontal size={17} color="#0C1417" />
            {filterCount > 1 && (
              <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1">
                <Text className="text-[9.5px] font-geist-bold text-white">
                  {filterCount}
                </Text>
              </View>
            )}
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-4">
          {/* Category Banner Card */}
          <View
            className="mb-4 flex-row items-center rounded-3xl border border-ink-200 bg-white p-4"
            style={{ gap: 12 }}
          >
            <CategoryBadge categoryId={categoryId} size="lg" />
            <View className="flex-1 min-w-0">
              <Text className="text-[14.5px] font-geist-semibold text-ink">
                {category.name} tasks near you
              </Text>
              <Text className="mt-0.5 font-geist text-[12.5px] text-ink-500">
                Sorted by{' '}
                {sortOptions
                  .find((s) => s.key === filters.sort)
                  ?.label.toLowerCase()}
              </Text>
            </View>
          </View>

          {/* Task Results List */}
          {results.length > 0 ? (
            <View className="gap-3" style={{ gap: 12 }}>
              {results.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </View>
          ) : (
            <View className="py-12">
              <EmptyState
                icon={<Inbox size={32} color="#8A959B" />}
                title={`No open ${category.name.toLowerCase()} tasks`}
                message="Nothing here right now. Widen your filters or check another category."
                actionLabel="Browse all tasks"
                onAction={() => router.push('/(tabs)/discover')}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <FilterSheet
        open={open}
        onClose={() => setOpen(false)}
        filters={filters}
        onApply={setFilters}
        resultCount={results.length}
      />
    </Screen>
  );
}
