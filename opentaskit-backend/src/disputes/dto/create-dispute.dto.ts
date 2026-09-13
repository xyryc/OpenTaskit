import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DisputeReason } from '../../../generated/prisma/enums';

export class CreateDisputeDto {
  @ApiProperty({
    enum: DisputeReason,
    example: DisputeReason.WORK_UNSATISFACTORY,
    description: 'Categorized reason for filing the dispute',
  })
  @IsNotEmpty()
  @IsEnum(DisputeReason)
  reason: DisputeReason;

  @ApiProperty({
    example:
      'The plumbing repairs were incomplete and water is actively leaking under the sink.',
    description: 'Detailed statement of the issue',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    example: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a'],
    type: [String],
    description: 'Evidence image URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}
