/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PurchaseReturnsService } from './purchase-returns.service';
import {
  PurchaseReturn,
  PurchaseReturnStatus,
  CreditAdjustmentStatus,
} from './schemas/purchase-return.schema';
import { GoodsReceipt, ItemCondition } from './schemas/goods-receipt.schema';
import { InventoryService } from '../inventory/inventory.service';
import { FinanceService } from '../finance/finance.service';

describe('PurchaseReturnsService', () => {
  let service: PurchaseReturnsService;
  let mockReturnModel: any;
  let mockReceiptModel: any;
  let mockInventoryService: any;
  let mockFinanceService: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockReturnModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockReturnModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    mockReturnModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockReturnModel.findOneAndUpdate = jest.fn();
    mockReturnModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    mockReturnModel.db = {
      collection: jest.fn().mockReturnValue({
        findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
      }),
    };

    mockReceiptModel = {
      findOne: jest.fn(),
    };

    mockInventoryService = {
      adjustStock: jest.fn().mockResolvedValue({}),
    };

    mockFinanceService = {
      applyPurchaseReturnCredit: jest.fn().mockResolvedValue({
        payable: {},
        adjustedDebtAmount: 800000,
        refundDueAmount: 0,
      }),
    };

    mockConnection = {
      startSession: jest
        .fn()
        .mockRejectedValue(new Error('No replica set in mock')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseReturnsService,
        {
          provide: getModelToken(PurchaseReturn.name),
          useValue: mockReturnModel,
        },
        {
          provide: getModelToken(GoodsReceipt.name),
          useValue: mockReceiptModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: FinanceService,
          useValue: mockFinanceService,
        },
      ],
    }).compile();

    service = module.get<PurchaseReturnsService>(PurchaseReturnsService);
  });

  describe('PUR-04: Purchase Returns to Supplier', () => {
    const grId = new Types.ObjectId().toString();
    const prodId = new Types.ObjectId().toString();
    const supplierId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    const mockGR: any = {
      _id: new Types.ObjectId(grId),
      receiptCode: 'GR261030-0001',
      supplier: new Types.ObjectId(supplierId),
      items: [
        {
          product: new Types.ObjectId(prodId),
          productName: 'Giấy A4 Double A',
          sku: 'GIAY-A4-001',
          unit: 'ram',
          conversionRatio: 1,
          receivedQuantity: 100,
          baseQuantity: 100,
          acceptedQuantity: 100,
          rejectedQuantity: 0,
          actualUnitPrice: 80000,
          condition: ItemCondition.GOOD,
        },
      ],
    };

    it('PUR04-T01: Tạo phiếu trả hàng thành công -> Giảm tồn kho, lưu chứng từ', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGR),
        }),
      });

      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });
      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.createReturn(
        {
          goodsReceiptId: grId,
          items: [
            {
              productId: prodId,
              unit: 'ram',
              returnedQuantity: 10,
              condition: ItemCondition.DAMAGED,
              reason: 'Bao bì rách, ẩm ướt',
            },
          ],
          note: 'Trả 10 ram bị hỏng',
        },
        userId,
      );

      expect(res.returnCode).toBeDefined();
      expect(res.items.length).toBe(1);
      expect(res.items[0].returnedQuantity).toBe(10);
      expect(res.items[0].baseQuantity).toBe(10);
      expect(res.totalAmount).toBe(800000); // 10 * 80.000
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        expect.objectContaining({
          product: prodId,
          quantity: -10,
        }),
        userId,
      );
    });

    it('PUR04-T02: Trả vượt quá số lượng đã nhận theo GRN -> Báo lỗi', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGR),
        }),
      });

      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            items: [{ product: new Types.ObjectId(prodId), baseQuantity: 95 }],
          },
        ]),
      });

      await expect(
        service.createReturn(
          {
            goodsReceiptId: grId,
            items: [
              {
                productId: prodId,
                unit: 'ram',
                returnedQuantity: 10, // 95 + 10 = 105 > 100
                reason: 'Hàng lỗi',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR04-T03: Trả sản phẩm không thuộc GRN -> Báo lỗi', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGR),
        }),
      });

      const unknownProdId = new Types.ObjectId().toString();

      await expect(
        service.createReturn(
          {
            goodsReceiptId: grId,
            items: [
              {
                productId: unknownProdId,
                unit: 'ram',
                returnedQuantity: 5,
                reason: 'Lỗi',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR04-T04: Idempotency retry -> Không trừ kho lần hai', async () => {
      const existingPR: any = {
        _id: new Types.ObjectId(),
        returnCode: 'PR261030-0001',
        idempotencyKey: 'retry_key_123',
      };

      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingPR),
      });

      const res = await service.createReturn(
        {
          goodsReceiptId: grId,
          idempotencyKey: 'retry_key_123',
          items: [
            {
              productId: prodId,
              unit: 'ram',
              returnedQuantity: 5,
              reason: 'Lỗi',
            },
          ],
        },
        userId,
      );

      expect(res.returnCode).toBe('PR261030-0001');
      expect(mockInventoryService.adjustStock).not.toHaveBeenCalled();
    });

    it('PUR04-T05: Xác nhận bù trừ công nợ sau khi NCC chấp thuận', async () => {
      const prId = new Types.ObjectId().toString();
      const mockPR: any = {
        _id: new Types.ObjectId(prId),
        returnCode: 'PR261030-0001',
        goodsReceipt: new Types.ObjectId(grId),
        totalAmount: 800000,
        creditAdjustmentStatus: CreditAdjustmentStatus.PENDING,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPR),
      });
      mockReturnModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockPR,
          creditAdjustmentStatus: CreditAdjustmentStatus.APPLIED,
        }),
      });

      const res = await service.confirmCreditAdjustment(
        prId,
        { note: 'NCC đã gửi biên bản cấn trừ công nợ' },
        userId,
      );

      expect(res.creditAdjustmentStatus).toBe(CreditAdjustmentStatus.APPLIED);
      expect(mockFinanceService.applyPurchaseReturnCredit).toHaveBeenCalledWith(
        mockPR.goodsReceipt,
        800000,
        'PR261030-0001',
        'NCC đã gửi biên bản cấn trừ công nợ',
      );
    });
  });

  describe('PUR-RET-01: Hoàn thiện trả hàng nhà cung cấp (All Playbook Test Cases)', () => {
    const grId = new Types.ObjectId().toString();
    const prodId = new Types.ObjectId().toString();
    const supplierId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    const mockGRN10: any = {
      _id: new Types.ObjectId(grId),
      receiptCode: 'GR261101-0010',
      supplier: new Types.ObjectId(supplierId),
      items: [
        {
          product: new Types.ObjectId(prodId),
          productName: 'Bút máy Thiên Long',
          sku: 'BUT-MAY-TL',
          unit: 'hộp',
          conversionRatio: 1,
          receivedQuantity: 10,
          baseQuantity: 10,
          acceptedQuantity: 10,
          rejectedQuantity: 0,
          actualUnitPrice: 50000,
          condition: ItemCondition.GOOD,
        },
      ],
    };

    it('PUR-RET-T01: GRN nhận 10 sản phẩm A, chưa trả; trả 3 -> Tồn giảm 3; return ghi 3', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGRN10),
        }),
      });
      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });
      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.createReturn(
        {
          goodsReceiptId: grId,
          items: [
            {
              productId: prodId,
              unit: 'hộp',
              returnedQuantity: 3,
              reason: 'Dư hàng theo thỏa thuận',
            },
          ],
        },
        userId,
      );

      expect(res.items[0].returnedQuantity).toBe(3);
      expect(res.items[0].baseQuantity).toBe(3);
      expect(res.totalAmount).toBe(150000);
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        expect.objectContaining({
          product: prodId,
          quantity: -3,
        }),
        userId,
      );
    });

    it('PUR-RET-T02: Đã trả 4, tiếp tục trả 7 -> Bị từ chối vì vượt số lượng còn được trả (10 - 4 = 6 < 7)', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGRN10),
        }),
      });
      // Đã có phiếu trả 4 cái trước đó
      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            items: [{ product: new Types.ObjectId(prodId), baseQuantity: 4 }],
          },
        ]),
      });

      await expect(
        service.createReturn(
          {
            goodsReceiptId: grId,
            items: [
              {
                productId: prodId,
                unit: 'hộp',
                returnedQuantity: 7,
                reason: 'Trả tiếp',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR-RET-T03: Một request có hai dòng A: 7 và 7, GRN chỉ có 10 -> Bị từ chối (7 + 7 = 14 > 10)', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGRN10),
        }),
      });
      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      await expect(
        service.createReturn(
          {
            goodsReceiptId: grId,
            items: [
              {
                productId: prodId,
                unit: 'hộp',
                returnedQuantity: 7,
                reason: 'Dòng 1',
              },
              {
                productId: prodId,
                unit: 'hộp',
                returnedQuantity: 7,
                reason: 'Dòng 2 cố tình chia nhỏ',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR-RET-T04: Hàng REJECTED chưa vào tồn khả dụng -> Không trừ tồn khả dụng lần nữa', async () => {
      const mockGRNRejected: any = {
        _id: new Types.ObjectId(grId),
        receiptCode: 'GR261101-0011',
        supplier: new Types.ObjectId(supplierId),
        items: [
          {
            product: new Types.ObjectId(prodId),
            productName: 'Bút máy Thiên Long lỗi',
            sku: 'BUT-MAY-TL',
            unit: 'hộp',
            conversionRatio: 1,
            receivedQuantity: 10,
            baseQuantity: 10,
            acceptedQuantity: 0, // Bị từ chối toàn bộ khi nhập hàng, chưa từng vào kho
            rejectedQuantity: 10,
            actualUnitPrice: 50000,
            condition: ItemCondition.DAMAGED,
          },
        ],
      };

      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGRNRejected),
        }),
      });
      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const res = await service.createReturn(
        {
          goodsReceiptId: grId,
          items: [
            {
              productId: prodId,
              unit: 'hộp',
              returnedQuantity: 5,
              condition: ItemCondition.DAMAGED,
              reason: 'Trả hàng lỗi bị từ chối từ GRN',
            },
          ],
        },
        userId,
      );

      expect(res.items[0].returnedQuantity).toBe(5);
      // adjustStock KHÔNG được gọi vì hàng rejected chưa vào tồn khả dụng
      expect(mockInventoryService.adjustStock).not.toHaveBeenCalled();
    });

    it('PUR-RET-T05: Lỗi sau khi tạo return nhưng trước inventory movement -> Rollback toàn bộ', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGRN10),
        }),
      });
      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn().mockResolvedValue(undefined),
      };
      mockConnection.startSession.mockResolvedValueOnce(mockSession);

      // Giả lập lỗi khi gọi inventory adjustStock
      mockInventoryService.adjustStock.mockRejectedValueOnce(
        new Error('Inventory adjustment error'),
      );

      await expect(
        service.createReturn(
          {
            goodsReceiptId: grId,
            items: [
              {
                productId: prodId,
                unit: 'hộp',
                returnedQuantity: 2,
                reason: 'Lỗi',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow('Inventory adjustment error');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('PUR-RET-T06: Lỗi khi apply credit adjustment -> Rollback toàn bộ', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGRN10),
        }),
      });
      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn().mockResolvedValue(undefined),
      };
      mockConnection.startSession.mockResolvedValueOnce(mockSession);

      // Giả lập lỗi khi apply credit
      mockFinanceService.applyPurchaseReturnCredit.mockRejectedValueOnce(
        new Error('Finance AP credit error'),
      );

      await expect(
        service.createReturn(
          {
            goodsReceiptId: grId,
            applyCreditAdjustmentImmediately: true,
            items: [
              {
                productId: prodId,
                unit: 'hộp',
                returnedQuantity: 2,
                reason: 'Lỗi',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow('Finance AP credit error');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('PUR-RET-T07: Retry cùng key -> Không tạo return/movement/credit lần hai', async () => {
      const existingPR: any = {
        _id: new Types.ObjectId(),
        returnCode: 'PR261101-0099',
        idempotencyKey: 'idem_key_ret_007',
      };

      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingPR),
      });

      const res = await service.createReturn(
        {
          goodsReceiptId: grId,
          idempotencyKey: 'idem_key_ret_007',
          items: [
            {
              productId: prodId,
              unit: 'hộp',
              returnedQuantity: 2,
              reason: 'Lỗi',
            },
          ],
        },
        userId,
      );

      expect(res.returnCode).toBe('PR261101-0099');
      expect(mockInventoryService.adjustStock).not.toHaveBeenCalled();
      expect(
        mockFinanceService.applyPurchaseReturnCredit,
      ).not.toHaveBeenCalled();
    });

    it('PUR-RET-T08: Hai request apply credit đồng thời -> Chỉ 1 lần bù trừ thành công, request sau bị từ chối', async () => {
      const prId = new Types.ObjectId().toString();
      const mockPR: any = {
        _id: new Types.ObjectId(prId),
        returnCode: 'PR261101-0010',
        goodsReceipt: new Types.ObjectId(grId),
        totalAmount: 1000000,
        creditAdjustmentStatus: CreditAdjustmentStatus.PENDING,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      let executionCount = 0;
      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPR),
      });
      mockReturnModel.findOneAndUpdate.mockImplementation((filter: any) => {
        if (filter.creditAdjustmentStatus === CreditAdjustmentStatus.PENDING) {
          executionCount++;
          if (executionCount === 1) {
            return {
              exec: jest.fn().mockResolvedValue({
                ...mockPR,
                creditAdjustmentStatus: CreditAdjustmentStatus.APPLIED,
              }),
            };
          }
          return { exec: jest.fn().mockResolvedValue(null) };
        }
        return { exec: jest.fn().mockResolvedValue(mockPR) };
      });

      const p1 = service.confirmCreditAdjustment(prId, {}, userId);
      const p2 = service.confirmCreditAdjustment(prId, {}, userId);

      const [res1, res2] = await Promise.allSettled([p1, p2]);

      expect(res1.status).toBe('fulfilled');
      expect(res2.status).toBe('rejected');
    });

    it('PUR-RET-T09: Return amount 5 triệu, payable còn 3 triệu -> AP giảm 3 triệu; 2 triệu thành khoản NCC phải hoàn/credit', async () => {
      const prId = new Types.ObjectId().toString();
      const mockPR: any = {
        _id: new Types.ObjectId(prId),
        returnCode: 'PR261101-0050',
        goodsReceipt: new Types.ObjectId(grId),
        totalAmount: 5000000,
        creditAdjustmentStatus: CreditAdjustmentStatus.PENDING,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPR),
      });
      mockReturnModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockPR,
          creditAdjustmentStatus: CreditAdjustmentStatus.APPLIED,
        }),
      });

      mockFinanceService.applyPurchaseReturnCredit.mockResolvedValueOnce({
        payable: { remainingAmount: 0 },
        adjustedDebtAmount: 3000000,
        refundDueAmount: 2000000,
      });

      const res = await service.confirmCreditAdjustment(
        prId,
        { adjustmentAmount: 5000000 },
        userId,
      );

      expect(res.adjustedDebtAmount).toBe(3000000);
      expect(res.refundDueAmount).toBe(2000000);
    });

    it('PUR-RET-T10: Client sửa unitCost thành 1đ -> Backend dùng snapshot cost đáng tin cậy (50.000đ)', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGRN10),
        }),
      });
      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const res = await service.createReturn(
        {
          goodsReceiptId: grId,
          items: [
            {
              productId: prodId,
              unit: 'hộp',
              returnedQuantity: 2,
              unitCost: 1, // Client cố tình gian lận giá vốn 1đ
              reason: 'Trả hàng',
            },
          ],
        },
        userId,
      );

      // Backend dùng snapshot cost từ GRN (50.000đ) -> 2 * 50.000 = 100.000đ
      expect(res.items[0].unitCost).toBe(50000);
      expect(res.totalAmount).toBe(100000);
    });

    it('PUR-RET-T11: User chỉ có MANAGE_INVENTORY nhưng không có quyền tài chính -> PermissionsGuard từ chối (403 Forbidden)', async () => {
      const { Reflector } = await import('@nestjs/core');
      const { PermissionsGuard } =
        await import('../../common/guards/permissions.guard');
      const { PurchaseReturnsController } =
        await import('./purchase-returns.controller');
      const { StaffPermission, UserRole } = await import('../../common/enums');
      const { ForbiddenException } = await import('@nestjs/common');

      const reflector = new Reflector();
      const guard = new PermissionsGuard(reflector);

      const requiredPermissions = reflector.get<string[]>(
        'permissions',
        PurchaseReturnsController.prototype.confirmCreditAdjustment,
      );
      expect(requiredPermissions).toContain(StaffPermission.MANAGE_FINANCE);

      const mockContextStaffWithoutPerm: any = {
        getHandler: () =>
          PurchaseReturnsController.prototype.confirmCreditAdjustment,
        getClass: () => PurchaseReturnsController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: UserRole.STAFF,
              permissions: [StaffPermission.MANAGE_INVENTORY], // Không có MANAGE_FINANCE
              status: true,
            },
          }),
        }),
      };

      expect(() => guard.canActivate(mockContextStaffWithoutPerm)).toThrow(
        ForbiddenException,
      );

      const mockContextStaffWithPerm: any = {
        getHandler: () =>
          PurchaseReturnsController.prototype.confirmCreditAdjustment,
        getClass: () => PurchaseReturnsController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: UserRole.STAFF,
              permissions: [StaffPermission.MANAGE_FINANCE],
              status: true,
            },
          }),
        }),
      };

      expect(guard.canActivate(mockContextStaffWithPerm)).toBe(true);
    });

    it('PUR-RET-T12: Trả hàng thuộc GRN không tồn tại -> Bị từ chối (NotFoundException 404)', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null), // Không tìm thấy GRN
        }),
      });

      await expect(
        service.createReturn(
          {
            goodsReceiptId: new Types.ObjectId().toString(),
            items: [
              {
                productId: prodId,
                unit: 'hộp',
                returnedQuantity: 1,
                reason: 'Lỗi',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
