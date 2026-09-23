import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EscrowService } from './escrow.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [PrismaModule, WalletModule, PlatformConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, EscrowService],
  exports: [EscrowService],
})
export class PaymentsModule {}
