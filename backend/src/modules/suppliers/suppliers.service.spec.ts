import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SuppliersService } from './suppliers.service';
import { Supplier, SupplierStatus } from './schemas/supplier.schema';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('SuppliersService (ERP-01)', () => {
  let service: SuppliersService;
  let supplierModel: any;
  let mockCountersCollection: any;

  const mockSupplier: any = {
    _id: new Types.ObjectId().toString(),
    code: 'NCC-0001',
    name: 'Công ty Sách & Thiết bị Giáo dục',
    contactPerson: 'Nguyễn Văn A',
    phone: '0912345678',
    email: 'info@giaoduc.vn',
    address: 'Hà Nội',
    status: SupplierStatus.ACTIVE,
    suppliedProducts: [
      {
        product: new Types.ObjectId(),
        lastPurchasePrice: 15000,
        lastPurchasedAt: new Date(),
      },
    ],
    isDeleted: false,
    deletedAt: undefined,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    mockCountersCollection = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
    };

    supplierModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId().toString(),
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    }));

    supplierModel.db = {
      collection: jest.fn().mockReturnValue(mockCountersCollection),
      model: jest.fn().mockReturnValue({
        countDocuments: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
      }),
    };

    supplierModel.findOne = jest.fn();
    supplierModel.findById = jest.fn();
    supplierModel.find = jest.fn();
    supplierModel.countDocuments = jest.fn();
    supplierModel.findOneAndUpdate = jest.fn();
    supplierModel.findByIdAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getModelToken(Supplier.name),
          useValue: supplierModel,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (ERP-01)', () => {
    it('tự động sinh mã NCC-0001 nếu không truyền code', async () => {
      supplierModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create({
        name: 'Nhà cung cấp Bút Thiên Long',
        phone: '0909123456',
      });

      expect(result.code).toBe('NCC-0001');
      expect(result.name).toBe('Nhà cung cấp Bút Thiên Long');
      expect(result.isDeleted).toBe(false);
    });

    it('cho phép đặt mã thủ công hợp lệ', async () => {
      supplierModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create({
        code: 'NCC-THIENLONG',
        name: 'Tập đoàn Thiên Long',
        phone: '0909123456',
      });

      expect(result.code).toBe('NCC-THIENLONG');
      expect(result.name).toBe('Tập đoàn Thiên Long');
    });

    it('ném ConflictException nếu mã nhà cung cấp đã tồn tại', async () => {
      supplierModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ _id: 'some_id', code: 'NCC-EXIST' }),
      });

      await expect(
        service.create({
          code: 'NCC-EXIST',
          name: 'Trùng mã',
          phone: '0909123456',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll (ERP-01)', () => {
    it('lấy danh sách nhà cung cấp có phân trang và lọc isDeleted: false', async () => {
      const execFind = jest.fn().mockResolvedValue([mockSupplier]);
      const execCount = jest.fn().mockResolvedValue(1);

      supplierModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: execFind,
      });

      supplierModel.countDocuments.mockReturnValue({ exec: execCount });

      const res = await service.findAll({
        page: 1,
        limit: 10,
        search: 'Giáo dục',
      });
      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(supplierModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isDeleted: false,
          $or: expect.any(Array),
        }),
      );
    });
  });

  describe('findById & update (ERP-01)', () => {
    it('ném BadRequestException nếu ID không hợp lệ', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('ném NotFoundException nếu không tìm thấy NCC', async () => {
      const validId = new Types.ObjectId().toString();
      supplierModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(validId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('cập nhật thành công thông tin nhà cung cấp', async () => {
      const validId = new Types.ObjectId().toString();
      const instance = {
        ...mockSupplier,
        _id: validId,
        save: jest.fn().mockResolvedValue(true),
      };

      supplierModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(instance),
      });

      const updated = await service.update(validId, {
        name: 'Tên mới cập nhật',
        contactPerson: 'Người liên hệ mới',
      });

      expect(instance.name).toBe('Tên mới cập nhật');
      expect(instance.contactPerson).toBe('Người liên hệ mới');
      expect(instance.save).toHaveBeenCalled();
    });
  });

  describe('delete (ERP-01)', () => {
    it('chỉ xóa mềm isDeleted: true và chuyển sang INACTIVE để bảo toàn kế toán', async () => {
      const validId = new Types.ObjectId().toString();
      const instance = {
        ...mockSupplier,
        _id: validId,
        isDeleted: false,
        status: SupplierStatus.ACTIVE,
        save: jest.fn().mockResolvedValue(true),
      };

      supplierModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(instance),
      });

      const res = await service.delete(validId);
      expect(res.success).toBe(true);
      expect(instance.isDeleted).toBe(true);
      expect(instance.status).toBe(SupplierStatus.INACTIVE);
      expect(instance.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('recordProductPurchase & getSuppliersForProduct (ERP-01)', () => {
    it('cập nhật giá mua gần nhất nếu sản phẩm đã có trong danh mục cung ứng', async () => {
      const sId = new Types.ObjectId();
      const pId = new Types.ObjectId();

      supplierModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: sId }),
      });

      await service.recordProductPurchase(sId, pId, 12000);
      expect(supplierModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: sId, 'suppliedProducts.product': pId },
        expect.objectContaining({
          $set: expect.objectContaining({
            'suppliedProducts.$.lastPurchasePrice': 12000,
          }),
        }),
        { new: true },
      );
    });

    it('thêm mới sản phẩm vào suppliedProducts nếu chưa có', async () => {
      const sId = new Types.ObjectId();
      const pId = new Types.ObjectId();

      supplierModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null), // not found in array
      });
      supplierModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: sId }),
      });

      await service.recordProductPurchase(sId, pId, 18000);
      expect(supplierModel.findByIdAndUpdate).toHaveBeenCalledWith(
        sId,
        expect.objectContaining({
          $push: {
            suppliedProducts: expect.objectContaining({
              product: pId,
              lastPurchasePrice: 18000,
            }),
          },
        }),
        { new: true },
      );
    });

    it('tra cứu nhà cung cấp đã từng cung ứng sản phẩm kèm giá mua gần nhất', async () => {
      const pId = new Types.ObjectId().toString();
      supplierModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            _id: 'ncc_1',
            code: 'NCC-0001',
            name: 'Thiên Long',
            phone: '0901234567',
            contactPerson: 'Anh Ba',
            suppliedProducts: [
              {
                product: new Types.ObjectId(pId),
                lastPurchasePrice: 8500,
                lastPurchasedAt: new Date('2026-10-15'),
              },
            ],
          },
        ]),
      });

      const res = await service.getSuppliersForProduct(pId);
      expect(res).toHaveLength(1);
      expect(res[0].code).toBe('NCC-0001');
      expect(res[0].lastPurchasePrice).toBe(8500);
    });
  });
});
