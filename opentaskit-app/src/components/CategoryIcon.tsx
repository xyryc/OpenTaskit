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
  const key = iconName || category?.icon;
  const Component = key && key in icons ? icons[key] : LayoutGrid;
  return <Component size={size} color={color ?? '#0C1417'} />;
}

export function CategoryBadge({
  categoryId,
  size = 'md',
}: {
  categoryId: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const category = categoryById(categoryId);
  const boxClasses =
    size === 'lg'
      ? 'h-12 w-12 rounded-2xl'
      : size === 'md'
      ? 'h-10 w-10 rounded-xl'
      : 'h-8 w-8 rounded-lg';
  const iconSize = size === 'lg' ? 24 : size === 'md' ? 20 : 16;

  return (
    <View
      className={`items-center justify-center ${boxClasses} ${category?.tone ?? 'bg-ink-100'}`}
    >
      <CategoryIcon categoryId={categoryId} size={iconSize} />
    </View>
  );
}
