import { useAppSelector } from '@/store';
import {
  useGetMyPostedTasksQuery,
  useGetMyAssignedTasksQuery,
  useGetMyOffersQuery,
} from '@/store/api/apiSlice';

/**
 * Returns the actual count of ongoing/actionable items for the Activity tab:
 * - Active posted tasks (Hiring: open, receiving offers, assigned, in progress, disputed)
 * - Pending bids submitted by the user (My bids)
 * - Active jobs assigned to the user (Assigned: assigned, in progress, disputed)
 */
export function useActivityCount(): number {
  const { guest } = useAppSelector((state) => state.auth);

  const { data: postedTasks = [] } = useGetMyPostedTasksQuery(undefined, {
    skip: guest,
    pollingInterval: 10000,
  });
  const { data: assignedTasks = [] } = useGetMyAssignedTasksQuery(undefined, {
    skip: guest,
    pollingInterval: 10000,
  });
  const { data: myOffers = [] } = useGetMyOffersQuery(undefined, {
    skip: guest,
    pollingInterval: 10000,
  });

  if (guest) return 0;

  const activePosted = postedTasks.filter((t) => {
    const s = t.status?.toUpperCase();
    return s !== 'COMPLETED' && s !== 'CANCELLED';
  }).length;

  const pendingBids = myOffers.filter(
    (o) => o.status?.toUpperCase() === 'PENDING'
  ).length;

  const activeJobs = assignedTasks.filter((t) => {
    const s = t.status?.toUpperCase();
    return s !== 'COMPLETED' && s !== 'CANCELLED';
  }).length;

  return activePosted + pendingBids + activeJobs;
}
