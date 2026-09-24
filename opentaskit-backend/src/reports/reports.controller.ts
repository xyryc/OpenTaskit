import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { FilterReportsDto } from './dto/filter-reports.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Problem Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // 1. Authenticated user submits a problem report
  @ApiOperation({ summary: 'Submit a new problem report' })
  @Post('reports')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(userId, dto);
  }

  // 1b. Authenticated user views their own submitted reports
  @ApiOperation({ summary: 'Get current user submitted problem reports' })
  @Get('reports/my')
  findMyReports(@CurrentUser('id') userId: string) {
    return this.reportsService.findMyReports(userId);
  }

  // 2. Admin lists all reports with filters & pagination
  @ApiOperation({ summary: 'Admin list all problem reports' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/reports')
  findAllAdmin(@Query() query: FilterReportsDto) {
    return this.reportsService.findAllAdmin(query);
  }

  // 3. Admin gets detail of a single report
  @ApiOperation({ summary: 'Admin get single problem report detail' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/reports/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.reportsService.findOneAdmin(id);
  }

  // 4. Admin updates report status and resolution notes
  @ApiOperation({ summary: 'Admin update problem report status and resolution notes' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/reports/:id')
  updateAdmin(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportsService.updateAdmin(id, adminId, dto);
  }
}
