import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushTokenController } from './push-token.controller';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [PrismaModule],
  controllers: [PushTokenController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushModule {}
