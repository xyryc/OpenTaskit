import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PayoutStatus } from '../../../generated/prisma/enums';

const PROCESSABLE_STATUSES = [
  PayoutStatus.APPROVED,
  PayoutStatus.REJECTED,
  PayoutStatus.PAID,
] as const;

export class ProcessPayoutRequestDto {
  @ApiProperty({ enum: PROCESSABLE_STATUSES, example: PayoutStatus.PAID })
  @IsEnum(PayoutStatus)
  status: (typeof PROCESSABLE_STATUSES)[number];

  @ApiProperty({ required: false, example: 'Transferred via bank on 2026-09-22.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}
