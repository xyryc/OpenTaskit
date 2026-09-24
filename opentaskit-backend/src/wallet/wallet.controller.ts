import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';

@ApiTags('Wallet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({
    summary: 'Get the authenticated user\'s wallet balance and recent ledger entries',
  })
  @Get('me')
  getMyWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getMyWallet(userId);
  }

  @ApiOperation({ summary: 'Start a PayHere checkout to top up the wallet' })
  @Post('topup/checkout')
  initiateTopUp(
    @Body() dto: InitiateTopUpDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.walletService.initiateTopUp(userId, dto.amount);
  }

  @ApiOperation({
    summary: 'Confirm a top-up directly against PayHere (fallback when the IPN cannot reach us)',
  })
  @Post('topup/:orderId/verify')
  verifyTopUp(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.walletService.verifyTopUp(orderId, userId);
  }
}
