import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ReportCategory } from '../../../generated/prisma/enums';

export class CreateReportDto {
  @ApiProperty({
    enum: ReportCategory,
    example: ReportCategory.APP_BUG_TECHNICAL,
    description: 'Category of the problem being reported',
  })
  @IsEnum(ReportCategory)
  category: ReportCategory;

  @ApiProperty({
    example: 'When I tap on payment checkout, it produces an unexpected error.',
    description: 'Detailed description of the issue encountered',
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional({
    example: 'TASK-10293',
    description: 'Optional task reference ID related to the report',
  })
  @IsOptional()
  @IsString()
  taskRef?: string;

  @ApiPropertyOptional({
    example: ['https://res.cloudinary.com/.../evidence1.jpg'],
    description: 'Uploaded screenshot or evidence URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
