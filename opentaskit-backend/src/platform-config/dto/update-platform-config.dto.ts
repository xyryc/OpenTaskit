import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePlatformConfigDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Percentage cut the platform takes from escrow on release',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent?: number;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Minimum budget required to post a task in LKR',
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  minTaskBudgetLkr?: number;

  @ApiPropertyOptional({
    example: 'support@opentaskit.com',
    description: 'Official support email address',
  })
  @IsOptional()
  @IsString()
  supportEmail?: string;

  @ApiPropertyOptional({
    example: '+94 11 234 5678',
    description: 'Official support phone hotline',
  })
  @IsOptional()
  @IsString()
  supportHotline?: string;

  @ApiPropertyOptional({
    example: '+94 77 123 4567',
    description: 'Official WhatsApp support number for customer inquiries',
  })
  @IsOptional()
  @IsString()
  whatsappSupportNumber?: string;
}
