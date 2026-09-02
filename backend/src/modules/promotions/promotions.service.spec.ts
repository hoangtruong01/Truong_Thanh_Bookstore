import { BadRequestException } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { DiscountType } from '../../common/enums';

const query = (value: any) => ({
  session: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

describe('Task 19: Promotion usage limits', () => {
  const promo = {
    _id: '507f1f77bcf86cd799439011',
    code: 'SAVE10',
    status: true,
    startDate: new Date(Date.now() - 1000),
    endDate: new Date(Date.now() + 60000),
    usedCount: 0,
    usageLimit: 100,
    perUserLimit: 1,
    minOrderValue: 100000,
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    maxDiscount: 30000,
  };

  function createService(trackedCount = 0) {
    const promotionModel: any = {
      findOne: jest.fn().mockReturnValue(query({ ...promo })),
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue(query({ ...promo, usedCount: 1 })),
      updateOne: jest.fn().mockReturnValue(query({ acknowledged: true })),
    };
    const usageModel: any = {
      findOne: jest
        .fn()
        .mockReturnValue(query(trackedCount ? { count: trackedCount } : null)),
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue(query({ count: trackedCount + 1 })),
      updateOne: jest.fn().mockReturnValue(query({ acknowledged: true })),
    };
    const orderModel: any = {
      countDocuments: jest.fn().mockReturnValue(query(0)),
    };
    const notifications: any = { createGlobalPromo: jest.fn() };
    return {
      service: new PromotionsService(
        promotionModel,
        usageModel,
        orderModel,
        notifications,
      ),
      promotionModel,
      usageModel,
    };
  }

  it('atomically reserves both global and per-user usage', async () => {
    const { service, promotionModel, usageModel } = createService();
    const result = await service.apply(
      { code: 'SAVE10', orderTotal: 200000 },
      '507f1f77bcf86cd799439012',
      true,
    );
    expect(result.discount).toBe(20000);
    expect(promotionModel.findOneAndUpdate).toHaveBeenCalled();
    expect(usageModel.findOneAndUpdate).toHaveBeenCalled();
  });

  it('rejects a customer who reached per-user limit', async () => {
    const { service } = createService(1);
    await expect(
      service.apply(
        { code: 'SAVE10', orderTotal: 200000 },
        '507f1f77bcf86cd799439012',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
