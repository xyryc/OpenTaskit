import { createSlice } from '@reduxjs/toolkit';
import type { AuthUser } from '@/types';
import { isAnyOf } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';

interface AuthState {
  authed: boolean;
  guest: boolean;
  user: AuthUser | null;
}

const initialState: AuthState = {
  authed: false,
  guest: false,
  user: null,
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
    signOut: (state) => {
      state.user = null;
      state.authed = false;
      state.guest = false;
    },
  },
  extraReducers: (builder) => {
    // API success is the only way to establish an authenticated session.
    builder.addMatcher(
      isAnyOf(apiSlice.endpoints.login.matchFulfilled, apiSlice.endpoints.register.matchFulfilled),
      (state, { payload }) => {
        state.authed = true;
        state.guest = false;
        state.user = payload.user;
      },
    );
  },
});

export const { continueAsGuest, signOut } = authSlice.actions;
export default authSlice.reducer;
