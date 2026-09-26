import { useAppSelector } from '@/store';
import { useGetUnreadMessagesCountQuery } from '@/store/api/apiSlice';

export function useUnreadMessages() {
  const { guest } = useAppSelector((state) => state.auth);
  const { data } = useGetUnreadMessagesCountQuery(undefined, {
    skip: guest,
    pollingInterval: 5000,
  });

  return data?.count ?? 0;
}

