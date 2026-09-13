import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DisputeResolution } from '../../../generated/prisma/enums';

export class ResolveDisputeDto {
  @ApiProperty({
    enum: DisputeResolution,
    example: DisputeResolution.REFUND_POSTER,
    description: 'Admin verdict outcome for the dispute',
  })
  @IsNotEmpty()
  @IsEnum(DisputeResolution)
  resolution: DisputeResolution;

  @ApiProperty({
    example:
      'Evidence confirmed that the tasker failed to arrive on the agreed date. Full refund issued to poster.',
    description: 'Detailed explanation of the mediation findings',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  resolutionNotes: string;
}
