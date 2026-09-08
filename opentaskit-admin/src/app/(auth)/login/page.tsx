"use client";

import React, { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Clock,
} from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const isExpired = searchParams.get("expired") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both your work email and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
      });
      router.replace("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please verify your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Card */}
      <div className="rounded-2xl border bg-card p-7 shadow-lg shadow-black/5 dark:shadow-none">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-primary/20 shadow-md">
            <Image
              src="/brand/icon-brand.png"
              alt="OpenTaskit Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              OpenTaskit Admin Portal
            </h1>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Operations, escrow oversight & moderation controls
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-6">
          {/* Session Expired Notice */}
          {isExpired && !error && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400 animate-in fade-in-50">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                Your administrator session has expired. Please sign in again to continue.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-foreground tracking-wide"
            >
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="pl-9 h-10 text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-foreground tracking-wide"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="pl-9 pr-9 h-10 text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-10 font-semibold tracking-wide mt-2 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In to Admin Portal"
            )}
          </Button>
        </form>
      </div>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
        <span>Restricted system. Authorized OpenTaskit personnel only.</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-muted/25 dark:bg-zinc-950 p-4">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <Suspense fallback={null}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
