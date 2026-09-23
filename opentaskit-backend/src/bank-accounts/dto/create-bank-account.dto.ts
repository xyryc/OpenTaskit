import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Commercial Bank' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  bankName: string;

  @ApiProperty({ example: 'Colombo Main Branch' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  branch: string;

  @ApiProperty({ example: 'M D Anik' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  accountHolderName: string;

  @ApiProperty({ example: '8001234567' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  accountNumber: string;
}
