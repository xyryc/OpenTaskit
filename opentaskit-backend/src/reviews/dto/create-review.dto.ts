import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating score between 1 and 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Feedback text explaining the rating',
    example:
      'Fast, tidy and explained everything as he worked. Highly recommended!',
    minLength: 5,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  text: string;

  @ApiPropertyOptional({
    description: 'Optional recommendation tags',
    example: ['On time', 'Professional', 'High quality'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
