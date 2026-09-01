import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';
import { users, ME } from '@/data/users';

interface AuthState {
  authed: boolean;
  guest: boolean;
  user: User | null;
}

const initialUser = users.find((u) => u.id === ME) ?? users[0];

const initialState: AuthState = {
  authed: false,
  guest: false,
  user: initialUser,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthed: (state, action: PayloadAction<boolean>) => {
      state.authed = action.payload;
      if (action.payload) {
        state.guest = false;
      }
    },
    continueAsGuest: (state) => {
      state.guest = true;
      state.authed = false;
    },
    signOut: (state) => {
      state.authed = false;
      state.guest = false;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
  },
});

export const { setAuthed, continueAsGuest, signOut, setUser } = authSlice.actions;
export default authSlice.reducer;
