"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminUser, AdminLoginPayload, AdminLoginResponse, ApiError } from "@/types/auth";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  setStoredSession,
  updateStoredTokens,
  clearStoredSession,
} from "@/lib/auth-storage";

interface AuthContextType {
  user: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: AdminLoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Rehydrate session from storage on mount
  useEffect(() => {
    try {
      const storedToken = getStoredAccessToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser && storedUser.role === "ADMIN") {
        setAccessToken(storedToken);
        setUser(storedUser);
      } else if (storedToken || storedUser) {
        // Inconsistent or non-admin session
        clearStoredSession();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Synchronize React state whenever adminFetch rotates tokens in the background
  useEffect(() => {
    const handleTokenRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{ accessToken: string; refreshToken: string }>;
      if (customEvent.detail?.accessToken) {
        setAccessToken(customEvent.detail.accessToken);
      }
    };

    window.addEventListener("admin_token_refreshed", handleTokenRefreshed);
    return () => {
      window.removeEventListener("admin_token_refreshed", handleTokenRefreshed);
    };
  }, []);

  const login = async (payload: AdminLoginPayload) => {
    const res = await fetch("/api/backend/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessage = "Invalid email or password";
      try {
        const errJson = (await res.json()) as ApiError;
        if (Array.isArray(errJson.message)) {
          errorMessage = errJson.message.join(", ");
        } else if (typeof errJson.message === "string") {
          errorMessage = errJson.message;
        }
      } catch {
        errorMessage = res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = (await res.json()) as AdminLoginResponse;

    // Strict role authorization: only ADMIN role permitted
    if (!data.user || data.user.role !== "ADMIN") {
      clearStoredSession();
      throw new Error("Access Denied: Your account does not have administrator privileges.");
    }

    setStoredSession(data.accessToken, data.refreshToken, data.user);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const refreshTokens = async (): Promise<boolean> => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch("/api/backend/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        throw new Error("Refresh rejected");
      }

      const data = await res.json();
      if (!data.accessToken || !data.refreshToken) {
        throw new Error("Invalid token payload");
      }

      updateStoredTokens(data.accessToken, data.refreshToken);
      setAccessToken(data.accessToken);
      return true;
    } catch {
      clearStoredSession();
      setAccessToken(null);
      setUser(null);
      router.replace("/login?expired=true");
      return false;
    }
  };

  const logout = async () => {
    const refreshToken = getStoredRefreshToken();

    // Invalidate refresh token on backend database
    if (refreshToken) {
      try {
        await fetch("/api/backend/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Silently continue with local cleanup if network fails
      }
    }

    clearStoredSession();
    setAccessToken(null);
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken && user?.role === "ADMIN",
        isLoading,
        login,
        logout,
        refreshTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-medium text-muted-foreground tracking-wide">
            Checking authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
