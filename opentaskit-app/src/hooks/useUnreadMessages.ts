import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import { useGetConversationsQuery } from '@/store/api/apiSlice';

export function useUnreadMessages() {
  const { guest } = useAppSelector((state) => state.auth);
  const { data: conversations } = useGetConversationsQuery(undefined, { skip: guest });

  return useMemo(
    () => (conversations ?? []).reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );
}
