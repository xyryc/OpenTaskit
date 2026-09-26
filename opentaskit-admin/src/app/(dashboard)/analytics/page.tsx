"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  Layers,
  MapPin,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsOverviewResponse, AnalyticsRange } from "@/types/analytics";
import { adminFetch } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const CATEGORY_COLORS = ["bg-amber-500", "bg-[#0094F7]", "bg-emerald-600", "bg-purple-600", "bg-green-600", "bg-rose-500"];

const analyticsChartConfig = {
  gmv: {
    label: "Gross Volume (LKR)",
    color: "#0094F7",
  },
  revenue: {
    label: "Net Commission (LKR)",
    color: "#10b981",
  },
} satisfies ChartConfig;

function money(value: number) {
  return `LKR ${Math.round(value).toLocaleString()}`;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState<AnalyticsRange>("30d");
  const [overview, setOverview] = React.useState<AnalyticsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOverview = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/backend/admin/analytics/overview?range=${timeRange}`);
      if (!res.ok) {
        throw new Error(`Failed to load marketplace analytics (HTTP ${res.status})`);
      }
      const data: AnalyticsOverviewResponse = await res.json();
      setOverview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load analytics from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const kpis = overview?.kpis;
  const trend = overview?.trend ?? [];
  const categoryBreakdown = overview?.categoryBreakdown ?? [];
  const regionalBreakdown = overview?.regionalBreakdown ?? [];
  const liquidity = overview?.liquidity;

  const categoryChartConfig = {
    count: {
      label: "Tasks Posted",
      color: "#0094F7",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#0094F7]" />
            <span>Marketplace Analytics & Performance KPIs</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Key metrics covering Gross Marketplace Volume (GMV), net revenue, task fulfillment liquidity, and regional demand.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as AnalyticsRange)}>
            <SelectTrigger className="h-9 w-40 text-xs bg-background">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !overview ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Top 4 Core Financial & Volume KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gross Volume (GMV)
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-[#0094F7]/10 flex items-center justify-center text-[#0094F7]">
                  <Wallet className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {money(kpis?.totalGmv ?? 0)}
                </div>
                <div
                  className={`flex items-center gap-1 mt-1 text-[11px] font-medium ${
                    (kpis?.gmvChangePct ?? 0) >= 0 ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {(kpis?.gmvChangePct ?? 0) >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {(kpis?.gmvChangePct ?? 0) >= 0 ? "+" : ""}
                    {kpis?.gmvChangePct ?? 0}% vs previous period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Net Commission Revenue
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                  {money(kpis?.platformRevenue ?? 0)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Platform take-rate on completed tasks
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Task Fulfillment Rate
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {kpis?.completionRate ?? 0}%
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {kpis?.completedTasks ?? 0} completed / {kpis?.totalTasks ?? 0} posted
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Avg Order Value (AOV)
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <Sparkles className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {money(kpis?.avgOrderValue ?? 0)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Response time: ~{kpis?.avgOfferResponseMinutes ?? 0} mins
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GMV Growth Area Chart */}
            <Card className="lg:col-span-2 border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Revenue & Escrow Volume Growth
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Completed-task volume and platform commission, aggregated from live task records.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    (kpis?.gmvChangePct ?? 0) >= 0
                      ? "text-emerald-600 border-emerald-500/30"
                      : "text-destructive border-destructive/30"
                  }`}
                >
                  {(kpis?.gmvChangePct ?? 0) >= 0 ? "Active Growth" : "Declining"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ChartContainer config={analyticsChartConfig} className="h-72 w-full aspect-auto">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillGmvAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0094F7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0094F7" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="fillRevenueAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area
                      type="monotone"
                      dataKey="gmv"
                      stroke="#0094F7"
                      strokeWidth={2}
                      fill="url(#fillGmvAnalytics)"
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#fillRevenueAnalytics)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Platform Liquidity & Speed */}
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Marketplace Liquidity & Speed
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Efficiency metrics from job posting to offer acceptance.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <span className="font-semibold text-foreground block">Time to First Offer</span>
                    <span className="text-[11px] text-muted-foreground">Median time after task is posted</span>
                  </div>
                  <span className="font-bold text-foreground text-sm font-mono">
                    {liquidity?.avgOfferResponseMinutes ?? 0} mins
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <span className="font-semibold text-foreground block">Offers Per Posted Task</span>
                    <span className="text-[11px] text-muted-foreground">Average competitive bids</span>
                  </div>
                  <span className="font-bold text-foreground text-sm font-mono">
                    {liquidity?.offersPerOpenTask ?? 0} bids
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <span className="font-semibold text-foreground block">Provider KYC Conversion</span>
                    <span className="text-[11px] text-muted-foreground">NIC verification approval rate</span>
                  </div>
                  <span className="font-bold text-emerald-600 text-sm font-mono">
                    {liquidity?.kycConversionPct ?? 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">Dispute Ratio</span>
                    <span className="text-[11px] text-muted-foreground">Contested jobs vs total completions</span>
                  </div>
                  <span className="font-bold text-muted-foreground text-sm font-mono">
                    {liquidity?.disputeRatioPct ?? 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row: Category Distribution & Regional Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Share */}
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Task Demand by Category
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Service categories driving marketplace task volume.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {categoryBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tasks posted in this period yet.</p>
                ) : (
                  categoryBreakdown.map((cat, idx) => (
                    <div key={cat.name} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-foreground">{cat.name}</span>
                        <span className="text-muted-foreground font-mono">
                          {cat.count} tasks ({cat.pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} rounded-full`}
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Geographic Service Distribution
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Task concentrations across key Sri Lankan regional hubs.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {regionalBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No in-person tasks with an address in this period yet.</p>
                ) : (
                  regionalBreakdown.map((reg) => (
                    <div key={reg.city} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-foreground">{reg.city}</span>
                        <span className="text-muted-foreground font-mono">
                          {reg.tasks} tasks ({reg.pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${reg.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
