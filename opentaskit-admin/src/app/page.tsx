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
  RefreshCw,
  Layers,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Chart data & configurations
const revenueChartData = [
  { month: "Mar", gmv: 2800000, revenue: 280000 },
  { month: "Apr", gmv: 3100000, revenue: 310000 },
  { month: "May", gmv: 3600000, revenue: 360000 },
  { month: "Jun", gmv: 3950000, revenue: 395000 },
  { month: "Jul", gmv: 4100000, revenue: 410000 },
  { month: "Aug", gmv: 4250000, revenue: 425000 },
];

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

const categoryChartData = [
  { category: "Handyman", tasks: 62, fill: "#f59e0b" },
  { category: "Cleaning", tasks: 48, fill: "#0094F7" },
  { category: "Delivery", tasks: 34, fill: "#10b981" },
  { category: "Tech & IT", tasks: 22, fill: "#8b5cf6" },
  { category: "Gardening", tasks: 18, fill: "#16a34a" },
];

const categoryChartConfig = {
  tasks: {
    label: "Tasks",
    color: "#0094F7",
  },
} satisfies ChartConfig;

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
                Monthly gross transacted volume and 10% platform commission revenue.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
              +14.2% Growth
            </Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ChartContainer config={revenueChartConfig} className="h-64 w-full aspect-auto">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="tasks"
                  radius={[0, 4, 4, 0]}
                  fill="#0094F7"
                />
              </BarChart>
            </ChartContainer>
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

              {/* Action Item 3: Escrow Payment Settlement */}
              <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <ArrowDownToLine className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Gateway Escrow Payment
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-600">
                        + LKR 25,000
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Card payment settled via PayHere for Task #TSK-894.
                    </p>
                    <span className="text-[10px] text-muted-foreground/75 mt-1 inline-block">
                      Settled 1 hour ago
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" asChild>
                  <Link href="/finance/escrow">View Ledger</Link>
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
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-primary" asChild>
                <Link href="/tasks">
                  <span>View All Tasks</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {/* Task 1 */}
              <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Fix Living Room Ceiling Fan Electrical Wiring
                    </span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-semibold">
                      Open (3 offers)
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Colombo 03</span>
                    <span>•</span>
                    <span>Budget: LKR 4,500</span>
                    <span>•</span>
                    <span>Poster: Nuwan Pradeep</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/tasks">Inspect</Link>
                </Button>
              </div>

              {/* Task 2 */}
              <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Deep Cleaning 2-Story House Before Move-in
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-semibold text-blue-600">
                      Assigned
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Nugegoda</span>
                    <span>•</span>
                    <span>Budget: LKR 18,000</span>
                    <span>•</span>
                    <span>Provider: Kasun Perera</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/tasks">Inspect</Link>
                </Button>
              </div>
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
                <Badge variant="secondary" className="text-[10px]">4</Badge>
              </Link>

              <Link
                href="/disputes"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors font-medium text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span>Disputes & Arbitration</span>
                </div>
                <Badge variant="destructive" className="text-[10px]">2</Badge>
              </Link>

              <Link
                href="/finance/escrow"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors font-medium text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="h-4 w-4 text-primary" />
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

              <Link
                href="/support/chat"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors font-medium text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Live Support Chat</span>
                </div>
                <Badge variant="default" className="text-[10px] bg-[#0094F7]">1 New</Badge>
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
                <span className="font-semibold text-foreground">94.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dispute Frequency</span>
                <span className="font-semibold text-emerald-600">1.2% (Low)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg. Provider Rating</span>
                <span className="font-semibold text-foreground">4.8 / 5.0</span>
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
