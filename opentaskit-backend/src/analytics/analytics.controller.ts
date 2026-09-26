import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsOverviewDto } from './dto/analytics-overview.dto';

@ApiTags('Analytics')
@Controller('admin/analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({
    summary: 'Marketplace KPIs, trend series, and category/regional breakdowns for a given time range',
  })
  @Get('overview')
  getOverview(@Query() query: AnalyticsOverviewDto) {
    return this.analyticsService.getOverview(query.range);
  }
}
