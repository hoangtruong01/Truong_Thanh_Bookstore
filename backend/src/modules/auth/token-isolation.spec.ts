/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { CloudinaryService } from '../users/cloudinary.service';
import { EmailService } from '../email/email.service';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { UserRole } from '../../common/enums';
import { randomUUID } from 'crypto';

describe('QA-01: Token Isolation Test Suite', () => {
  let jwtStrategy: JwtStrategy;
  let authService: AuthService;
  let usersService: jest.Mocked<any>;
  let jwtService: JwtService;
  let tokenBlacklistService: TokenBlacklistService;
  let configService: jest.Mocked<any>;

  const JWT_SECRET = 'super-secret-key-for-token-isolation-testing-12345';
  const JWT_REFRESH_SECRET =
    'refresh-secret-key-for-token-isolation-testing-67890';
  const JWT_RESET_SECRET =
    'reset-pwd-secret-key-for-token-isolation-testing-99999';
  const MOCK_USER_ID = '507f1f77bcf86cd799439011';

  const mockUser: any = {
    _id: MOCK_USER_ID,
    email: 'test@truongthanh.vn',
    fullName: 'Test User',
    role: UserRole.CUSTOMER,
    status: true,
    tokenVersion: 2,
    permissions: [],
    refreshTokenHash: 'stored-hash-placeholder',
    save: jest.fn().mockResolvedValue(true),
    toObject: function () {
      return { ...this };
    },
  };

  beforeEach(async () => {
    usersService = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByIdWithPassword: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return JWT_SECRET;
        if (key === 'JWT_REFRESH_SECRET') return JWT_REFRESH_SECRET;
        if (key === 'JWT_RESET_SECRET') return JWT_RESET_SECRET;
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '30d';
        return undefined;
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return JWT_SECRET;
        if (key === 'JWT_REFRESH_SECRET') return JWT_REFRESH_SECRET;
        if (key === 'JWT_RESET_SECRET') return JWT_RESET_SECRET;
        throw new Error(`Config ${key} not found`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        AuthService,
        TokenBlacklistService,
        {
          provide: JwtService,
          useValue: new JwtService({ secret: JWT_SECRET }),
        },
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: configService },
        {
          provide: CloudinaryService,
          useValue: { uploadImage: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: { sendOtpEmail: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    tokenBlacklistService = module.get<TokenBlacklistService>(
      TokenBlacklistService,
    );
  });

  afterEach(() => {
    tokenBlacklistService.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('Part A.1: Token Type Confusion Protection (JwtStrategy)', () => {
    it('Scenario 1: Valid Access Token with type "access" must PASS validation', async () => {
      const validPayload = {
        sub: MOCK_USER_ID,
        email: 'test@truongthanh.vn',
        role: UserRole.CUSTOMER,
        tokenVersion: 2,
        type: 'access',
        jti: randomUUID(),
      };

      const mockRequest = { headers: {} };
      const result = await jwtStrategy.validate(mockRequest, validPayload);

      expect(result).toBeDefined();
      expect(result._id).toBe(MOCK_USER_ID);
      expect(result.email).toBe('test@truongthanh.vn');
      expect(result.role).toBe(UserRole.CUSTOMER);
      expect(result.tokenVersion).toBe(2);
    });

    it('Scenario 2: Refresh Token (type: "refresh") used as Bearer token must throw 401 (ERR_INVALID_TOKEN)', async () => {
      const refreshTokenPayload = {
        sub: MOCK_USER_ID,
        email: 'test@truongthanh.vn',
        type: 'refresh',
        tokenVersion: 2,
        jti: randomUUID(),
      };

      const mockRequest = { headers: {} };
      await expect(
        jwtStrategy.validate(mockRequest, refreshTokenPayload),
      ).rejects.toThrow(UnauthorizedException);

      try {
        await jwtStrategy.validate(mockRequest, refreshTokenPayload);
      } catch (err: any) {
        expect(err.getStatus()).toBe(401);
        expect(err.getResponse()?.errorCode).toBe(ErrorCode.ERR_INVALID_TOKEN);
      }
    });

    it('Scenario 3: Reset Password Token (type: "RESET_PASSWORD") used as Bearer token must throw 401', async () => {
      const resetTokenPayload = {
        sub: MOCK_USER_ID,
        email: 'test@truongthanh.vn',
        type: 'RESET_PASSWORD',
        jti: randomUUID(),
      };

      const mockRequest = { headers: {} };
      await expect(
        jwtStrategy.validate(mockRequest, resetTokenPayload),
      ).rejects.toThrow(UnauthorizedException);

      try {
        await jwtStrategy.validate(mockRequest, resetTokenPayload);
      } catch (err: any) {
        expect(err.getStatus()).toBe(401);
        expect(err.getResponse()?.errorCode).toBe(ErrorCode.ERR_INVALID_TOKEN);
      }
    });

    it('Scenario 4: Token missing "type" property must be rejected with 401', async () => {
      const legacyPayloadWithoutType = {
        sub: MOCK_USER_ID,
        email: 'test@truongthanh.vn',
        role: UserRole.CUSTOMER,
        tokenVersion: 2,
        jti: randomUUID(),
      };

      const mockRequest = { headers: {} };
      await expect(
        jwtStrategy.validate(mockRequest, legacyPayloadWithoutType),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Part A.2: Cross-Flow Protection in AuthService', () => {
    it('Scenario 5: Access Token sent to refresh token flow must be rejected', async () => {
      // Sign an access token
      const accessToken = jwtService.sign({
        sub: MOCK_USER_ID,
        email: 'test@truongthanh.vn',
        type: 'access',
        tokenVersion: 2,
        jti: randomUUID(),
      });

      await expect(authService.refreshToken(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );

      try {
        await authService.refreshToken(accessToken);
      } catch (err: any) {
        expect(err.getStatus()).toBe(401);
        expect(err.getResponse()?.errorCode).toBe(ErrorCode.ERR_INVALID_TOKEN);
      }
    });

    it('Scenario 6: Expired Refresh Token must return ERR_REFRESH_TOKEN_EXPIRED (401)', async () => {
      const expiredToken = jwtService.sign(
        {
          sub: MOCK_USER_ID,
          email: 'test@truongthanh.vn',
          type: 'refresh',
          tokenVersion: 2,
          jti: randomUUID(),
        },
        { secret: JWT_REFRESH_SECRET, expiresIn: '-1s' }, // Expired 1 second ago
      );

      try {
        await authService.refreshToken(expiredToken);
        fail('Should have thrown UnauthorizedException');
      } catch (err: any) {
        expect(err.getStatus()).toBe(401);
        expect(err.getResponse()?.errorCode).toBe(
          ErrorCode.ERR_REFRESH_TOKEN_EXPIRED,
        );
      }
    });

    it('Scenario 7: Token with invalid secret must throw 401 ERR_INVALID_TOKEN', async () => {
      const forgedToken = new JwtService({
        secret: 'attacker-fake-secret',
      }).sign({
        sub: MOCK_USER_ID,
        type: 'refresh',
        tokenVersion: 2,
      });

      await expect(authService.refreshToken(forgedToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Part A.3: Revocation & Security Invalidation (tokenVersion, JTI, Reuse)', () => {
    it('Scenario 8: Token with outdated tokenVersion (e.g. after password change) must throw 401 ERR_TOKEN_REVOKED', async () => {
      const outdatedPayload = {
        sub: MOCK_USER_ID,
        email: 'test@truongthanh.vn',
        role: UserRole.CUSTOMER,
        tokenVersion: 1, // User's active version is 2
        type: 'access',
        jti: randomUUID(),
      };

      const mockRequest = { headers: {} };
      try {
        await jwtStrategy.validate(mockRequest, outdatedPayload);
        fail('Should have thrown UnauthorizedException');
      } catch (err: any) {
        expect(err.getStatus()).toBe(401);
        expect(err.getResponse()?.errorCode).toBe(ErrorCode.ERR_TOKEN_REVOKED);
      }
    });

    it('Scenario 9: Token with blacklisted JTI must be immediately rejected with 401 ERR_TOKEN_REVOKED', async () => {
      const testJti = randomUUID();
      tokenBlacklistService.blacklistJti(testJti, Date.now() + 60000);

      const blacklistedPayload = {
        sub: MOCK_USER_ID,
        email: 'test@truongthanh.vn',
        role: UserRole.CUSTOMER,
        tokenVersion: 2,
        type: 'access',
        jti: testJti,
      };

      const mockRequest = { headers: {} };
      try {
        await jwtStrategy.validate(mockRequest, blacklistedPayload);
        fail('Should have thrown UnauthorizedException');
      } catch (err: any) {
        expect(err.getStatus()).toBe(401);
        expect(err.getResponse()?.errorCode).toBe(ErrorCode.ERR_TOKEN_REVOKED);
      }
    });

    it('Scenario 10: Refresh Token Reuse detection must revoke all sessions and increment tokenVersion', async () => {
      const validJti = randomUUID();
      const legitimateRefreshToken = jwtService.sign(
        {
          sub: MOCK_USER_ID,
          email: 'test@truongthanh.vn',
          type: 'refresh',
          tokenVersion: 2,
          jti: validJti,
        },
        { secret: JWT_REFRESH_SECRET },
      );

      // User has a DIFFERENT stored hash in DB (simulating an old/reused token)
      const userWithOldSession = {
        ...mockUser,
        tokenVersion: 2,
        refreshTokenHash: 'different-hash-from-a-previous-rotation',
        save: jest.fn().mockResolvedValue(true),
      };
      usersService.findByIdWithPassword.mockResolvedValue(userWithOldSession);

      try {
        await authService.refreshToken(legitimateRefreshToken);
        fail('Should have caught token reuse');
      } catch (err: any) {
        expect(err.getStatus()).toBe(401);
        expect(err.getResponse()?.errorCode).toBe(
          ErrorCode.ERR_REFRESH_TOKEN_REUSE,
        );
        // Verify all sessions were invalidated: tokenVersion incremented, hash cleared
        expect(userWithOldSession.tokenVersion).toBe(3);
        expect(userWithOldSession.refreshTokenHash).toBeUndefined();
        expect(userWithOldSession.save).toHaveBeenCalled();
      }
    });
  });

  describe('Part A.4: BE-01 Cryptographic Secret Separation Tests', () => {
    it('Scenario 11: Reset Token signed with JWT_RESET_SECRET cannot be used to refresh tokens', async () => {
      const resetToken = jwtService.sign(
        {
          sub: MOCK_USER_ID,
          email: 'test@truongthanh.vn',
          type: 'RESET_PASSWORD',
        },
        { secret: JWT_RESET_SECRET, expiresIn: '15m' },
      );

      // Attempting to refresh with resetToken should fail signature check (signed with reset secret, verified with refresh secret)
      await expect(authService.refreshToken(resetToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Scenario 12: Refresh Token signed with JWT_REFRESH_SECRET cannot be used to reset password', async () => {
      const refreshToken = jwtService.sign(
        {
          sub: MOCK_USER_ID,
          email: 'test@truongthanh.vn',
          type: 'refresh',
        },
        { secret: JWT_REFRESH_SECRET, expiresIn: '30d' },
      );

      // Attempting to reset password with refreshToken should fail signature check (signed with refresh secret, verified with reset secret)
      await expect(
        authService.resetPassword({
          email: 'test@truongthanh.vn',
          resetToken: refreshToken,
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Scenario 13: Access Token signed with JWT_SECRET cannot be used to reset password', async () => {
      const accessToken = jwtService.sign(
        {
          sub: MOCK_USER_ID,
          email: 'test@truongthanh.vn',
          type: 'access',
        },
        { secret: JWT_SECRET, expiresIn: '15m' },
      );

      await expect(
        authService.resetPassword({
          email: 'test@truongthanh.vn',
          resetToken: accessToken,
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
