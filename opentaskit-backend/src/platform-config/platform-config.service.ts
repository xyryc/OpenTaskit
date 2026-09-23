import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async updatePlatformFeePercent(platformFeePercent: number) {
    await this.getConfig();
    return this.prisma.platformConfig.update({
      where: { id: SINGLETON_ID },
      data: { platformFeePercent },
    });
  }
}
