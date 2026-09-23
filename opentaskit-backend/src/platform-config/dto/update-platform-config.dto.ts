import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdatePlatformConfigDto {
  @ApiProperty({
    example: 10,
    description: 'Percentage cut the platform takes from escrow on release',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent: number;
}
