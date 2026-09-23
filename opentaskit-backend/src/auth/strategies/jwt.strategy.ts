import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
    });
  }

  // whatever this method returns gets automatically attached to request.user
  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Cheap presence tracking: only touch the row if it's been a while,
    // since this runs on every authenticated request.
    const ACTIVITY_UPDATE_THRESHOLD_MS = 60_000;
    if (Date.now() - user.lastActiveAt.getTime() > ACTIVITY_UPDATE_THRESHOLD_MS) {
      this.prisma.user
        .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
        .catch(() => {});
    }

    const {
      password: _password,
      hashedRefreshToken: _hashedRefreshToken,
      ...userWithoutSecrets
    } = user;
    return userWithoutSecrets;
  }
}
