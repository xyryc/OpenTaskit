import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store';
import {
  useGetSavedTasksQuery,
  useSaveTaskMutation,
  useUnsaveTaskMutation,
  getAccessToken,
} from '@/store/api/apiSlice';
import type { TaskItem } from '@/types/api';

export function useSavedTasks() {
  const { guest, user } = useAppSelector((state) => state.auth);
  const token = getAccessToken();
  const isLoggedIn = !guest && (!!user || !!token);

  const {
    data: savedTasks = [],
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useGetSavedTasksQuery(undefined, {
    skip: !isLoggedIn,
  });

  const [saveTaskMutation, { isLoading: isSaving }] = useSaveTaskMutation();
  const [unsaveTaskMutation, { isLoading: isUnsaving }] = useUnsaveTaskMutation();

  const savedTaskIds = useMemo(
    () => savedTasks.map((task) => task.id),
    [savedTasks]
  );

  const isTaskSaved = useCallback(
    (taskId: string) => savedTaskIds.includes(taskId),
    [savedTaskIds]
  );

  const toggleSave = useCallback(
    async (taskId: string) => {
      if (!isLoggedIn) {
        return {
          success: false,
          reason: 'unauthenticated' as const,
        };
      }

      const alreadySaved = savedTaskIds.includes(taskId);
      try {
        if (alreadySaved) {
          await unsaveTaskMutation(taskId).unwrap();
          return { success: true, action: 'unsaved' as const };
        } else {
          await saveTaskMutation(taskId).unwrap();
          return { success: true, action: 'saved' as const };
        }
      } catch (err) {
        return { success: false, reason: 'error' as const, error: err };
      }
    },
    [isLoggedIn, savedTaskIds, saveTaskMutation, unsaveTaskMutation]
  );

  return {
    savedTasks,
    savedTaskIds,
    savedCount: savedTasks.length,
    isTaskSaved,
    toggleSave,
    isLoading,
    isFetching,
    refetch,
    isError,
    isSaving,
    isUnsaving,
    isLoggedIn,
  };
}
