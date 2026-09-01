"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wallet,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Platform Dashboard
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time marketplace overview, financial escrow vault, and moderation queues.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs bg-[#0094F7] hover:bg-[#007cd6] text-white"
            asChild
          >
            <Link href="/tasks">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Announcement</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Escrow Held
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              LKR 1,845,000
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+14.2% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Marketplace Tasks
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#0094F7]">
              <ClipboardList className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              184 Tasks
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
              <span>32 open · 48 assigned · 104 completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending KYC Verifications
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              4 Submissions
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>Requires admin approval</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Platform Revenue
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              LKR 184,500
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>10% average commission fee</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Urgent Action Queue & Recent Marketplace Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Urgent Moderation & Action Queue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Action Required Queue
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  High-priority KYC reviews, disputed escrows, and manual bank top-ups.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                9 Pending Items
              </Badge>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {/* Action Item 1: KYC Review */}
              <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Kasun Perera
                      </span>
                      <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                        National ID
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted front & back NIC photos with selfie verification.
                    </p>
                    <span className="text-[10px] text-muted-foreground/75 mt-1 inline-block">
                      Submitted 12 mins ago
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
                  <Link href="/kyc">Review KYC</Link>
                </Button>
              </div>

              {/* Action Item 2: Dispute */}
              <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Dispute #DSP-104
                      </span>
                      <Badge variant="destructive" className="text-[10px] font-semibold">
                        LKR 12,500 Locked
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Task #TSK-892 (AC Repair): Poster reports incomplete electrical work.
                    </p>
                    <span className="text-[10px] text-muted-foreground/75 mt-1 inline-block">
                      Opened 35 mins ago
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10" asChild>
                  <Link href="/disputes">Arbitrate</Link>
                </Button>
              </div>

              {/* Action Item 3: Bank Top-up */}
              <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <ArrowDownToLine className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Bank Transfer Top-up
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-600">
                        + LKR 25,000
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Commercial Bank slip uploaded by Dilshan Alwis.
                    </p>
                    <span className="text-[10px] text-muted-foreground/75 mt-1 inline-block">
                      Uploaded 1 hour ago
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
                  <Link href="/finance/topups">Verify Slip</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks Activity */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Recent Tasks Posted
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Latest activity across Colombo, Kandy, and Galle areas.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
                <Link href="/tasks">
                  <span>View all</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60 text-xs">
                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-[11px] font-semibold bg-muted">
                        SM
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        Mount 65" TV on Concrete Wall
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Colombo 03 · Handyman · 3 Offers received
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground block">
                      LKR 6,500
                    </span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                      Open
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-[11px] font-semibold bg-muted">
                        RN
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        Deep Clean 3 Bedroom Apartment
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Nugegoda · Cleaning · Assigned to Kamal W.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground block">
                      LKR 14,000
                    </span>
                    <Badge variant="secondary" className="text-[10px] text-blue-600">
                      In Progress
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-[11px] font-semibold bg-muted">
                        AK
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        Package Delivery from Kandy to Colombo
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Intercity · Delivery · Escrow Released
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground block">
                      LKR 8,000
                    </span>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Completed
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Quick Shortcuts & Platform Rates */}
        <div className="flex flex-col gap-6">
          {/* Quick Management Shortcuts */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold text-foreground">
                Quick Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 flex flex-col gap-1.5 text-xs">
              <Link
                href="/categories"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors font-medium text-foreground"
              >
                <span>Manage Marketplace Categories</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/kyc"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors font-medium text-foreground"
              >
                <span>Verify Provider Credentials</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/finance/escrow"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors font-medium text-foreground"
              >
                <span>Review Active Escrow Balances</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/disputes"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors font-medium text-foreground"
              >
                <span>Arbitrate Open Disputes</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/settings"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors font-medium text-foreground"
              >
                <span>Configure Platform Fee %</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
