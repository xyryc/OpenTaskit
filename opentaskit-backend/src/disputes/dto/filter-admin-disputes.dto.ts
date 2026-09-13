import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DisputeReason, DisputeStatus } from '../../../generated/prisma/enums';

export class FilterAdminDisputesDto {
  @ApiPropertyOptional({
    description: 'Search by task title, description, or user names',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: DisputeStatus,
    description: 'Filter by dispute lifecycle status',
  })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({
    enum: DisputeReason,
    description: 'Filter by categorized reason',
  })
  @IsOptional()
  @IsEnum(DisputeReason)
  reason?: DisputeReason;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
