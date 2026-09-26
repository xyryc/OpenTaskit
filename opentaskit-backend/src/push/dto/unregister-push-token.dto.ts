import { IsNotEmpty, IsString } from 'class-validator';

export class UnregisterPushTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Push token is required' })
  token: string;
}
