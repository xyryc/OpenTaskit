import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './filter-users.dto';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: 'ADMIN' })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
