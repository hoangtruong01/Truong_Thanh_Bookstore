import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';
import { UserRole } from '../../common/enums';
import { CloudinaryService } from '../users/cloudinary.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
    });

    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints || 0,
        loyaltyTier: user.loyaltyTier,
        permissions: user.permissions || [],
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        loyaltyPoints: user.loyaltyPoints || 0,
        loyaltyTier: user.loyaltyTier,
        permissions: user.permissions || [],
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  // FIX-H07: Exclude password hash from profile response
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const userObj = user.toObject ? user.toObject() : user;
    const { password, ...safeUser } = userObj;
    return safeUser;
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
      throw new UnauthorizedException('User not found');
    }
    return updatedUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(userId, { password: hashedPassword });
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // BUG-19: Do not disclose email existence to prevent user enumeration
      return {
        success: true,
        message: 'Mã OTP đã được gửi đến email của bạn',
      };
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

    // Save to user and reset attempts
    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    user.resetOtpAttempts = 0;
    await user.save();

    // Send OTP email (async)
    this.emailService.sendOtpEmail(email, otp).catch((err) => {
      const logger = new Logger(AuthService.name);
      logger.error(`Failed to send OTP email to ${email}:`, err);
    });

    const response: any = {
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
    };

    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
      response.otp = otp;
    }

    return response;
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    if (!user.resetOtp) {
      throw new UnauthorizedException('Không tìm thấy mã OTP. Vui lòng yêu cầu lại');
    }

    // Check if max attempts reached (5 attempts max)
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

    if (user.resetOtp !== otp) {
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

    return { success: true, message: 'Xác thực OTP thành công' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

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

    if (user.resetOtp !== otp) {
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

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    return { success: true, message: 'Đặt lại mật khẩu thành công' };
  }
}

