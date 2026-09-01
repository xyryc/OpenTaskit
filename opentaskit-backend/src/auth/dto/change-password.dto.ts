import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm new password is required' })
  confirmNewPassword: string;
}
