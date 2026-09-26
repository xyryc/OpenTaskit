import type { NotificationKind, NotificationRecord } from '@/types';

export function notificationKind(record: NotificationRecord): NotificationKind {
  return record.type.toLowerCase() as NotificationKind;
}

export interface RouteResolvable {
  type: NotificationRecord['type'];
  taskId: string | null;
  actionUrl: string | null;
}

// Backend `actionUrl` strings were written ad-hoc across services and don't
// consistently match this app's actual route paths - only the ones already
// shaped like `/(screens)/...` are safe to use directly. Everything else is
// resolved client-side from the notification's type + taskId instead.
//
// Shared by the in-app notification banner (which has a full NotificationRecord)
// and the push-notification tap handler (which only has the plain-string FCM
// data payload) - kept as a pure function over the minimal shape both need.
export function resolveRouteFromParts(input: RouteResolvable): string | null {
  if (input.actionUrl?.startsWith('/(screens)')) {
    return input.actionUrl;
  }

  if (!input.taskId) {
    return null;
  }

  switch (input.type) {
    case 'DISPUTE':
      return `/(screens)/dispute/${input.taskId}`;
    case 'OFFER':
      // Covers both "you received an offer" (task may still be open) and
      // "your offer was accepted" - the task detail screen works for both,
      // unlike the job screen which assumes the task is already assigned.
      return `/(screens)/task/${input.taskId}`;
    case 'TASK':
    case 'PAYMENT':
    case 'REVIEW':
      return `/(screens)/job/${input.taskId}`;
    default:
      return null;
  }
}

export function resolveNotificationRoute(record: NotificationRecord): string | null {
  return resolveRouteFromParts(record);
}
