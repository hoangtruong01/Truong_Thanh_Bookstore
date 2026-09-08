/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { OrderStatus, PaymentStatus } from '../../common/enums';
import { PaymentsService } from './payments.service';

describe('PaymentsService callback reconciliation', () => {
  it('repairs the order projection when a successful callback is retried', async () => {
    const paidAt = new Date('2026-09-04T05:00:00.000Z');
    const payment = {
      _id: '507f1f77bcf86cd799439012',
      order: '507f1f77bcf86cd799439011',
      provider: 'VNPAY',
      transactionId: 'txn-001',
      callbackProcessedAt: paidAt,
      paidAt,
      status: PaymentStatus.PAID,
    };
    const paymentModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(payment),
      }),
    };
    const orderUpdateExec = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const orderModel = {
      updateOne: jest.fn().mockReturnValue({ exec: orderUpdateExec }),
    };
    const providers = { get: jest.fn() };
    const service = new PaymentsService(
      paymentModel as never,
      orderModel as never,
      providers as never,
    );

    const result = await service.handleCallback({
      provider: 'VNPAY' as never,
      transactionId: 'txn-001',
    });

    expect(result).toBe(payment);
    expect(orderModel.updateOne).toHaveBeenCalledWith(
      { _id: payment.order },
      {
        $set: {
          paymentStatus: PaymentStatus.PAID,
          revenueRecognizedAt: paidAt,
        },
      },
    );
    expect(orderModel.updateOne).toHaveBeenNthCalledWith(
      2,
      { _id: payment.order, orderStatus: OrderStatus.PENDING },
      expect.objectContaining({
        $set: { orderStatus: OrderStatus.CONFIRMED },
        $push: expect.any(Object),
      }),
    );
    expect(orderUpdateExec).toHaveBeenCalledTimes(2);
    expect(providers.get).not.toHaveBeenCalled();
  });

  it('safely handles idempotent replay when payment._id is undefined in mock or plain object', async () => {
    const paidAt = new Date('2026-09-04T05:00:00.000Z');
    const payment = {
      order: '507f1f77bcf86cd799439011',
      provider: 'VNPAY',
      transactionId: 'txn-002',
      callbackProcessedAt: paidAt,
      paidAt,
      status: PaymentStatus.PAID,
    };
    const paymentModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(payment),
      }),
    };
    const orderModel = {
      updateOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      }),
    };
    const providers = { get: jest.fn() };
    const service = new PaymentsService(
      paymentModel as never,
      orderModel as never,
      providers as never,
    );

    const result = await service.handleCallback({
      provider: 'VNPAY' as never,
      transactionId: 'txn-002',
    });

    expect(result).toBe(payment);
  });
});
