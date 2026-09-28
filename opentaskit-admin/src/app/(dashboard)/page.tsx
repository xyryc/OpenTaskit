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
  LifeBuoy,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  Layers,
  Inbox,
  AlertCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { adminFetch } from "@/lib/api-client";
import type { AnalyticsOverviewResponse } from "@/types/analytics";
import type { TaskListItem, PaginatedTasksResponse } from "@/types/task";
import type { KycVerification, PaginatedKycResponse } from "@/types/kyc";
import type { DisputeRecord, PaginatedDisputesResponse } from "@/types/dispute";
import type { PaginatedPaymentsResponse } from "@/types/payment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Chart configurations
const revenueChartConfig = {
  gmv: {
    label: "Gross Volume (LKR)",
    color: "#0094F7",
  },
  revenue: {
    label: "Net Revenue (LKR)",
    color: "#10b981",
  },
} satisfies ChartConfig;

const categoryChartConfig = {
  tasks: {
    label: "Tasks",
    color: "#0094F7",
  },
} satisfies ChartConfig;

const CATEGORY_COLORS = ["#0094F7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const DOCUMENT_LABELS: Record<string, string> = {
  NIC: "National ID",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving Licence",
};

const REPORT_CATEGORY_LABELS: Record<string, string> = {
  TASK_OR_PROVIDER_ISSUE: "Task / Provider",
  PAYMENT_OR_WALLET: "Payment & Wallet",
  ACCOUNT_AND_LOGIN: "Account & Login",
  SAFETY_AND_TRUST: "Safety & Trust",
  APP_BUG_TECHNICAL: "App Technical Bug",
  OTHER: "Problem Report",
};

export interface ProblemReportSummary {
  id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function getTaskStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "OPEN":
      return (
        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-semibold">
          Open
        </Badge>
      );
    case "ASSIGNED":
    case "IN_PROGRESS":
      return (
        <Badge variant="secondary" className="text-[10px] text-blue-600 font-semibold">
          In Progress
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="outline" className="text-[10px] text-muted-foreground font-semibold">
          Completed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="destructive" className="text-[10px] font-semibold">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-semibold">
          {status}
        </Badge>
      );
  }
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = React.useState<AnalyticsOverviewResponse | null>(null);
  const [escrowMetrics, setEscrowMetrics] = React.useState({
    activeEscrowTotal: 0,
    platformFeeTotal: 0,
    releasedToTaskersTotal: 0,
    refundedToPostersTotal: 0,
  });
  const [recentTasks, setRecentTasks] = React.useState<TaskListItem[]>([]);
  const [pendingKyc, setPendingKyc] = React.useState<KycVerification[]>([]);
  const [kycCounts, setKycCounts] = React.useState({ pending: 0, verified: 0, rejected: 0, total: 0 });
  const [openDisputes, setOpenDisputes] = React.useState<DisputeRecord[]>([]);
  const [disputeMetrics, setDisputeMetrics] = React.useState({ openCount: 0, underReviewCount: 0, resolvedCount: 0 });
  const [openReports, setOpenReports] = React.useState<ProblemReportSummary[]>([]);
  const [openReportsCount, setOpenReportsCount] = React.useState(0);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDashboardData = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [
        analyticsRes,
        paymentsRes,
        tasksRes,
        kycRes,
        disputesRes,
        reportsRes,
      ] = await Promise.allSettled([
        adminFetch("/api/backend/admin/analytics/overview?range=30d"),
        adminFetch("/api/backend/admin/payments?page=1&limit=5"),
        adminFetch("/api/backend/tasks?limit=5&allStatuses=true"),
        adminFetch("/api/backend/admin/kyc?status=PENDING&limit=5"),
        adminFetch("/api/backend/admin/disputes?status=OPEN&limit=5"),
        adminFetch("/api/backend/admin/reports?status=OPEN&limit=5"),
      ]);

      // 1. Analytics
      if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
        const data: AnalyticsOverviewResponse = await analyticsRes.value.json();
        setAnalytics(data);
      }

      // 2. Escrow & Payments
      if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
        const data: PaginatedPaymentsResponse = await paymentsRes.value.json();
        if (data.metrics) {
          setEscrowMetrics(data.metrics);
        }
      }

      // 3. Recent Tasks
      if (tasksRes.status === "fulfilled" && tasksRes.value.ok) {
        const data: PaginatedTasksResponse = await tasksRes.value.json();
        setRecentTasks(data.data || []);
      }

      // 4. KYC
      if (kycRes.status === "fulfilled" && kycRes.value.ok) {
        const data: PaginatedKycResponse = await kycRes.value.json();
        setPendingKyc(data.data || []);
        if (data.counts) {
          setKycCounts(data.counts);
        }
      }

      // 5. Disputes
      if (disputesRes.status === "fulfilled" && disputesRes.value.ok) {
        const data: PaginatedDisputesResponse = await disputesRes.value.json();
        setOpenDisputes(data.data || []);
        if (data.metrics) {
          setDisputeMetrics(data.metrics);
        }
      }

      // 6. Problem Reports
      if (reportsRes.status === "fulfilled" && reportsRes.value.ok) {
        const data = await reportsRes.value.json();
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setOpenReports(list);
        setOpenReportsCount(typeof data.total === "number" ? data.total : list.length);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived metrics
  const totalActionItems = kycCounts.pending + disputeMetrics.openCount + openReportsCount;

  // Chart data formatting
  const trendData = React.useMemo(() => {
    if (!analytics?.trend || analytics.trend.length === 0) {
      return [];
    }
    return analytics.trend.map((pt) => ({
      month: pt.label,
      gmv: pt.gmv,
      revenue: pt.revenue,
    }));
  }, [analytics?.trend]);

  const categoryChartData = React.useMemo(() => {
    if (!analytics?.categoryBreakdown || analytics.categoryBreakdown.length === 0) {
      return [];
    }
    return analytics.categoryBreakdown.map((cat, idx) => ({
      category: cat.name,
      tasks: cat.count,
      fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
  }, [analytics?.categoryBreakdown]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
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
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => loadDashboardData(true)}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-2.5 text-red-700 dark:text-red-400 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => loadDashboardData()}>
            Retry
          </Button>
        </div>
      )}

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Escrow Held */}
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
            {isLoading ? (
              <Skeleton className="h-8 w-36 mb-2" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                LKR {Math.round(escrowMetrics.activeEscrowTotal).toLocaleString()}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
              <span>LKR {Math.round(escrowMetrics.releasedToTaskersTotal).toLocaleString()} released to date</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Active Tasks */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Marketplace Tasks
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#0094F7]">
              <ClipboardList className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28 mb-2" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {analytics?.kpis.totalTasks ?? recentTasks.length} Tasks
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
              <span>
                {analytics?.kpis.completedTasks ?? 0} completed ·{" "}
                {Math.max(
                  0,
                  (analytics?.kpis.totalTasks ?? recentTasks.length) -
                    (analytics?.kpis.completedTasks ?? 0)
                )}{" "}
                open / active
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Action Items */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Action Items
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {totalActionItems} Submissions
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {kycCounts.pending} KYC · {disputeMetrics.openCount} Disputes · {openReportsCount} Reports
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Platform Revenue */}
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
            {isLoading ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                LKR{" "}
                {Math.round(
                  analytics?.kpis.platformRevenue ?? escrowMetrics.platformFeeTotal
                ).toLocaleString()}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>
                {(analytics?.kpis.gmvChangePct ?? 0) >= 0 ? "+" : ""}
                {(analytics?.kpis.gmvChangePct ?? 0).toFixed(1)}% vs prev 30d
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Volume Area Chart (2/3 width) */}
        <Card className="lg:col-span-2 border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Escrow Volume & Revenue Trend
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Gross transacted marketplace volume and platform commission fees.
              </CardDescription>
            </div>
            <Link href="/analytics" className="text-xs text-primary hover:underline font-medium">
              View Analytics
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="h-64 w-full flex items-center justify-center">
                <Skeleton className="h-56 w-full" />
              </div>
            ) : trendData.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-64 w-full aspect-auto">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0094F7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0094F7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(val) => val}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}M`
                        : `${(val / 1000).toFixed(0)}k`
                    }
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    type="monotone"
                    dataKey="gmv"
                    stroke="#0094F7"
                    strokeWidth={2}
                    fill="url(#fillGmv)"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#fillRevenue)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl">
                <Inbox className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <span className="text-xs font-semibold text-foreground">No volume recorded in last 30 days</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Transactions will automatically chart here as tasks are completed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown Bar Chart (1/3 width) */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Tasks by Category
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Active job volume distribution.
              </CardDescription>
            </div>
            <Link href="/categories" className="text-xs text-primary hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="h-64 w-full flex items-center justify-center">
                <Skeleton className="h-56 w-full" />
              </div>
            ) : categoryChartData.length > 0 ? (
              <ChartContainer config={categoryChartConfig} className="h-64 w-full aspect-auto">
                <BarChart
                  data={categoryChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    className="text-[11px]"
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="tasks" radius={[0, 4, 4, 0]} fill="#0094F7" />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl">
                <Layers className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <span className="text-xs font-semibold text-foreground">No category data yet</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Category distribution will populate as users post tasks.
                </p>
              </div>
            )}
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
                  High-priority KYC reviews, open disputes, and pending problem reports.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                {totalActionItems} Pending Items
              </Badge>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : totalActionItems === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2.5">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">All caught up!</span>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    No urgent KYC verifications, disputes, or problem reports awaiting admin review.
                  </p>
                </div>
              ) : (
                <>
                  {/* Pending KYC Submissions */}
                  {pendingKyc.slice(0, 3).map((sub) => (
                    <div
                      key={`kyc-${sub.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 pr-2">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {sub.user?.fullName || "Identity Verification"}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground shrink-0">
                              {DOCUMENT_LABELS[sub.documentType] || sub.documentType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            ID: {sub.idNumber || "Verification photo submission"}
                          </p>
                          <span className="text-[10px] text-muted-foreground/75 mt-1 inline-block">
                            Submitted {formatTimeAgo(sub.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
                        <Link href="/kyc">Review KYC</Link>
                      </Button>
                    </div>
                  ))}

                  {/* Open Disputes */}
                  {openDisputes.slice(0, 3).map((dsp) => (
                    <div
                      key={`dispute-${dsp.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 pr-2">
                        <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0 mt-0.5">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground truncate">
                              Dispute on {dsp.task?.title || "Task"}
                            </span>
                            {dsp.task?.budget ? (
                              <Badge variant="destructive" className="text-[10px] font-semibold shrink-0">
                                LKR {dsp.task.budget.toLocaleString()} Locked
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Reason: {dsp.reason.replace(/_/g, " ")}
                          </p>
                          <span className="text-[10px] text-muted-foreground/75 mt-1 inline-block">
                            Opened {formatTimeAgo(dsp.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                        asChild
                      >
                        <Link href="/disputes">Arbitrate</Link>
                      </Button>
                    </div>
                  ))}

                  {/* Open Problem Reports */}
                  {openReports.slice(0, 3).map((rep) => (
                    <div
                      key={`report-${rep.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 pr-2">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <LifeBuoy className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {rep.user?.fullName || "User Report"}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground shrink-0">
                              {REPORT_CATEGORY_LABELS[rep.category] || rep.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                            {rep.description}
                          </p>
                          <span className="text-[10px] text-muted-foreground/75 mt-1 inline-block">
                            Reported {formatTimeAgo(rep.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
                        <Link href="/support">Resolve</Link>
                      </Button>
                    </div>
                  ))}
                </>
              )}
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
                  Latest activity across Sri Lanka marketplace districts.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-primary" asChild>
                <Link href="/tasks">
                  <span>View All Tasks</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No tasks posted in the marketplace yet.
                </div>
              ) : (
                recentTasks.slice(0, 5).map((task) => (
                  <div
                    key={`task-${task.id}`}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {task.title}
                        </span>
                        {getTaskStatusBadge(task.status)}
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground truncate">
                        <span>
                          {task.address || (task.locationType === "REMOTE" ? "Remote" : "In-Person")}
                        </span>
                        <span>•</span>
                        <span>Budget: LKR {task.budget.toLocaleString()}</span>
                        <span>•</span>
                        <span>Poster: {task.user?.fullName || "User"}</span>
                        {typeof task._count?.offers === "number" && task._count.offers > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">
                              {task._count.offers} {task._count.offers === 1 ? "offer" : "offers"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground shrink-0" asChild>
                      <Link href="/tasks">Inspect</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Quick Links & System Health */}
        <div className="flex flex-col gap-6">
          {/* Quick Navigation Cards */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold text-foreground">
                Administrative Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 grid grid-cols-1 gap-1 text-xs">
              <Link
                href="/kyc"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors font-medium text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  <span>KYC Identity Queue</span>
                </div>
                {kycCounts.pending > 0 ? (
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 font-semibold">
                    {kycCounts.pending}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    0
                  </Badge>
                )}
              </Link>

              <Link
                href="/disputes"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors font-medium text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span>Disputes & Arbitration</span>
                </div>
                {disputeMetrics.openCount > 0 ? (
                  <Badge variant="destructive" className="text-[10px] font-semibold">
                    {disputeMetrics.openCount}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    0
                  </Badge>
                )}
              </Link>

              {/* Problem Reports (Replacing Support Chat as instructed) */}
              <Link
                href="/support"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors font-medium text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <LifeBuoy className="h-4 w-4 text-primary" />
                  <span>Problem Reports</span>
                </div>
                {openReportsCount > 0 ? (
                  <Badge variant="default" className="text-[10px] bg-[#0094F7]">
                    {openReportsCount} New
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    0
                  </Badge>
                )}
              </Link>

              <Link
                href="/finance/escrow"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors font-medium text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <span>Escrow Ledger & Gateway</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/categories"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors font-medium text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-[#0094F7]" />
                  <span>Manage Service Categories</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          {/* Platform Performance Summary */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold text-foreground">
                Marketplace Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Task Completion Rate</span>
                <span className="font-semibold text-foreground">
                  {(analytics?.kpis.completionRate ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dispute Frequency</span>
                <span className="font-semibold text-emerald-600">
                  {(analytics?.liquidity.disputeRatioPct ?? 0).toFixed(1)}% (Low)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Provider KYC Conversion</span>
                <span className="font-semibold text-foreground">
                  {(analytics?.liquidity.kycConversionPct ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Escrow Safety Vault</span>
                <span className="font-semibold text-emerald-600">100% Protected</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
