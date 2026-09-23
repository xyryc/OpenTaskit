import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { FilterAdminPaymentsDto } from './dto/filter-admin-payments.dto';
import type { PayHereIpnPayload } from './payhere.util';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Initiate escrow funding for an assigned task via PayHere Hosted Checkout',
  })
  @UseGuards(JwtAuthGuard)
  @Post('payments/checkout/:taskId')
  initiateCheckout(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') posterId: string,
  ) {
    return this.paymentsService.initiateCheckout(taskId, posterId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get the latest payment/escrow status for a task' })
  @UseGuards(JwtAuthGuard)
  @Get('payments/task/:taskId')
  getPaymentStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.getPaymentStatus(taskId, userId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin payments/escrow ledger with platform-wide totals' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/payments')
  findAllAdmin(@Query() query: FilterAdminPaymentsDto) {
    return this.paymentsService.findAllAdmin(query);
  }

  // PayHere server-to-server webhook. Not JWT-guarded - PayHere calls this
  // directly - but every payload is signature-verified inside the service.
  @ApiOperation({ summary: 'PayHere IPN webhook (server-to-server, signature verified)' })
  @HttpCode(200)
  @Post('payments/ipn')
  handleIpn(@Body() payload: PayHereIpnPayload) {
    return this.paymentsService.handleIpn(payload);
  }
}
