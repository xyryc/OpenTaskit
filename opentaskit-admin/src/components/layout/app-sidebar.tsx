"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Layers,
  Star,
  Wallet,
  Landmark,
  LifeBuoy,
  FileText,
  MessageSquare,
  Settings,
  TrendingUp,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { adminFetch } from "@/lib/api-client";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics & KPIs",
        url: "/analytics",
        icon: TrendingUp,
      },
    ],
  },
  {
    label: "Marketplace",
    items: [
      {
        title: "Tasks",
        url: "/tasks",
        icon: ClipboardList,
      },
      {
        title: "Categories",
        url: "/categories",
        icon: Layers,
      },
      {
        title: "Reviews & Ratings",
        url: "/reviews",
        icon: Star,
      },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      {
        title: "Users",
        url: "/users",
        icon: Users,
      },
      {
        title: "KYC Verification",
        url: "/kyc",
        icon: ShieldCheck,
        badge: "4",
        badgeVariant: "default" as const,
      },
      {
        title: "Disputes & Cases",
        url: "/disputes",
        icon: AlertTriangle,
        badge: "2",
        badgeVariant: "destructive" as const,
      },
    ],
  },
  {
    label: "Financials & Escrow",
    items: [
      {
        title: "Escrow & Ledger",
        url: "/finance/escrow",
        icon: Wallet,
        badge: "2",
        badgeVariant: "default" as const,
      },
      {
        title: "Withdrawal Requests",
        url: "/finance/payouts",
        icon: Landmark,
        badge: "2",
        badgeVariant: "destructive" as const,
      },
    ],
  },
  {
    label: "Support & System",
    items: [
      {
        title: "Problem Reports",
        url: "/support",
        icon: LifeBuoy,
      },
      {
        title: "Legal & Policies",
        url: "/legal",
        icon: FileText,
      },
      {
        title: "Platform Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [liveBadges, setLiveBadges] = React.useState<Record<string, string>>({
    "/kyc": "4",
    "/disputes": "2",
    "/finance/escrow": "2",
    "/finance/payouts": "2",
  });

  React.useEffect(() => {
    let isMounted = true;
    async function fetchCounts() {
      try {
        const [paymentsRes, payoutsRes, kycRes, disputesRes] = await Promise.allSettled([
          adminFetch("/api/backend/admin/payments?page=1&limit=1"),
          adminFetch("/api/backend/admin/payouts?status=PENDING&page=1&limit=1"),
          adminFetch("/api/backend/admin/kyc?status=PENDING&page=1&limit=1"),
          adminFetch("/api/backend/admin/disputes?status=OPEN&page=1&limit=1"),
        ]);

        const updates: Record<string, string> = {};

        if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
          const data = await paymentsRes.value.json();
          const count = data.metrics?.activeEscrowCount;
          if (typeof count === "number") {
            updates["/finance/escrow"] = count > 0 ? String(count) : "";
          }
        }

        if (payoutsRes.status === "fulfilled" && payoutsRes.value.ok) {
          const data = await payoutsRes.value.json();
          const count = data.metrics?.pendingCount ?? data.pagination?.total;
          if (typeof count === "number") {
            updates["/finance/payouts"] = count > 0 ? String(count) : "";
          }
        }

        if (kycRes.status === "fulfilled" && kycRes.value.ok) {
          const data = await kycRes.value.json();
          const count = data.counts?.pending ?? data.pagination?.total;
          if (typeof count === "number") {
            updates["/kyc"] = count > 0 ? String(count) : "";
          }
        }

        if (disputesRes.status === "fulfilled" && disputesRes.value.ok) {
          const data = await disputesRes.value.json();
          const count = data.metrics?.openCount ?? data.pagination?.total;
          if (typeof count === "number") {
            updates["/disputes"] = count > 0 ? String(count) : "";
          }
        }

        if (isMounted && Object.keys(updates).length > 0) {
          setLiveBadges((prev) => ({ ...prev, ...updates }));
        }
      } catch {
        // Keep initial defaults
      }
    }

    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <Link href="/" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0094F7] text-white overflow-hidden shadow-xs">
            <Image
              src="/brand/icon-brand.png"
              alt="OpenTaskit Logo"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              OpenTaskit
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Admin Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isExact = pathname === item.url;
                  const isNestedChild =
                    item.url !== "/" &&
                    pathname.startsWith(item.url + "/") &&
                    !navGroups.some((g) =>
                      g.items.some(
                        (other) =>
                          other.url !== item.url &&
                          other.url.startsWith(item.url) &&
                          (pathname === other.url || pathname.startsWith(other.url + "/"))
                      )
                    );
                  const isActive = isExact || isNestedChild;
                  const badgeText = liveBadges[item.url] ?? item.badge;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`h-9 px-3 text-sm font-medium transition-colors group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center ${
                          isActive
                            ? "bg-[#0094F7]/15 text-[#0094F7] font-semibold dark:bg-[#0094F7]/25 dark:text-[#38b6ff] shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                      >
                        <Link href={item.url} className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                          <item.icon
                            className={`h-4 w-4 shrink-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5 ${
                              isActive ? "text-[#0094F7] dark:text-[#38b6ff]" : "text-muted-foreground"
                            }`}
                          />
                          <span className="group-data-[collapsible=icon]:hidden truncate pr-6">{item.title}</span>
                          {badgeText && (
                            <SidebarMenuBadge
                              className={`right-2 top-1/2 -translate-y-1/2 text-[10.5px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center group-data-[collapsible=icon]:hidden ${
                                item.badgeVariant === "destructive"
                                  ? "bg-destructive/15 text-destructive font-bold"
                                  : isActive
                                  ? "bg-[#0094F7]/25 text-[#0094F7] dark:text-[#38b6ff]"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {badgeText}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 rounded-lg border">
            <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-medium text-foreground">
              {user?.fullName || "System Admin"}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {user?.email || "admin@opentaskit.com"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
