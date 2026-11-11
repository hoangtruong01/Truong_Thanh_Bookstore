/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { UpdatePromotionDto } from './dto/promotion.dto';

/**
 * SEC-010: PATCH /promotions/:id phải được ValidationPipe kiểm tra.
 * Trước đây body được khai báo Partial<CreatePromotionDto> (kiểu generic, metatype
 * lúc runtime là Object) nên ValidationPipe bỏ qua hoàn toàn.
 *
 * Test dùng đúng metatype mà Nest đọc từ `design:paramtypes` của controller và
 * cùng cấu hình ValidationPipe như main.ts.
 */
describe('SEC-010: PromotionsController PATCH validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });

  const bodyMetatype = (): any => {
    const types = Reflect.getMetadata(
      'design:paramtypes',
      PromotionsController.prototype,
      'update',
    );
    return types[1];
  };

  const run = (body: any) =>
    pipe.transform(body, { type: 'body', metatype: bodyMetatype() });

  it('dùng UpdatePromotionDto làm kiểu body của update()', () => {
    expect(bodyMetatype()).toBe(UpdatePromotionDto);
  });

  it('từ chối discountValue âm với 400', async () => {
    await expect(run({ discountValue: -50 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('từ chối usedCount (mass assignment) với 400', async () => {
    await expect(run({ usedCount: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('từ chối trường lạ (vd: _id, createdAt)', async () => {
    await expect(run({ _id: 'x', name: 'A' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('từ chối discountType không hợp lệ và usageLimit < 1', async () => {
    await expect(run({ discountType: 'FREE' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(run({ usageLimit: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('cho phép cập nhật một phần hợp lệ và chuẩn hóa code', async () => {
    const result = await run({ code: ' summer-1 ', discountValue: 20 });
    expect(result).toBeInstanceOf(UpdatePromotionDto);
    expect(result.code).toBe('SUMMER-1');
    expect(result.discountValue).toBe(20);
  });

  it('cho phép body rỗng (partial)', async () => {
    await expect(run({})).resolves.toBeInstanceOf(UpdatePromotionDto);
  });

  it('từ chối giá trị null (IsOptional của PartialType cho qua) với 400', async () => {
    const service = { update: jest.fn() };
    const controller = new PromotionsController(service as any);
    for (const body of [
      { endDate: null },
      { discountValue: null },
      { usageLimit: null },
      { code: null },
    ]) {
      const dto = await run(body);
      expect(() => controller.update('id1', dto)).toThrow(BadRequestException);
    }
    expect(service.update).not.toHaveBeenCalled();
  });

  it('vẫn chuyển body hợp lệ xuống service', async () => {
    const service = { update: jest.fn().mockResolvedValue({ ok: true }) };
    const controller = new PromotionsController(service as any);
    const dto = await run({ discountValue: 15 });
    await controller.update('id1', dto);
    expect(service.update).toHaveBeenCalledWith('id1', dto);
  });
});
