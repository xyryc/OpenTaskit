import { useAppDispatch } from '@/store';
import { apiSlice, clearAuthStorage, getRefreshToken, useLogoutMutation } from '@/store/api/apiSlice';
import { continueAsGuest as guestAction, signOut as signOutAction } from '@/store/slices/authSlice';

/** Keep credential and cache cleanup consistent across every session exit. */
export function useAuthActions() {
  const dispatch = useAppDispatch();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  function clearSession() {
    clearAuthStorage();
    dispatch(apiSlice.util.resetApiState());
  }

  async function signOut() {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch {
      // A network failure must not prevent signing out on this device.
    } finally {
      clearSession();
      dispatch(signOutAction());
    }
  }

  function continueAsGuest() {
    clearSession();
    dispatch(guestAction());
  }

  return { signOut, continueAsGuest, isLoggingOut };
}
