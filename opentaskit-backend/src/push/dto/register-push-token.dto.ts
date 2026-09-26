import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Push token is required' })
  token: string;

  @IsString()
  @IsOptional()
  @IsIn(['android', 'ios'], { message: 'Platform must be android or ios' })
  platform?: string;
}
