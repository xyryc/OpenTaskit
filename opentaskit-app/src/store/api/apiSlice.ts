import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createMMKV } from 'react-native-mmkv';
import type {
  AuthResponse,
  LoginPayload,
  LogoutPayload,
  MessageResponse,
  RegisterPayload,
} from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL?.trim()) {
  throw new Error('EXPO_PUBLIC_API_URL must be configured in .env');
}

const storage = createMMKV({ id: 'opentaskit-auth' });
const ACCESS_TOKEN_KEY = 'opentaskit_access_token';
const REFRESH_TOKEN_KEY = 'opentaskit_refresh_token';

export const getRefreshToken = () => storage.getString(REFRESH_TOKEN_KEY);

export function clearAuthStorage() {
  storage.remove(ACCESS_TOKEN_KEY);
  storage.remove(REFRESH_TOKEN_KEY);
}

/** Persist synchronously before mutation success allows a screen to navigate. */
function persistSession(response: AuthResponse): AuthResponse {
  storage.set(ACCESS_TOKEN_KEY, response.accessToken);
  storage.set(REFRESH_TOKEN_KEY, response.refreshToken);
  return response;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    timeout: 10000,
    prepareHeaders: (headers) => {
      const token = storage.getString(ACCESS_TOKEN_KEY);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterPayload>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: persistSession,
    }),
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: persistSession,
    }),
    logout: builder.mutation<MessageResponse, LogoutPayload>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation } = apiSlice;
