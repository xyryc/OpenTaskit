import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { KycDocumentType } from '../../../generated/prisma/enums';

export class SubmitKycDto {
  @ApiProperty({
    enum: KycDocumentType,
    example: KycDocumentType.NIC,
    description: 'Type of official government document',
  })
  @IsNotEmpty()
  @IsEnum(KycDocumentType)
  documentType: KycDocumentType;

  @ApiProperty({
    example: '199512345678',
    description: 'ID number on the document',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  idNumber: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Full legal name on document',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '1995-04-12', description: 'Date of birth' })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/opentaskit/image/upload/v1/kyc/front.jpg',
    description: 'URL of the front photo of document (optional if sending file)',
  })
  @IsOptional()
  @IsString()
  frontPhotoUrl?: string;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/opentaskit/image/upload/v1/kyc/back.jpg',
    description: 'URL of the back photo of document',
  })
  @IsOptional()
  @IsUrl()
  backPhotoUrl?: string;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/opentaskit/image/upload/v1/kyc/selfie.jpg',
    description: 'URL of verification selfie',
  })
  @IsOptional()
  @IsUrl()
  selfieUrl?: string;
}
