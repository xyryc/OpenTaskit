import { createMMKV } from 'react-native-mmkv';
import type { CategoryItem } from '@/types';

const cacheStorage = createMMKV({ id: 'opentaskit-cache' });
const CATEGORIES_CACHE_KEY = 'opentaskit_cached_categories';

export function getCachedCategories(): CategoryItem[] | null {
  try {
    const raw = cacheStorage.getString(CATEGORIES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function setCachedCategories(categories: CategoryItem[]): void {
  try {
    if (Array.isArray(categories) && categories.length > 0) {
      cacheStorage.set(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
    }
  } catch (err) {
    console.error('Failed to cache categories to MMKV:', err);
  }
}
