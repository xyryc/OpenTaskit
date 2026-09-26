import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePlatformConfigDto } from './dto/update-platform-config.dto';

const SINGLETON_ID = 'singleton';
const DEFAULT_PLATFORM_FEE_PERCENT = 10;

@Injectable()
export class PlatformConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // Reads (and lazily creates) the singleton platform config row.
  async getConfig() {
    const existing = await this.prisma.platformConfig.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.platformConfig.create({
      data: {
        id: SINGLETON_ID,
        platformFeePercent: DEFAULT_PLATFORM_FEE_PERCENT,
      },
    });
  }

  async getPlatformFeePercent(): Promise<number> {
    const config = await this.getConfig();
    return config.platformFeePercent;
  }

  async getMinTaskBudgetLkr(): Promise<number> {
    const config = await this.getConfig();
    return config.minTaskBudgetLkr;
  }

  async updatePlatformFeePercent(platformFeePercent: number) {
    await this.getConfig();
    return this.prisma.platformConfig.update({
      where: { id: SINGLETON_ID },
      data: { platformFeePercent },
    });
  }

  async updateConfig(dto: UpdatePlatformConfigDto) {
    await this.getConfig();
    return this.prisma.platformConfig.update({
      where: { id: SINGLETON_ID },
      data: {
        ...(dto.platformFeePercent !== undefined && {
          platformFeePercent: dto.platformFeePercent,
        }),
        ...(dto.minTaskBudgetLkr !== undefined && {
          minTaskBudgetLkr: dto.minTaskBudgetLkr,
        }),
        ...(dto.supportEmail !== undefined && {
          supportEmail: dto.supportEmail,
        }),
        ...(dto.supportHotline !== undefined && {
          supportHotline: dto.supportHotline,
        }),
        ...(dto.whatsappSupportNumber !== undefined && {
          whatsappSupportNumber: dto.whatsappSupportNumber,
        }),
      },
    });
  }
}
