import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class InitiateTopUpDto {
  @ApiProperty({ example: 1000, description: 'Amount to top up, in LKR' })
  @IsNumber()
  @Min(100)
  amount: number;
}
