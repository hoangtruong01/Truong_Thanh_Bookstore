import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, UpdateProfileDto, ResetPasswordDto } from './dto/auth.dto';
import { UserRole } from '../../common/enums';
import { CloudinaryService } from '../users/cloudinary.service';
import { EmailService } from '../email/email.service';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
    private emailService: EmailService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isTokenHashValid(storedHash: string, token: string): boolean {
    try {
      const expected = Buffer.from(storedHash, 'hex');
      const actual = Buffer.from(this.hashToken(token), 'hex');
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }

  private hashOtp(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }

  private isOtpHashValid(storedHash: string, otp: string): boolean {
    try {
      const expected = Buffer.from(storedHash, 'hex');
      const actual = Buffer.from(this.hashOtp(otp), 'hex');
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }

  private sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : user;
    const {
      password,
      resetOtp,
      resetOtpExpiry,
      resetOtpAttempts,
      refreshTokenHash,
      ...safeUser
    } = userObj;
    return safeUser;
  }

  private async generateTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString(), email: user.email, type: 'refresh' },
      { expiresIn: '30d' },
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
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }
    if (!user.status) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không được cung cấp');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (!payload || payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const user = await this.usersService.findByIdWithPassword(payload.sub);
    if (!user || !user.status) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    if (!user.refreshTokenHash || !this.isTokenHashValid(user.refreshTokenHash, refreshToken)) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi hoặc không hợp lệ');
    }

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(userId?: string) {
    if (userId) {
      const user = await this.usersService.findByIdWithPassword(userId);
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
    if (updateProfileDto.fullName !== undefined) updateData.fullName = updateProfileDto.fullName;
    if (updateProfileDto.phone !== undefined) updateData.phone = updateProfileDto.phone;

    if (updateProfileDto.avatar) {
      if (updateProfileDto.avatar.startsWith('data:image')) {
        const imageUrl = await this.cloudinaryService.uploadImage(updateProfileDto.avatar);
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
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
    user.refreshTokenHash = undefined; // Force re-login on other devices
    await user.save();

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

    return {
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại trên hệ thống');
    }

    if (!user.resetOtp) {
      throw new UnauthorizedException('Không tìm thấy mã OTP hoặc đã hết hạn. Vui lòng yêu cầu lại');
    }

    const currentAttempts = user.resetOtpAttempts || 0;
    if (currentAttempts >= 5) {
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      user.resetOtpAttempts = 0;
      await user.save();
      throw new UnauthorizedException('Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới');
    }

    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      user.resetOtpAttempts = 0;
      await user.save();
      throw new UnauthorizedException('Mã OTP đã hết hạn. Vui lòng yêu cầu mã OTP mới');
    }

    if (!this.isOtpHashValid(user.resetOtp, otp)) {
      user.resetOtpAttempts = currentAttempts + 1;
      if (user.resetOtpAttempts >= 5) {
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        user.resetOtpAttempts = 0;
        await user.save();
        throw new UnauthorizedException('Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới');
      }
      await user.save();
      const remaining = 5 - user.resetOtpAttempts;
      throw new UnauthorizedException(`Mã OTP không đúng. Bạn còn ${remaining} lần thử`);
    }

    const resetToken = this.jwtService.sign(
      { sub: user._id.toString(), email: user.email, type: 'RESET_PASSWORD' },
      { expiresIn: '15m' },
    );

    return { success: true, message: 'Xác thực OTP thành công', resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, otp, resetToken, newPassword } = dto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại trên hệ thống');
    }

    if (resetToken) {
      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(resetToken);
      } catch {
        throw new UnauthorizedException('Mã token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
      }

      if (!payload || payload.type !== 'RESET_PASSWORD' || payload.email !== email.toLowerCase()) {
        throw new UnauthorizedException('Mã token đặt lại mật khẩu không hợp lệ');
      }
    } else if (otp) {
      if (!user.resetOtp) {
        throw new UnauthorizedException('Mã OTP không hợp lệ hoặc đã hết hạn');
      }

      const currentAttempts = user.resetOtpAttempts || 0;
      if (currentAttempts >= 5) {
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        user.resetOtpAttempts = 0;
        await user.save();
        throw new UnauthorizedException('Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới');
      }

      if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        user.resetOtpAttempts = 0;
        await user.save();
        throw new UnauthorizedException('Mã OTP đã hết hạn');
      }

      if (!this.isOtpHashValid(user.resetOtp, otp)) {
        user.resetOtpAttempts = currentAttempts + 1;
        if (user.resetOtpAttempts >= 5) {
          user.resetOtp = undefined;
          user.resetOtpExpiry = undefined;
          user.resetOtpAttempts = 0;
          await user.save();
          throw new UnauthorizedException('Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới');
        }
        await user.save();
        const remaining = 5 - user.resetOtpAttempts;
        throw new UnauthorizedException(`Mã OTP không đúng. Bạn còn ${remaining} lần thử`);
      }
    } else {
      throw new UnauthorizedException('Vui lòng cung cấp mã OTP hoặc resetToken để đặt lại mật khẩu');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    user.refreshTokenHash = undefined; // Invalidate active sessions
    await user.save();

    return { success: true, message: 'Đặt lại mật khẩu thành công' };
  }
}
