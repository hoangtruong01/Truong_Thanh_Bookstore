import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../token-blacklist.service';
import { ErrorCode } from '../../../common/enums/error-code.enum';

interface JwtAccessPayload {
  type?: string;
  sub: string;
  email?: string;
  role?: string;
  tokenVersion?: number;
  jti?: string;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
    private tokenBlacklistService: TokenBlacklistService,
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
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtAccessPayload) {
    // 0. Enforce Token Isolation: only access tokens are permitted for API access
    if (
      payload?.type !== 'access' ||
      !payload.sub ||
      typeof payload.tokenVersion !== 'number' ||
      typeof payload.jti !== 'string' ||
      !payload.jti
    ) {
      throw new UnauthorizedException({
        message: 'Loại mã xác thực không hợp lệ. Chỉ chấp nhận Access Token.',
        errorCode: ErrorCode.ERR_INVALID_TOKEN,
      });
    }

    // 1. Check if token JTI is blacklisted
    if (
      payload?.jti &&
      this.tokenBlacklistService.isJtiBlacklisted(payload.jti)
    ) {
      throw new UnauthorizedException({
        message:
          'Mã xác thực đã bị thu hồi (đã đăng xuất). Vui lòng đăng nhập lại.',
        errorCode: ErrorCode.ERR_TOKEN_REVOKED,
      });
    }

    // 2. Check if raw token is blacklisted
    const rawToken =
      ExtractJwt.fromAuthHeaderAsBearerToken()(request) ||
      (request?.headers?.cookie
        ?.split(';')
        .map((p: string) => p.trim())
        .find((p: string) => p.startsWith('access_token='))
        ?.substring('access_token='.length)
        ? decodeURIComponent(
            request.headers.cookie
              .split(';')
              .map((p: string) => p.trim())
              .find((p: string) => p.startsWith('access_token='))!
              .substring('access_token='.length),
          )
        : null);

    if (rawToken && this.tokenBlacklistService.isTokenBlacklisted(rawToken)) {
      throw new UnauthorizedException({
        message:
          'Mã xác thực đã bị thu hồi (đã đăng xuất). Vui lòng đăng nhập lại.',
        errorCode: ErrorCode.ERR_TOKEN_REVOKED,
      });
    }

    // 3. Find user and check status & tokenVersion
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.status) {
      throw new UnauthorizedException({
        message: 'Tài khoản không tồn tại hoặc đã bị khóa',
        errorCode: ErrorCode.ERR_USER_INACTIVE,
      });
    }

    if (payload.tokenVersion !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException({
        message:
          'Phiên đăng nhập đã bị vô hiệu hóa do đổi mật khẩu hoặc đăng xuất toàn thiết bị.',
        errorCode: ErrorCode.ERR_TOKEN_REVOKED,
      });
    }

    return {
      _id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      permissions: user.permissions || [],
      status: user.status,
      tokenVersion: user.tokenVersion ?? 0,
    };
  }
}
