import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({ example: 4500, description: 'Proposed price in LKR' })
  @IsNumber()
  @Min(100, { message: 'Minimum offer amount is LKR 100' })
  amount: number;

  @ApiProperty({
    example:
      'I have 5 years of electrical experience and can bring testing tools.',
    description: 'Cover pitch message from the tasker',
  })
  @IsString()
  @IsNotEmpty({ message: 'Offer message is required' })
  message: string;
}
