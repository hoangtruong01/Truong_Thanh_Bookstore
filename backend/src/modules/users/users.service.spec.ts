import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole, StaffPermission } from '../../common/enums';

describe('UsersService RBAC', () => {
  let service: UsersService;
  let mockUserModel: any;

  const validAdminId = '507f1f77bcf86cd799439011';
  const validSuperAdminId = '507f1f77bcf86cd799439012';
  const validStaffId = '507f1f77bcf86cd799439013';
  const validOtherAdminId = '507f1f77bcf86cd799439014';

  const mockAdminUser = {
    _id: validAdminId,
    role: UserRole.ADMIN,
    fullName: 'Admin User',
    email: 'admin@truongthanh.vn',
    status: true,
  };

  const mockSuperAdminUser = {
    _id: validSuperAdminId,
    role: UserRole.SUPER_ADMIN,
    fullName: 'Super Admin User',
    email: 'superadmin@truongthanh.vn',
    status: true,
  };

  const mockStaffUser = {
    _id: validStaffId,
    role: UserRole.STAFF,
    fullName: 'Staff User',
    email: 'staff@truongthanh.vn',
    status: true,
    permissions: [StaffPermission.MANAGE_ORDERS],
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockUserModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllUsers', () => {
    it('should return paginated user list with filters', async () => {
      const mockUsers = [mockAdminUser, mockStaffUser];
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      };

      mockUserModel.find.mockReturnValue(mockQueryChain);
      mockUserModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

      const result = await service.findAllUsers({ page: 1, limit: 10, role: UserRole.STAFF, search: 'staff' });
      expect(result.data).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('createStaffOrAdmin', () => {
    it('should allow ADMIN to create STAFF account', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const createdUserMock = {
        _id: validStaffId,
        email: 'newstaff@truongthanh.vn',
        role: UserRole.STAFF,
        toObject: () => ({ _id: validStaffId, email: 'newstaff@truongthanh.vn', role: UserRole.STAFF }),
      };

      const userConstructorMock = jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue(createdUserMock),
      });
      (service as any).userModel = Object.assign(userConstructorMock, mockUserModel);

      const dto = {
        email: 'newstaff@truongthanh.vn',
        password: 'Password123',
        fullName: 'New Staff',
        role: UserRole.STAFF,
        permissions: [StaffPermission.MANAGE_ORDERS],
      };

      const result = await service.createStaffOrAdmin(dto, mockAdminUser);
      expect(result.email).toBe('newstaff@truongthanh.vn');
      expect(result.role).toBe(UserRole.STAFF);
    });

    it('should reject non-SUPER_ADMIN trying to create ADMIN account', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const dto = {
        email: 'admin2@truongthanh.vn',
        password: 'Password123',
        fullName: 'Admin 2',
        role: UserRole.ADMIN,
      };

      await expect(service.createStaffOrAdmin(dto, mockAdminUser)).rejects.toThrow(ForbiddenException);
    });

    it('should reject duplicate email', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockAdminUser),
        }),
      });

      const dto = {
        email: 'admin@truongthanh.vn',
        password: 'Password123',
        fullName: 'Duplicate Admin',
        role: UserRole.STAFF,
      };

      await expect(service.createStaffOrAdmin(dto, mockSuperAdminUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('should prevent actor from modifying their own role', async () => {
      await expect(
        service.updateRole(validAdminId, { role: UserRole.STAFF }, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent non-SUPER_ADMIN from promoting someone to SUPER_ADMIN', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStaffUser),
      });

      await expect(
        service.updateRole(validStaffId, { role: UserRole.SUPER_ADMIN }, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent non-SUPER_ADMIN from changing a SUPER_ADMIN account role', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSuperAdminUser),
      });

      await expect(
        service.updateRole(validSuperAdminId, { role: UserRole.ADMIN }, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully update role when actor is SUPER_ADMIN', async () => {
      const targetUser: any = {
        _id: validStaffId,
        role: UserRole.STAFF,
        toObject() {
          return { _id: this._id, role: this.role };
        },
      };
      targetUser.save = jest.fn().mockResolvedValue(targetUser);

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(targetUser),
      });

      const result = await service.updateRole(validStaffId, { role: UserRole.ADMIN }, mockSuperAdminUser);
      expect(targetUser.role).toBe(UserRole.ADMIN);
      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions for STAFF user', async () => {
      const targetUser: any = {
        _id: validStaffId,
        role: UserRole.STAFF,
        permissions: [StaffPermission.MANAGE_ORDERS],
        toObject() {
          return { _id: this._id, role: this.role, permissions: this.permissions };
        },
      };
      targetUser.save = jest.fn().mockResolvedValue(targetUser);

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(targetUser),
      });

      const result = await service.updatePermissions(validStaffId, {
        permissions: [StaffPermission.MANAGE_ORDERS, StaffPermission.MANAGE_PROMOTIONS],
      });
      expect(targetUser.permissions).toEqual([
        StaffPermission.MANAGE_ORDERS,
        StaffPermission.MANAGE_PROMOTIONS,
      ]);
      expect(result.permissions).toContain(StaffPermission.MANAGE_PROMOTIONS);
    });
  });

  describe('updateStatus', () => {
    it('should prevent actor from locking their own account', async () => {
      await expect(
        service.updateStatus(validAdminId, { status: false }, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent non-SUPER_ADMIN from locking a SUPER_ADMIN account', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSuperAdminUser),
      });

      await expect(
        service.updateStatus(validSuperAdminId, { status: false }, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully update status for a user', async () => {
      const targetUser: any = {
        _id: validStaffId,
        role: UserRole.STAFF,
        status: true,
        toObject() {
          return { _id: this._id, status: this.status };
        },
      };
      targetUser.save = jest.fn().mockResolvedValue(targetUser);

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(targetUser),
      });

      const result = await service.updateStatus(validStaffId, { status: false }, mockAdminUser);
      expect(targetUser.status).toBe(false);
      expect(result.status).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should prevent actor from deleting their own account', async () => {
      await expect(
        service.deleteUser(validAdminId, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent deleting a SUPER_ADMIN account', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSuperAdminUser),
      });

      await expect(
        service.deleteUser(validSuperAdminId, mockSuperAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent ADMIN from deleting another ADMIN account', async () => {
      const otherAdmin = { _id: validOtherAdminId, role: UserRole.ADMIN };
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(otherAdmin),
      });

      await expect(
        service.deleteUser(validOtherAdminId, mockAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to delete an ADMIN or STAFF account', async () => {
      const targetStaff = { _id: validStaffId, role: UserRole.STAFF };
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(targetStaff),
      });
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(targetStaff),
      });

      const result = await service.deleteUser(validStaffId, mockSuperAdminUser);
      expect(result.success).toBe(true);
    });
  });
});
