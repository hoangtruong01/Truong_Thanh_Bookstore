import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => {
          const cookieHeader = request?.headers?.cookie as string | undefined;
          if (!cookieHeader) return null;
          const cookie = cookieHeader
            .split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith('access_token='));
          return cookie
            ? decodeURIComponent(cookie.substring('access_token='.length))
            : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.status) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }
    return {
      _id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      permissions: user.permissions || [],
      status: user.status,
    };
  }
}
