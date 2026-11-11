import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PromotionsService } from './promotions.service';
import { DiscountType } from '../../common/enums';
import { UpdatePromotionDto } from './dto/promotion.dto';

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

describe('ADMCAT-B1/B2/B3, E2E-B2: promotion business rules', () => {
  const basePromo = {
    _id: '507f1f77bcf86cd799439011',
    code: 'RULES',
    name: 'Rules',
    status: true,
    startDate: new Date(Date.now() - 60000),
    endDate: new Date(Date.now() + 3600000),
    usedCount: 0,
    usageLimit: 100,
    perUserLimit: 1,
    minOrderValue: 0,
    discountType: DiscountType.PERCENT,
    discountValue: 10,
  };

  function build(promo: any = basePromo) {
    const saved: any[] = [];
    const promotionModel: any = jest.fn().mockImplementation((doc: any) => ({
      ...doc,
      save: jest.fn().mockImplementation(() => {
        saved.push(doc);
        return Promise.resolve({ ...doc, status: false });
      }),
    }));
    promotionModel.findOne = jest.fn().mockReturnValue(query(promo));
    promotionModel.findById = jest.fn().mockReturnValue(query(promo));
    promotionModel.findByIdAndUpdate = jest
      .fn()
      .mockReturnValue(query({ ...promo }));
    const usageModel: any = { findOne: jest.fn().mockReturnValue(query(null)) };
    const orderModel: any = {
      countDocuments: jest.fn().mockReturnValue(query(0)),
    };
    const service = new PromotionsService(
      promotionModel,
      usageModel,
      orderModel,
      { createGlobalPromo: jest.fn() } as any,
    );
    return { service, promotionModel, saved };
  }

  const createDto = (over: any = {}) => ({
    code: 'NEWCODE',
    name: 'New',
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    startDate: new Date(Date.now() - 1000).toISOString(),
    endDate: new Date(Date.now() + 864e5).toISOString(),
    ...over,
  });

  it('B1: rejects PERCENT promotion above 100% on create', async () => {
    const { service, saved } = build();
    await expect(
      service.create(createDto({ discountValue: 150 })),
    ).rejects.toThrow('Giảm theo phần trăm không được vượt quá 100%');
    expect(saved).toHaveLength(0);
  });

  it('B1: allows FIXED promotion above 100 (value in VND)', async () => {
    const { service, saved } = build();
    await service.create(
      createDto({
        discountType: DiscountType.FIXED,
        discountValue: 50000,
      }),
    );
    expect(saved).toHaveLength(1);
  });

  it('B1: apply never returns a discount larger than the order total', async () => {
    const legacy = { ...basePromo, discountValue: 150 };
    const { service } = build(legacy);
    const res = await service.apply({ code: 'RULES', orderTotal: 200000 });
    expect(res.discount).toBe(200000);

    const fixed = {
      ...basePromo,
      discountType: DiscountType.FIXED,
      discountValue: 500000,
    };
    const res2 = await build(fixed).service.apply({
      code: 'RULES',
      orderTotal: 120000,
    });
    expect(res2.discount).toBe(120000);
  });

  it('B2: apply never returns a negative discount for legacy bad data', async () => {
    const negative = {
      ...basePromo,
      discountType: DiscountType.FIXED,
      discountValue: -50000,
    };
    const res = await build(negative).service.apply({
      code: 'RULES',
      orderTotal: 120000,
    });
    expect(res.discount).toBe(0);
  });

  it('B2: UpdatePromotionDto keeps class-validator rules and rejects usedCount', async () => {
    const dto = plainToInstance(UpdatePromotionDto, {
      discountValue: -50000,
      usageLimit: -1,
    });
    const errors = await validate(dto);
    const props = errors.map((e: any) => e.property).sort();
    expect(props).toEqual(['discountValue', 'usageLimit']);

    const withUsed = plainToInstance(UpdatePromotionDto, { usedCount: 0 });
    const errs2 = await validate(withUsed, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errs2.map((e: any) => e.property)).toEqual(['usedCount']);

    const ok = plainToInstance(UpdatePromotionDto, { name: 'Đổi tên' });
    expect(await validate(ok)).toHaveLength(0);
  });

  it('B2: update re-checks merged data (PATCH only discountValue on a PERCENT promo)', async () => {
    const { service, promotionModel } = build();
    await expect(
      service.update(basePromo._id, { discountValue: 120 }),
    ).rejects.toThrow('Giảm theo phần trăm không được vượt quá 100%');
    expect(promotionModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('B3: rejects endDate before or equal to startDate on create and update', async () => {
    const { service, promotionModel } = build();
    await expect(
      service.create(
        createDto({
          startDate: new Date(Date.now() + 864e6).toISOString(),
          endDate: new Date(Date.now() - 864e5).toISOString(),
        }),
      ),
    ).rejects.toThrow('Ngày kết thúc phải sau ngày bắt đầu');

    await expect(
      service.update(basePromo._id, {
        endDate: new Date(basePromo.startDate.getTime() - 1000).toISOString(),
      }),
    ).rejects.toThrow('Ngày kết thúc phải sau ngày bắt đầu');
    expect(promotionModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('E2E-B2: apply errors are returned in Vietnamese', async () => {
    await expect(
      build(null).service.apply({ code: 'NOPE', orderTotal: 1000 }),
    ).rejects.toThrow('Mã khuyến mãi không tồn tại hoặc đã ngừng áp dụng');

    const expired = {
      ...basePromo,
      startDate: new Date(Date.now() - 864e6),
      endDate: new Date(Date.now() - 864e5),
    };
    await expect(
      build(expired).service.apply({ code: 'RULES', orderTotal: 1000 }),
    ).rejects.toThrow('Mã khuyến mãi đã hết hạn');

    const future = { ...basePromo, startDate: new Date(Date.now() + 864e5) };
    await expect(
      build(future).service.apply({ code: 'RULES', orderTotal: 1000 }),
    ).rejects.toThrow('Mã khuyến mãi chưa đến thời gian áp dụng');

    const used = { ...basePromo, usedCount: 100 };
    await expect(
      build(used).service.apply({ code: 'RULES', orderTotal: 1000 }),
    ).rejects.toThrow('Mã khuyến mãi đã hết lượt sử dụng');

    const minOrder = { ...basePromo, minOrderValue: 300000 };
    await expect(
      build(minOrder).service.apply({ code: 'RULES', orderTotal: 1000 }),
    ).rejects.toThrow(/Đơn hàng cần tối thiểu/);
  });
});
