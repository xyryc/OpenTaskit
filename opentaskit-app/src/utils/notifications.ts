import type { NotificationKind, NotificationRecord } from '@/types';

export function notificationKind(record: NotificationRecord): NotificationKind {
  return record.type.toLowerCase() as NotificationKind;
}

// Backend `actionUrl` strings were written ad-hoc across services and don't
// consistently match this app's actual route paths - only the ones already
// shaped like `/(screens)/...` are safe to use directly. Everything else is
// resolved client-side from the notification's type + taskId instead.
export function resolveNotificationRoute(record: NotificationRecord): string | null {
  if (record.actionUrl?.startsWith('/(screens)')) {
    return record.actionUrl;
  }

  if (!record.taskId) {
    return null;
  }

  switch (record.type) {
    case 'DISPUTE':
      return `/(screens)/dispute/${record.taskId}`;
    case 'OFFER':
      // Covers both "you received an offer" (task may still be open) and
      // "your offer was accepted" - the task detail screen works for both,
      // unlike the job screen which assumes the task is already assigned.
      return `/(screens)/task/${record.taskId}`;
    case 'TASK':
    case 'PAYMENT':
    case 'REVIEW':
      return `/(screens)/job/${record.taskId}`;
    default:
      return null;
  }
}
