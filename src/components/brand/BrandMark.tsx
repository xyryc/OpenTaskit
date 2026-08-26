import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const BRAND_ICONS = {
  white: require('../../../assets/brand/icon-white.png'),
  brand: require('../../../assets/brand/icon-brand.png'),
  ink: require('../../../assets/brand/icon-ink.png'),
} as const;

export interface BrandMarkProps {
  size?: number;
  tone?: 'brand' | 'white' | 'ink';
}

export function BrandMark({ size = 44, tone = 'brand' }: BrandMarkProps) {
  const source = BRAND_ICONS[tone] ?? BRAND_ICONS.brand;
  const borderRadius = Math.round(size * 0.22);

  return (
    <View
      className="items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius }}
    >
      <Image
        source={source}
        style={[styles.brandImage, { width: size, height: size, borderRadius }]}
        contentFit="contain"
        priority="high"
        cachePolicy="memory-disk"
      />
    </View>
  );
}

export interface BrandLockupProps {
  tone?: 'ink' | 'white' | 'brand';
  size?: number;
}

export function BrandLockup({ tone = 'brand', size = 40 }: BrandLockupProps) {
  const markTone = tone === 'white' ? 'white' : tone === 'ink' ? 'ink' : 'brand';

  return (
    <View className="flex-row items-center gap-2.5">
      <BrandMark size={size} tone={markTone} />
      <Text
        className={`text-[22px] font-semibold tracking-[-0.03em] ${
          tone === 'white' ? 'text-white' : 'text-ink'
        }`}
      >
        OpenTaskit
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandImage: {
    // Kept strictly for the Image component as requested
  },
});
