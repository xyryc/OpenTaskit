import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // Helper: SHA-256 pre-hash to overcome bcrypt 72-byte limit
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // generate access (15m) & refresh (1d/30d) tokens
  private async generateTokens(
    userId: string,
    email: string,
    rememberMe: boolean = false,
  ) {
    const accessTokenPayload = { sub: userId, email };

    // access token: always short 15m
    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN as any) || '15m',
    });

    // refresh token (unique ID ensures rotation always generates a new string)
    const refreshTokenPayload = {
      sub: userId,
      email,
      tokenId: crypto.randomUUID(),
    };

    // refresh token: 30 days if remember me, otherwise 1 day
    const refreshExpiresIn = rememberMe ? '30d' : '1d';
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      expiresIn: refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  // hash and save refresh token in db
  private async updateHashedRefreshToken(
    userId: string,
    refreshToken: string | null,
  ) {
    if (!refreshToken) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { hashedRefreshToken: null },
      });
      return;
    }

    const tokenPreHash = this.hashToken(refreshToken);
    const hashedRefreshToken = await bcrypt.hash(tokenPreHash, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  async register(dto: RegisterDto) {
    // 1. Check if passwords match
    if (dto.password != dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // 2. Check if a user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // 3. Hash the password with bcrypt (10 rounds of salt)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // 4. Save the new user to neon db
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        password: hashedPassword,
      },
    });

    // 5. generate tokens and save hashed refresh token
    const tokens = await this.generateTokens(user.id, user.email, false);
    await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

    // 6. omit the password hash from the response for security
    const { password: _password, ...userWithOutPassword } = user;

    return {
      message: 'User registered successfully',
      ...tokens,
      user: userWithOutPassword,
    };
  }

  async login(dto: LoginDto) {
    // 1. find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 2. if user doesn't exist, throw 401 unauthorized
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. compare password hash
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. generate tokens based on rememberMe preference
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      dto.rememberMe ?? false,
    );
    await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

    // 6. return token and user profile
    const {
      password: _password,
      hashedRefreshToken: _hashedRefreshToken,
      ...userWithoutPassword
    } = user;

    return {
      message: 'Login successful',
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    let payload: any;
    try {
      // 1. Verify the refresh token's cryptographic signature & expiration
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      });
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    // 2. Find user in database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access denied');
    }

    // 3. Compare incoming pre-hashed refresh token with database hash
    const incomingTokenHash = this.hashToken(dto.refreshToken);
    const isTokenMatch = await bcrypt.compare(
      incomingTokenHash,
      user.hashedRefreshToken,
    );

    if (!isTokenMatch) {
      throw new ForbiddenException('Access denied');
    }

    // 4. Token Rotation: Issue a fresh pair of tokens
    const tokens = await this.generateTokens(user.id, user.email, false);
    await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

    return {
      message: 'Tokens refreshed successfully',
      ...tokens,
    };
  }

  async logout(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      });

      // Clear the hashed refresh token in database
      await this.updateHashedRefreshToken(payload.sub, null);
    } catch {
      // Even if token was invalid/expired, proceed silently
    }

    return {
      message: 'Logged out successfully',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    // 1. Check if new passwords match
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // 2. Prevent setting the same password
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password cannot be the same as the old password',
      );
    }

    // 3. Find user to get the current password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 4. Verify old password
    const isOldPasswordCorrect = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isOldPasswordCorrect) {
      throw new BadRequestException('Incorrect current password');
    }

    // 5. Hash new password
    const saltRounds = 10;
    const newHashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    // 6. Update password & invalidate refresh tokens (logout other sessions)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newHashedPassword,
        hashedRefreshToken: null,
      },
    });

    return {
      message:
        'Password changed successfully. Please log in again with your new password.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message:
          'If an account exists with this email, a 6-digit verification code has been sent.',
      };
    }

    // 1. Generate 6-digit numeric OTP (e.g. 839201)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Hash the OTP with bcrypt for database storage
    const tokenPreHash = this.hashToken(otp);
    const resetOtpHash = await bcrypt.hash(tokenPreHash, 10);

    // 3. Expiration: 10 minutes from now
    const resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Save hashed OTP to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtpHash,
        resetOtpExpiresAt,
      },
    });

    // 5. Send Email via Brevo
    await this.mailService.sendPasswordResetOtp(user.email, user.fullName, otp);

    return {
      message:
        'If an account exists with this email, a 6-digit verification code has been sent.',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (
      !user ||
      !user.resetOtpHash ||
      !user.resetOtpExpiresAt ||
      user.resetOtpExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Verification code has expired or is invalid. Please request a new code.',
      );
    }

    const tokenPreHash = this.hashToken(dto.otp);
    const isOtpValid = await bcrypt.compare(tokenPreHash, user.resetOtpHash);

    if (!isOtpValid) {
      throw new BadRequestException('Invalid verification code.');
    }

    return {
      message: 'Verification code is valid.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (
      !user ||
      !user.resetOtpHash ||
      !user.resetOtpExpiresAt ||
      user.resetOtpExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Verification code has expired or is invalid. Please request a new code.',
      );
    }

    const tokenPreHash = this.hashToken(dto.otp);
    const isOtpValid = await bcrypt.compare(tokenPreHash, user.resetOtpHash);

    if (!isOtpValid) {
      throw new BadRequestException('Invalid verification code.');
    }

    // Hash new password
    const saltRounds = 10;
    const newHashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    // Clear OTP fields & invalidate existing login sessions
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
        resetOtpHash: null,
        resetOtpExpiresAt: null,
        hashedRefreshToken: null,
      },
    });

    return {
      message:
        'Password has been reset successfully. You can now log in with your new password.',
    };
  }
}
