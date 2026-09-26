import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { useAppDispatch, useAppSelector } from '@/store';
import { apiSlice, getStoredNotificationsEnabled, setStoredPushToken, useRegisterPushTokenMutation } from '@/store/api/apiSlice';
import { ensureAndroidChannel, getDeviceFcmToken } from '@/utils/pushNotifications';
import { resolveRouteFromParts } from '@/utils/notifications';
import type { NotificationTypeValue } from '@/types';

// Registers this device's native FCM token whenever the user is (or becomes)
// authenticated, and wires up foreground + tap handling for real push
// notifications. Must be rendered as JSX inside the Redux <Provider> tree
// (like NotificationBannerHost) - it cannot be called as a bare hook from
// RootLayout's own function body, since that body isn't itself a descendant
// of the <Provider> it renders.
export function PushNotificationSync() {
  usePushTokenSync();
  usePushForegroundHandler();
  usePushNotificationTapHandler();
  return null;
}

function usePushTokenSync() {
  const authed = useAppSelector((s) => s.auth.authed);
  const [registerPushToken] = useRegisterPushTokenMutation();
  const registeredForSession = useRef(false);

  useEffect(() => {
    if (!authed || registeredForSession.current) return;
    if (!getStoredNotificationsEnabled()) return;
    registeredForSession.current = true;

    (async () => {
      await ensureAndroidChannel();
      const token = await getDeviceFcmToken();
      if (!token) return;
      try {
        await registerPushToken({
          token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        }).unwrap();
        setStoredPushToken(token);
      } catch {
        // Non-fatal - user can still use the app without push registered;
        // it'll retry next time this flips false -> true (e.g. next login).
      }
    })();

    return () => {
      if (!authed) registeredForSession.current = false;
    };
  }, [authed, registerPushToken]);
}

function usePushForegroundHandler() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((event) => {
      const data = event.request.content.data as Record<string, string> | undefined;
      const tags: Array<'Notification' | { type: 'Message'; id: string }> = ['Notification'];
      if (data?.type === 'MESSAGE') {
        tags.push({ type: 'Message', id: 'UNREAD_COUNT' }, { type: 'Message', id: 'CONVERSATIONS' });
      }
      dispatch(apiSlice.util.invalidateTags(tags));
    });
    return () => subscription.remove();
  }, [dispatch]);
}

function usePushNotificationTapHandler() {
  useEffect(() => {
    // Also replays the response that opened the app from a killed state.
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (!data) return;
      const route = resolveRouteFromParts({
        type: (data.type as NotificationTypeValue) ?? 'SYSTEM',
        taskId: data.taskId || null,
        actionUrl: data.actionUrl || null,
      });
      if (route) router.push(route as any);
    });
    return () => subscription.remove();
  }, []);
}
