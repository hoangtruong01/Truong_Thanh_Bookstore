import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../users/cloudinary.service';
import { EmailService } from '../email/email.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { UserRole } from '../../common/enums';

describe('AuthService (auth.service.spec.ts)', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<any>;
  let jwtService: jest.Mocked<any>;
  let emailService: jest.Mocked<any>;
  let cloudinaryService: jest.Mocked<any>;
  let tokenBlacklistService: TokenBlacklistService;
  let configService: jest.Mocked<any>;

  const mockUser: any = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Nguyễn Văn Test',
    email: 'test@truongthanh.vn',
    password: '$2b$10$hashedpassword123456789012345678901234567890',
    phone: '0901234567',
    role: UserRole.CUSTOMER,
    status: true,
    tokenVersion: 0,
    loyaltyPoints: 100,
    loyaltyTier: 'BRONZE',
    permissions: [],
    save: jest.fn().mockResolvedValue(true),
    toObject: function () {
      return { ...this };
    },
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdWithPassword: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };

    emailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(true),
    };

    cloudinaryService = {
      uploadImage: jest
        .fn()
        .mockResolvedValue('https://cloudinary.com/avatar.jpg'),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '30d';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenBlacklistService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    tokenBlacklistService = module.get<TokenBlacklistService>(
      TokenBlacklistService,
    );
  });

  afterEach(() => {
    tokenBlacklistService.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('Register Flow', () => {
    it('should register a new user successfully and return tokens without password', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const createdUser = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockUser }),
      };
      usersService.create.mockResolvedValue(createdUser);

      const result = await authService.register({
        fullName: 'Nguyễn Văn Test',
        email: 'test@truongthanh.vn',
        password: 'Password@123',
        phone: '0901234567',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('mock.jwt.token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@truongthanh.vn');
      expect(result.user.password).toBeUndefined();
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          fullName: 'Nguyễn Văn Test',
          email: 'test@truongthanh.vn',
          password: 'Password@123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Login Flow', () => {
    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      const user = {
        ...mockUser,
        password: hashedPassword,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockUser, password: hashedPassword }),
      };
      usersService.findByEmail.mockResolvedValue(user);

      const result = await authService.login({
        email: 'test@truongthanh.vn',
        password: 'Password@123',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('mock.jwt.token');
      expect(result.user.password).toBeUndefined();
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if email does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@truongthanh.vn',
          password: 'Password@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is locked (status: false)', async () => {
      const inactiveUser = { ...mockUser, status: false };
      usersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(
        authService.login({
          email: 'test@truongthanh.vn',
          password: 'Password@123',
        }),
      ).rejects.toThrow('Tài khoản đã bị khóa');
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      const user = { ...mockUser, password: hashedPassword };
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        authService.login({
          email: 'test@truongthanh.vn',
          password: 'WrongPassword@999',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Refresh Token Flow & Rotation', () => {
    it('should rotate tokens successfully with valid refresh token', async () => {
      const rawRefreshToken = 'valid.refresh.token';
      const tokenHash = createHash('sha256')
        .update(rawRefreshToken)
        .digest('hex');

      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser._id,
        email: mockUser.email,
        type: 'refresh',
        tokenVersion: 0,
      });

      const user = {
        ...mockUser,
        tokenVersion: 0,
        refreshTokenHash: tokenHash,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...mockUser }),
      };
      usersService.findByIdWithPassword.mockResolvedValue(user);

      const result = await authService.refreshToken(
        rawRefreshToken,
        'old.access.token',
      );
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('mock.jwt.token');
      expect(user.save).toHaveBeenCalled();
      expect(tokenBlacklistService.isTokenBlacklisted('old.access.token')).toBe(
        true,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      jwtService.verifyAsync.mockRejectedValue(expiredError);

      await expect(authService.refreshToken('expired.token')).rejects.toThrow(
        /Refresh token đã hết hạn/,
      );
    });

    it('should detect token reuse, invalidate user sessions and throw UnauthorizedException', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser._id,
        email: mockUser.email,
        type: 'refresh',
        tokenVersion: 0,
      });

      const user = {
        ...mockUser,
        tokenVersion: 0,
        refreshTokenHash: 'different_hash_from_another_session',
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByIdWithPassword.mockResolvedValue(user);

      await expect(authService.refreshToken('reused.token')).rejects.toThrow(
        /Phát hiện Refresh Token đã qua sử dụng/,
      );
      expect(user.refreshTokenHash).toBeUndefined();
      expect(user.tokenVersion).toBe(1);
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if tokenVersion in payload is outdated', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser._id,
        email: mockUser.email,
        type: 'refresh',
        tokenVersion: 0, // Old version
      });

      const user = {
        ...mockUser,
        tokenVersion: 2, // New version after password reset
        refreshTokenHash: 'some_hash',
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByIdWithPassword.mockResolvedValue(user);

      await expect(
        authService.refreshToken('outdated.version.token'),
      ).rejects.toThrow(/Phiên đăng nhập đã bị hủy/);
    });
  });

  describe('Logout & Blacklist Flow', () => {
    it('should clear refresh token in database and blacklist access token on logout', async () => {
      const rawAccessToken = 'user.access.token';
      jwtService.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: 'logout-jti-1',
      });

      const user = {
        ...mockUser,
        refreshTokenHash: 'some_hash',
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByIdWithPassword.mockResolvedValue(user);

      const result = await authService.logout(mockUser._id, rawAccessToken);
      expect(result.success).toBe(true);
      expect(user.refreshTokenHash).toBeUndefined();
      expect(user.save).toHaveBeenCalled();
      expect(tokenBlacklistService.isTokenBlacklisted(rawAccessToken)).toBe(
        true,
      );
      expect(tokenBlacklistService.isJtiBlacklisted('logout-jti-1')).toBe(true);
    });
  });

  describe('Profile & Password Management', () => {
    it('getProfile should exclude password, tokenVersion and secret fields', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        toObject: () => ({
          ...mockUser,
          resetOtp: '123456',
          refreshTokenHash: 'hash',
        }),
      });

      const profile = await authService.getProfile(mockUser._id);
      expect(profile.password).toBeUndefined();
      expect(profile.resetOtp).toBeUndefined();
      expect(profile.refreshTokenHash).toBeUndefined();
      expect(profile.email).toBe(mockUser.email);
    });

    it('changePassword should increment tokenVersion, clear refreshTokenHash and blacklist access token', async () => {
      const oldHashed = await bcrypt.hash('OldPassword@123', 10);
      jwtService.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: 'change-pw-jti',
      });

      const user = {
        ...mockUser,
        tokenVersion: 0,
        password: oldHashed,
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByIdWithPassword.mockResolvedValue(user);

      const result = await authService.changePassword(
        mockUser._id,
        'OldPassword@123',
        'NewPassword@456',
        'current.access.token',
      );

      expect(result.success).toBe(true);
      expect(user.tokenVersion).toBe(1);
      expect(user.refreshTokenHash).toBeUndefined();
      expect(user.save).toHaveBeenCalled();
      expect(
        tokenBlacklistService.isTokenBlacklisted('current.access.token'),
      ).toBe(true);
      expect(tokenBlacklistService.isJtiBlacklisted('change-pw-jti')).toBe(
        true,
      );
      const isNewMatch = await bcrypt.compare('NewPassword@456', user.password);
      expect(isNewMatch).toBe(true);
    });
  });

  describe('Forgot & Reset Password OTP Flow', () => {
    it('forgotPassword should generate 6-digit OTP, store sha256 and trigger email', async () => {
      const user = { ...mockUser, save: jest.fn().mockResolvedValue(true) };
      usersService.findByEmail.mockResolvedValue(user);

      const result = await authService.forgotPassword(mockUser.email);
      expect(result.success).toBe(true);
      expect(user.resetOtp).toBeDefined();
      expect(user.resetOtpExpiry).toBeDefined();
      expect(user.resetOtpAttempts).toBe(0);
      expect(user.save).toHaveBeenCalled();
    });

    it('forgotPassword should not reveal if email does not exist (anti-enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.forgotPassword(
        'nonexistent@truongthanh.vn',
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('Mã OTP đã được gửi');
    });

    it('verifyOtp should succeed with valid OTP and return signed resetToken', async () => {
      const rawOtp = '123456';
      const otpHash = createHash('sha256').update(rawOtp).digest('hex');
      const expiry = new Date(Date.now() + 600000); // 10m future

      const user = {
        ...mockUser,
        resetOtp: otpHash,
        resetOtpExpiry: expiry,
        resetOtpAttempts: 0,
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByEmail.mockResolvedValue(user);

      const result = await authService.verifyOtp(mockUser.email, rawOtp);
      expect(result.success).toBe(true);
      expect(result.resetToken).toBe('mock.jwt.token');
    });

    it('verifyOtp should throw error and increment attempts on wrong OTP', async () => {
      const rawOtp = '123456';
      const otpHash = createHash('sha256').update(rawOtp).digest('hex');
      const expiry = new Date(Date.now() + 600000);

      const user = {
        ...mockUser,
        resetOtp: otpHash,
        resetOtpExpiry: expiry,
        resetOtpAttempts: 2,
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        authService.verifyOtp(mockUser.email, '999999'),
      ).rejects.toThrow(/Mã OTP không đúng. Bạn còn 2 lần thử/);
      expect(user.resetOtpAttempts).toBe(3);
      expect(user.save).toHaveBeenCalled();
    });

    it('resetPassword should succeed with resetToken, increment tokenVersion and clear OTP fields', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockUser._id,
        email: mockUser.email,
        type: 'RESET_PASSWORD',
      });

      const user = {
        ...mockUser,
        tokenVersion: 0,
        resetOtp: 'some_otp',
        resetOtpExpiry: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByEmail.mockResolvedValue(user);

      const result = await authService.resetPassword({
        email: mockUser.email,
        resetToken: 'valid.reset.token',
        newPassword: 'BrandNewPassword@123',
      });

      expect(result.success).toBe(true);
      expect(user.tokenVersion).toBe(1);
      expect(user.resetOtp).toBeUndefined();
      expect(user.resetOtpExpiry).toBeUndefined();
      expect(user.save).toHaveBeenCalled();
      const isMatch = await bcrypt.compare(
        'BrandNewPassword@123',
        user.password,
      );
      expect(isMatch).toBe(true);
    });
  });
});
