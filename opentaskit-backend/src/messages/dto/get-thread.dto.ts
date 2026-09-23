import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetThreadDto {
  @ApiPropertyOptional({
    description:
      'Required when the poster views a task that has no accepted offer yet and more than one applicant - identifies which applicant thread to open',
  })
  @IsOptional()
  @IsUUID()
  withUserId?: string;
}
