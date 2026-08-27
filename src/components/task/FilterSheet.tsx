import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

import { categories } from '@/data/categories';
import { money } from '@/utils/format';
import {
  dateOptions,
  defaultFilters,
  sortOptions,
  type TaskFilters,
} from '@/utils/taskFilters';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { SelectChip } from '@/components/ui/Chip';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: TaskFilters;
  onApply: (filters: TaskFilters) => void;
  resultCount: number;
}

const DISTANCE_PRESETS = [5, 10, 15, 25, 50];

export function FilterSheet({
  open,
  onClose,
  filters,
  onApply,
  resultCount,
}: FilterSheetProps) {
  const [draft, setDraft] = useState<TaskFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const toggleCategory = (id: string) => {
    setDraft((d) => ({
      ...d,
      categoryIds: d.categoryIds.includes(id)
        ? d.categoryIds.filter((x) => x !== id)
        : [...d.categoryIds, id],
    }));
  };

  const handleAdjustDistance = (delta: number) => {
    setDraft((d) => ({
      ...d,
      maxDistanceKm: Math.max(1, Math.min(100, d.maxDistanceKm + delta)),
    }));
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filters"
      description={`${resultCount} tasks match your current filters`}
      footer={
        <View className="flex-row gap-2.5" style={{ gap: 10 }}>
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => setDraft(defaultFilters)}
          >
            Clear all
          </Button>
          <Button
            className="flex-1"
            variant="brand"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          >
            Apply filters
          </Button>
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="max-h-[500px]"
      >
        <View className="gap-6 pb-6 pt-1" style={{ gap: 22 }}>
          {/* Section: Distance */}
          <View>
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[14px] font-geist-semibold text-ink">
                Distance
              </Text>
              <Text className="font-geist-medium text-[13px] text-brand">
                Within {draft.maxDistanceKm} km
              </Text>
            </View>

            {/* Distance Stepper & Quick Presets */}
            <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-ink-200 bg-white p-2">
              <Pressable
                onPress={() => handleAdjustDistance(-2)}
                className="h-10 w-10 items-center justify-center rounded-xl bg-ink-100 active:bg-ink-200"
              >
                <Minus size={18} color="#2B3A41" />
              </Pressable>
              <Text className="font-geist-semibold text-[16px] text-ink">
                {draft.maxDistanceKm} km
              </Text>
              <Pressable
                onPress={() => handleAdjustDistance(2)}
                className="h-10 w-10 items-center justify-center rounded-xl bg-ink-100 active:bg-ink-200"
              >
                <Plus size={18} color="#2B3A41" />
              </Pressable>
            </View>

            <View className="mt-2.5 flex-row flex-wrap gap-2" style={{ gap: 8 }}>
              {DISTANCE_PRESETS.map((km) => (
                <SelectChip
                  key={km}
                  selected={draft.maxDistanceKm === km}
                  onPress={() => setDraft((d) => ({ ...d, maxDistanceKm: km }))}
                >
                  {km} km
                </SelectChip>
              ))}
            </View>
          </View>

          {/* Section: Budget */}
          <View>
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[14px] font-geist-semibold text-ink">
                Budget
              </Text>
              <Text className="font-geist-medium text-[13px] text-brand">
                {money(draft.budgetMin)} – {money(draft.budgetMax)}
              </Text>
            </View>

            <View className="mt-3 flex-row gap-2.5" style={{ gap: 10 }}>
              <View className="flex-1 rounded-2xl border border-ink-200 bg-white px-3.5 py-2.5">
                <Text className="text-[11.5px] font-geist text-ink-400">
                  Minimum (Rs)
                </Text>
                <TextInput
                  value={draft.budgetMin.toString()}
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
                    setDraft((d) => ({ ...d, budgetMin: num }));
                  }}
                  keyboardType="numeric"
                  style={[{ fontFamily: 'Geist-SemiBold' }]}
                  className="mt-0.5 text-[16px] font-geist-semibold text-ink"
                />
              </View>

              <View className="flex-1 rounded-2xl border border-ink-200 bg-white px-3.5 py-2.5">
                <Text className="text-[11.5px] font-geist text-ink-400">
                  Maximum (Rs)
                </Text>
                <TextInput
                  value={draft.budgetMax.toString()}
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
                    setDraft((d) => ({ ...d, budgetMax: num }));
                  }}
                  keyboardType="numeric"
                  style={[{ fontFamily: 'Geist-SemiBold' }]}
                  className="mt-0.5 text-[16px] font-geist-semibold text-ink"
                />
              </View>
            </View>
          </View>

          {/* Section: Category */}
          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-geist-semibold text-ink">
                Categories
              </Text>
              {draft.categoryIds.length > 0 && (
                <Pressable
                  onPress={() => setDraft((d) => ({ ...d, categoryIds: [] }))}
                  hitSlop={8}
                >
                  <Text className="font-geist-medium text-[12.5px] text-brand">
                    Clear categories
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="mt-3 flex-row flex-wrap gap-2" style={{ gap: 8 }}>
              {categories.map((category) => (
                <SelectChip
                  key={category.id}
                  selected={draft.categoryIds.includes(category.id)}
                  onPress={() => toggleCategory(category.id)}
                >
                  {category.name}
                </SelectChip>
              ))}
            </View>
          </View>

          {/* Section: When */}
          <View>
            <Text className="text-[14px] font-geist-semibold text-ink">
              When
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2" style={{ gap: 8 }}>
              {dateOptions.map((option) => (
                <SelectChip
                  key={option.key}
                  selected={draft.date === option.key}
                  onPress={() => setDraft((d) => ({ ...d, date: option.key }))}
                >
                  {option.label}
                </SelectChip>
              ))}
            </View>
          </View>

          {/* Section: Sort */}
          <View>
            <Text className="text-[14px] font-geist-semibold text-ink">
              Sort by
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2" style={{ gap: 8 }}>
              {sortOptions.map((option) => (
                <SelectChip
                  key={option.key}
                  selected={draft.sort === option.key}
                  onPress={() => setDraft((d) => ({ ...d, sort: option.key }))}
                >
                  {option.label}
                </SelectChip>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
