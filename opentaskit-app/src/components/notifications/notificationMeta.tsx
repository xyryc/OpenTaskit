import React from 'react';
import {
  CircleDollarSign,
  Gavel,
  MessageCircle,
  Send,
  Settings2,
  Sparkles,
  Star,
} from 'lucide-react-native';

import type { NotificationKind } from '@/types';

export const NOTIFICATION_KIND_META: Record<
  NotificationKind,
  { icon: React.ReactNode; iconBg: string }
> = {
  offer: {
    icon: <Send size={18} color="#0094F7" />,
    iconBg: 'bg-brand-tint',
  },
  message: {
    icon: <MessageCircle size={18} color="#0072C4" />,
    iconBg: 'bg-info/10',
  },
  task: {
    icon: <Sparkles size={18} color="#0094F7" />,
    iconBg: 'bg-brand-tint',
  },
  payment: {
    icon: <CircleDollarSign size={18} color="#0E9F6E" />,
    iconBg: 'bg-success/10',
  },
  dispute: {
    icon: <Gavel size={18} color="#C7382F" />,
    iconBg: 'bg-danger/10',
  },
  review: {
    icon: <Star size={18} color="#C27803" />,
    iconBg: 'bg-warning/15',
  },
  system: {
    icon: <Settings2 size={18} color="#2B3A41" />,
    iconBg: 'bg-ink-100',
  },
};
