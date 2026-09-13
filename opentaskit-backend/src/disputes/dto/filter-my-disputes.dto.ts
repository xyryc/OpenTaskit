import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DisputeStatus } from '../../../generated/prisma/enums';

export class FilterMyDisputesDto {
  @ApiPropertyOptional({
    enum: DisputeStatus,
    description: 'Filter by dispute lifecycle status',
  })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({
    enum: ['all', 'raised', 'received'],
    default: 'all',
    description: 'Filter by user participation',
  })
  @IsOptional()
  @IsIn(['all', 'raised', 'received'])
  role?: 'all' | 'raised' | 'received' = 'all';

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
