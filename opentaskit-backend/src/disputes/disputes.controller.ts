import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { FilterMyDisputesDto } from './dto/filter-my-disputes.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FilterAdminDisputesDto } from './dto/filter-admin-disputes.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('Disputes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  // POST /api/v1/tasks/:taskId/disputes - File a dispute
  @ApiOperation({
    summary: 'Raise / file a dispute on an assigned or completed task',
  })
  @Post('tasks/:taskId/disputes')
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.create(taskId, userId, dto);
  }

  // GET /api/v1/tasks/:taskId/disputes - Get dispute details for a task
  @ApiOperation({
    summary: 'Get dispute details and status for a specific task',
  })
  @Get('tasks/:taskId/disputes')
  findByTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.disputesService.findByTask(taskId, userId, userRole);
  }

  // GET /api/v1/disputes/me - My disputes feed
  @ApiOperation({
    summary: "Get authenticated user's disputes (raised and received)",
  })
  @Get('disputes/me')
  findMyDisputes(
    @CurrentUser('id') userId: string,
    @Query() query: FilterMyDisputesDto,
  ) {
    return this.disputesService.findMyDisputes(userId, query);
  }

  // GET /api/v1/admin/disputes - Admin dispute moderation queue
  @ApiOperation({
    summary: 'List and filter all disputes platform-wide (Admin only)',
  })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/disputes')
  findAllAdmin(@Query() query: FilterAdminDisputesDto) {
    return this.disputesService.findAllAdmin(query);
  }

  // PATCH /api/v1/admin/disputes/:id/resolve - Admin resolve dispute
  @ApiOperation({ summary: 'Resolve a dispute and issue verdict (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/disputes/:id/resolve')
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(id, adminId, dto);
  }
}
