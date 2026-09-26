import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { TaskStatus } from '../../generated/prisma/enums';
import type { AnalyticsRange } from './dto/analytics-overview.dto';

const REGION_MATCHERS: { name: string; test: (address: string) => boolean }[] = [
  { name: 'Colombo District (01-15)', test: (a) => a.includes('colombo') },
  { name: 'Gampaha & Negombo', test: (a) => a.includes('gampaha') || a.includes('negombo') },
  { name: 'Kandy Central', test: (a) => a.includes('kandy') },
  { name: 'Galle Southern Coast', test: (a) => a.includes('galle') },
];

interface RangeWindow {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  bucketUnit: 'day' | 'week' | 'month';
}

interface Bucket {
  label: string;
  start: Date;
  end: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  async getOverview(range: AnalyticsRange = '30d') {
    const window = this.resolveRange(range);
    const feePercent = await this.platformConfig.getPlatformFeePercent();

    const [
      totalTasksCreated,
      completedCohort,
      gmvAgg,
      prevGmvAgg,
      completedRows,
      categoryGroups,
      categories,
      regionalRows,
      tasksWithFirstOffer,
      offersInRangeCount,
      disputesInRangeCount,
      kycVerifiedCount,
      kycTotalCount,
    ] = await Promise.all([
      this.prisma.task.count({
        where: { createdAt: { gte: window.start, lte: window.end } },
      }),
      this.prisma.task.count({
        where: {
          createdAt: { gte: window.start, lte: window.end },
          status: TaskStatus.COMPLETED,
        },
      }),
      this.prisma.task.aggregate({
        where: {
          status: TaskStatus.COMPLETED,
          updatedAt: { gte: window.start, lte: window.end },
        },
        _sum: { budget: true },
        _count: { _all: true },
      }),
      this.prisma.task.aggregate({
        where: {
          status: TaskStatus.COMPLETED,
          updatedAt: { gte: window.prevStart, lte: window.prevEnd },
        },
        _sum: { budget: true },
      }),
      // Individual completed-task rows for the trend chart buckets below.
      this.prisma.task.findMany({
        where: {
          status: TaskStatus.COMPLETED,
          updatedAt: { gte: window.start, lte: window.end },
        },
        select: { budget: true, updatedAt: true },
      }),
      this.prisma.task.groupBy({
        by: ['categoryId'],
        where: { createdAt: { gte: window.start, lte: window.end } },
        _count: { _all: true },
      }),
      this.prisma.category.findMany({ select: { id: true, name: true } }),
      this.prisma.task.findMany({
        where: {
          createdAt: { gte: window.start, lte: window.end },
          address: { not: null },
        },
        select: { address: true },
      }),
      this.prisma.task.findMany({
        where: { createdAt: { gte: window.start, lte: window.end } },
        select: {
          createdAt: true,
          offers: {
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      this.prisma.offer.count({
        where: { task: { createdAt: { gte: window.start, lte: window.end } } },
      }),
      this.prisma.dispute.count({
        where: { createdAt: { gte: window.start, lte: window.end } },
      }),
      this.prisma.kycVerification.count({ where: { status: 'VERIFIED' } }),
      this.prisma.kycVerification.count(),
    ]);

    const totalGmv = gmvAgg._sum.budget ?? 0;
    const completedInPeriod = gmvAgg._count._all;
    const prevGmv = prevGmvAgg._sum.budget ?? 0;
    const platformRevenue = Math.round(totalGmv * (feePercent / 100) * 100) / 100;
    const completionRate = totalTasksCreated > 0 ? (completedCohort / totalTasksCreated) * 100 : 0;
    const avgOrderValue = completedInPeriod > 0 ? totalGmv / completedInPeriod : 0;
    const gmvChangePct =
      prevGmv > 0 ? ((totalGmv - prevGmv) / prevGmv) * 100 : totalGmv > 0 ? 100 : 0;

    // Response-time average only counts tasks that received at least one offer.
    const responseMinutes = tasksWithFirstOffer
      .filter((t) => t.offers.length > 0)
      .map((t) => (t.offers[0].createdAt.getTime() - t.createdAt.getTime()) / 60000);
    const avgOfferResponseMinutes =
      responseMinutes.length > 0
        ? Math.round(responseMinutes.reduce((s, v) => s + v, 0) / responseMinutes.length)
        : 0;
    const offersPerOpenTask =
      totalTasksCreated > 0
        ? Math.round((offersInRangeCount / totalTasksCreated) * 10) / 10
        : 0;
    const disputeRatioPct =
      completedCohort > 0 ? Math.round((disputesInRangeCount / completedCohort) * 1000) / 10 : 0;
    const kycConversionPct =
      kycTotalCount > 0 ? Math.round((kycVerifiedCount / kycTotalCount) * 1000) / 10 : 0;

    const buckets = this.buildBuckets(window);
    const trend = buckets.map((bucket) => {
      const rows = completedRows.filter(
        (r) => r.updatedAt >= bucket.start && r.updatedAt < bucket.end,
      );
      const gmv = rows.reduce((s, r) => s + r.budget, 0);
      return {
        label: bucket.label,
        gmv,
        revenue: Math.round(gmv * (feePercent / 100) * 100) / 100,
      };
    });

    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
    const categoryBreakdown = categoryGroups
      .map((g) => ({
        name: categoryNameById.get(g.categoryId) ?? 'Uncategorized',
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((c) => ({
        ...c,
        pct: totalTasksCreated > 0 ? Math.round((c.count / totalTasksCreated) * 100) : 0,
      }));

    const regionalCounts = new Map<string, number>();
    let otherRegionCount = 0;
    for (const row of regionalRows) {
      const address = (row.address ?? '').toLowerCase();
      const match = REGION_MATCHERS.find((m) => m.test(address));
      if (match) {
        regionalCounts.set(match.name, (regionalCounts.get(match.name) ?? 0) + 1);
      } else {
        otherRegionCount += 1;
      }
    }
    const regionalTotal = regionalRows.length;
    const regionalBreakdown = REGION_MATCHERS.map((m) => ({
      city: m.name,
      tasks: regionalCounts.get(m.name) ?? 0,
    }))
      .concat(otherRegionCount > 0 ? [{ city: 'Other Regions', tasks: otherRegionCount }] : [])
      .filter((r) => r.tasks > 0)
      .map((r) => ({
        ...r,
        pct: regionalTotal > 0 ? Math.round((r.tasks / regionalTotal) * 100) : 0,
      }));

    return {
      range,
      kpis: {
        totalGmv,
        platformRevenue,
        totalTasks: totalTasksCreated,
        completedTasks: completedCohort,
        completionRate: Math.round(completionRate * 10) / 10,
        avgOrderValue: Math.round(avgOrderValue),
        avgOfferResponseMinutes,
        gmvChangePct: Math.round(gmvChangePct * 10) / 10,
      },
      trend,
      categoryBreakdown,
      regionalBreakdown,
      liquidity: {
        avgOfferResponseMinutes,
        offersPerOpenTask,
        kycConversionPct,
        disputeRatioPct,
      },
    };
  }

  private resolveRange(range: AnalyticsRange): RangeWindow {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfDaysAgo = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1));
      d.setHours(0, 0, 0, 0);
      return d;
    };

    let start: Date;
    let bucketUnit: RangeWindow['bucketUnit'];
    switch (range) {
      case '7d':
        start = startOfDaysAgo(7);
        bucketUnit = 'day';
        break;
      case '90d':
        start = startOfDaysAgo(90);
        bucketUnit = 'week';
        break;
      case 'ytd':
        start = new Date(now.getFullYear(), 0, 1);
        bucketUnit = 'month';
        break;
      case '30d':
      default:
        start = startOfDaysAgo(30);
        bucketUnit = 'day';
        break;
    }

    const durationMs = endOfToday.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return { start, end: endOfToday, prevStart, prevEnd, bucketUnit };
  }

  private buildBuckets(window: RangeWindow): Bucket[] {
    const buckets: Bucket[] = [];

    if (window.bucketUnit === 'day') {
      const cursor = new Date(window.start);
      while (cursor <= window.end) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 1);
        buckets.push({
          label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          start,
          end,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      return buckets;
    }

    if (window.bucketUnit === 'week') {
      const cursor = new Date(window.start);
      while (cursor <= window.end) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 7);
        buckets.push({
          label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          start,
          end,
        });
        cursor.setDate(cursor.getDate() + 7);
      }
      return buckets;
    }

    // month
    const cursor = new Date(window.start.getFullYear(), window.start.getMonth(), 1);
    while (cursor <= window.end) {
      const start = new Date(cursor);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      buckets.push({
        label: start.toLocaleDateString('en-US', { month: 'short' }),
        start,
        end,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return buckets;
  }
}
