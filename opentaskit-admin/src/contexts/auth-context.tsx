"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminUser, AdminLoginPayload, AdminLoginResponse, ApiError } from "@/types/auth";
import {
  getStoredAccessToken,
  getStoredUser,
  setStoredSession,
  clearStoredSession,
} from "@/lib/auth-storage";

interface AuthContextType {
  user: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: AdminLoginPayload) => Promise<void>;
  logout: () => void;
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
        // Fallback to HTTP status text
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

  const logout = () => {
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
