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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PayoutsService } from './payouts.service';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { ProcessPayoutRequestDto } from './dto/process-payout-request.dto';
import { FilterAdminPayoutsDto } from './dto/filter-admin-payouts.dto';

@ApiTags('Payouts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @ApiOperation({ summary: 'Request a withdrawal to a saved bank account' })
  @Post('payouts')
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePayoutRequestDto) {
    return this.payoutsService.create(userId, dto);
  }

  @ApiOperation({ summary: "Get the authenticated user's payout request history" })
  @Get('payouts/me')
  findMine(@CurrentUser('id') userId: string) {
    return this.payoutsService.findMine(userId);
  }

  @ApiOperation({ summary: 'List and filter all payout requests platform-wide (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/payouts')
  findAllAdmin(@Query() query: FilterAdminPayoutsDto) {
    return this.payoutsService.findAllAdmin(query);
  }

  @ApiOperation({ summary: 'Approve, reject, or mark a payout request as paid (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/payouts/:id/process')
  process(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ProcessPayoutRequestDto,
  ) {
    return this.payoutsService.process(id, adminId, dto);
  }
}
