import type { Task } from '../types';

export type SortKey = 'recommended' | 'latest' | 'nearest' | 'budget_high' | 'budget_low';
export type DateKey = 'any' | 'today' | 'tomorrow' | 'week' | 'custom';

export interface TaskFilters {
  maxDistanceKm: number;
  budgetMin: number;
  budgetMax: number;
  categoryIds: string[];
  date: DateKey;
  sort: SortKey;
}

export const defaultFilters: TaskFilters = {
  maxDistanceKm: 15,
  budgetMin: 0,
  budgetMax: 30000,
  categoryIds: [],
  date: 'any',
  sort: 'recommended'
};

export const sortOptions: {key: SortKey;label: string;}[] = [
{ key: 'recommended', label: 'Recommended' },
{ key: 'latest', label: 'Latest' },
{ key: 'nearest', label: 'Nearest' },
{ key: 'budget_high', label: 'Highest budget' },
{ key: 'budget_low', label: 'Lowest budget' }];


export const dateOptions: {key: DateKey;label: string;}[] = [
{ key: 'any', label: 'Any time' },
{ key: 'today', label: 'Today' },
{ key: 'tomorrow', label: 'Tomorrow' },
{ key: 'week', label: 'This week' },
{ key: 'custom', label: 'Custom' }];


export function activeFilterCount(filters: TaskFilters): number {
  let count = 0;
  if (filters.maxDistanceKm !== defaultFilters.maxDistanceKm) count += 1;
  if (filters.budgetMin !== defaultFilters.budgetMin || filters.budgetMax !== defaultFilters.budgetMax) count += 1;
  if (filters.categoryIds.length) count += 1;
  if (filters.date !== 'any') count += 1;
  if (filters.sort !== 'recommended') count += 1;
  return count;
}

export function applyFilters(tasks: Task[], filters: TaskFilters, query = ''): Task[] {
  const term = query.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    if (task.distanceKm > filters.maxDistanceKm) return false;
    if (task.budget < filters.budgetMin || task.budget > filters.budgetMax) return false;
    if (filters.categoryIds.length && !filters.categoryIds.includes(task.categoryId)) return false;
    if (filters.date === 'today' && task.schedule.type !== 'asap') return false;
    if (filters.date === 'tomorrow' && !task.schedule.date?.includes('14')) return false;
    if (filters.date === 'week' && task.schedule.type === 'flexible') return false;
    if (term) {
      const haystack = `${task.title} ${task.description} ${task.location} ${task.categoryId}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case 'latest':
      sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      break;
    case 'nearest':
      sorted.sort((a, b) => a.distanceKm - b.distanceKm);
      break;
    case 'budget_high':
      sorted.sort((a, b) => b.budget - a.budget);
      break;
    case 'budget_low':
      sorted.sort((a, b) => a.budget - b.budget);
      break;
    default:
      sorted.sort(
        (a, b) => a.distanceKm / 10 - b.distanceKm / 10 + (new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()) / 1e9
      );
  }
  return sorted;
}

export function mapApiTaskToTask(item: import('@/types/api').TaskItem): Task {
  const statusMap: Record<string, Task['status']> = {
    OPEN: 'posted',
    ASSIGNED: 'assigned',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };

  const scheduleTypeMap: Record<string, Task['schedule']['type']> = {
    ASAP: 'asap',
    SPECIFIC_DATE: 'date',
    FLEXIBLE: 'flexible',
  };

  const paymentMethodMap: Record<string, Task['paymentMethod']> = {
    CASH: 'cash',
    CARD: 'card',
    WALLET: 'wallet',
  };

  return {
    id: item.id,
    title: item.title,
    categoryId: item.categoryId,
    category: item.category
      ? {
          id: item.category.id,
          name: item.category.name,
          slug: item.category.slug,
          icon: item.category.icon,
        }
      : undefined,
    user: item.user
      ? {
          id: item.user.id,
          fullName: item.user.fullName,
          phoneNumber: item.user.phoneNumber,
        }
      : undefined,
    offersCount: item._count?.offers ?? 0,
    description: item.details,
    images: item.images ?? [],
    budget: item.budget,
    flexibleBudget: item.isBudgetFlexible ?? false,
    location: item.address || (item.locationType === 'REMOTE' ? 'Remote' : 'In Person'),
    distanceKm: item.locationType === 'REMOTE' ? 0 : 2.5,
    pin: { x: item.latitude ?? 52, y: item.longitude ?? 36 },
    schedule: {
      type: scheduleTypeMap[item.timeType] || 'asap',
      date: item.scheduledDate ? item.scheduledDate.slice(0, 10) : undefined,
      time: item.scheduledTime || undefined,
    },
    paymentMethod: paymentMethodMap[item.paymentMethod] || 'cash',
    postedAt: item.createdAt,
    status: statusMap[item.status] || 'posted',
    requesterId: item.userId,
  };
}
