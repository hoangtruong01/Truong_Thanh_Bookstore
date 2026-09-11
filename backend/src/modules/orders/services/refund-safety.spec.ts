import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrderDocument } from '../schemas/order.schema';
import {
  OrderStatus,
  PaymentStatus,
  RefundStatus,
  UserRole,
} from '../../../common/enums';

describe('Refund settlement safety', () => {
  const id = new Types.ObjectId().toString();
  const actor = { _id: new Types.ObjectId().toString(), role: UserRole.ADMIN };
  let order: Record<string, unknown>;
  let model: { findById: jest.Mock; findOneAndUpdate: jest.Mock };
  let service: OrderLifecycleService;

  beforeEach(() => {
    order = {
      _id: id,
      orderStatus: OrderStatus.RETURNED,
      paymentStatus: PaymentStatus.PAID,
      total: 100000,
      refundStatus: RefundStatus.REQUESTED,
      refundAmount: 100000,
    };
    model = {
      findById: jest.fn(() => ({ exec: jest.fn().mockResolvedValue(order) })),
      findOneAndUpdate: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue({
          ...order,
          refundStatus: RefundStatus.MANUAL_REQUIRED,
        }),
      })),
    };
    service = new OrderLifecycleService(
      model as unknown as Model<OrderDocument>,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('records manual review without inventing a completed transfer', async () => {
    const result = await service.processRefund(id, actor);
    expect(result.refundStatus).toBe(RefundStatus.MANUAL_REQUIRED);
    expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    const [filter, update] = model.findOneAndUpdate.mock.calls[0] as [
      Record<string, unknown>,
      {
        $set: Record<string, unknown>;
        $push: { timeline: { status: OrderStatus } };
      },
    ];
    expect(filter).toMatchObject({
      orderStatus: OrderStatus.RETURNED,
      paymentStatus: PaymentStatus.PAID,
      total: 100000,
    });
    expect(update.$set).not.toHaveProperty('refundedAt');
    expect(update.$set).not.toHaveProperty('refundTransactionRef');
    expect(update.$set).not.toHaveProperty('paymentStatus');
    expect(update.$push.timeline.status).toBe(OrderStatus.RETURNED);
  });

  it.each([0, -1, 100001, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid refund amount %s',
    async (amount) => {
      await expect(
        service.processRefund(id, actor, { amount }),
      ).rejects.toThrow(BadRequestException);
      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    },
  );

  it('rejects unpaid orders', async () => {
    order.paymentStatus = PaymentStatus.UNPAID;
    await expect(service.processRefund(id, actor)).rejects.toThrow(
      BadRequestException,
    );
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects a customer even when called outside the HTTP controller', async () => {
    await expect(
      service.processRefund(id, { ...actor, role: UserRole.CUSTOMER }),
    ).rejects.toThrow(ForbiddenException);
    expect(model.findById).not.toHaveBeenCalled();
  });

  it('does not append another request when manual review is already pending', async () => {
    order.refundStatus = RefundStatus.MANUAL_REQUIRED;
    await expect(service.processRefund(id, actor)).resolves.toBe(order);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('reports a conflict if another worker changes settlement state', async () => {
    model.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(service.processRefund(id, actor)).rejects.toThrow(
      ConflictException,
    );
  });
});
