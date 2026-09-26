import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from './push-notification.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UnregisterPushTokenDto } from './dto/unregister-push-token.dto';

@ApiTags('Push')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('push-tokens')
export class PushTokenController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
  ) {}

  @ApiOperation({ summary: 'Register (or reassign) this device FCM token' })
  @Post()
  async register(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterPushTokenDto,
  ) {
    // Same device token may have belonged to a different account before
    // (logout -> different login on the same phone) - reassign, don't insert.
    await this.prisma.pushToken.upsert({
      where: { token: dto.token },
      create: { token: dto.token, userId, platform: dto.platform ?? 'android' },
      update: { userId, updatedAt: new Date() },
    });
    return { message: 'Push token registered' };
  }

  @ApiOperation({ summary: 'Unregister this device FCM token' })
  @Delete()
  async unregister(
    @CurrentUser('id') userId: string,
    @Body() dto: UnregisterPushTokenDto,
  ) {
    await this.prisma.pushToken.deleteMany({
      where: { token: dto.token, userId },
    });
    return { message: 'Push token unregistered' };
  }

  @ApiOperation({ summary: 'Send a test push to all of the caller\'s devices' })
  @Post('self-test')
  async selfTest(@CurrentUser('id') userId: string) {
    await this.pushService.sendToUser(userId, {
      title: 'OpenTaskit test',
      body: 'If you can see this, push notifications are wired up correctly.',
      data: { type: 'SYSTEM' },
    });
    return { message: 'Test push dispatched' };
  }
}
