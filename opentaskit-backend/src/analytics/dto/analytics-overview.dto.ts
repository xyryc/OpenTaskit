import { IsIn, IsOptional } from 'class-validator';

export const ANALYTICS_RANGES = ['7d', '30d', '90d', 'ytd'] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export class AnalyticsOverviewDto {
  @IsOptional()
  @IsIn(ANALYTICS_RANGES)
  range?: AnalyticsRange;
}
