import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'Mohammad Anik' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '+8801570233979' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1648474484044-bb82df2f5a1f',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Senior Plumber & Handyman' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @ApiPropertyOptional({
    example:
      'Over 7 years of experience in domestic pipe fitting and bathroom repairs.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    example: ['Plumbing', 'Pipe Repair', 'Installation'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}
