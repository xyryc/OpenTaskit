import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreatePayoutRequestDto {
  @ApiProperty({ example: 'b2f1c4b0-...' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ example: 5000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;
}
