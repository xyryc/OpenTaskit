import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MaxLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Ceiling fan installation' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 2500, description: 'Starting rate in Rs' })
  @IsInt()
  @Min(0)
  fromPrice: number;
}
