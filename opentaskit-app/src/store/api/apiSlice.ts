import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { createMMKV } from "react-native-mmkv";
import { router } from "expo-router";
import { signOut } from "../slices/authActions";
import type {
  AuthResponse,
  AuthUser,
  CategoryItem,
  CreateTaskPayload,
  FilterTasksQuery,
  ForgotPasswordPayload,
  LoginPayload,
  LogoutPayload,
  MessageResponse,
  PaginatedTasksResponse,
  RefreshPayload,
  RefreshResponse,
  RegisterPayload,
  ResetPasswordPayload,
  TaskItem,
  VerifyOtpPayload,
} from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL?.trim()) {
  throw new Error("EXPO_PUBLIC_API_URL must be configured in .env");
}

const storage = createMMKV({ id: "opentaskit-auth" });
const ACCESS_TOKEN_KEY = "opentaskit_access_token";
const REFRESH_TOKEN_KEY = "opentaskit_refresh_token";
const USER_KEY = "opentaskit_user";

export const getAccessToken = () => storage.getString(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => storage.getString(REFRESH_TOKEN_KEY);
export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = storage.getString(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export function clearAuthStorage() {
  storage.remove(ACCESS_TOKEN_KEY);
  storage.remove(REFRESH_TOKEN_KEY);
  storage.remove(USER_KEY);
}

/** Persist synchronously before mutation success allows a screen to navigate. */
function persistSession(response: AuthResponse): AuthResponse {
  storage.set(ACCESS_TOKEN_KEY, response.accessToken);
  storage.set(REFRESH_TOKEN_KEY, response.refreshToken);
  if (response.user) {
    storage.set(USER_KEY, JSON.stringify(response.user));
  }
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

// Mutex to serialize refresh requests across concurrent calls
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/** Clears session state everywhere (storage, auth slice, RTK Query cache) and returns to welcome. */
function forceLogout(api: { dispatch: (action: any) => void }) {
  clearAuthStorage();
  api.dispatch(signOut());
  api.dispatch(apiSlice.util.resetApiState());
  try {
    router.replace("/(screens)/welcome");
  } catch {}
}

export async function refreshAccessToken(api: { dispatch: (action: any) => void }): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    forceLogout(api);
    return null;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = (await response.json()) as RefreshResponse;
        storage.set(ACCESS_TOKEN_KEY, data.accessToken);
        storage.set(REFRESH_TOKEN_KEY, data.refreshToken);
        return data.accessToken;
      } else {
        forceLogout(api);
        return null;
      }
    } catch {
      forceLogout(api);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // If request returned 401 Unauthorized, attempt token refresh
  if (result.error && result.error.status === 401) {
    const newToken = await refreshAccessToken(api);
    if (newToken) {
      // Retry the original request with the fresh token
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Category", "Task", "User", "SavedTask"],
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

    // Tasks Marketplace
    getTasks: builder.query<PaginatedTasksResponse, FilterTasksQuery | void>({
      query: (params) => ({
        url: '/tasks',
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Task' as const, id: 'LIST' },
              ...result.data.map(({ id }) => ({ type: 'Task' as const, id })),
            ]
          : [{ type: 'Task' as const, id: 'LIST' }],
    }),
    getTaskById: builder.query<TaskItem, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),

    createTask: builder.mutation<TaskItem, CreateTaskPayload>({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    uploadImages: builder.mutation<{ message: string; urls: string[] }, FormData>({
      async queryFn(formData, api) {
        const executeUpload = (token: string | null): Promise<any> => {
          return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_BASE_URL}/uploads`);
            xhr.timeout = 60000; // 60s timeout for image upload

            if (token) {
              xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText);
                  resolve({ data });
                } catch {
                  resolve({
                    error: {
                      status: "CUSTOM_ERROR" as const,
                      error: "Failed to parse upload response",
                    },
                  });
                }
              } else {
                try {
                  const errorData = JSON.parse(xhr.responseText);
                  resolve({
                    error: {
                      status: xhr.status,
                      data: errorData,
                    },
                  });
                } catch {
                  resolve({
                    error: {
                      status: xhr.status,
                      data: xhr.responseText,
                    },
                  });
                }
              }
            };

            xhr.onerror = () => {
              resolve({
                error: {
                  status: "FETCH_ERROR" as const,
                  error: "Network error occurred while uploading photos",
                },
              });
            };

            xhr.ontimeout = () => {
              resolve({
                error: {
                  status: "TIMEOUT_ERROR" as const,
                  error: "Image upload timed out. Please try again.",
                },
              });
            };

            xhr.send(formData);
          });
        };

        // 1. Initial attempt with current access token
        const currentToken = storage.getString(ACCESS_TOKEN_KEY) || null;
        let res = await executeUpload(currentToken);

        // 2. If 401 Unauthorized, automatically refresh tokens and retry!
        if (res.error && res.error.status === 401) {
          const newToken = await refreshAccessToken(api);
          if (newToken) {
            res = await executeUpload(newToken);
          }
        }

        return res;
      },
    }),

    resetPassword: builder.mutation<MessageResponse, ResetPasswordPayload>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),

    // Saved Tasks (Bookmarks)
    getSavedTasks: builder.query<TaskItem[], void>({
      query: () => "/users/me/saved-tasks",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "SavedTask" as const, id })),
              { type: "SavedTask", id: "LIST" },
            ]
          : [{ type: "SavedTask", id: "LIST" }],
    }),

    saveTask: builder.mutation<{ message: string; taskId: string }, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/save`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "SavedTask", id: "LIST" }],
    }),

    unsaveTask: builder.mutation<{ message: string; taskId: string }, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/save`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "SavedTask", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUploadImagesMutation,
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useGetSavedTasksQuery,
  useSaveTaskMutation,
  useUnsaveTaskMutation,
} = apiSlice;


