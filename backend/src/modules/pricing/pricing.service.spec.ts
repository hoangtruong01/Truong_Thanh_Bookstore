import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PricingService } from './pricing.service';
import {
  PricePolicy,
  PricePolicyScope,
  PricePolicyStatus,
} from './schemas/price-policy.schema';

describe('PricingService', () => {
  let service: PricingService;
  let mockPolicyModel: any;

  beforeEach(async () => {
    mockPolicyModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));

    mockPolicyModel.find = jest.fn();
    mockPolicyModel.findOne = jest.fn();
    mockPolicyModel.findOneAndUpdate = jest.fn();
    mockPolicyModel.countDocuments = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getModelToken(PricePolicy.name),
          useValue: mockPolicyModel,
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
});
