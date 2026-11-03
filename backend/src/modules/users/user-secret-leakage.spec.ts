import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { UserRole, StaffPermission } from '../../common/enums';

describe('SEC-P0-02: User Secret Field Isolation & Sanitization', () => {
  let service: UsersService;
  let mockUserModel: any;

  const mockUserId = new Types.ObjectId().toString();
  const rawDbUserWithSecrets: any = {
    _id: new Types.ObjectId(mockUserId),
    fullName: 'Nguyen Van Admin',
    email: 'admin@truongthanh.vn',
    password: '$2b$10$hashed_password_secret',
    refreshTokenHash:
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    resetOtp:
      'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f',
    resetOtpExpiry: new Date(Date.now() + 600000),
    resetOtpAttempts: 2,
    role: UserRole.STAFF,
    status: true,
    permissions: [StaffPermission.VIEW_REPORTS],
    toObject() {
      return { ...this };
    },
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(() => {
    mockUserModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: new Types.ObjectId(),
        password: '$2b$10$hashed_password',
        refreshTokenHash: 'refresh_hash_secret',
        resetOtp: 'otp_hash_secret',
        resetOtpExpiry: new Date(),
        resetOtpAttempts: 0,
        toObject() {
          return { ...this };
        },
      }),
    }));

    mockUserModel.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...rawDbUserWithSecrets }),
      }),
      exec: jest.fn().mockResolvedValue({ ...rawDbUserWithSecrets }),
    });

    mockUserModel.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      exec: jest.fn().mockResolvedValue(null),
    });

    service = new UsersService(mockUserModel);
  });

  it('SEC-02-T01: findById must never return password, refreshTokenHash, resetOtp, resetOtpExpiry, resetOtpAttempts', async () => {
    const user = await service.findById(mockUserId);

    expect(user).toBeDefined();
    expect(user.fullName).toBe('Nguyen Van Admin');
    expect((user as any).password).toBeUndefined();
    expect((user as any).refreshTokenHash).toBeUndefined();
    expect((user as any).resetOtp).toBeUndefined();
    expect((user as any).resetOtpExpiry).toBeUndefined();
    expect((user as any).resetOtpAttempts).toBeUndefined();
  });

  it('SEC-02-T02: updateRole must never return secrets in response', async () => {
    const result = await service.updateRole(
      mockUserId,
      UserRole.STAFF,
      UserRole.SUPER_ADMIN,
      new Types.ObjectId().toString(),
    );

    expect((result as any).password).toBeUndefined();
    expect((result as any).refreshTokenHash).toBeUndefined();
    expect((result as any).resetOtp).toBeUndefined();
    expect((result as any).resetOtpExpiry).toBeUndefined();
    expect((result as any).resetOtpAttempts).toBeUndefined();
  });

  it('SEC-02-T02: updatePermissions must never return secrets in response', async () => {
    const result = await service.updatePermissions(
      mockUserId,
      [StaffPermission.MANAGE_INVENTORY],
      UserRole.ADMIN,
    );

    expect((result as any).password).toBeUndefined();
    expect((result as any).refreshTokenHash).toBeUndefined();
    expect((result as any).resetOtp).toBeUndefined();
    expect((result as any).resetOtpExpiry).toBeUndefined();
    expect((result as any).resetOtpAttempts).toBeUndefined();
  });

  it('SEC-02-T02: updateStatus must never return secrets in response', async () => {
    const result = await service.updateStatus(
      mockUserId,
      false,
      UserRole.SUPER_ADMIN,
      new Types.ObjectId().toString(),
    );

    expect((result as any).password).toBeUndefined();
    expect((result as any).refreshTokenHash).toBeUndefined();
    expect((result as any).resetOtp).toBeUndefined();
    expect((result as any).resetOtpExpiry).toBeUndefined();
    expect((result as any).resetOtpAttempts).toBeUndefined();
  });

  it('SEC-02-T02: createStaffOrAdmin must sanitize output before returning', async () => {
    const result = await service.createStaffOrAdmin(
      {
        fullName: 'New Staff',
        email: 'newstaff@truongthanh.vn',
        password: 'Password123!',
        role: UserRole.STAFF,
        permissions: [StaffPermission.MANAGE_ORDERS],
      },
      UserRole.SUPER_ADMIN,
    );

    expect((result as any).password).toBeUndefined();
    expect((result as any).refreshTokenHash).toBeUndefined();
    expect((result as any).resetOtp).toBeUndefined();
    expect((result as any).resetOtpExpiry).toBeUndefined();
    expect((result as any).resetOtpAttempts).toBeUndefined();
  });
});
