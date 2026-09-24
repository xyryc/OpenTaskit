import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '../../../generated/prisma/enums';

export class UpdateReportDto {
  @ApiPropertyOptional({
    enum: ReportStatus,
    example: ReportStatus.RESOLVED,
    description: 'Updated lifecycle status of the report',
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    example: 'Contacted user via WhatsApp and investigated transaction with payment provider.',
    description: 'Internal admin resolution notes and follow-up details',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
