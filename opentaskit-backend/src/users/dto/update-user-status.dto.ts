import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: 'SUSPENDED' })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
