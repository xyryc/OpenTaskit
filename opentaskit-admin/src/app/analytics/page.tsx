"use client";

import * as React from "react";
import {
  TrendingUp,
  Wallet,
  CheckCircle2,
  Users,
  ClipboardList,
  Layers,
  MapPin,
  Clock,
  ArrowUpRight,
  Sparkles,
  Calendar,
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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState<string>("30d");

  // Multiplier for interactive time filtering
  const multiplier = timeRange === "7d" ? 0.25 : timeRange === "90d" ? 3 : timeRange === "ytd" ? 8 : 1;

  const totalGmv = Math.round(4250000 * multiplier);
  const platformRevenue = Math.round(totalGmv * 0.1);
  const totalTasks = Math.round(520 * multiplier);
  const completedTasks = Math.round(482 * multiplier);
  const completionRate = "94.8%";
  const avgOrderValue = "LKR 8,170";
  const avgOfferResponseTime = "14 mins";

  const monthlyChartData = [
    { month: "Apr", gmv: 3100000 * multiplier, revenue: 310000 * multiplier, tasks: 380 * multiplier },
    { month: "May", gmv: 3600000 * multiplier, revenue: 360000 * multiplier, tasks: 440 * multiplier },
    { month: "Jun", gmv: 3950000 * multiplier, revenue: 395000 * multiplier, tasks: 490 * multiplier },
    { month: "Jul", gmv: 4100000 * multiplier, revenue: 410000 * multiplier, tasks: 510 * multiplier },
    { month: "Aug", gmv: 4250000 * multiplier, revenue: 425000 * multiplier, tasks: 520 * multiplier },
  ];

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

  const categoryBreakdown = [
    { name: "Handyman & Repairs", count: Math.round(180 * multiplier), pct: 35, color: "bg-amber-500", fill: "#f59e0b" },
    { name: "Cleaning & Housekeeping", count: Math.round(145 * multiplier), pct: 28, color: "bg-[#0094F7]", fill: "#0094F7" },
    { name: "Delivery & Courier", count: Math.round(95 * multiplier), pct: 18, color: "bg-emerald-600", fill: "#10b981" },
    { name: "Tech & IT Support", count: Math.round(60 * multiplier), pct: 12, color: "bg-purple-600", fill: "#8b5cf6" },
    { name: "Gardening & Yard", count: Math.round(40 * multiplier), pct: 7, color: "bg-green-600", fill: "#16a34a" },
  ];

  const categoryChartConfig = {
    count: {
      label: "Tasks Posted",
      color: "#0094F7",
    },
  } satisfies ChartConfig;

  const regionalBreakdown = [
    { city: "Colombo District (01-15)", tasks: Math.round(280 * multiplier), pct: 54 },
    { city: "Gampaha & Negombo", tasks: Math.round(115 * multiplier), pct: 22 },
    { city: "Kandy Central", tasks: Math.round(75 * multiplier), pct: 14 },
    { city: "Galle Southern Coast", tasks: Math.round(50 * multiplier), pct: 10 },
  ];

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
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-9 w-40 text-xs bg-background">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date (2026)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
              LKR {totalGmv.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+14.2% vs previous period</span>
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
              LKR {platformRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              10% take-rate on completed escrows
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
              {completionRate}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {completedTasks} completed / {totalTasks} total tasks
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
              {avgOrderValue}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Response time: ~{avgOfferResponseTime}
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
                Comparison of gross transacted volume and 10% platform commission.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
              Active Growth
            </Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ChartContainer config={analyticsChartConfig} className="h-72 w-full aspect-auto">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
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
              <span className="font-bold text-foreground text-sm font-mono">14 mins</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="font-semibold text-foreground block">Offers Per Open Task</span>
                <span className="text-[11px] text-muted-foreground">Average competitive bids</span>
              </div>
              <span className="font-bold text-foreground text-sm font-mono">3.4 bids</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="font-semibold text-foreground block">Provider KYC Conversion</span>
                <span className="text-[11px] text-muted-foreground">NIC verification approval rate</span>
              </div>
              <span className="font-bold text-emerald-600 text-sm font-mono">84.2%</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground block">Dispute Ratio</span>
                <span className="text-[11px] text-muted-foreground">Contested jobs vs total completions</span>
              </div>
              <span className="font-bold text-muted-foreground text-sm font-mono">1.2%</span>
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
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-foreground">{cat.name}</span>
                  <span className="text-muted-foreground font-mono">
                    {cat.count} tasks ({cat.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
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
            {regionalBreakdown.map((reg, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
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
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
