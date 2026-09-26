import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformConfigService } from './platform-config.service';

@ApiTags('Platform Config')
@Controller('platform-config')
export class PlatformConfigPublicController {
  constructor(private readonly platformConfigService: PlatformConfigService) {}

  @ApiOperation({ summary: 'Get public platform contact channels (WhatsApp, phone, email)' })
  @Get('contact')
  async getContactInfo() {
    const config = await this.platformConfigService.getConfig();
    return {
      supportEmail: config.supportEmail,
      supportHotline: config.supportHotline,
      whatsappSupportNumber: config.whatsappSupportNumber,
    };
  }

  @ApiOperation({ summary: 'Get public task-posting rules (minimum budget)' })
  @Get('task-rules')
  async getTaskRules() {
    const config = await this.platformConfigService.getConfig();
    return {
      minTaskBudgetLkr: config.minTaskBudgetLkr,
    };
  }
}
