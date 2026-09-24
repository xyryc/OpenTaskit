import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PlatformConfigService } from './platform-config.service';
import { UpdatePlatformConfigDto } from './dto/update-platform-config.dto';

@ApiTags('Platform Config')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/platform-config')
export class PlatformConfigController {
  constructor(private readonly platformConfigService: PlatformConfigService) {}

  @ApiOperation({ summary: 'Get platform-wide payment settings (Admin only)' })
  @Get()
  getConfig() {
    return this.platformConfigService.getConfig();
  }

  @ApiOperation({
    summary: 'Update platform-wide settings (Admin only)',
  })
  @Patch()
  updateConfig(@Body() dto: UpdatePlatformConfigDto) {
    return this.platformConfigService.updateConfig(dto);
  }
}
