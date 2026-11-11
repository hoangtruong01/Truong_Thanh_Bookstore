/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { createHash } from 'crypto';
import { OrdersService } from './orders.service';

/**
 * SEC-004 / SEC-032: response dành cho khách (my-orders, chi tiết đơn của chủ
 * đơn, guest lookup) không chứa giá vốn, biên lợi nhuận, thông tin phê duyệt
 * và hash nội bộ. Staff/admin vẫn xem đầy đủ.
 */
describe('OrdersService customer-facing order view (SEC-004/032)', () => {
  const userId = '507f1f77bcf86cd799439099';
  const guestToken = 'guest-secret-token-123';
  const guestTokenHash = createHash('sha256').update(guestToken).digest('hex');

  const makeRawOrder = (extra: Record<string, any> = {}) => ({
    _id: '607f1f77bcf86cd799439001',
    orderCode: 'TT1',
    customer: { _id: userId },
    guestAccessTokenHash: guestTokenHash,
    idempotencyKeyHash: 'secret-idem-hash',
    items: [
      {
        name: 'Sách A',
        price: 85000,
        quantity: 1,
        costPrice: 40000,
        baseSellingPrice: 100000,
        appliedPolicyName: 'VIP',
        grossMarginPercent: 52.9,
        markupPercent: 112.5,
        approver: 'admin-1',
        approvalReason: 'giảm giá đặc biệt',
      },
    ],
    ...extra,
  });

  const makeService = (orderModel: any) =>
    new OrdersService(
      orderModel,
      {} as any,
      { get: jest.fn().mockReturnValue('') } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

  const expectNoSensitive = (order: any) => {
    expect(order).not.toHaveProperty('guestAccessTokenHash');
    expect(order).not.toHaveProperty('idempotencyKeyHash');
    for (const field of [
      'costPrice',
      'baseSellingPrice',
      'appliedPolicyName',
      'grossMarginPercent',
      'markupPercent',
      'approver',
      'approvalReason',
    ]) {
      expect(order.items[0]).not.toHaveProperty(field);
    }
    expect(order.items[0].price).toBe(85000);
  };

  const findByIdModel = (raw: any) => ({
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(raw),
      }),
    }),
  });

  it('my-orders: findByUser không trả giá vốn', async () => {
    const raw = makeRawOrder();
    const model: any = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([raw]),
            }),
          }),
        }),
      }),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    };
    const result: any = await makeService(model).findByUser(userId, {
      page: 1,
      limit: 10,
    });
    expectNoSensitive(result.data[0]);
    // không mutate dữ liệu gốc
    expect(raw.items[0]).toHaveProperty('costPrice');
  });

  it('chi tiết đơn: chủ đơn không thấy giá vốn', async () => {
    const service = makeService(findByIdModel(makeRawOrder()));
    const order: any = await service.findByIdForActor(
      '607f1f77bcf86cd799439001',
      {
        _id: userId,
        role: 'CUSTOMER',
      },
    );
    expectNoSensitive(order);
  });

  it('chi tiết đơn: admin vẫn thấy dữ liệu đầy đủ', async () => {
    const service = makeService(findByIdModel(makeRawOrder()));
    const order: any = await service.findByIdForActor(
      '607f1f77bcf86cd799439001',
      {
        _id: 'admin-id',
        role: 'ADMIN',
      },
    );
    expect(order.items[0].costPrice).toBe(40000);
    expect(order.items[0].grossMarginPercent).toBe(52.9);
  });

  it('guest lookup: không trả hash nội bộ và giá vốn', async () => {
    const raw = makeRawOrder({ customer: null });
    const model: any = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(raw),
        }),
      }),
    };
    const order: any = await makeService(model).findGuestById(
      raw._id,
      guestToken,
    );
    expectNoSensitive(order);
    expect(order.orderCode).toBe('TT1');
  });

  describe('hủy đơn / yêu cầu hoàn trả trả về bản dành cho khách', () => {
    const withLifecycle = (lifecycle: Record<string, jest.Mock>) => {
      const service: any = makeService({});
      service.orderLifecycleService = lifecycle;
      return service;
    };

    it('cancelForActor: khách hàng không thấy giá vốn, admin vẫn thấy', async () => {
      const lifecycle = {
        cancelForActor: jest.fn().mockResolvedValue(makeRawOrder()),
      };
      const service = withLifecycle(lifecycle);
      const asCustomer = await service.cancelForActor('o1', {
        _id: userId,
        role: 'CUSTOMER',
      });
      expectNoSensitive(asCustomer);
      const asAdmin = await service.cancelForActor('o1', {
        _id: 'admin-id',
        role: 'ADMIN',
      });
      expect(asAdmin.items[0].costPrice).toBe(40000);
    });

    it('cancelGuest: khách vãng lai không thấy giá vốn/hash', async () => {
      const service = withLifecycle({
        cancelGuest: jest.fn().mockResolvedValue(makeRawOrder()),
      });
      expectNoSensitive(await service.cancelGuest('o1', guestToken));
    });

    it('requestReturn: khách hàng không thấy giá vốn', async () => {
      const service = withLifecycle({
        requestReturn: jest.fn().mockResolvedValue(makeRawOrder()),
      });
      expectNoSensitive(
        await service.requestReturn(
          'o1',
          { _id: userId, role: 'CUSTOMER' },
          { reason: 'lỗi' },
        ),
      );
    });
  });
});
