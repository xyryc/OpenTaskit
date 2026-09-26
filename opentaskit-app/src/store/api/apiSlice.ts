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
  AcceptOfferResponse,
  AuthResponse,
  AuthUser,
  BankAccountItem,
  CancelTaskResponse,
  CategoryItem,
  ChangePasswordPayload,
  CompleteTaskResponse,
  ConversationItem,
  CreateBankAccountPayload,
  CreateDisputePayload,
  CreateMessagePayload,
  CreateOfferPayload,
  CreatePayoutRequestPayload,
  CreateReviewPayload,
  CreateTaskPayload,
  DisputeItem,
  FilterTasksQuery,
  ForgotPasswordPayload,
  InitiateCheckoutResponse,
  KycVerificationRecord,
  MyDisputesQuery,
  MyDisputesResponse,
  LoginPayload,
  LogoutPayload,
  MessageResponse,
  MessageThreadResponse,
  MyKycResponse,
  MyProfileResponse,
  MyReviewsQuery,
  MyReviewsResponse,
  MyWalletResponse,
  NotificationsQuery,
  NotificationsResponse,
  OfferItem,
  PaginatedTasksResponse,
  PaymentTaskStatus,
  PayoutRequestItem,
  RejectOfferResponse,
  ReviewItem,
  UpdateMyProfilePayload,
  UpdateTaskPayload,
  CreateServicePayload,
  CreatePortfolioItemPayload,
  ProviderServiceRecord,
  PortfolioItemRecord,
  LegalDocumentResponse,
  RefreshPayload,
  RefreshResponse,
  RegisterPayload,
  ResetPasswordPayload,
  StartTaskResponse,
  MyOfferItem,
  PublicProfileResponse,
  TaskItem,
  UpdateOfferResponse,
  UserReviewsQuery,
  UserReviewsResponse,
  VerifyOtpPayload,
  WalletTopUpStatus,
  CreateProblemReportPayload,
  ProblemReportResponse,
  ContactConfigResponse,
  TaskRulesResponse,
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
  isHandlingForcedLogout = false;
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

// Guards forceLogout against re-entrancy: resetApiState() below causes any
// still-mounted subscribed query to refetch immediately: with the token
// already cleared, that refetch 401s, which re-enters this same function via
// refreshAccessToken. Without this flag that becomes an infinite loop of
// resetApiState -> refetch -> 401 -> forceLogout -> resetApiState -> ...
let isHandlingForcedLogout = false;

/** Clears session state everywhere (storage, auth slice, RTK Query cache) and returns to welcome. */
function forceLogout(api: { dispatch: (action: any) => void }) {
  if (isHandlingForcedLogout) return;
  isHandlingForcedLogout = true;
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
        isHandlingForcedLogout = false;
        storage.set(ACCESS_TOKEN_KEY, data.accessToken);
        storage.set(REFRESH_TOKEN_KEY, data.refreshToken);
        return data.accessToken;
      }

      // Only a 401/403 from the server means the refresh token itself is
      // invalid/expired/revoked - that's a real "session over" signal. Any
      // other status (5xx, etc.) is a server-side hiccup, not proof the
      // session is dead, so don't wipe the user's tokens over it.
      if (response.status === 401 || response.status === 403) {
        forceLogout(api);
      }
      return null;
    } catch {
      // Network failure (offline, request timeout, dev server mid-restart,
      // etc.) - the refresh token may still be perfectly valid, so don't
      // force a logout here. Just fail this attempt; the next request will
      // retry the refresh once connectivity/the server is back.
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Shared multipart/form-data uploader for endpoints that need a longer
 * timeout than fetchBaseQuery's default 10s (image/document uploads), with
 * one automatic retry after a silent token refresh on 401.
 */
function multipartUpload(
  path: string,
  formData: FormData,
  api: { dispatch: (action: any) => void },
  timeoutMs = 60000,
) {
  const executeUpload = (token: string | null): Promise<any> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}${path}`);
      xhr.timeout = timeoutMs;

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

      xhr.onerror = (e) => {
        console.warn(`[multipartUpload] Network error:`, {
          status: xhr.status,
          statusText: xhr.statusText,
          response: xhr.responseText,
          url: `${API_BASE_URL}${path}`,
          event: e,
        });
        resolve({
          error: {
            status: "FETCH_ERROR" as const,
            error: `Network error connecting to ${API_BASE_URL}${path}. Please check that the server is running.`,
          },
        });
      };

      xhr.ontimeout = () => {
        resolve({
          error: {
            status: "TIMEOUT_ERROR" as const,
            error: "Upload timed out. Please try again.",
          },
        });
      };

      xhr.send(formData);
    });
  };

  return (async () => {
    const currentToken = storage.getString(ACCESS_TOKEN_KEY) || null;
    let res = await executeUpload(currentToken);

    if (res.error && res.error.status === 401) {
      const newToken = await refreshAccessToken(api);
      if (newToken) {
        res = await executeUpload(newToken);
      }
    }

    return res;
  })();
}

// Public auth endpoints: a 401 from these means "invalid credentials" or
// "invalid/expired refresh token", never "access token expired" - so they
// must never trigger the reauth-and-retry flow below.
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/verify-otp",
  "/auth/reset-password",
];

function isPublicAuthRequest(args: string | FetchArgs): boolean {
  const url = typeof args === "string" ? args : args.url;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // If request returned 401 Unauthorized, attempt token refresh - unless the
  // request itself was to a public auth endpoint (e.g. a login attempt with
  // the wrong password), where a 401 must be surfaced as-is, not treated as
  // an expired session.
  if (result.error && result.error.status === 401 && !isPublicAuthRequest(args)) {
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
  tagTypes: [
    "Category",
    "Task",
    "User",
    "SavedTask",
    "Offer",
    "Review",
    "Kyc",
    "Dispute",
    "Wallet",
    "BankAccount",
    "Payout",
    "Payment",
    "Notification",
    "Message",
    "Legal",
    "Report",
  ],
  // Two-sided marketplace state (task/offer status) changes from the OTHER
  // party's device, which this client has no way to know about until it
  // re-asks the server - so re-check on every screen focus/mount rather than
  // trusting a possibly stale cache indefinitely.
  refetchOnFocus: true,
  // Refetch on mount only if the cached data is more than 30s old, so quick
  // back-and-forth navigation within a session doesn't hammer the API.
  refetchOnMountOrArgChange: 30,
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

    changePassword: builder.mutation<MessageResponse, ChangePasswordPayload>({
      query: (body) => ({ url: "/auth/change-password", method: "PATCH", body }),
    }),

    // User Profile
    getMyProfile: builder.query<MyProfileResponse, void>({
      query: () => "/users/me",
      providesTags: [{ type: "User", id: "ME" }],
    }),

    updateMyProfile: builder.mutation<MyProfileResponse, UpdateMyProfilePayload>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),

    addService: builder.mutation<ProviderServiceRecord, CreateServicePayload>({
      query: (body) => ({ url: "/users/me/services", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),
    removeService: builder.mutation<{ success: boolean }, string>({
      query: (serviceId) => ({ url: `/users/me/services/${serviceId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),

    addPortfolioItem: builder.mutation<PortfolioItemRecord, CreatePortfolioItemPayload>({
      query: (body) => ({ url: "/users/me/portfolio", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),
    removePortfolioItem: builder.mutation<{ success: boolean }, string>({
      query: (itemId) => ({ url: `/users/me/portfolio/${itemId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),

    // Legal documents (admin-editable Terms of Service / Privacy Policy)
    getLegalDocument: builder.query<LegalDocumentResponse, string>({
      query: (slug) => `/legal/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: "Legal", id: slug }],
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
      invalidatesTags: [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_POSTED' },
      ],
    }),

    updateTask: builder.mutation<TaskItem, { taskId: string } & UpdateTaskPayload>({
      query: ({ taskId, ...body }) => ({
        url: `/tasks/${taskId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_POSTED' },
      ],
    }),

    getMyPostedTasks: builder.query<TaskItem[], void>({
      query: () => '/users/me/tasks?type=posted',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Task' as const, id })),
              { type: 'Task', id: 'MY_POSTED' },
            ]
          : [{ type: 'Task', id: 'MY_POSTED' }],
    }),

    getMyAssignedTasks: builder.query<TaskItem[], void>({
      query: () => '/users/me/tasks?type=assigned',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Task' as const, id })),
              { type: 'Task', id: 'MY_ASSIGNED' },
            ]
          : [{ type: 'Task', id: 'MY_ASSIGNED' }],
    }),

    deleteTask: builder.mutation<{ message: string; id: string }, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, taskId) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_POSTED' },
        { type: 'Task', id: 'MY_ASSIGNED' },
      ],
    }),

    startTask: builder.mutation<StartTaskResponse, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/start`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, taskId) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_POSTED' },
        { type: 'Task', id: 'MY_ASSIGNED' },
        { type: 'Offer', id: `TASK_${taskId}` },
        { type: 'Offer', id: 'MY_LIST' },
      ],
    }),

    completeTask: builder.mutation<CompleteTaskResponse, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, taskId) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_POSTED' },
        { type: 'Task', id: 'MY_ASSIGNED' },
        { type: 'Offer', id: `TASK_${taskId}` },
        { type: 'Offer', id: 'MY_LIST' },
      ],
    }),

    cancelTask: builder.mutation<CancelTaskResponse, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, taskId) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_POSTED' },
        { type: 'Task', id: 'MY_ASSIGNED' },
        { type: 'Offer', id: `TASK_${taskId}` },
        { type: 'Offer', id: 'MY_LIST' },
      ],
    }),

    // Offers
    createOffer: builder.mutation<OfferItem, { taskId: string } & CreateOfferPayload>({
      query: ({ taskId, ...body }) => ({
        url: `/tasks/${taskId}/offers`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: 'Task', id: taskId },
        { type: 'Offer', id: `TASK_${taskId}` },
        { type: 'Offer', id: 'MY_LIST' },
      ],
    }),

    getOffersForTask: builder.query<OfferItem[], string>({
      query: (taskId) => `/tasks/${taskId}/offers`,
      providesTags: (result, _error, taskId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Offer' as const, id })),
              { type: 'Offer' as const, id: `TASK_${taskId}` },
            ]
          : [{ type: 'Offer' as const, id: `TASK_${taskId}` }],
    }),

    getMyOffers: builder.query<MyOfferItem[], void>({
      query: () => '/users/me/offers',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Offer' as const, id })),
              { type: 'Offer' as const, id: 'MY_LIST' },
            ]
          : [{ type: 'Offer' as const, id: 'MY_LIST' }],
    }),

    updateOffer: builder.mutation<UpdateOfferResponse, { offerId: string } & CreateOfferPayload>({
      query: ({ offerId, ...body }) => ({ url: `/offers/${offerId}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { offerId }) => [
        { type: 'Offer', id: offerId },
        { type: 'Offer', id: 'MY_LIST' },
      ],
    }),

    withdrawOffer: builder.mutation<{ message: string; offerId: string }, { offerId: string; taskId: string }>({
      query: ({ offerId }) => ({ url: `/offers/${offerId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { offerId, taskId }) => [
        { type: 'Offer', id: offerId },
        { type: 'Offer', id: `TASK_${taskId}` },
        { type: 'Offer', id: 'MY_LIST' },
        { type: 'Task', id: taskId },
      ],
    }),

    acceptOffer: builder.mutation<AcceptOfferResponse, { offerId: string; taskId: string }>({
      query: ({ offerId }) => ({
        url: `/offers/${offerId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { offerId, taskId }) => [
        { type: 'Offer', id: offerId },
        { type: 'Offer', id: `TASK_${taskId}` },
        { type: 'Offer', id: 'MY_LIST' },
        { type: 'Task', id: taskId },
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_POSTED' },
        { type: 'Task', id: 'MY_ASSIGNED' },
      ],
    }),

    rejectOffer: builder.mutation<RejectOfferResponse, { offerId: string; taskId: string }>({
      query: ({ offerId }) => ({
        url: `/offers/${offerId}/reject`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { offerId, taskId }) => [
        { type: 'Offer', id: offerId },
        { type: 'Offer', id: `TASK_${taskId}` },
        { type: 'Offer', id: 'MY_LIST' },
        { type: 'Task', id: taskId },
      ],
    }),

    // Reviews
    createReview: builder.mutation<ReviewItem, { taskId: string } & CreateReviewPayload>({
      query: ({ taskId, ...body }) => ({
        url: `/tasks/${taskId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, _error, { taskId }) => [
        { type: 'Review', id: `TASK_${taskId}` },
        ...(result ? [{ type: 'Review' as const, id: `USER_${result.toUserId}` }] : []),
      ],
    }),

    getReviewsForTask: builder.query<ReviewItem[], string>({
      query: (taskId) => `/tasks/${taskId}/reviews`,
      providesTags: (result, _error, taskId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Review' as const, id })),
              { type: 'Review' as const, id: `TASK_${taskId}` },
            ]
          : [{ type: 'Review' as const, id: `TASK_${taskId}` }],
    }),

    getUserReviews: builder.query<UserReviewsResponse, { userId: string } & UserReviewsQuery>({
      query: ({ userId, ...params }) => ({
        url: `/users/${userId}/reviews`,
        params,
      }),
      providesTags: (_result, _error, { userId }) => [{ type: 'Review', id: `USER_${userId}` }],
    }),

    getMyReviews: builder.query<MyReviewsResponse, MyReviewsQuery | void>({
      query: (params) => ({
        url: `/reviews/me`,
        params: params ?? undefined,
      }),
      providesTags: ['Review'],
    }),

    getPublicProfile: builder.query<PublicProfileResponse, string>({
      query: (userId) => `/users/${userId}/profile`,
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),

    // Disputes
    createDispute: builder.mutation<DisputeItem, { taskId: string } & CreateDisputePayload>({
      query: ({ taskId, ...body }) => ({
        url: `/tasks/${taskId}/disputes`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: 'Dispute', id: `TASK_${taskId}` },
        { type: 'Dispute', id: 'MY_LIST' },
        { type: 'Task', id: taskId },
      ],
    }),

    getDisputesForTask: builder.query<DisputeItem[], string>({
      query: (taskId) => `/tasks/${taskId}/disputes`,
      providesTags: (result, _error, taskId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Dispute' as const, id })),
              { type: 'Dispute' as const, id: `TASK_${taskId}` },
            ]
          : [{ type: 'Dispute' as const, id: `TASK_${taskId}` }],
    }),

    getMyDisputes: builder.query<MyDisputesResponse, MyDisputesQuery | void>({
      query: (params) => ({ url: '/disputes/me', params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Dispute' as const, id })),
              { type: 'Dispute' as const, id: 'MY_LIST' },
            ]
          : [{ type: 'Dispute' as const, id: 'MY_LIST' }],
    }),

    uploadImages: builder.mutation<{ message: string; urls: string[] }, FormData>({
      queryFn: (formData, api) => multipartUpload("/uploads", formData, api),
    }),

    // Notifications
    getNotifications: builder.query<NotificationsResponse, NotificationsQuery | void>({
      query: (params) => ({ url: '/notifications', params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ id }) => ({ type: 'Notification' as const, id })),
              { type: 'Notification' as const, id: 'LIST' },
            ]
          : [{ type: 'Notification' as const, id: 'LIST' }],
    }),

    markNotificationRead: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    markAllNotificationsRead: builder.mutation<{ message: string; count: number }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    deleteNotification: builder.mutation<{ message: string; id: string }, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    // Messages / Chat
    getConversations: builder.query<ConversationItem[], void>({
      query: () => '/messages/conversations',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ taskId, otherUser }) => ({
                type: 'Message' as const,
                id: `CONV_${taskId}_${otherUser.id}`,
              })),
              { type: 'Message' as const, id: 'CONVERSATIONS' },
            ]
          : [{ type: 'Message' as const, id: 'CONVERSATIONS' }],
    }),

    getUnreadMessagesCount: builder.query<{ count: number }, void>({
      query: () => '/messages/unread-count',
      providesTags: [{ type: 'Message' as const, id: 'UNREAD_COUNT' }],
    }),

    getMessageThread: builder.query<MessageThreadResponse, { taskId: string; withUserId?: string }>({
      query: ({ taskId, withUserId }) => ({
        url: `/tasks/${taskId}/messages`,
        params: withUserId ? { withUserId } : undefined,
      }),
      providesTags: (_result, _error, { taskId, withUserId }) => [
        { type: 'Message', id: `THREAD_${taskId}_${withUserId ?? 'auto'}` },
      ],
    }),

    sendMessage: builder.mutation<
      { id: string },
      { taskId: string } & CreateMessagePayload
    >({
      query: ({ taskId, ...body }) => ({
        url: `/tasks/${taskId}/messages`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { taskId, toUserId }) => [
        { type: 'Message', id: `THREAD_${taskId}_${toUserId ?? 'auto'}` },
        { type: 'Message', id: 'CONVERSATIONS' },
        { type: 'Message', id: 'UNREAD_COUNT' },
      ],
    }),

    // Payments / Escrow
    initiateCheckout: builder.mutation<InitiateCheckoutResponse, string>({
      query: (taskId) => ({ url: `/payments/checkout/${taskId}`, method: 'POST' }),
      invalidatesTags: (_result, _error, taskId) => [{ type: 'Payment', id: taskId }],
    }),

    getPaymentStatus: builder.query<PaymentTaskStatus, string>({
      query: (taskId) => `/payments/task/${taskId}`,
      providesTags: (_result, _error, taskId) => [{ type: 'Payment', id: taskId }],
    }),

    // Client-triggered fallback confirmation, called right after the native
    // PayHere SDK reports a completed payment - the server re-checks against
    // PayHere directly rather than trusting the client's word for it.
    verifyPayment: builder.mutation<PaymentTaskStatus, { orderId: string; taskId: string }>({
      query: ({ orderId }) => ({ url: `/payments/${orderId}/verify`, method: 'POST' }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: 'Payment', id: taskId }],
    }),

    // Wallet
    getMyWallet: builder.query<MyWalletResponse, void>({
      query: () => '/wallet/me',
      providesTags: ['Wallet'],
    }),

    initiateTopUp: builder.mutation<InitiateCheckoutResponse, { amount: number }>({
      query: (body) => ({ url: '/wallet/topup/checkout', method: 'POST', body }),
    }),

    // Client-triggered fallback confirmation, mirrors verifyPayment - called
    // right after the native PayHere SDK reports a completed top-up.
    verifyTopUp: builder.mutation<WalletTopUpStatus, { orderId: string }>({
      query: ({ orderId }) => ({ url: `/wallet/topup/${orderId}/verify`, method: 'POST' }),
      invalidatesTags: ['Wallet'],
    }),

    // Bank Accounts
    getMyBankAccounts: builder.query<BankAccountItem[], void>({
      query: () => '/bank-accounts/me',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'BankAccount' as const, id })),
              { type: 'BankAccount' as const, id: 'LIST' },
            ]
          : [{ type: 'BankAccount' as const, id: 'LIST' }],
    }),

    createBankAccount: builder.mutation<BankAccountItem, CreateBankAccountPayload>({
      query: (body) => ({ url: '/bank-accounts', method: 'POST', body }),
      invalidatesTags: [{ type: 'BankAccount', id: 'LIST' }],
    }),

    deleteBankAccount: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/bank-accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'BankAccount', id: 'LIST' }],
    }),

    // Payouts (withdrawals)
    getMyPayouts: builder.query<PayoutRequestItem[], void>({
      query: () => '/payouts/me',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Payout' as const, id })),
              { type: 'Payout' as const, id: 'LIST' },
            ]
          : [{ type: 'Payout' as const, id: 'LIST' }],
    }),

    createPayoutRequest: builder.mutation<PayoutRequestItem, CreatePayoutRequestPayload>({
      query: (body) => ({ url: '/payouts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Payout', id: 'LIST' }, 'Wallet'],
    }),

    // KYC / Identity Verification
    getMyKyc: builder.query<MyKycResponse, void>({
      query: () => "/kyc/me",
      providesTags: ["Kyc"],
    }),

    submitKyc: builder.mutation<KycVerificationRecord, FormData>({
      queryFn: (formData, api) => multipartUpload("/kyc/submit", formData, api),
      invalidatesTags: ["Kyc"],
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

    submitProblemReport: builder.mutation<ProblemReportResponse, CreateProblemReportPayload>({
      query: (body) => ({
        url: "/reports",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Report" as const, id: "LIST" }, { type: "Report" as const, id: "MY_LIST" }],
    }),

    getMyReports: builder.query<ProblemReportResponse[], void>({
      query: () => "/reports/my",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Report" as const, id })),
              { type: "Report" as const, id: "MY_LIST" },
            ]
          : [{ type: "Report" as const, id: "MY_LIST" }],
    }),

    getContactConfig: builder.query<ContactConfigResponse, void>({
      query: () => "/platform-config/contact",
    }),

    getTaskRules: builder.query<TaskRulesResponse, void>({
      query: () => "/platform-config/task-rules",
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useGetMyPostedTasksQuery,
  useGetMyAssignedTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useStartTaskMutation,
  useCompleteTaskMutation,
  useCancelTaskMutation,
  useCreateOfferMutation,
  useGetOffersForTaskQuery,
  useGetMyOffersQuery,
  useUpdateOfferMutation,
  useWithdrawOfferMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useCreateReviewMutation,
  useGetReviewsForTaskQuery,
  useGetUserReviewsQuery,
  useGetMyReviewsQuery,
  useGetPublicProfileQuery,
  useGetMyKycQuery,
  useSubmitKycMutation,
  useCreateDisputeMutation,
  useGetDisputesForTaskQuery,
  useGetMyDisputesQuery,
  useUploadImagesMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useGetConversationsQuery,
  useGetUnreadMessagesCountQuery,
  useGetMessageThreadQuery,
  useSendMessageMutation,
  useInitiateCheckoutMutation,
  useGetPaymentStatusQuery,
  useVerifyPaymentMutation,
  useLazyGetPaymentStatusQuery,
  useGetMyWalletQuery,
  useInitiateTopUpMutation,
  useVerifyTopUpMutation,
  useGetMyBankAccountsQuery,
  useCreateBankAccountMutation,
  useDeleteBankAccountMutation,
  useGetMyPayoutsQuery,
  useCreatePayoutRequestMutation,
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useAddServiceMutation,
  useRemoveServiceMutation,
  useAddPortfolioItemMutation,
  useRemovePortfolioItemMutation,
  useGetLegalDocumentQuery,
  useGetSavedTasksQuery,
  useSaveTaskMutation,
  useUnsaveTaskMutation,
  useSubmitProblemReportMutation,
  useGetMyReportsQuery,
  useGetContactConfigQuery,
  useGetTaskRulesQuery,
} = apiSlice;



