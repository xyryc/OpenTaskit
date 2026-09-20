import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState, type AppStateStatus } from 'react-native';
import { apiSlice } from './api/apiSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Enables refetchOnFocus for RTK Query hooks. RTK Query's default handler
// wires browser events (window 'focus'/'visibilitychange') which never fire
// on React Native, silently doing nothing - so we drive it from AppState
// (foreground/background) instead, which is what "focus" actually means here.
setupListeners(store.dispatch, (dispatch, { onFocus, onFocusLost }) => {
  const handleAppStateChange = (state: AppStateStatus) => {
    dispatch(state === 'active' ? onFocus() : onFocusLost());
  };
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
