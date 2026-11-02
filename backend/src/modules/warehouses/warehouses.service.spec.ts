import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from './schemas/warehouse.schema';
import { WarehouseStock } from './schemas/warehouse-stock.schema';
import { StockTransfer } from './schemas/stock-transfer.schema';
import { InventoryTransaction } from '../inventory/schemas/inventory.schema';
import { Product } from '../products/schemas/product.schema';
import {
  WarehouseType,
  StockTransferStatus,
  InventoryTransactionType,
} from '../../common/enums';

describe('WarehousesService (INV-02: Multi-Warehouse & Stock Transfers)', () => {
  let service: WarehousesService;
  let mockWarehouseModel: any;
  let mockWarehouseStockModel: any;
  let mockStockTransferModel: any;
  let mockTransactionModel: any;
  let mockProductModel: any;
  let mockConnection: any;
  let mockSession: any;

  const mockUserId = new Types.ObjectId();
  const mockWarehouseAId = new Types.ObjectId();
  const mockWarehouseBId = new Types.ObjectId();
  const mockProductId = new Types.ObjectId();

  beforeEach(async () => {
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    mockConnection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    mockWarehouseModel = jest.fn().mockImplementation(function (dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      });
    });
    mockWarehouseModel.findOne = jest.fn();
    mockWarehouseModel.findById = jest.fn();
    mockWarehouseModel.find = jest.fn();
    mockWarehouseModel.countDocuments = jest.fn();
    mockWarehouseModel.create = jest.fn();
    mockWarehouseModel.updateMany = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

    mockWarehouseStockModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockStockTransferModel = jest.fn().mockImplementation(function (dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      });
    });
    mockStockTransferModel.findOne = jest.fn();
    mockStockTransferModel.findById = jest.fn();
    mockStockTransferModel.find = jest.fn();
    mockStockTransferModel.countDocuments = jest.fn();
    mockStockTransferModel.create = jest.fn();

    mockTransactionModel = {
      create: jest.fn().mockResolvedValue([]),
    };

    mockProductModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesService,
        {
          provide: getModelToken(Warehouse.name),
          useValue: mockWarehouseModel,
        },
        {
          provide: getModelToken(WarehouseStock.name),
          useValue: mockWarehouseStockModel,
        },
        {
          provide: getModelToken(StockTransfer.name),
          useValue: mockStockTransferModel,
        },
        {
          provide: getModelToken(InventoryTransaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
  });

  describe('INV-02-T01: Khởi tạo kho mặc định', () => {
    it('should seed default MAIN and STORE warehouses if none exist', async () => {
      mockWarehouseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockWarehouseModel.create
        .mockResolvedValueOnce({
          _id: mockWarehouseAId,
          code: 'KHO-TONG',
          isDefault: true,
        })
        .mockResolvedValueOnce({
          _id: mockWarehouseBId,
          code: 'KHO-CUA-HANG',
          isDefault: false,
        });

      const result = await service.ensureDefaultWarehouses();

      expect(mockWarehouseModel.create).toHaveBeenCalledTimes(2);
      expect(result.code).toBe('KHO-TONG');
    });
  });

  describe('INV-02-T02: Tạo kho mới & Chống trùng mã kho', () => {
    it('should throw ConflictException if warehouse code already exists', async () => {
      mockWarehouseModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ _id: mockWarehouseAId, code: 'KHO-01' }),
      });

      await expect(
        service.createWarehouse({
          code: 'KHO-01',
          name: 'Kho Trùng',
          address: 'Hà Nội',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('INV-02-T03: Lập phiếu chuyển kho hợp lệ (DRAFT)', () => {
    it('should reject transfer when fromWarehouse equals toWarehouse', async () => {
      await expect(
        service.createTransfer(
          {
            fromWarehouse: mockWarehouseAId.toString(),
            toWarehouse: mockWarehouseAId.toString(),
            items: [{ product: mockProductId.toString(), requestedQty: 10 }],
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create transfer in DRAFT status with generated transferCode', async () => {
      mockWarehouseModel.findById
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({
            _id: mockWarehouseAId,
            code: 'KHO-A',
            isActive: true,
          }),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({
            _id: mockWarehouseBId,
            code: 'KHO-B',
            isActive: true,
          }),
        });

      mockProductModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            _id: mockProductId,
            name: 'Sách Văn Học',
            sku: 'SKU-VANHOC-01',
            costPrice: 50000,
          },
        ]),
      });

      const result = await service.createTransfer(
        {
          fromWarehouse: mockWarehouseAId.toString(),
          toWarehouse: mockWarehouseBId.toString(),
          items: [{ product: mockProductId.toString(), requestedQty: 10 }],
        },
        mockUserId,
      );

      expect(result.status).toBe(StockTransferStatus.DRAFT);
      expect(result.transferCode).toMatch(/^TRF-\d{8}-\d{4}$/);
      expect(result.items[0].requestedQty).toBe(10);
    });
  });

  describe('INV-02-T04: Phê duyệt phiếu chuyển kho (APPROVED)', () => {
    it('should approve DRAFT transfer and record approvedBy', async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        status: StockTransferStatus.DRAFT,
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest.spyOn(service, 'findTransferById').mockResolvedValue(mockTransfer);

      const approved = await service.approveTransfer(
        mockTransfer._id,
        mockUserId,
      );

      expect(approved.status).toBe(StockTransferStatus.APPROVED);
      expect(approved.approvedBy).toEqual(mockUserId);
    });

    it('should reject approving non-DRAFT transfer', async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        status: StockTransferStatus.IN_TRANSIT,
      };

      jest.spyOn(service, 'findTransferById').mockResolvedValue(mockTransfer);

      await expect(
        service.approveTransfer(mockTransfer._id, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('INV-02-T05 & T06: Xuất kho vận chuyển (IN_TRANSIT) & Thiếu tồn kho', () => {
    it('should deduct source warehouse stock and record TRANSFER_OUT transaction', async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        transferCode: 'TRF-20261102-0001',
        fromWarehouse: mockWarehouseAId,
        toWarehouse: mockWarehouseBId,
        status: StockTransferStatus.APPROVED,
        items: [
          {
            product: mockProductId,
            sku: 'SKU-01',
            requestedQty: 10,
            shippedQty: 0,
            costPrice: 50000,
          },
        ],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      mockStockTransferModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTransfer),
      });

      mockWarehouseStockModel.findOneAndUpdate.mockResolvedValue({
        quantity: 90, // After deducting 10 from 100
      });

      const shipped = await service.shipTransfer(mockTransfer._id, mockUserId);

      expect(shipped.status).toBe(StockTransferStatus.IN_TRANSIT);
      expect(shipped.items[0].shippedQty).toBe(10);
      expect(mockWarehouseStockModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          warehouse: mockWarehouseAId,
          product: mockProductId,
          quantity: { $gte: 10 },
        }),
        expect.objectContaining({ $inc: { quantity: -10 } }),
        expect.anything(),
      );
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: InventoryTransactionType.TRANSFER_OUT,
            quantity: 10,
            change: -10,
          }),
        ]),
        expect.anything(),
      );
    });

    it('should throw BadRequestException if source warehouse has insufficient stock', async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        transferCode: 'TRF-20261102-0002',
        fromWarehouse: mockWarehouseAId,
        toWarehouse: mockWarehouseBId,
        status: StockTransferStatus.APPROVED,
        items: [
          {
            product: mockProductId,
            sku: 'SKU-01',
            requestedQty: 100,
          },
        ],
      };

      mockStockTransferModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTransfer),
      });

      mockWarehouseStockModel.findOneAndUpdate.mockResolvedValue(null); // Insufficient

      await expect(
        service.shipTransfer(mockTransfer._id, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('INV-02-T07 & T08: Nhận kho đích (COMPLETED) & Ghi nhận Hao hụt Variance', () => {
    it('should credit destination warehouse stock, record variance and log DAMAGE transaction', async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        transferCode: 'TRF-20261102-0003',
        fromWarehouse: mockWarehouseAId,
        toWarehouse: mockWarehouseBId,
        status: StockTransferStatus.IN_TRANSIT,
        items: [
          {
            product: mockProductId,
            sku: 'SKU-01',
            requestedQty: 10,
            shippedQty: 10,
            receivedQty: 0,
            variance: 0,
            costPrice: 50000,
          },
        ],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      mockStockTransferModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTransfer),
      });

      mockWarehouseStockModel.findOneAndUpdate.mockResolvedValue({
        quantity: 8, // Credited 8
      });

      const completed = await service.receiveTransfer(
        mockTransfer._id,
        {
          items: [
            {
              product: mockProductId.toString(),
              receivedQty: 8,
              note: 'Bể vỡ 2 cuốn',
            },
          ],
        },
        mockUserId,
      );

      expect(completed.status).toBe(StockTransferStatus.COMPLETED);
      expect(completed.items[0].receivedQty).toBe(8);
      expect(completed.items[0].variance).toBe(2); // Variance = 10 - 8 = 2

      // Verify TRANSFER_IN for received 8
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: InventoryTransactionType.TRANSFER_IN,
            quantity: 8,
          }),
        ]),
        expect.anything(),
      );

      // Verify DAMAGE for variance 2
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: InventoryTransactionType.DAMAGE,
            quantity: 2,
            change: -2,
          }),
        ]),
        expect.anything(),
      );
    });
  });

  describe('INV-02-T09: Giữ chỗ tồn kho nguyên tử (reserveStock)', () => {
    it('should atomically reserve stock using condition expression', async () => {
      mockWarehouseStockModel.findOneAndUpdate.mockResolvedValue({
        warehouse: mockWarehouseAId,
        product: mockProductId,
        quantity: 50,
        reservedQuantity: 5,
      });

      const res = await service.reserveStock(
        mockWarehouseAId,
        mockProductId,
        5,
      );

      expect(res.reservedQuantity).toBe(5);
      expect(mockWarehouseStockModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          warehouse: mockWarehouseAId,
          product: mockProductId,
          $expr: {
            $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, 5],
          },
        }),
        expect.objectContaining({ $inc: { reservedQuantity: 5 } }),
        expect.anything(),
      );
    });

    it('should throw BadRequestException when available stock is insufficient for reservation', async () => {
      mockWarehouseStockModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.reserveStock(mockWarehouseAId, mockProductId, 999),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('INV-02-T10: Cô lập kho hàng lỗi/chờ kiểm (Sellable Stock Isolation)', () => {
    it('should exclude DAMAGED and QUARANTINE warehouses from sellable stock calculation', async () => {
      // Mock active warehouses: only MAIN and STORE are returned
      mockWarehouseModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            _id: mockWarehouseAId,
            code: 'KHO-TONG',
            name: 'Kho Tổng',
            type: WarehouseType.MAIN,
          },
          {
            _id: mockWarehouseBId,
            code: 'KHO-STORE',
            name: 'Kho Bán Lẻ',
            type: WarehouseType.STORE,
          },
        ]),
      });

      mockWarehouseStockModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            warehouse: mockWarehouseAId,
            product: mockProductId,
            quantity: 100,
            reservedQuantity: 20,
          },
          {
            warehouse: mockWarehouseBId,
            product: mockProductId,
            quantity: 30,
            reservedQuantity: 0,
          },
        ]),
      });

      const sellable = await service.getSellableStock(mockProductId);

      // Sellable = (100 - 20) + (30 - 0) = 80 + 30 = 110
      expect(sellable.totalSellable).toBe(110);
      expect(sellable.breakdown).toHaveLength(2);
      expect(
        sellable.breakdown.every((b) => b.type !== WarehouseType.DAMAGED),
      ).toBe(true);
    });
  });

  describe('INV-02-T11 & T12: Hủy chuyển kho & Hoàn trả IN_TRANSIT', () => {
    it('should rollback shipped items to source warehouse if cancelled during IN_TRANSIT', async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        transferCode: 'TRF-20261102-ROLLBACK',
        fromWarehouse: mockWarehouseAId,
        toWarehouse: mockWarehouseBId,
        status: StockTransferStatus.IN_TRANSIT,
        items: [
          {
            product: mockProductId,
            shippedQty: 15,
            costPrice: 50000,
          },
        ],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      mockStockTransferModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTransfer),
      });

      mockWarehouseStockModel.findOneAndUpdate.mockResolvedValue({
        quantity: 65,
      });

      const cancelled = await service.cancelTransfer(
        mockTransfer._id,
        mockUserId,
      );

      expect(cancelled.status).toBe(StockTransferStatus.CANCELLED);
      // Restored 15 back to warehouseA
      expect(mockWarehouseStockModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          warehouse: mockWarehouseAId,
          product: mockProductId,
        }),
        expect.objectContaining({ $inc: { quantity: 15 } }),
        expect.anything(),
      );
      // Logged ADJUSTMENT
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: InventoryTransactionType.ADJUSTMENT,
            quantity: 15,
            change: 15,
          }),
        ]),
        expect.anything(),
      );
    });

    it('should throw ConflictException if trying to cancel a COMPLETED transfer', async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        status: StockTransferStatus.COMPLETED,
      };

      mockStockTransferModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTransfer),
      });

      await expect(
        service.cancelTransfer(mockTransfer._id, mockUserId),
      ).rejects.toThrow(ConflictException);
    });
  });
});
