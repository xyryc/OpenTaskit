import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum AdminReviewStatusFilter {
  ALL = 'ALL',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
}

export class FilterAdminReviewsDto {
  @ApiPropertyOptional({
    description: 'Search by review comment, task title, reviewer, or recipient name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by exact star rating (1 to 5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    enum: AdminReviewStatusFilter,
    description: 'Filter by publication status',
    default: AdminReviewStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(AdminReviewStatusFilter)
  status?: AdminReviewStatusFilter = AdminReviewStatusFilter.ALL;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
