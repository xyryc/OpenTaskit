import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { KycStatus } from '../../../generated/prisma/enums';

export class ReviewKycDto {
  @ApiProperty({
    enum: [KycStatus.VERIFIED, KycStatus.REJECTED],
    example: KycStatus.VERIFIED,
    description: 'Review verdict: VERIFIED or REJECTED',
  })
  @IsNotEmpty()
  @IsEnum(KycStatus)
  status: KycStatus;

  @ApiPropertyOptional({
    example:
      'The photo of your document was too blurry to read the NIC number.',
    description: 'Reason for rejection (required if status is REJECTED)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;

  @ApiPropertyOptional({
    example: 'Verified against government registry format.',
    description: 'Internal admin review notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNotes?: string;
}
