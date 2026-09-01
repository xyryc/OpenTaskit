import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Equals,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;

  @IsBoolean()
  @Equals(true, {
    message: 'You must agree to the Terms of Service and Privacy Policy',
  })
  agreeToTerms: boolean;
}
