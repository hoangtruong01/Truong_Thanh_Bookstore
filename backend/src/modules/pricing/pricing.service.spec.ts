import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PricingService } from './pricing.service';
import {
  PricePolicy,
  PricePolicyScope,
  PricePolicyStatus,
} from './schemas/price-policy.schema';
import { Product } from '../products/schemas/product.schema';
import { Inventory } from '../inventory/schemas/inventory.schema';
import { StaffPermission, UserRole, ProductStatus } from '../../common/enums';

describe('PricingService', () => {
  let service: PricingService;
  let mockPolicyModel: any;
  let mockProductModel: any;
  let mockInventoryModel: any;

  beforeEach(async () => {
    mockPolicyModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));

    mockPolicyModel.find = jest.fn();
    mockPolicyModel.findOne = jest.fn();
    mockPolicyModel.findOneAndUpdate = jest.fn();
    mockPolicyModel.countDocuments = jest.fn();

    mockProductModel = {
      findById: jest.fn(),
    };

    mockInventoryModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getModelToken(PricePolicy.name),
          useValue: mockPolicyModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Inventory.name),
          useValue: mockInventoryModel,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  describe('PRC-01: calculatePrice', () => {
    it('PRC01-T01: Giá vốn 80.000, Markup 20% -> Giá bán 96.000, Gross Margin ~16.67%', () => {
      const res = service.calculatePrice({
        costPrice: 80000,
        markupPercent: 20,
      });

      expect(res.valid).toBe(true);
      expect(res.proposedPrice).toBe(96000);
      expect(res.markupPercent).toBe(20);
      expect(res.marginPercent).toBeCloseTo(16.67, 1);
    });

    it('PRC01-T02: Giá vốn 80.000, Margin 20% -> Giá bán 100.000, Markup 25%', () => {
      const res = service.calculatePrice({
        costPrice: 80000,
        targetMarginPercent: 20,
      });

      expect(res.valid).toBe(true);
      expect(res.proposedPrice).toBe(100000);
      expect(res.marginPercent).toBe(20);
      expect(res.markupPercent).toBe(25);
    });

    it('PRC01-T03: Giá vốn 0 hoặc âm -> Báo lỗi thiếu giá vốn, không tính lãi ảo', () => {
      const resZero = service.calculatePrice({
        costPrice: 0,
        targetMarginPercent: 20,
      });
      expect(resZero.valid).toBe(false);
      expect(resZero.message).toContain('Thiếu giá vốn');

      const resNegative = service.calculatePrice({
        costPrice: -10000,
        targetMarginPercent: 20,
      });
      expect(resNegative.valid).toBe(false);
    });

    it('PRC01-T04: Target margin >= 100% -> Throw BadRequestException', () => {
      expect(() =>
        service.calculatePrice({
          costPrice: 80000,
          targetMarginPercent: 100,
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.calculatePrice({
          costPrice: 80000,
          targetMarginPercent: 120,
        }),
      ).toThrow(BadRequestException);
    });

    it('Markup hoặc Margin âm -> Throw BadRequestException', () => {
      expect(() =>
        service.calculatePrice({
          costPrice: 80000,
          markupPercent: -5,
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.calculatePrice({
          costPrice: 80000,
          targetMarginPercent: -10,
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('PRC-02 & PRC-03: checkMargin', () => {
    it('Phê duyệt khi Margin thực tế thấp hơn sàn (Floor)', async () => {
      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              name: 'Sàn 15%',
              minMarginFloor: 15,
              maxDiscountPercent: 20,
            },
          ]),
        }),
      });

      // Bán 100k, giá vốn 90k -> margin 10% < sàn 15%
      const res = await service.checkMargin({
        costPrice: 90000,
        sellingPrice: 100000,
        discountPercent: 0,
      });

      expect(res.requiresApproval).toBe(true);
      expect(res.effectiveMarginPercent).toBe(10);
      expect(res.reason).toContain('thấp hơn mức sàn');
    });

    it('Phê duyệt khi chiết khấu vượt hạn mức tối đa', async () => {
      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              name: 'Chiết khấu tối đa 15%',
              minMarginFloor: 5,
              maxDiscountPercent: 15,
            },
          ]),
        }),
      });

      // Bán 100k, giá vốn 50k, chiết khấu 25% > max 15%
      const res = await service.checkMargin({
        costPrice: 50000,
        sellingPrice: 100000,
        discountPercent: 25,
      });

      expect(res.requiresApproval).toBe(true);
      expect(res.reason).toContain('vượt quá hạn mức');
    });

    it('Không cần phê duyệt khi thỏa mãn cả sàn lãi và hạn mức chiết khấu', async () => {
      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              name: 'Chính sách chuẩn',
              minMarginFloor: 10,
              maxDiscountPercent: 20,
            },
          ]),
        }),
      });

      // Bán 100k, chiết khấu 10% -> 90k, vốn 60k -> margin = (90-60)/90 = 33.33% > 10%
      const res = await service.checkMargin({
        costPrice: 60000,
        sellingPrice: 100000,
        discountPercent: 10,
      });

      expect(res.requiresApproval).toBe(false);
      expect(res.effectiveMarginPercent).toBeCloseTo(33.33, 1);
    });
  });

  describe('Policy Management CRUD', () => {
    it('Tự động gán độ ưu tiên (priority) theo scope khi tạo', async () => {
      const userId = new Types.ObjectId().toString();

      const globalRes = await service.create(
        {
          name: 'Chính sách Global',
          scope: PricePolicyScope.GLOBAL,
          targetMarginPercent: 20,
        },
        userId,
      );
      expect(globalRes.priority).toBe(10);

      const productRes = await service.create(
        {
          name: 'Chính sách Product',
          scope: PricePolicyScope.PRODUCT,
          targetMarginPercent: 25,
        },
        userId,
      );
      expect(productRes.priority).toBe(50);
    });

    it('Lấy danh sách phân trang findAll', async () => {
      const mockItems = [
        { name: 'Policy 1', scope: PricePolicyScope.GLOBAL },
        { name: 'Policy 2', scope: PricePolicyScope.PRODUCT },
      ];

      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  populate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockItems),
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      mockPolicyModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

      const res = await service.findAll({ page: 1, limit: 10 });
      expect(res.data.length).toBe(2);
      expect(res.total).toBe(2);
    });

    it('Xóa mềm remove', async () => {
      const id = new Types.ObjectId().toString();
      mockPolicyModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: id, isDeleted: true }),
      });

      const res = await service.remove(id);
      expect(res.success).toBe(true);
    });
  });

  describe('PLAYBOOK PRC-01: Suite 14 Test Cases Bắt Buộc (PRC-T01 -> PRC-T14)', () => {
    const sampleProductId = new Types.ObjectId().toString();
    const sampleProduct = {
      _id: new Types.ObjectId(sampleProductId),
      name: 'Sách Đắc Nhân Tâm',
      sku: 'BOOK-DNT-01',
      price: 100000,
      discountPrice: 0,
      unit: 'cuốn',
      status: ProductStatus.ACTIVE,
      isDeleted: false,
      wholesalePrice: 85000,
      wholesaleMinQuantity: 10,
    };

    beforeEach(() => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...sampleProduct }),
      });
      mockInventoryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          product: sampleProduct._id,
          costPrice: 80000,
          currentStock: 100,
        }),
      });
      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              name: 'Chính sách chuẩn',
              scope: PricePolicyScope.GLOBAL,
              minMarginFloor: 15,
              maxDiscountPercent: 20,
              targetMarginPercent: 20,
            },
          ]),
        }),
      });
    });

    it('PRC-T01: Cost 90.000đ, sell 100.000đ, margin floor 15% -> Yêu cầu approval', async () => {
      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              name: 'Sàn 15%',
              minMarginFloor: 15,
              maxDiscountPercent: 20,
            },
          ]),
        }),
      });

      const res = await service.checkMargin({
        costPrice: 90000,
        sellingPrice: 100000,
        discountPercent: 0,
      });

      expect(res.requiresApproval).toBe(true);
      expect(res.effectiveMarginPercent).toBe(10);
      expect(res.reason).toContain('thấp hơn mức sàn');
    });

    it('PRC-T02: Cost 80.000đ, sell 100.000đ, margin floor 15% -> Được bán nếu các policy khác hợp lệ', async () => {
      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              name: 'Sàn 15%',
              minMarginFloor: 15,
              maxDiscountPercent: 20,
            },
          ]),
        }),
      });

      const res = await service.checkMargin({
        costPrice: 80000,
        sellingPrice: 100000,
        discountPercent: 0,
      });

      expect(res.requiresApproval).toBe(false);
      expect(res.effectiveMarginPercent).toBe(20);
    });

    it('PRC-T03: CostPrice null/0 -> Không tự động thông qua (Fail-closed)', async () => {
      const resZero = await service.checkMargin({
        costPrice: 0,
        sellingPrice: 100000,
      });
      expect(resZero.requiresApproval).toBe(true);
      expect(resZero.reason).toContain('chưa có giá vốn hợp lệ');

      const resNegative = await service.checkMargin({
        costPrice: -5000,
        sellingPrice: 100000,
      });
      expect(resNegative.requiresApproval).toBe(true);
      expect(resNegative.reason).toContain('chưa có giá vốn hợp lệ');
    });

    it('PRC-T04: Client gửi costPrice = 1đ -> Backend bỏ qua, lấy cost từ DB', async () => {
      mockInventoryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          costPrice: 65000,
        }),
      });

      const res = await service.calculateItemPrice({
        productId: sampleProductId,
        quantity: 2,
        clientCostPrice: 1, // Client gian lận gửi giá vốn 1đ
      });

      expect(res.costPrice).toBe(65000);
      expect(res.costPrice).not.toBe(1);
    });

    it('PRC-T05: Client gửi giá bán thấp hơn policy -> Backend tính lại hoặc yêu cầu duyệt', async () => {
      mockInventoryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          costPrice: 80000,
        }),
      });
      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              name: 'Chính sách sàn 15%',
              minMarginFloor: 15,
              maxDiscountPercent: 20,
            },
          ]),
        }),
      });

      // Bán 85.000 với giá vốn 80.000 -> Margin = (85000 - 80000) / 85000 = 5.88% < 15%
      const res = await service.calculateItemPrice({
        productId: sampleProductId,
        quantity: 1,
        requestedUnitPrice: 85000,
      });

      expect(res.requiresApproval).toBe(true);
      expect(res.grossMarginPercent).toBeCloseTo(5.88, 1);
      expect(res.reason).toContain('thấp hơn mức sàn');
    });

    it('PRC-T06: Product policy và Global policy cùng áp dụng -> Chọn đúng policy theo precedence', async () => {
      const productPolicy = {
        _id: new Types.ObjectId(),
        name: 'Chính sách riêng sản phẩm',
        scope: PricePolicyScope.PRODUCT,
        priority: 50,
      };
      const globalPolicy = {
        _id: new Types.ObjectId(),
        name: 'Chính sách toàn hệ thống',
        scope: PricePolicyScope.GLOBAL,
        priority: 10,
      };

      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([productPolicy, globalPolicy]),
        }),
      });

      const selected = await service.findApplicablePolicy(sampleProductId);
      expect(selected?.name).toBe('Chính sách riêng sản phẩm');
      expect(selected?.priority).toBe(50);
    });

    it('PRC-T07: Policy hết hạn -> Không áp dụng', async () => {
      // Mock truy vấn find: chỉ trả về policy còn hạn
      mockPolicyModel.find.mockImplementation((filter: any) => {
        expect(filter.effectiveFrom).toBeDefined();
        expect(filter.$or).toBeDefined();
        return {
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        };
      });

      const selected = await service.findApplicablePolicy(sampleProductId);
      expect(selected).toBeNull();
    });

    it('PRC-T08: Policy chưa tới effective date -> Không áp dụng', async () => {
      mockPolicyModel.find.mockImplementation((filter: any) => {
        expect(filter.effectiveFrom).toHaveProperty('$lte');
        return {
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        };
      });

      const selected = await service.findApplicablePolicy(sampleProductId);
      expect(selected).toBeNull();
    });

    it('PRC-T09: Khách sỉ có tier riêng -> Đúng giá theo tier', async () => {
      const wholesaleTierPolicy = {
        _id: new Types.ObjectId(),
        name: 'Chính sách Khách Sỉ VIP',
        scope: PricePolicyScope.TIER,
        customerTier: 'WHOLESALE_1',
        discountPercent: 12,
        minMarginFloor: 10,
        maxDiscountPercent: 20,
      };

      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([wholesaleTierPolicy]),
        }),
      });

      const res = await service.calculateItemPrice({
        productId: sampleProductId,
        quantity: 5,
        customerTier: 'WHOLESALE_1',
      });

      // Giá gốc 100k, giảm 12% -> 88.000đ
      expect(res.unitPrice).toBe(88000);
      expect(res.appliedPolicyName).toBe('Chính sách Khách Sỉ VIP');
    });

    it('PRC-T10: Cùng sản phẩm/khách/channel ở POS và WEB -> Kết quả tính giá nhất quán', async () => {
      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              name: 'Giá niêm yết chuẩn',
              minMarginFloor: 10,
              maxDiscountPercent: 20,
            },
          ]),
        }),
      });

      const posResult = await service.calculateItemPrice({
        productId: sampleProductId,
        quantity: 2,
        channel: 'POS',
      });

      const webResult = await service.calculateItemPrice({
        productId: sampleProductId,
        quantity: 2,
        channel: 'WEB',
      });

      expect(posResult.unitPrice).toBe(webResult.unitPrice);
      expect(posResult.lineTotal).toBe(webResult.lineTotal);
      expect(posResult.costPrice).toBe(webResult.costPrice);
      expect(posResult.grossMarginPercent).toBe(webResult.grossMarginPercent);
    });

    it('PRC-T11: Approval token dùng cho order khác -> Từ chối', () => {
      const approverId = new Types.ObjectId().toString();
      const approverUser = {
        _id: new Types.ObjectId(approverId),
        role: UserRole.ADMIN,
        permissions: [StaffPermission.MANAGE_PRICING],
        status: true,
      };

      const tokenOrderA = service.generateApprovalToken({
        approverId,
        orderFingerprint: 'order_payload_hash_AAA',
      });

      // Dùng token của đơn A để áp vào đơn B -> Bị từ chối
      expect(() =>
        service.verifyApproval({
          approver: approverUser,
          orderFingerprint: 'order_payload_hash_BBB',
          approvalToken: tokenOrderA,
        }),
      ).toThrow(ForbiddenException);

      // Dùng đúng đơn A -> Hợp lệ
      const isValid = service.verifyApproval({
        approver: approverUser,
        orderFingerprint: 'order_payload_hash_AAA',
        approvalToken: tokenOrderA,
      });
      expect(isValid).toBe(true);
    });

    it('PRC-T12: User không có quyền duyệt margin -> Không thể approve', () => {
      const approverId = new Types.ObjectId().toString();
      const unauthorizedStaff = {
        _id: new Types.ObjectId(approverId),
        role: UserRole.STAFF,
        permissions: [StaffPermission.POS_ACCESS], // Không có MANAGE_PRICING hay POS_OVERRIDE_DISCOUNT
        status: true,
      };

      const token = service.generateApprovalToken({
        approverId,
        orderFingerprint: 'hash_test',
      });

      expect(() =>
        service.verifyApproval({
          approver: unauthorizedStaff,
          orderFingerprint: 'hash_test',
          approvalToken: token,
        }),
      ).toThrow(ForbiddenException);
    });

    it('PRC-T13: Quantity tăng làm thay đổi bậc giá -> Giá được tính đúng theo quantity', async () => {
      const tieredPolicy = {
        _id: new Types.ObjectId(),
        name: 'Chính sách mua số lượng lớn',
        scope: PricePolicyScope.PRODUCT,
        quantityTiers: [
          { minQuantity: 50, fixedPrice: 75000 },
          { minQuantity: 10, fixedPrice: 85000 },
        ],
        minMarginFloor: 5,
        maxDiscountPercent: 25,
      };

      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([tieredPolicy]),
        }),
      });

      // Mua 5 cuốn (<10) -> giá gốc 100k
      const res5 = await service.calculateItemPrice({
        productId: sampleProductId,
        quantity: 5,
      });
      expect(res5.unitPrice).toBe(100000);

      // Mua 15 cuốn (>=10, <50) -> bậc 1: 85k
      const res15 = await service.calculateItemPrice({
        productId: sampleProductId,
        quantity: 15,
      });
      expect(res15.unitPrice).toBe(85000);

      // Mua 60 cuốn (>=50) -> bậc 2: 75k
      const res60 = await service.calculateItemPrice({
        productId: sampleProductId,
        quantity: 60,
      });
      expect(res60.unitPrice).toBe(75000);
    });

    it('PRC-T14: Voucher + wholesale discount cùng lúc -> Áp dụng rule stacking rõ ràng, không double discount', () => {
      // Đơn hàng khách sỉ không được phép áp dụng voucher cộng dồn
      expect(() =>
        service.validatePromotionStacking({
          isWholesale: true,
          promotionCode: 'GIAM10K',
          allowVoucherStacking: false,
        }),
      ).toThrow(BadRequestException);

      // Khi chính sách cho phép cộng dồn
      expect(() =>
        service.validatePromotionStacking({
          isWholesale: true,
          promotionCode: 'GIAM10K',
          allowVoucherStacking: true,
        }),
      ).not.toThrow();

      // Đơn hàng bán lẻ bình thường
      expect(() =>
        service.validatePromotionStacking({
          isWholesale: false,
          promotionCode: 'GIAM10K',
        }),
      ).not.toThrow();
    });
  });
});
