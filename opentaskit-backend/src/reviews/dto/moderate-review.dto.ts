import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ModerateReviewDto {
  @ApiProperty({ description: 'Whether the review is hidden from public display' })
  @IsNotEmpty()
  @IsBoolean()
  isHidden: boolean;

  @ApiPropertyOptional({ description: 'Reason for hiding or moderating the review' })
  @IsOptional()
  @IsString()
  moderationReason?: string;
}
