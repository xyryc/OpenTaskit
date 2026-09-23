import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class LegalSectionDto {
  @ApiProperty({ example: 'sec-t1' })
  @IsString()
  id: string;

  @ApiProperty({ example: '1. Who we are' })
  @IsString()
  @MaxLength(150)
  heading: string;

  @ApiProperty({ example: 'OpenTaskit is a marketplace that connects...' })
  @IsString()
  body: string;
}

export class UpdateLegalDocumentDto {
  @ApiPropertyOptional({ example: 'Terms of Service' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiProperty({ type: [LegalSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegalSectionDto)
  sections: LegalSectionDto[];
}
