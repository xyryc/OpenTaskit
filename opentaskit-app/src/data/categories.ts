import type { Category } from '../types';

export const categories: Category[] = [
{ id: 'cleaning', name: 'Cleaning', icon: 'sparkles', tone: 'bg-brand-tint text-brand-dark' },
{ id: 'plumbing', name: 'Plumbing', icon: 'wrench', tone: 'bg-[#EAF1FB] text-[#1D5FD8]' },
{ id: 'electrical', name: 'Electrical', icon: 'zap', tone: 'bg-[#FDF3E2] text-[#B4690E]' },
{ id: 'moving', name: 'Moving', icon: 'truck', tone: 'bg-[#F1EEFB] text-[#5B45C7]' },
{ id: 'delivery', name: 'Delivery', icon: 'package', tone: 'bg-[#E6F7F4] text-[#0E7C72]' },
{ id: 'gardening', name: 'Gardening', icon: 'leaf', tone: 'bg-[#EDF6E6] text-[#3F7118]' },
{ id: 'painting', name: 'Painting', icon: 'brush', tone: 'bg-[#FBEEF0] text-[#B03A4A]' },
{ id: 'repair', name: 'Repair', icon: 'hammer', tone: 'bg-[#EEF1F3] text-ink-700' },
{ id: 'tutoring', name: 'Tutoring', icon: 'graduation', tone: 'bg-[#E9F1FB] text-[#1D5FD8]' },
{ id: 'photography', name: 'Photography', icon: 'camera', tone: 'bg-[#F3EFEA] text-[#7A5A2E]' },
{ id: 'beauty', name: 'Beauty', icon: 'scissors', tone: 'bg-[#FBEDF6] text-[#A03A82]' },
{ id: 'tech', name: 'Technology', icon: 'laptop', tone: 'bg-[#E9EEF3] text-[#2B5C7E]' },
{ id: 'other', name: 'Other', icon: 'grid', tone: 'bg-ink-100 text-ink-700' }];


export function categoryById(id: string): Category {
  return categories.find((c) => c.id === id) ?? categories[categories.length - 1];
}