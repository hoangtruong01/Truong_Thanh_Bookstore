/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { PosService } from './pos.service';
import { POSItemCondition, POSOrderStatus } from './schemas/pos-order.schema';
import { ProductStatus, StaffPermission, UserRole } from '../../common/enums';

/**
 * Regression tests cho cụm C9 (POS integrity):
 * SEC-007 (giá client), SEC-006 (managerPassword oracle), SEC-023 (refund dòng trùng),
 * SEC-024 (lộ costPrice cho thu ngân).
 */
describe('PosService - security regression (SEC-006/007/023/024)', () => {
  const productId = new Types.ObjectId('507f1f77bcf86cd799439022');
  const productId2 = new Types.ObjectId('507f1f77bcf86cd799439033');
  const adminId = '507f1f77bcf86cd799439099';

  const product = {
    _id: productId,
    name: 'Bút bi',
    sku: 'SP1',
    price: 5000,
    discountPrice: 0,
    wholesalePrice: 0,
    wholesaleMinQuantity: 0,
    stock: 100,
    unit: 'cây',
    status: ProductStatus.ACTIVE,
    isDeleted: false,
    unitConversions: [],
  };

  const cashier = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Thu ngân',
    role: UserRole.STAFF,
    permissions: [StaffPermission.POS_ACCESS, StaffPermission.POS_REFUND],
  };
  const admin = {
    _id: adminId,
    fullName: 'Quản lý',
    role: UserRole.ADMIN,
    permissions: [],
  };

  let posOrderModel: any;
  let productsService: any;
  let usersService: any;
  let pricingService: any;
  let approverRecord: any;
  let service: PosService;

  const buildService = (withPricing = true) => {
    posOrderModel = {
      create: jest
        .fn()
        .mockImplementation((docs: any[]) =>
          Promise.resolve(
            docs.map((d) => ({ ...d, _id: new Types.ObjectId() })),
          ),
        ),
      findOne: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }),
      findById: jest.fn(),
      db: {
        collection: jest.fn().mockReturnValue({
          findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
        }),
      },
    };
    const productModel = {
      findById: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ ...product }),
      })),
    };
    const inventoryModel = {
      findOne: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue({ currentStock: 100, costPrice: 3000 }),
      }),
    };
    const transactionModel = { create: jest.fn().mockResolvedValue([]) };
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    const connection = { startSession: jest.fn().mockResolvedValue(session) };
    productsService = {
      deductStock: jest.fn().mockResolvedValue(undefined),
      incrementSold: jest.fn().mockResolvedValue(undefined),
      updateStock: jest.fn().mockResolvedValue(undefined),
    };
    approverRecord = {
      _id: new Types.ObjectId(adminId),
      fullName: admin.fullName,
      role: UserRole.ADMIN,
      status: true,
      permissions: [],
      password: bcrypt.hashSync('Manager@123', 4),
    };
    usersService = {
      findByIdWithPassword: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(id === adminId ? approverRecord : null),
        ),
    };
    // Giả lập PricingService: yêu cầu duyệt nếu giá được dùng để tính < 6000
    pricingService = {
      calculateItemPrice: jest.fn().mockImplementation((p: any) =>
        Promise.resolve({
          requiresApproval: p.requestedUnitPrice < 6000,
          reason: 'Dưới sàn biên lợi nhuận',
          grossMarginPercent: 40,
          markupPercent: 66,
          baseSellingPrice: 5000,
        }),
      ),
    };

    service = new PosService(
      posOrderModel,
      productModel as any,
      inventoryModel as any,
      transactionModel as any,
      connection as any,
      productsService,
      {} as any,
      usersService,
      withPricing ? pricingService : undefined,
    );
  };

  beforeEach(() => buildService());

  describe('SEC-007 - giá client không được dùng để né sàn biên lợi nhuận', () => {
    it('từ chối unitPrice client cao hơn giá niêm yết trong CSDL', async () => {
      await expect(
        service.createPOSOrder(
          {
            items: [
              {
                productId: productId.toString(),
                quantity: 1,
                unitPrice: 999999,
              },
            ],
          } as any,
          cashier,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(pricingService.calculateItemPrice).not.toHaveBeenCalled();
    });

    it('kiểm tra sàn biên trên giá CSDL, bỏ qua unitPrice thấp hơn của client', async () => {
      // Giá CSDL 5000 -> mock pricing yêu cầu duyệt; thu ngân không có quyền => Forbidden
      await expect(
        service.createPOSOrder(
          {
            items: [
              { productId: productId.toString(), quantity: 1, unitPrice: 4999 },
            ],
          } as any,
          cashier,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(pricingService.calculateItemPrice).toHaveBeenCalledWith(
        expect.objectContaining({ requestedUnitPrice: 5000 }),
      );
    });

    it('không bao giờ chuyển giá client sang PricingService', async () => {
      await expect(
        service.createPOSOrder(
          {
            items: [
              { productId: productId.toString(), quantity: 1, unitPrice: 5000 },
            ],
          } as any,
          admin,
        ),
      ).resolves.toBeDefined();
      const arg = pricingService.calculateItemPrice.mock.calls[0][0];
      expect(arg.requestedUnitPrice).toBe(5000);
    });
  });

  describe('SEC-006 - managerPassword không phải password oracle', () => {
    const orderNeedingApproval = (extra: Record<string, any> = {}) =>
      ({
        items: [{ productId: productId.toString(), quantity: 10 }],
        discountAmount: 15000, // 30% > 20%
        approvedById: adminId,
        ...extra,
      }) as any;

    // Pricing không yêu cầu duyệt, chỉ kích hoạt qua mức giảm > 20%
    beforeEach(() => buildService(false));

    it('không chấp nhận mật khẩu plaintext trùng với trường password trong CSDL', async () => {
      approverRecord.password = 'PlainText@123'; // không phải bcrypt hash
      await expect(
        service.createPOSOrder(
          orderNeedingApproval({ managerPassword: 'PlainText@123' }),
          cashier,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('chấp nhận mật khẩu đúng (bcrypt) và trả lỗi chung khi sai', async () => {
      await expect(
        service.createPOSOrder(
          orderNeedingApproval({ managerPassword: 'Manager@123' }),
          cashier,
        ),
      ).resolves.toBeDefined();

      const wrong = await service
        .createPOSOrder(
          orderNeedingApproval({ managerPassword: 'sai-mat-khau' }),
          cashier,
        )
        .catch((e) => e);
      const unknownApprover = await service
        .createPOSOrder(
          orderNeedingApproval({
            approvedById: '507f1f77bcf86cd7994390aa',
            managerPassword: 'x',
          }),
          cashier,
        )
        .catch((e) => e);

      expect(wrong).toBeInstanceOf(ForbiddenException);
      expect(unknownApprover).toBeInstanceOf(ForbiddenException);
      // Cùng thông điệp => không lộ tài khoản nào tồn tại / sai mật khẩu hay sai quyền
      expect(wrong.message).toBe(unknownApprover.message);
      expect(wrong.message).not.toMatch(/mật khẩu/i);
    });

    it('khóa tạm thời thu ngân sau nhiều lần nhập sai, kể cả khi sau đó nhập đúng', async () => {
      for (let i = 0; i < 5; i++) {
        await expect(
          service.createPOSOrder(
            orderNeedingApproval({ managerPassword: `sai-${i}` }),
            cashier,
          ),
        ).rejects.toThrow(ForbiddenException);
      }
      await expect(
        service.createPOSOrder(
          orderNeedingApproval({ managerPassword: 'Manager@123' }),
          cashier,
        ),
      ).rejects.toThrow(/khóa/i);
    });
  });

  describe('SEC-023 - hoàn trả dòng trùng sản phẩm không vượt số đã bán', () => {
    const buildOrder = () => ({
      _id: new Types.ObjectId(),
      invoiceCode: 'HD261030-0001',
      status: POSOrderStatus.COMPLETED,
      finalAmount: 18000,
      totalRefundedAmount: 0,
      items: [
        {
          product: productId,
          sku: 'SP1',
          name: 'Bút bi',
          unit: 'cây',
          conversionRatio: 1,
          quantity: 3,
          lineTotal: 9000,
          effectiveLineTotal: 9000,
          netUnitPrice: 3000,
          returnedQuantity: 0,
        },
        {
          product: productId2,
          sku: 'SP2',
          name: 'Vở',
          unit: 'cuốn',
          conversionRatio: 1,
          quantity: 1,
          lineTotal: 9000,
          effectiveLineTotal: 9000,
          netUnitPrice: 9000,
          returnedQuantity: 0,
        },
      ],
      refundHistory: [] as any[],
      paymentMovements: [],
      save: jest.fn().mockResolvedValue(true),
    });

    const mockOrder = (order: any) =>
      posOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

    it('từ chối khi tổng số lượng các dòng trùng vượt số lượng còn có thể trả', async () => {
      const order = buildOrder();
      mockOrder(order);
      await expect(
        service.refundPOSOrder(
          order._id.toString(),
          {
            items: [
              {
                productId: productId.toString(),
                quantity: 2,
                condition: POSItemCondition.GOOD,
              },
              {
                productId: productId.toString(),
                quantity: 2,
                condition: POSItemCondition.GOOD,
              },
            ],
            reason: 'Trả trùng dòng',
          } as any,
          cashier,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(productsService.updateStock).not.toHaveBeenCalled();
      expect(order.items[0].returnedQuantity).toBe(0);
    });

    it('không hoàn quá giá trị của dòng hàng khi tách thành nhiều dòng trong cùng yêu cầu', async () => {
      const order = buildOrder();
      mockOrder(order);
      const res = await service.refundPOSOrder(
        order._id.toString(),
        {
          items: [
            {
              productId: productId.toString(),
              quantity: 1,
              condition: POSItemCondition.GOOD,
            },
            {
              productId: productId.toString(),
              quantity: 2,
              condition: POSItemCondition.GOOD,
            },
          ],
          reason: 'Trả hết bút chia 2 dòng',
        },
        cashier,
      );
      // Bút: 3 cây * 3000 = 9000 (không được 3000 + 9000 = 12000)
      expect(res.refundHistory[0].totalRefundAmount).toBe(9000);
      expect(res.totalRefundedAmount).toBe(9000);
    });
  });

  describe('SEC-024 - không trả giá vốn/biên lợi nhuận cho thu ngân', () => {
    it('create: thu ngân không thấy costPrice/grossMargin/markup, ADMIN vẫn thấy', async () => {
      const dto = () =>
        ({ items: [{ productId: productId.toString(), quantity: 1 }] }) as any;

      buildService(false);
      const forCashier = await service.createPOSOrder(dto(), cashier);
      expect(forCashier.items[0].costPrice).toBeUndefined();
      expect(forCashier.items[0].grossMarginPercent).toBeUndefined();
      expect(forCashier.items[0].markupPercent).toBeUndefined();
      expect(forCashier.items[0].unitPrice).toBe(5000);

      buildService(false);
      const forAdmin = await service.createPOSOrder(dto(), admin);
      expect(forAdmin.items[0].costPrice).toBe(3000);
    });

    it('refund: thu ngân không thấy costPrice trong phản hồi', async () => {
      const order: any = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0002',
        status: POSOrderStatus.COMPLETED,
        finalAmount: 5000,
        totalRefundedAmount: 0,
        items: [
          {
            product: productId,
            sku: 'SP1',
            name: 'Bút bi',
            unit: 'cây',
            conversionRatio: 1,
            quantity: 1,
            lineTotal: 5000,
            effectiveLineTotal: 5000,
            netUnitPrice: 5000,
            costPrice: 3000,
            grossMarginPercent: 40,
            returnedQuantity: 0,
          },
        ],
        refundHistory: [],
        paymentMovements: [],
        save: jest.fn().mockResolvedValue(true),
      };
      posOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });
      const res = await service.refundPOSOrder(
        order._id.toString(),
        {
          items: [
            {
              productId: productId.toString(),
              quantity: 1,
              condition: POSItemCondition.GOOD,
            },
          ],
          reason: 'Khách đổi ý',
        },
        cashier,
      );
      expect(res.items[0].costPrice).toBeUndefined();
      expect(res.items[0].grossMarginPercent).toBeUndefined();
    });
  });
});
