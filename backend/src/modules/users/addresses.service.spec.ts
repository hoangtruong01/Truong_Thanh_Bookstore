import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AddressesService } from './addresses.service';
import { Address } from './schemas/address.schema';

describe('AddressesService', () => {
  let service: AddressesService;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockAddressId = '507f1f77bcf86cd799439022';
  const mockAddressId2 = '507f1f77bcf86cd799439033';

  const mockAddress = {
    _id: new Types.ObjectId(mockAddressId),
    user: new Types.ObjectId(mockUserId),
    label: 'Nhà riêng',
    recipientName: 'Nguyễn Văn A',
    phone: '0901234567',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    detail: '123 Nguyễn Huệ',
    isDefault: true,
    isDeleted: false,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockAddress2 = {
    _id: new Types.ObjectId(mockAddressId2),
    user: new Types.ObjectId(mockUserId),
    label: 'Văn phòng',
    recipientName: 'Nguyễn Văn A',
    phone: '0901234567',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường Võ Thị Sáu',
    detail: '456 Hai Bà Trưng',
    isDefault: false,
    isDeleted: false,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockAddressModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    _id: new Types.ObjectId(mockAddressId),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  })) as any;

  mockAddressModel.updateMany = jest.fn();
  mockAddressModel.countDocuments = jest.fn();
  mockAddressModel.find = jest.fn();
  mockAddressModel.findOne = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: getModelToken(Address.name),
          useValue: mockAddressModel,
        },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  describe('create', () => {
    it('should automatically set isDefault = true for the first address', async () => {
      mockAddressModel.countDocuments.mockResolvedValue(0);

      const dto = {
        label: 'Nhà riêng',
        recipientName: 'Nguyễn Văn A',
        phone: '0901234567',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        detail: '123 Nguyễn Huệ',
        isDefault: false, // passed as false, but is first address
      };

      const result = await service.create(mockUserId, dto);
      expect(result.isDefault).toBe(true);
      expect(mockAddressModel.countDocuments).toHaveBeenCalled();
    });

    it('should keep isDefault = false if user already has addresses and isDefault was not requested', async () => {
      mockAddressModel.countDocuments.mockResolvedValue(1);

      const dto = {
        label: 'Văn phòng',
        recipientName: 'Nguyễn Văn A',
        phone: '0901234567',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường Võ Thị Sáu',
        detail: '456 Hai Bà Trưng',
        isDefault: false,
      };

      const result = await service.create(mockUserId, dto);
      expect(result.isDefault).toBe(false);
      expect(mockAddressModel.updateMany).not.toHaveBeenCalled();
    });

    it('should reset other default addresses if new address isDefault = true', async () => {
      mockAddressModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
      mockAddressModel.countDocuments.mockResolvedValue(1);

      const dto = {
        label: 'Công ty',
        recipientName: 'Nguyễn Văn A',
        phone: '0901234567',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        detail: '789 Lê Duẩn',
        isDefault: true,
      };

      const result = await service.create(mockUserId, dto);
      expect(result.isDefault).toBe(true);
      expect(mockAddressModel.updateMany).toHaveBeenCalledWith(
        { user: new Types.ObjectId(mockUserId) },
        { isDefault: false },
      );
    });
  });

  describe('findByUser', () => {
    it('should return list of non-deleted addresses sorted by isDefault and createdAt', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockAddress, mockAddress2]),
      };
      mockAddressModel.find.mockReturnValue(mockQuery);

      const result = await service.findByUser(mockUserId);
      expect(result).toHaveLength(2);
      expect(mockAddressModel.find).toHaveBeenCalledWith({
        user: new Types.ObjectId(mockUserId),
        isDeleted: false,
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({
        isDefault: -1,
        createdAt: -1,
      });
    });
  });

  describe('findById', () => {
    it('should return address if found and belongs to user', async () => {
      mockAddressModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAddress),
      });

      const result = await service.findById(mockAddressId, mockUserId);
      expect(result).toBeDefined();
      expect(result.recipientName).toBe('Nguyễn Văn A');
    });

    it('should throw NotFoundException if address not found or belongs to another user', async () => {
      mockAddressModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(mockAddressId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update address details successfully', async () => {
      const existingAddr = {
        ...mockAddress,
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockAddressModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingAddr),
      });

      const updateDto = { detail: '999 Nguyễn Huệ (Số mới)' };
      await service.update(mockAddressId, mockUserId, updateDto);

      expect(existingAddr.detail).toBe('999 Nguyễn Huệ (Số mới)');
      expect(existingAddr.save).toHaveBeenCalled();
    });

    it('should reset other default addresses if address is updated to isDefault = true', async () => {
      const existingAddr = {
        ...mockAddress,
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockAddressModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingAddr),
      });
      mockAddressModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

      await service.update(mockAddressId, mockUserId, { isDefault: true });

      expect(mockAddressModel.updateMany).toHaveBeenCalledWith(
        { user: new Types.ObjectId(mockUserId) },
        { isDefault: false },
      );
      expect(existingAddr.isDefault).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('should mark address as deleted', async () => {
      const nonDefaultAddr = {
        ...mockAddress2,
        isDefault: false,
        isDeleted: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockAddressModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(nonDefaultAddr),
      });

      await service.softDelete(mockAddressId2, mockUserId);

      expect(nonDefaultAddr.isDeleted).toBe(true);
      expect(nonDefaultAddr.save).toHaveBeenCalled();
    });

    it('should promote next active address to default when default address is deleted', async () => {
      const defaultAddr = {
        ...mockAddress,
        isDefault: true,
        isDeleted: false,
        save: jest.fn().mockResolvedValue(true),
      };
      const nextAddr = {
        ...mockAddress2,
        isDefault: false,
        isDeleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      // First findById returns the defaultAddr
      mockAddressModel.findOne
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(defaultAddr),
        })
        // Second findOne in softDelete finds the nextAddr
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(nextAddr),
        });

      await service.softDelete(mockAddressId, mockUserId);

      expect(defaultAddr.isDeleted).toBe(true);
      expect(defaultAddr.isDefault).toBe(false);
      expect(nextAddr.isDefault).toBe(true);
      expect(nextAddr.save).toHaveBeenCalled();
    });
  });

  describe('setDefault', () => {
    it('should unset all other addresses and set selected address as default', async () => {
      const targetAddr = {
        ...mockAddress2,
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockAddressModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
      mockAddressModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(targetAddr),
      });

      await service.setDefault(mockAddressId2, mockUserId);

      expect(mockAddressModel.updateMany).toHaveBeenCalledWith(
        { user: new Types.ObjectId(mockUserId) },
        { isDefault: false },
      );
      expect(targetAddr.isDefault).toBe(true);
      expect(targetAddr.save).toHaveBeenCalled();
    });
  });

  describe('getDefault', () => {
    it('should return the explicit default address', async () => {
      mockAddressModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAddress),
      });

      const result = await service.getDefault(mockUserId);
      expect(result).toEqual(mockAddress);
      expect(mockAddressModel.findOne).toHaveBeenCalledWith({
        user: new Types.ObjectId(mockUserId),
        isDefault: true,
        isDeleted: false,
      });
    });

    it('should fallback to most recent active address if no explicit default is found', async () => {
      mockAddressModel.findOne
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockAddress2),
        });

      const result = await service.getDefault(mockUserId);
      expect(result).toEqual(mockAddress2);
    });
  });
});
