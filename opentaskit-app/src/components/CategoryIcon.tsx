import React from 'react';
import { View } from 'react-native';
import {
  Camera,
  GraduationCap,
  Hammer,
  Laptop,
  LayoutGrid,
  Leaf,
  Package,
  Paintbrush,
  Scissors,
  Sparkles,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react-native';
import { categoryById } from '@/data/categories';

const icons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  sparkles: Sparkles,
  wrench: Wrench,
  zap: Zap,
  truck: Truck,
  package: Package,
  leaf: Leaf,
  brush: Paintbrush,
  hammer: Hammer,
  graduation: GraduationCap,
  camera: Camera,
  scissors: Scissors,
  laptop: Laptop,
  grid: LayoutGrid,
};

const iconTones: Record<string, string> = {
  sparkles: 'bg-brand-tint text-brand-dark',
  wrench: 'bg-[#EAF1FB] text-[#1D5FD8]',
  zap: 'bg-[#FDF3E2] text-[#B4690E]',
  truck: 'bg-[#F1EEFB] text-[#5B45C7]',
  package: 'bg-[#E6F7F4] text-[#0E7C72]',
  leaf: 'bg-[#EDF6E6] text-[#3F7118]',
  brush: 'bg-[#FBEEF0] text-[#B03A4A]',
  hammer: 'bg-[#EEF1F3] text-ink-700',
  graduation: 'bg-[#E9F1FB] text-[#1D5FD8]',
  camera: 'bg-[#F3EFEA] text-[#7A5A2E]',
  scissors: 'bg-[#FBEDF6] text-[#A03A82]',
  laptop: 'bg-[#E9EEF3] text-[#2B5C7E]',
  grid: 'bg-ink-100 text-ink-700',
};

export function CategoryIcon({
  categoryId,
  iconName,
  size = 20,
  color,
}: {
  categoryId?: string;
  iconName?: string | null;
  size?: number;
  color?: string;
}) {
  const category = categoryId ? categoryById(categoryId) : undefined;
  const rawKey = (iconName || category?.icon || '').toLowerCase().trim();
  const Component = rawKey && rawKey in icons ? icons[rawKey] : LayoutGrid;
  return <Component size={size} color={color ?? '#0C1417'} />;
}

export function CategoryBadge({
  categoryId,
  iconName,
  tone,
  size = 'md',
}: {
  categoryId?: string;
  iconName?: string | null;
  tone?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const category = categoryId ? categoryById(categoryId) : undefined;
  const resolvedIcon = (iconName || category?.icon || '').toLowerCase().trim();
  const resolvedTone =
    tone || category?.tone || (resolvedIcon && iconTones[resolvedIcon]) || 'bg-brand-tint';

  const boxClasses =
    size === 'lg'
      ? 'h-12 w-12 rounded-2xl'
      : size === 'md'
      ? 'h-10 w-10 rounded-xl'
      : 'h-8 w-8 rounded-lg';
  const iconSize = size === 'lg' ? 24 : size === 'md' ? 20 : 16;

  return (
    <View
      className={`items-center justify-center ${boxClasses} ${resolvedTone}`}
    >
      <CategoryIcon categoryId={categoryId} iconName={resolvedIcon} size={iconSize} />
    </View>
  );
}
