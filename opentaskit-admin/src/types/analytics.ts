export type AnalyticsRange = "7d" | "30d" | "90d" | "ytd";

export interface AnalyticsKpis {
  totalGmv: number;
  platformRevenue: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgOrderValue: number;
  avgOfferResponseMinutes: number;
  gmvChangePct: number;
}

export interface AnalyticsTrendPoint {
  label: string;
  gmv: number;
  revenue: number;
}

export interface AnalyticsCategoryShare {
  name: string;
  count: number;
  pct: number;
}

export interface AnalyticsRegionShare {
  city: string;
  tasks: number;
  pct: number;
}

export interface AnalyticsLiquidity {
  avgOfferResponseMinutes: number;
  offersPerOpenTask: number;
  kycConversionPct: number;
  disputeRatioPct: number;
}

export interface AnalyticsOverviewResponse {
  range: AnalyticsRange;
  kpis: AnalyticsKpis;
  trend: AnalyticsTrendPoint[];
  categoryBreakdown: AnalyticsCategoryShare[];
  regionalBreakdown: AnalyticsRegionShare[];
  liquidity: AnalyticsLiquidity;
}
