import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../token-blacklist.service';

describe('JwtStrategy (AUDIT-P1-01)', () => {
  let strategy: JwtStrategy;
  let usersService: Partial<UsersService>;
  let tokenBlacklistService: Partial<TokenBlacklistService>;
  let configService: Partial<ConfigService>;

  const mockObjectId = new Types.ObjectId();
  const mockUser: any = {
    _id: mockObjectId,
    email: 'test@truongthanh.vn',
    role: 'STAFF',
    fullName: 'Nguyen Van Test',
    permissions: ['VIEW_REPORTS'],
    status: true,
    tokenVersion: 1,
  };

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue('super-secret-jwt-key'),
    };
    usersService = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };
    tokenBlacklistService = {
      isJtiBlacklisted: jest.fn().mockResolvedValue(false),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    };

    strategy = new JwtStrategy(
      configService as ConfigService,
      usersService as UsersService,
      tokenBlacklistService as TokenBlacklistService,
    );
  });

  it('should return _id, id, and userId matching the user object ID (AUDIT-P1-01)', async () => {
    const payload = {
      type: 'access',
      sub: mockObjectId.toString(),
      tokenVersion: 1,
      jti: 'test-jti-uuid-1234',
    };
    const req = { headers: {} };

    const result = await strategy.validate(req, payload);

    expect(result._id).toEqual(mockObjectId);
    expect(result.id).toBe(mockObjectId.toString());
    expect(result.userId).toBe(mockObjectId.toString());
    expect(result.email).toBe('test@truongthanh.vn');
    expect(result.role).toBe('STAFF');
  });

  it('should reject tokens with missing or wrong type', async () => {
    const payload = {
      type: 'refresh',
      sub: mockObjectId.toString(),
      tokenVersion: 1,
      jti: 'test-jti',
    };
    await expect(
      strategy.validate({ headers: {} }, payload as any),
    ).rejects.toThrow(UnauthorizedException);
  });
});
