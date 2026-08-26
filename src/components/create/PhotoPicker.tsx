import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Camera, Check, ImagePlus } from 'lucide-react-native';
import { Image } from 'expo-image';
import { IMG } from '@/data/images';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';

const library = [IMG.cleaning, IMG.plumbing, IMG.moving, IMG.garden, IMG.ac];

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export interface PhotoPickerProps {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onToggle: (src: string) => void;
}

export function PhotoPicker({ open, onClose, selected, onToggle }: PhotoPickerProps) {
  const rows = useMemo(() => chunkArray(library, 3), []);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Add photos"
      description="Photos help people understand the job and send accurate offers."
      footer={
        <Button full variant="brand" onPress={onClose}>
          Done ({selected.length})
        </Button>
      }
    >
      {/* Quick Action Buttons */}
      <View className="flex-row gap-2.5" style={{ gap: 10 }}>
        <Pressable
          onPress={() => onToggle(library[0])}
          className="flex-1 items-center rounded-2xl border border-dashed border-ink-300 py-4 active:bg-ink-100"
        >
          <Camera size={20} color="#2B3A41" />
          <Text className="mt-1.5 font-geist font-medium text-[12.5px] text-ink-700">
            Take photo
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onToggle(library[2])}
          className="flex-1 items-center rounded-2xl border border-dashed border-ink-300 py-4 active:bg-ink-100"
        >
          <ImagePlus size={20} color="#2B3A41" />
          <Text className="mt-1.5 font-geist font-medium text-[12.5px] text-ink-700">
            Upload file
          </Text>
        </Pressable>
      </View>

      <Text className="mb-2.5 mt-5 text-[13px] font-geist font-semibold uppercase tracking-[0.07em] text-ink-400">
        Recent photos
      </Text>

      {/* 3-column Recent Photos Grid */}
      <View className="pb-2">
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            className="mb-2.5 flex-row gap-2.5"
            style={{ gap: 10, marginBottom: 10 }}
          >
            {row.map((src, colIndex) => {
              const active = selected.includes(src);
              return (
                <Pressable
                  key={colIndex}
                  onPress={() => onToggle(src)}
                  className={`relative aspect-square flex-1 overflow-hidden rounded-2xl border-2 ${
                    active ? 'border-brand' : 'border-transparent'
                  }`}
                >
                  <Image source={{ uri: src }} style={styles.thumbnailImage} contentFit="cover" />
                  {active && (
                    <View className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-brand">
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  )}
                </Pressable>
              );
            })}

            {/* Invisible Spacers for incomplete row */}
            {Array.from({ length: 3 - row.length }).map((_, spacerIndex) => (
              <View
                key={`spacer-${spacerIndex}`}
                className="flex-1"
              />
            ))}
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
