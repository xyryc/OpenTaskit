import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiPropertyOptional({ example: 'Can you come by around 3pm?' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;

  @ApiPropertyOptional({ description: 'URL of an uploaded image attachment' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({
    description:
      'Required when the poster messages a task that has no accepted offer yet and more than one applicant - identifies which applicant to message',
  })
  @IsOptional()
  @IsUUID()
  toUserId?: string;
}
