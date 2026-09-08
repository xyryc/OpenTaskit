import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOfferDto {
  @ApiPropertyOptional({
    example: 4000,
    description: 'Updated offer amount in LKR',
  })
  @IsNumber()
  @Min(100, { message: 'Minimum offer amount is LKR 100' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    example: 'I can do this for 4000 and start tomorrow morning.',
    description: 'Updated message from the tasker',
  })
  @IsString()
  @IsOptional()
  message?: string;
}
