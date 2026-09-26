import { useAppDispatch } from '@/store';
import {
  apiSlice,
  clearAuthStorage,
  clearStoredPushToken,
  getRefreshToken,
  getStoredPushToken,
  useLogoutMutation,
  useUnregisterPushTokenMutation,
} from '@/store/api/apiSlice';
import { continueAsGuest as guestAction, signOut as signOutAction } from '@/store/slices/authSlice';

/** Keep credential and cache cleanup consistent across every session exit. */
export function useAuthActions() {
  const dispatch = useAppDispatch();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [unregisterPushToken] = useUnregisterPushTokenMutation();

  async function unregisterDevicePushToken() {
    const pushToken = getStoredPushToken();
    if (pushToken) {
      await unregisterPushToken({ token: pushToken }).unwrap().catch(() => {});
    }
    clearStoredPushToken();
  }

  function clearSession() {
    clearAuthStorage();
    dispatch(apiSlice.util.resetApiState());
  }

  async function signOut() {
    const refreshToken = getRefreshToken();
    try {
      await unregisterDevicePushToken();
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch {
      // A network failure must not prevent signing out on this device.
    } finally {
      clearSession();
      dispatch(signOutAction());
    }
  }

  async function continueAsGuest() {
    await unregisterDevicePushToken();
    clearSession();
    dispatch(guestAction());
  }

  return { signOut, continueAsGuest, isLoggingOut };
}
