import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'crypto';
import { UsersService } from '../users/users.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { UserRole } from '../../common/enums';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { CloudinaryService } from '../users/cloudinary.service';
import { EmailService } from '../email/email.service';
import { UserDocument } from '../users/schemas/user.schema';
import { TokenBlacklistService } from './token-blacklist.service';
import { SecurityAuditService } from '../../common/audit/security-audit.service';

// SEC-005: trần an toàn (giây) cho TTL ghi blacklist. exp đã được verify chữ ký nên
// chính là thời gian sống thực của token; trần chỉ để chặn cấu hình/giá trị bất thường
// và phải >= JWT_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN tối đa được phép cấu hình.
const MAX_ACCESS_TOKEN_BLACKLIST_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_REFRESH_TOKEN_BLACKLIST_TTL_SECONDS = 365 * 24 * 60 * 60;
// SEC-019: số lần thử OTP tối đa.
const MAX_OTP_ATTEMPTS = 5;

const INVALID_OTP_MESSAGE = 'Mã OTP không hợp lệ hoặc đã hết hạn';
const INVALID_PASSWORD_RESET_MESSAGE =
  'Mã xác thực hoặc thông tin đặt lại mật khẩu không hợp lệ';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private ephemeralOtpPepper?: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
    private emailService: EmailService,
    private tokenBlacklistService: TokenBlacklistService,
    private configService: ConfigService,
    @Optional()
    private securityAuditService?: SecurityAuditService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isTokenHashValid(storedHash: string, token: string): boolean {
    try {
      const expected = Buffer.from(storedHash, 'hex');
      const actual = Buffer.from(this.hashToken(token), 'hex');
      return (
        expected.length === actual.length && timingSafeEqual(expected, actual)
      );
    } catch {
      return false;
    }
  }

  /**
   * SECURITY: fail closed in production — the OTP pepper must come from config
   * (OTP_PEPPER, or JWT_RESET_SECRET as fallback); there is no hardcoded default.
   */
  onModuleInit(): void {
    if (this.isProduction() && !this.getConfiguredOtpPepper()) {
      throw new Error(
        'OTP_PEPPER (or JWT_RESET_SECRET) is required in production to hash OTP codes',
      );
    }
  }

  private isProduction(): boolean {
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    return nodeEnv === 'production';
  }

  private getConfiguredOtpPepper(): string | undefined {
    return (
      this.configService.get<string>('OTP_PEPPER') ||
      this.configService.get<string>('JWT_RESET_SECRET') ||
      undefined
    );
  }

  private getOtpPepper(): string {
    const configured = this.getConfiguredOtpPepper();
    if (configured) return configured;
    if (this.isProduction()) {
      throw new Error('OTP pepper is not configured');
    }
    // Non-production without any secret: use a per-process random pepper
    // (OTPs then stay valid only for this process lifetime) instead of a
    // hardcoded value shipped in source control.
    if (!this.ephemeralOtpPepper) {
      this.ephemeralOtpPepper = randomBytes(32).toString('hex');
      this.logger.warn(
        'OTP_PEPPER/JWT_RESET_SECRET not configured; using an ephemeral OTP pepper (non-production only).',
      );
    }
    return this.ephemeralOtpPepper;
  }

  private hashOtp(otp: string): string {
    const pepper = this.getOtpPepper();
    return createHmac('sha256', pepper).update(otp).digest('hex');
  }

  private isOtpHashValid(storedHash: string, otp: string): boolean {
    try {
      const expected = Buffer.from(storedHash, 'hex');
      const actual = Buffer.from(this.hashOtp(otp), 'hex');
      if (
        expected.length === actual.length &&
        timingSafeEqual(expected, actual)
      ) {
        return true;
      }
      // Backward compatibility fallback with legacy SHA-256 in constant time
      const legacy = Buffer.from(
        createHash('sha256').update(otp).digest('hex'),
        'hex',
      );
      return (
        expected.length === legacy.length && timingSafeEqual(expected, legacy)
      );
    } catch {
      return false;
    }
  }

  /**
   * SEC-019: tăng bộ đếm số lần thử OTP một cách nguyên tử (findOneAndUpdate + $inc,
   * chỉ khi attempts < MAX và OTP chưa bị đổi/xóa). Nhờ đó các request song song không
   * thể vượt quá giới hạn. Trả về số lần thử sau khi tăng, hoặc null nếu đã hết lượt.
   */
  private async reserveOtpAttempt(user: UserDocument): Promise<number | null> {
    const model = user.constructor as unknown as Model<UserDocument>;
    if (typeof model?.findOneAndUpdate !== 'function') {
      // Chỉ xảy ra với đối tượng không phải Mongoose document (mock trong test cũ);
      // trong runtime UsersService luôn trả hydrated document nên nhánh này không chạy.
      const current = user.resetOtpAttempts || 0;
      if (current >= MAX_OTP_ATTEMPTS) return null;
      user.resetOtpAttempts = current + 1;
      await user.save();
      return user.resetOtpAttempts;
    }
    const updated = await model
      .findOneAndUpdate(
        {
          _id: user._id,
          resetOtp: user.resetOtp,
          resetOtpAttempts: { $not: { $gte: MAX_OTP_ATTEMPTS } },
        },
        { $inc: { resetOtpAttempts: 1 } },
        { new: true },
      )
      .exec();
    if (!updated) return null;
    return updated.resetOtpAttempts ?? 1;
  }

  private async clearOtp(user: UserDocument): Promise<void> {
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    await user.save();
  }

  private sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : user;
    const {
      password: _password,
      resetOtp: _resetOtp,
      resetOtpExpiry: _resetOtpExpiry,
      resetOtpAttempts: _resetOtpAttempts,
      refreshTokenHash: _refreshTokenHash,
      ...safeUser
    } = userObj;
    return safeUser;
  }

  private getAccessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  private getRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  private getResetSecret(): string {
    return this.configService.getOrThrow<string>('JWT_RESET_SECRET');
  }

  /**
   * SEC-005: verify chữ ký + loại token trước khi ghi blacklist.
   * - Trả về null nếu chữ ký/type sai, thiếu exp hoặc token đã hết hạn (không cần blacklist).
   * - exp trả về được chặn trên bởi maxTtlSeconds để TTL Redis không vượt quá vòng đời thực.
   */
  private async verifyTokenForRevocation(
    token: string,
    secret: string,
    expectedType: 'access' | 'refresh',
    maxTtlSeconds: number,
  ): Promise<{ jti?: string; exp: number } | null> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret,
        ignoreExpiration: true,
      });
    } catch {
      return null;
    }
    if (!payload || payload.type !== expectedType) return null;
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSec) return null; // đã hết hạn, không cần ghi blacklist

    return {
      jti:
        typeof payload.jti === 'string' && payload.jti
          ? payload.jti
          : undefined,
      exp: Math.min(payload.exp, nowSec + maxTtlSeconds),
    };
  }

  private async generateTokens(user: UserDocument) {
    const tokenVersion = user.tokenVersion ?? 0;
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      tokenVersion,
      type: 'access',
      jti: accessJti,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d';

    const refreshToken = this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        type: 'refresh',
        tokenVersion,
        jti: refreshJti,
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: refreshExpiresIn as any,
      },
    );

    user.refreshTokenHash = this.hashToken(refreshToken);
    await user.save();

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trên hệ thống');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
      status: true,
      tokenVersion: 0,
    });

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      this.securityAuditService?.logAuthFailure({
        email: loginDto.email,
        reason: 'USER_NOT_FOUND',
      });
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }
    if (!user.status) {
      this.securityAuditService?.logAuthFailure({
        email: loginDto.email,
        reason: 'ACCOUNT_LOCKED',
      });
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      this.securityAuditService?.logAuthFailure({
        email: loginDto.email,
        reason: 'INVALID_PASSWORD',
      });
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string, rawAccessToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        message: 'Refresh token không được cung cấp',
        errorCode: ErrorCode.ERR_INVALID_TOKEN,
      });
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Refresh token đã hết hạn. Vui lòng đăng nhập lại.',
          errorCode: ErrorCode.ERR_REFRESH_TOKEN_EXPIRED,
        });
      }
      throw new UnauthorizedException({
        message: 'Refresh token không hợp lệ hoặc đã bị chỉnh sửa',
        errorCode: ErrorCode.ERR_INVALID_TOKEN,
      });
    }

    if (
      !payload ||
      payload.type !== 'refresh' ||
      !payload.sub ||
      typeof payload.tokenVersion !== 'number' ||
      typeof payload.jti !== 'string' ||
      !payload.jti
    ) {
      throw new UnauthorizedException({
        message: 'Refresh token không hợp lệ',
        errorCode: ErrorCode.ERR_INVALID_TOKEN,
      });
    }

    const user = await this.usersService.findByIdWithPassword(payload.sub);
    if (!user || !user.status) {
      throw new UnauthorizedException({
        message: 'Tài khoản không tồn tại hoặc đã bị khóa',
        errorCode: ErrorCode.ERR_USER_INACTIVE,
      });
    }

    // Check token version
    if (payload.tokenVersion !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException({
        message:
          'Phiên đăng nhập đã bị hủy do đổi mật khẩu hoặc đăng xuất toàn thiết bị',
        errorCode: ErrorCode.ERR_TOKEN_REVOKED,
      });
    }

    // Token Reuse Detection: Check if the token hash matches the stored active hash
    if (
      !user.refreshTokenHash ||
      !this.isTokenHashValid(user.refreshTokenHash, refreshToken)
    ) {
      // SUSPECTED TOKEN REUSE ATTACK!
      // Invalidate all tokens for this user immediately for security
      user.refreshTokenHash = undefined;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      this.logger.warn(
        `[SECURITY WARNING] Refresh token reuse detected for user ${user.email} (ID: ${user._id.toString()}). All active sessions have been invalidated.`,
      );

      throw new UnauthorizedException({
        message:
          'Phát hiện Refresh Token đã qua sử dụng hoặc không hợp lệ (nguy cơ chiếm đoạt phiên). Tất cả phiên đăng nhập đã bị vô hiệu hóa vì lý do bảo mật!',
        errorCode: ErrorCode.ERR_REFRESH_TOKEN_REUSE,
      });
    }

    // Blacklist previous access token if provided
    if (rawAccessToken) {
      await this.tokenBlacklistService.blacklistToken(rawAccessToken);
    }

    // Blacklist previous refresh token JTI upon rotation (Defense-in-depth)
    if (payload?.jti) {
      await this.tokenBlacklistService.blacklistJti(payload.jti, payload.exp);
    }

    // Token Rotation: Generate a completely new pair of access & refresh tokens
    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(
    userId?: string,
    rawAccessToken?: string,
    rawRefreshToken?: string,
  ) {
    // SEC-005: chỉ ghi blacklist (Redis) khi token có chữ ký hợp lệ. jti/exp lấy từ
    // payload đã được xác thực (không tin decode() chưa verify) và TTL bị chặn trên
    // bởi thời gian sống thực của token. Token không hợp lệ -> bỏ qua, chỉ xóa cookie.

    // 1. Blacklist access token if provided
    if (rawAccessToken) {
      try {
        const verified = await this.verifyTokenForRevocation(
          rawAccessToken,
          this.getAccessSecret(),
          'access',
          MAX_ACCESS_TOKEN_BLACKLIST_TTL_SECONDS,
        );
        if (verified) {
          if (verified.jti) {
            await this.tokenBlacklistService.blacklistJti(
              verified.jti,
              verified.exp,
            );
          }
          await this.tokenBlacklistService.blacklistToken(
            rawAccessToken,
            verified.exp,
          );
        }
      } catch {
        // Continue logout even if blacklist write fails
      }
    }

    // 2. Blacklist refresh token if provided
    if (rawRefreshToken) {
      try {
        const verified = await this.verifyTokenForRevocation(
          rawRefreshToken,
          this.getRefreshSecret(),
          'refresh',
          MAX_REFRESH_TOKEN_BLACKLIST_TTL_SECONDS,
        );
        if (verified) {
          if (verified.jti) {
            await this.tokenBlacklistService.blacklistJti(
              verified.jti,
              verified.exp,
            );
          }
          await this.tokenBlacklistService.blacklistToken(
            rawRefreshToken,
            verified.exp,
          );
        }
      } catch {
        // Continue logout even if refresh token blacklist fails
      }
    }

    // 3. Resolve target user ID and clear active refreshTokenHash in DB
    // BE-03: Never trust unverified decode() for user identity mutation.
    let targetUserId = userId;
    if (!targetUserId && rawRefreshToken) {
      try {
        const payload: any = await this.jwtService.verifyAsync(
          rawRefreshToken,
          {
            secret: this.getRefreshSecret(),
            ignoreExpiration: true,
          },
        );
        if (payload?.type === 'refresh' && typeof payload?.sub === 'string') {
          targetUserId = payload.sub;
        }
      } catch {
        // Invalid refresh token signature or type handled by leaving targetUserId unset.
      }
    }

    // BE-03 fix: If targetUserId still unknown, extract sub from rawAccessToken verifying signature
    if (!targetUserId && rawAccessToken) {
      try {
        const payload: any = await this.jwtService.verifyAsync(rawAccessToken, {
          secret: this.getAccessSecret(),
          ignoreExpiration: true,
        });
        if (payload?.type === 'access' && typeof payload?.sub === 'string') {
          targetUserId = payload.sub;
        }
      } catch {
        // Invalid access token signature or type ignored
      }
    }

    if (targetUserId) {
      const user = await this.usersService.findByIdWithPassword(targetUserId);
      if (user) {
        user.refreshTokenHash = undefined;
        await user.save();
      }
    }

    return { success: true, message: 'Đăng xuất thành công' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const updateData: any = {};
    if (updateProfileDto.fullName !== undefined)
      updateData.fullName = updateProfileDto.fullName;
    if (updateProfileDto.phone !== undefined)
      updateData.phone = updateProfileDto.phone;

    if (updateProfileDto.avatar) {
      if (updateProfileDto.avatar.startsWith('data:image')) {
        const imageUrl = await this.cloudinaryService.uploadImage(
          updateProfileDto.avatar,
        );
        updateData.avatar = imageUrl;
      } else {
        updateData.avatar = updateProfileDto.avatar;
      }
    }

    const updatedUser = await this.usersService.update(userId, updateData);
    if (!updatedUser) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    return this.sanitizeUser(updatedUser);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    rawAccessToken?: string,
  ) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.refreshTokenHash = undefined; // Invalidate active refresh tokens
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all prior tokens across all devices
    await user.save();

    this.securityAuditService?.logPasswordChanged({
      userId,
      email: user.email,
    });

    if (rawAccessToken) {
      try {
        const decoded: any = this.jwtService.decode(rawAccessToken);
        if (decoded?.jti)
          await this.tokenBlacklistService.blacklistJti(
            decoded.jti,
            decoded.exp,
          );
        await this.tokenBlacklistService.blacklistToken(
          rawAccessToken,
          decoded?.exp,
        );
      } catch {
        await this.tokenBlacklistService.blacklistToken(rawAccessToken);
      }
    }

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Anti-enumeration: Do not disclose email existence
      return {
        success: true,
        message: 'Mã OTP đã được gửi đến email của bạn',
      };
    }

    // Generate 6 digit OTP
    const otp = randomInt(100000, 1000000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

    // Save to user and reset attempts
    user.resetOtp = this.hashOtp(otp);
    user.resetOtpExpiry = expiry;
    user.resetOtpAttempts = 0;
    await user.save();

    // Send OTP email (async)
    this.emailService.sendOtpEmail(email, otp).catch((err) => {
      this.logger.error(`Failed to send OTP email to ${email}:`, err);
    });

    // SECURITY: never include the plain OTP in the response (any NODE_ENV,
    // even when email delivery fails) — it is delivered only via email.
    return {
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.resetOtp) {
      throw new UnauthorizedException(INVALID_OTP_MESSAGE);
    }

    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
      await this.clearOtp(user);
      throw new UnauthorizedException(INVALID_OTP_MESSAGE);
    }

    // SEC-019: đặt chỗ 1 lượt thử một cách nguyên tử TRƯỚC khi so khớp OTP.
    const attemptsUsed = await this.reserveOtpAttempt(user);
    if (attemptsUsed === null) {
      await this.clearOtp(user);
      throw new UnauthorizedException(INVALID_OTP_MESSAGE);
    }

    if (!this.isOtpHashValid(user.resetOtp, otp)) {
      if (attemptsUsed >= MAX_OTP_ATTEMPTS) {
        await this.clearOtp(user);
      }
      throw new UnauthorizedException(INVALID_OTP_MESSAGE);
    }

    const resetToken = this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email.trim().toLowerCase(),
        type: 'RESET_PASSWORD',
        tokenVersion: user.tokenVersion ?? 0,
        jti: randomUUID(),
      },
      { secret: this.getResetSecret(), expiresIn: '15m' },
    );

    return { success: true, message: 'Xác thực OTP thành công', resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, otp, resetToken, newPassword } = dto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(INVALID_PASSWORD_RESET_MESSAGE);
    }

    if (resetToken) {
      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(resetToken, {
          secret: this.getResetSecret(),
        });
      } catch {
        throw new UnauthorizedException(INVALID_PASSWORD_RESET_MESSAGE);
      }

      if (
        !payload ||
        payload.type !== 'RESET_PASSWORD' ||
        payload.sub !== user._id.toString() ||
        payload.email !== email.trim().toLowerCase() ||
        typeof payload.tokenVersion !== 'number' ||
        payload.tokenVersion !== (user.tokenVersion ?? 0) ||
        typeof payload.jti !== 'string' ||
        !payload.jti
      ) {
        throw new UnauthorizedException(INVALID_PASSWORD_RESET_MESSAGE);
      }
    } else if (otp) {
      if (!user.resetOtp) {
        throw new UnauthorizedException(INVALID_PASSWORD_RESET_MESSAGE);
      }

      if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
        await this.clearOtp(user);
        throw new UnauthorizedException(INVALID_PASSWORD_RESET_MESSAGE);
      }

      // SEC-019: đặt chỗ 1 lượt thử nguyên tử trước khi so khớp OTP.
      const attemptsUsed = await this.reserveOtpAttempt(user);
      if (attemptsUsed === null) {
        await this.clearOtp(user);
        throw new UnauthorizedException(INVALID_PASSWORD_RESET_MESSAGE);
      }

      if (!this.isOtpHashValid(user.resetOtp, otp)) {
        if (attemptsUsed >= MAX_OTP_ATTEMPTS) {
          await this.clearOtp(user);
        }
        throw new UnauthorizedException(INVALID_PASSWORD_RESET_MESSAGE);
      }
    } else {
      throw new UnauthorizedException(INVALID_PASSWORD_RESET_MESSAGE);
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    user.refreshTokenHash = undefined; // Invalidate active sessions
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all prior tokens across all devices
    await user.save();

    this.securityAuditService?.logPasswordChanged({
      userId: user._id.toString(),
      email: user.email,
    });

    return { success: true, message: 'Đặt lại mật khẩu thành công' };
  }
}
