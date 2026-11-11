import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Model, Types } from 'mongoose';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrderDocument } from '../schemas/order.schema';
import { ReturnNoteDto } from '../dto/return-note.dto';
import { OrderStatus, StaffPermission, UserRole } from '../../../common/enums';

const DAY = 24 * 60 * 60 * 1000;

function createService(findByIdImpl: jest.Mock) {
  const model = { findById: findByIdImpl };
  const service = new OrderLifecycleService(
    model as unknown as Model<OrderDocument>,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return service;
}

describe('OrderLifecycleService - SEC-008 return override', () => {
  const customerId = new Types.ObjectId().toString();
  const orderId = new Types.ObjectId().toString();

  function build(deliveredDaysAgo: number) {
    const order = {
      _id: orderId,
      customer: new Types.ObjectId(customerId),
      orderStatus: OrderStatus.DELIVERED,
      deliveredAt: new Date(Date.now() - deliveredDaysAgo * DAY),
    };
    const findById = jest.fn(() => ({
      exec: jest.fn().mockResolvedValue(order),
    }));
    const service = createService(findById);
    const updateStatus = jest
      .spyOn(service, 'updateStatus')
      .mockResolvedValue({} as OrderDocument);
    return { service, updateStatus };
  }

  it('khách hàng KHÔNG thể vượt hạn 7 ngày bằng overrideToken', async () => {
    const { service, updateStatus } = build(10);
    await expect(
      service.requestReturn(
        orderId,
        { _id: customerId, role: UserRole.CUSTOMER },
        { reason: 'Lỗi in', overrideToken: 'ABCDEF123' },
      ),
    ).rejects.toThrow(BadRequestException);
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('khách hàng trong hạn 7 ngày vẫn trả hàng bình thường (không gắn nhãn đặc cách)', async () => {
    const { service, updateStatus } = build(2);
    await service.requestReturn(
      orderId,
      { _id: customerId, role: UserRole.CUSTOMER },
      { reason: 'Lỗi in', overrideToken: 'ABCDEF123' },
    );
    expect(updateStatus).toHaveBeenCalledTimes(1);
    const dto = updateStatus.mock.calls[0][1] as { note: string };
    expect(dto.note).not.toContain('Đặc cách');
  });

  it('ADMIN được đặc cách quá hạn với overrideToken hợp lệ', async () => {
    const { service, updateStatus } = build(10);
    await service.requestReturn(
      orderId,
      { _id: new Types.ObjectId().toString(), role: UserRole.ADMIN },
      { reason: 'Lỗi in', overrideToken: 'ABCDEF123' },
    );
    expect(updateStatus).toHaveBeenCalledTimes(1);
    const dto = updateStatus.mock.calls[0][1] as { note: string };
    expect(dto.note).toContain('Đặc cách');
  });

  it('ADMIN quá hạn nhưng không có overrideToken vẫn bị từ chối', async () => {
    const { service } = build(10);
    await expect(
      service.requestReturn(
        orderId,
        { _id: new Types.ObjectId().toString(), role: UserRole.ADMIN },
        { reason: 'Lỗi in' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('STAFF có MANAGE_ORDERS được đặc cách; STAFF thiếu quyền thì không', async () => {
    const withPerm = build(10);
    await withPerm.service.requestReturn(
      orderId,
      {
        _id: customerId,
        role: UserRole.STAFF,
        permissions: [StaffPermission.MANAGE_ORDERS],
      },
      { reason: 'Lỗi in', overrideToken: 'ABCDEF123' },
    );
    expect(withPerm.updateStatus).toHaveBeenCalledTimes(1);

    const noPerm = build(10);
    await expect(
      noPerm.service.requestReturn(
        orderId,
        { _id: customerId, role: UserRole.STAFF, permissions: [] },
        { reason: 'Lỗi in', overrideToken: 'ABCDEF123' },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('OrderLifecycleService - SEC-022 cancel race', () => {
  const customerId = new Types.ObjectId().toString();
  const orderId = new Types.ObjectId().toString();

  it('khách hủy đơn: nếu trong transaction đơn đã CONFIRMED thì bị từ chối, không lưu', async () => {
    const save = jest.fn();
    const pendingOrder = {
      _id: orderId,
      customer: new Types.ObjectId(customerId),
      orderStatus: OrderStatus.PENDING,
    };
    const confirmedOrder = {
      _id: orderId,
      customer: new Types.ObjectId(customerId),
      orderStatus: OrderStatus.CONFIRMED,
      items: [],
      timeline: [],
      save,
    };
    const findById = jest
      .fn()
      // Lần 1: kiểm tra PENDING ngoài transaction
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(pendingOrder) })
      // Lần 2: đọc lại bên trong updateStatusInternal (staff vừa xác nhận)
      .mockReturnValueOnce({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(confirmedOrder),
      });
    const service = createService(findById);

    await expect(
      service.cancelForActor(orderId, {
        _id: customerId,
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(save).not.toHaveBeenCalled();
    expect(confirmedOrder.orderStatus).toBe(OrderStatus.CONFIRMED);
  });

  it('khách vãng lai hủy đơn: đơn đã CONFIRMED khi vào transaction thì bị từ chối', async () => {
    const token = 'guest-token-123';
    const save = jest.fn();
    const pendingOrder = {
      _id: orderId,
      customer: undefined,
      guestAccessTokenHash: createHash('sha256').update(token).digest('hex'),
      orderStatus: OrderStatus.PENDING,
    };
    const confirmedOrder = {
      _id: orderId,
      orderStatus: OrderStatus.CONFIRMED,
      items: [],
      timeline: [],
      save,
    };
    const findById = jest
      .fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(pendingOrder),
      })
      .mockReturnValueOnce({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(confirmedOrder),
      });
    const service = createService(findById);

    await expect(service.cancelGuest(orderId, token)).rejects.toThrow(
      BadRequestException,
    );
    expect(save).not.toHaveBeenCalled();
  });
});

describe('ReturnNoteDto - SEC-033', () => {
  it('cho phép bỏ trống note', async () => {
    const errors = await validate(plainToInstance(ReturnNoteDto, {}));
    expect(errors).toHaveLength(0);
  });

  it('từ chối note không phải chuỗi', async () => {
    const errors = await validate(
      plainToInstance(ReturnNoteDto, { note: { $ne: null } }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('từ chối note dài hơn 1000 ký tự', async () => {
    const errors = await validate(
      plainToInstance(ReturnNoteDto, { note: 'a'.repeat(1001) }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('chấp nhận note hợp lệ', async () => {
    const errors = await validate(
      plainToInstance(ReturnNoteDto, { note: 'Đã nhận đủ hàng' }),
    );
    expect(errors).toHaveLength(0);
  });
});
