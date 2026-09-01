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
        badge: "4 Pending",
        badgeVariant: "default" as const,
      },
      {
        title: "Disputes & Cases",
        url: "/disputes",
        icon: AlertTriangle,
        badge: "2 Active",
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
      },
    ],
  },
  {
    label: "Support & System",
    items: [
      {
        title: "Live Support Chat",
        url: "/support/chat",
        icon: MessageSquare,
        badge: "1 New",
        badgeVariant: "default" as const,
      },
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
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                          {item.badge && (
                            <SidebarMenuBadge
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full group-data-[collapsible=icon]:hidden ${
                                item.badgeVariant === "destructive"
                                  ? "bg-destructive/15 text-destructive font-bold"
                                  : isActive
                                  ? "bg-[#0094F7]/25 text-[#0094F7] dark:text-[#38b6ff]"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.badge}
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
              AD
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-medium text-foreground">
              System Admin
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              admin@opentaskit.com
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
