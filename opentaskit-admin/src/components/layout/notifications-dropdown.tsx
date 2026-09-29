"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  Landmark,
  Wallet,
  LifeBuoy,
  Inbox,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { adminFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  actionUrl?: string | null;
  taskId?: string | null;
  createdAt: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Just now";
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return "Just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}

function resolveAdminRoute(actionUrl?: string | null, type?: string): string | null {
  if (!actionUrl) {
    if (type === "PAYMENT") return "/finance/escrow";
    return null;
  }

  // Normalize mobile app route URLs to admin portal routes
  if (actionUrl.startsWith("/(screens)/")) {
    const screen = actionUrl.replace("/(screens)/", "");
    if (screen.startsWith("kyc")) return "/kyc";
    if (screen.startsWith("disputes")) return "/disputes";
    if (screen.startsWith("wallet")) return "/finance/escrow";
    if (screen.startsWith("tasks")) return "/tasks";
    return "/";
  }

  if (actionUrl.startsWith("/tasks/")) {
    if (actionUrl.includes("disputes")) return "/disputes";
    return "/tasks";
  }

  return actionUrl;
}

function getNotificationIcon(type: string, actionUrl?: string | null) {
  const url = actionUrl || "";
  if (url.includes("/kyc") || type === "KYC") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0094F7]/15 text-[#0094F7]">
        <ShieldCheck className="h-4 w-4" />
      </div>
    );
  }
  if (url.includes("/disputes") || type === "DISPUTE") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="h-4 w-4" />
      </div>
    );
  }
  if (url.includes("/payouts")) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Landmark className="h-4 w-4" />
      </div>
    );
  }
  if (url.includes("/escrow") || type === "PAYMENT") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Wallet className="h-4 w-4" />
      </div>
    );
  }
  if (url.includes("/support")) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
        <LifeBuoy className="h-4 w-4" />
      </div>
    );
  }
  if (type === "TASK") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0094F7]/15 text-[#0094F7]">
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Bell className="h-4 w-4" />
    </div>
  );
}

export function NotificationsDropdown() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = React.useState<boolean>(false);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminFetch("/api/backend/notifications?limit=25");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      }
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  React.useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch whenever dropdown opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notif: AdminNotification) => {
    // Optimistic read status update
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await adminFetch(`/api/backend/notifications/${notif.id}/read`, {
          method: "PATCH",
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    setOpen(false);

    const targetRoute = resolveAdminRoute(notif.actionUrl, notif.type);
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0 || isMarkingAll) return;

    try {
      setIsMarkingAll(true);
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await adminFetch("/api/backend/notifications/read-all", {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 cursor-pointer">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9.5px] font-bold text-destructive-foreground shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 shadow-lg">
        {/* Dropdown Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0.5">
                {unreadCount} New
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="h-7 px-2 text-[11px] font-medium text-primary hover:text-primary/80 gap-1 cursor-pointer"
            >
              {isMarkingAll ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Notifications Scroll List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mb-2" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 text-muted-foreground/50" />
              <p className="text-xs font-medium text-foreground">No notifications</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                All platform verification, dispute, and financial events are caught up!
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const icon = getNotificationIcon(notif.type, notif.actionUrl);
              const isUnread = !notif.isRead;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer text-left ${
                    isUnread
                      ? "bg-[#0094F7]/5 dark:bg-[#0094F7]/10 hover:bg-[#0094F7]/10 dark:hover:bg-[#0094F7]/15"
                      : "hover:bg-muted/40"
                  }`}
                >
                  {icon}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`text-xs leading-snug truncate ${
                          isUnread ? "font-bold text-foreground" : "font-medium text-foreground/90"
                        }`}
                      >
                        {notif.title}
                      </span>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-[#0094F7] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.body}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 mt-1 font-medium">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dropdown Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2 bg-muted/20 text-center">
            <span className="text-[10.5px] text-muted-foreground">
              Showing recent platform events & alerts
            </span>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
