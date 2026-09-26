import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch, useAppSelector } from '@/store';
import { apiSlice, useGetNotificationsQuery, useMarkNotificationReadMutation } from '@/store/api/apiSlice';
import { resolveNotificationRoute } from '@/utils/notifications';
import type { NotificationRecord } from '@/types';
import { NotificationBanner } from './NotificationBanner';

const POLL_INTERVAL_MS = 20000;

// Polls the notifications feed while the app is active and surfaces any
// notification that arrives after the initial load as a heads-up banner -
// existing unread notifications from before this component mounted are never
// banner'd, only genuinely new ones.
export function NotificationBannerHost() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { guest } = useAppSelector((s) => s.auth);
  const { data } = useGetNotificationsQuery(undefined, {
    skip: guest,
    pollingInterval: POLL_INTERVAL_MS,
  });
  const [markNotificationRead] = useMarkNotificationReadMutation();

  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [queue, setQueue] = useState<NotificationRecord[]>([]);
  const [current, setCurrent] = useState<NotificationRecord | null>(null);

  useEffect(() => {
    if (!data) return;

    if (!initialized.current) {
      data.notifications.forEach((n) => seenIds.current.add(n.id));
      initialized.current = true;
      return;
    }

    const fresh = data.notifications.filter(
      (n) => !seenIds.current.has(n.id) && !n.isRead
    );
    if (fresh.length === 0) return;

    fresh.forEach((n) => seenIds.current.add(n.id));
    if (fresh.some((n) => n.type === 'MESSAGE')) {
      dispatch(
        apiSlice.util.invalidateTags([
          { type: 'Message', id: 'UNREAD_COUNT' },
          { type: 'Message', id: 'CONVERSATIONS' },
        ])
      );
    }
    setQueue((prev) => [...prev, ...fresh]);
  }, [data, dispatch]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  if (guest || !current) {
    return null;
  }

  const handlePress = () => {
    markNotificationRead(current.id);
    const route = resolveNotificationRoute(current);
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 }}
    >
      <NotificationBanner
        key={current.id}
        notification={current}
        onPress={handlePress}
        onDismiss={() => setCurrent(null)}
      />
    </View>
  );
}
