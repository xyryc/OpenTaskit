import type { DisputeReason, DisputeResolutionValue, DisputeStatusValue } from '@/types/api';

export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  WORK_UNSATISFACTORY: 'Work not completed or poor quality',
  TASKER_NO_SHOW: 'Tasker did not show up',
  POSTER_UNRESPONSIVE: 'Poster is unresponsive',
  PAYMENT_ISSUE: 'Payment issue',
  HARASSMENT: 'Harassment or unsafe behavior',
  OTHER: 'Other',
};

export const DISPUTE_RESOLUTION_LABELS: Record<DisputeResolutionValue, string> = {
  REFUND_POSTER: 'Poster refunded',
  PAY_TASKER: 'Tasker paid in full',
  CANCELLED_NO_PENALTY: 'Task cancelled, no penalty',
  DISMISSED: 'Dispute dismissed',
};

export const DISPUTE_STATUS_META: Record<
  DisputeStatusValue,
  { tone: 'info' | 'warning' | 'success' | 'neutral'; label: string }
> = {
  OPEN: { tone: 'info', label: 'open' },
  UNDER_REVIEW: { tone: 'warning', label: 'under review' },
  RESOLVED: { tone: 'success', label: 'resolved' },
  DISMISSED: { tone: 'neutral', label: 'dismissed' },
};
