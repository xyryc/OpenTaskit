import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { AuthUser } from '@/types';
import { apiSlice, clearAuthStorage, getAccessToken, getStoredUser } from '../api/apiSlice';
import { signOut } from './authActions';

interface AuthState {
  authed: boolean;
  guest: boolean;
  user: AuthUser | null;
}

const storedUser = getStoredUser();
const storedToken = getAccessToken();

const initialState: AuthState = {
  authed: !!(storedToken && storedUser),
  guest: false,
  user: storedUser,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    continueAsGuest: (state) => {
      state.guest = true;
      state.user = null;
      state.authed = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signOut, (state) => {
        clearAuthStorage();
        state.user = null;
        state.authed = false;
        state.guest = false;
      })
      // API success establishes an authenticated session
      .addMatcher(
        isAnyOf(apiSlice.endpoints.login.matchFulfilled, apiSlice.endpoints.register.matchFulfilled),
        (state, { payload }) => {
          state.authed = true;
          state.guest = false;
          state.user = payload.user;
        },
      );
  },
});

export const { continueAsGuest } = authSlice.actions;
export { signOut };
export default authSlice.reducer;

