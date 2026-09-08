import {
  getStoredAccessToken,
  getStoredRefreshToken,
  updateStoredTokens,
  clearStoredSession,
} from "./auth-storage";

// Shared promise for mutex locking across concurrent 401 responses
let refreshPromise: Promise<string | null> | null = null;

export interface AdminFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Perform token refresh with mutex lock to prevent concurrent duplicate refresh calls.
 * Returns the fresh accessToken, or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const res = await fetch("/api/backend/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        throw new Error(`Token refresh failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!data.accessToken || !data.refreshToken) {
        throw new Error("Malformed token refresh response");
      }

      updateStoredTokens(data.accessToken, data.refreshToken);

      // Notify any active React contexts of the renewed token
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin_token_refreshed", {
            detail: {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            },
          })
        );
      }

      return data.accessToken as string;
    } catch {
      clearStoredSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=true";
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Enterprise API client for OpenTaskit Admin.
 * Automatically attaches the JWT Bearer token and transparently handles
 * 401 Unauthorized responses with JWT token rotation & request replay.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: AdminFetchOptions
): Promise<Response> {
  const options: RequestInit = { ...init };
  const headers = new Headers(options.headers || {});

  // Determine URL path
  const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const isAuthEndpoint =
    urlString.includes("/auth/login") ||
    urlString.includes("/auth/refresh") ||
    urlString.includes("/auth/logout");

  // Attach access token if available and auth not explicitly skipped
  if (!init?.skipAuth) {
    const token = getStoredAccessToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  options.headers = headers;

  // Execute initial request
  let response = await fetch(input, options);

  // If response is 401 Unauthorized and not an auth endpoint, attempt automatic token rotation
  if (response.status === 401 && !isAuthEndpoint && !init?.skipAuth) {
    const freshToken = await refreshAccessToken();
    if (freshToken) {
      // Retry original request with freshly acquired token
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${freshToken}`);
      options.headers = retryHeaders;
      response = await fetch(input, options);
    }
  }

  return response;
}
