import { PassThrough } from 'stream';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

/**
 * ADMOPS-B1: tải hóa đơn PDF từng gọi end() hai lần (service + controller)
 * -> ERR_STREAM_PUSH_AFTER_EOF không có listener -> sập process backend.
 */
describe('ADMOPS-B1: invoice PDF download', () => {
  const order = {
    _id: '507f1f77bcf86cd799439011',
    orderCode: 'TT260101-0001',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    customerName: 'Khách QA',
    phone: '0900000001',
    shippingAddress: '1 Lê Lợi, Q1',
    paymentMethod: 'COD',
    items: [{ productName: 'Bút bi', quantity: 2, price: 5000 }],
    subtotal: 10000,
    shippingFee: 30000,
    discount: 0,
    total: 40000,
  };

  const fakeServiceThis = {
    logger: { warn: jest.fn(), error: jest.fn(), log: jest.fn() },
  };

  function buildController() {
    const ordersService: any = {
      findGuestById: jest.fn().mockResolvedValue(order),
      findByIdForActor: jest.fn().mockResolvedValue({
        ...order,
        customer: { _id: 'u1' },
      }),
      generateInvoicePdf: (o: any) =>
        OrdersService.prototype.generateInvoicePdf.call(fakeServiceThis, o),
    };
    return new OrdersController(ordersService);
  }

  function fakeResponse() {
    const res: any = new PassThrough();
    const chunks: Buffer[] = [];
    res.headers = {};
    res.headersSent = false;
    res.setHeader = (k: string, v: string) => (res.headers[k] = v);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    res.on('data', (c: Buffer) => chunks.push(c));
    const finished = new Promise<Buffer>((resolve, reject) => {
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    return { res, finished };
  }

  let uncaught: Error[] = [];
  const onUncaught = (e: Error) => uncaught.push(e);
  beforeEach(() => {
    uncaught = [];
    process.on('uncaughtException', onUncaught);
  });
  afterEach(() => {
    process.removeListener('uncaughtException', onUncaught);
  });

  async function download(
    controller: OrdersController,
    kind: 'guest' | 'auth',
  ): Promise<Buffer> {
    const { res, finished } = fakeResponse();
    if (kind === 'guest') {
      await controller.getGuestInvoice(order._id, 'token', res);
    } else {
      await controller.getInvoice(
        order._id,
        { user: { _id: 'u1', role: 'CUSTOMER' } },
        res,
      );
    }
    const pdf = await finished;
    // chờ thêm một nhịp để bắt lỗi stream phát sinh bất đồng bộ
    await new Promise((r) => setImmediate(r));
    return pdf;
  }

  it('streams a complete PDF twice in a row without stream errors', async () => {
    const controller = buildController();
    for (const kind of ['guest', 'auth', 'guest'] as const) {
      const pdf = await download(controller, kind);
      expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
      expect(pdf.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true);
    }
    expect(uncaught).toEqual([]);
  });

  it('a PDF stream error never becomes an unhandled error', async () => {
    const pdf: any = await OrdersService.prototype.generateInvoicePdf.call(
      fakeServiceThis,
      order,
    );
    expect(pdf.listenerCount('error')).toBeGreaterThan(0);
    expect(() => pdf.emit('error', new Error('boom'))).not.toThrow();
  });
});
