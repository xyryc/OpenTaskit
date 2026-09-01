"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Shield,
  LogOut,
  User,
  Sliders,
  CheckCircle2,
} from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  const pathname = usePathname();

  // Helper to construct a clean breadcrumb title
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard Overview";
    const parts = pathname.split("/").filter(Boolean);
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" / ");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md">
      {/* Left: Sidebar Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Search, Notifications, Theme & Profile */}
      <div className="flex items-center gap-2">
        {/* Global Search */}
        <div className="relative hidden w-64 md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users, tasks, IDs..."
            className="h-9 w-full bg-muted/40 pl-8 text-xs focus-visible:bg-background"
          />
        </div>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              <Badge variant="secondary" className="text-[10px] font-semibold">
                3 New
              </Badge>
            </div>
            <div className="divide-y text-xs">
              <Link href="/kyc" className="flex gap-3 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-[#0094F7] shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">
                    New KYC Submission
                  </span>
                  <span className="text-muted-foreground">
                    Kasun Perera submitted National ID for verification.
                  </span>
                  <span className="text-[10px] text-muted-foreground/75 mt-1">
                    5 minutes ago
                  </span>
                </div>
              </Link>
              <Link href="/disputes" className="flex gap-3 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-destructive shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">
                    Dispute Opened #DSP-104
                  </span>
                  <span className="text-muted-foreground">
                    Task #TSK-892 marked as disputed by poster.
                  </span>
                  <span className="text-[10px] text-muted-foreground/75 mt-1">
                    25 minutes ago
                  </span>
                </div>
              </Link>
              <Link href="/finance/escrow" className="flex gap-3 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">
                    Escrow Locked #TXN-902
                  </span>
                  <span className="text-muted-foreground">
                    LKR 14,000 locked via Stripe gateway.
                  </span>
                  <span className="text-[10px] text-muted-foreground/75 mt-1">
                    1 hour ago
                  </span>
                </div>
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Mode Switcher */}
        <ThemeToggle />

        <Separator orientation="vertical" className="h-5" />

        {/* Admin User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-muted/60"
            >
              <Avatar className="h-7 w-7 border">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-xs font-semibold text-foreground">
                Admin
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">
                  Super Administrator
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@opentaskit.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Admin Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Security & Roles</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <Sliders className="h-4 w-4 text-muted-foreground" />
                <span>Platform Preferences</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
