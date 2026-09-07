import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { createMMKV } from "react-native-mmkv";
import type {
  AuthResponse,
  CategoryItem,
  ForgotPasswordPayload,
  LoginPayload,
  LogoutPayload,
  MessageResponse,
  RefreshPayload,
  RefreshResponse,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
} from "@/types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL?.trim()) {
  throw new Error("EXPO_PUBLIC_API_URL must be configured in .env");
}

const storage = createMMKV({ id: "opentaskit-auth" });
const ACCESS_TOKEN_KEY = "opentaskit_access_token";
const REFRESH_TOKEN_KEY = "opentaskit_refresh_token";

export const getAccessToken = () => storage.getString(ACCESS_TOKEN_KEY);
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

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 10000,
  prepareHeaders: (headers) => {
    const token = storage.getString(ACCESS_TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // If request returned 401 Unauthorized, attempt token refresh
  if (result.error && result.error.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const refreshData = refreshResult.data as RefreshResponse;
        storage.set(ACCESS_TOKEN_KEY, refreshData.accessToken);
        storage.set(REFRESH_TOKEN_KEY, refreshData.refreshToken);
        // Retry the original request with the fresh token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        // Refresh token failed or expired: clear session & sign out
        clearAuthStorage();
        api.dispatch({ type: "auth/signOut" });
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Category", "Task", "User"],
  endpoints: (builder) => ({
    // Categories
    getCategories: builder.query<CategoryItem[], boolean | void>({
      query: (includeInactive) => ({
        url: "/categories",
        params: includeInactive ? { all: "true" } : undefined,
      }),
      providesTags: ["Category"],
    }),
    getCategoryById: builder.query<CategoryItem, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Category", id }],
    }),

    // Authentication & Account
    register: builder.mutation<AuthResponse, RegisterPayload>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: persistSession,
    }),

    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: persistSession,
    }),

    refresh: builder.mutation<RefreshResponse, RefreshPayload>({
      query: (body) => ({ url: "/auth/refresh", method: "POST", body }),
      transformResponse: (response: RefreshResponse) => {
        storage.set(ACCESS_TOKEN_KEY, response.accessToken);
        storage.set(REFRESH_TOKEN_KEY, response.refreshToken);
        return response;
      },
    }),

    logout: builder.mutation<MessageResponse, LogoutPayload>({
      query: (body) => ({ url: "/auth/logout", method: "POST", body }),
    }),

    forgotPassword: builder.mutation<MessageResponse, ForgotPasswordPayload>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),

    verifyOtp: builder.mutation<MessageResponse, VerifyOtpPayload>({
      query: (body) => ({ url: "/auth/verify-otp", method: "POST", body }),
    }),

    resetPassword: builder.mutation<MessageResponse, ResetPasswordPayload>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} = apiSlice;
