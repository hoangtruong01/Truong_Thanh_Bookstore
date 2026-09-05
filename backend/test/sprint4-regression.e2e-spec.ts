import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Connection, createConnection, Model, Types } from 'mongoose';
import { OrdersService } from '../src/modules/orders/orders.service';
import {
  Order,
  OrderDocument,
  OrderSchema,
} from '../src/modules/orders/schemas/order.schema';
import { UsersService } from '../src/modules/users/users.service';
import {
  User,
  UserDocument,
  UserSchema,
} from '../src/modules/users/schemas/user.schema';
import { ProductsService } from '../src/modules/products/products.service';
import { PromotionsService } from '../src/modules/promotions/promotions.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { EmailService } from '../src/modules/email/email.service';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../src/common/enums';

jest.setTimeout(60000);

describe('Sprint 4 regression on real MongoDB transactions and aggregation', () => {
  let connection: Connection;
  let module: TestingModule;
  let orders: OrdersService;
  let orderModel: Model<OrderDocument>;
  let userModel: Model<UserDocument>;
  const databaseName = `sprint4_audit_${Date.now()}`;
  const productId = new Types.ObjectId();
  const products = {
    findByIds: jest.fn().mockResolvedValue([
      {
        _id: productId,
        name: 'Audit book',
        price: 1000000,
        stock: 10,
        status: 'ACTIVE',
        images: [],
        isDeleted: false,
      },
    ]),
    deductStock: jest.fn().mockResolvedValue(undefined),
    incrementSold: jest.fn().mockResolvedValue(undefined),
    updateStock: jest.fn().mockResolvedValue(undefined),
  };
  const notifications = { create: jest.fn().mockResolvedValue({}) };
  const dto = {
    items: [
      {
        product: productId.toString(),
        name: 'Audit book',
        price: 1000000,
        quantity: 1,
      },
    ],
    shippingAddress: 'Audit address',
    phone: '0901234567',
    loyaltyPointsUsed: 1000,
  };

  beforeAll(async () => {
    // Own a fresh database; never clean an existing application database.
    connection = await createConnection(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/?replicaSet=rs0',
      { dbName: databaseName, serverSelectionTimeoutMS: 10000 },
    ).asPromise();
    orderModel = connection.model<OrderDocument>(Order.name, OrderSchema);
    userModel = connection.model<UserDocument>(User.name, UserSchema);
    await Promise.all([orderModel.init(), userModel.init()]);
    module = await Test.createTestingModule({
      providers: [
        OrdersService,
        UsersService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: ProductsService, useValue: products },
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: PromotionsService, useValue: {} },
        { provide: NotificationsService, useValue: notifications },
        {
          provide: EmailService,
          useValue: {
            sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
            sendOrderStatusEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();
    orders = module.get(OrdersService);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([orderModel.deleteMany({}), userModel.deleteMany({})]);
  });

  afterAll(async () => {
    await module?.close();
    if (connection?.db && connection.name === databaseName) {
      await connection.dropDatabase();
    }
    await connection?.close();
  });

  it('groups by realization day, includes both discounts and excludes cancelled/returned/unpaid orders', async () => {
    const base = {
      items: [],
      subtotal: 1000000,
      discount: 50000,
      loyaltyDiscount: 100000,
      total: 850000,
      shippingAddress: 'Audit',
      phone: '0901234567',
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      createdAt: new Date('2026-09-01T08:00:00Z'),
      revenueRecognizedAt: new Date('2026-09-04T17:30:00Z'),
    };
    await orderModel.collection.insertMany([
      { ...base, orderCode: 'realized' },
      { ...base, orderCode: 'cancelled', orderStatus: OrderStatus.CANCELLED },
      { ...base, orderCode: 'returned', orderStatus: OrderStatus.RETURNED },
      {
        ...base,
        orderCode: 'unpaid',
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
      },
      {
        ...base,
        orderCode: 'next-day',
        revenueRecognizedAt: new Date('2026-09-05T17:00:00Z'),
      },
    ]);
    const result = await orders.getRevenueByDateRange(
      new Date('2026-09-04T17:00:00Z'),
      new Date('2026-09-05T16:59:59.999Z'),
    );
    expect(result).toEqual([
      {
        _id: '2026-09-05',
        total: 850000,
        subtotal: 1000000,
        discount: 150000,
        count: 1,
      },
    ]);
  });

  it('retains legacy orders without loyalty discount or realization timestamp', async () => {
    await orderModel.collection.insertOne({
      orderCode: 'legacy',
      items: [],
      subtotal: 200000,
      discount: 10000,
      total: 190000,
      shippingAddress: 'Audit',
      phone: '0901234567',
      orderStatus: OrderStatus.DELIVERED,
      createdAt: new Date('2026-09-04T17:30:00Z'),
    });
    expect(
      await orders.getRevenueByDateRange(
        new Date('2026-09-04T17:00:00Z'),
        new Date('2026-09-05T16:59:59.999Z'),
      ),
    ).toEqual([
      {
        _id: '2026-09-05',
        total: 190000,
        subtotal: 200000,
        discount: 10000,
        count: 1,
      },
    ]);
  });

  async function customer(points: number) {
    return userModel.create({
      fullName: 'Audit user',
      email: 'audit@example.com',
      password: 'unused-hash',
      loyaltyPoints: points,
    });
  }

  it('does not double spend one balance under concurrent checkout', async () => {
    const user = await customer(1500);
    const results = await Promise.allSettled([
      orders.create(dto, String(user._id)),
      orders.create(dto, String(user._id)),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect((await userModel.findById(user._id))?.loyaltyPoints).toBe(500);
    expect(await orderModel.countDocuments()).toBe(1);
  });

  it('rolls back the spent balance when stock deduction fails', async () => {
    const user = await customer(1500);
    products.deductStock.mockRejectedValueOnce(new Error('Stock unavailable'));
    await expect(orders.create(dto, String(user._id))).rejects.toThrow(
      'Stock unavailable',
    );
    expect((await userModel.findById(user._id))?.loyaltyPoints).toBe(1500);
    expect(await orderModel.countDocuments()).toBe(0);
  });

  it('does not notify or award points when the order write is rolled back', async () => {
    const user = await customer(500);
    const order = await orderModel.create({
      orderCode: 'failed-delivery',
      customer: user._id,
      items: [],
      subtotal: 1000000,
      total: 1000000,
      shippingAddress: 'Audit',
      phone: '0901234567',
      orderStatus: OrderStatus.SHIPPING,
    });
    const save = jest
      .spyOn(orderModel.prototype as OrderDocument, 'save')
      .mockRejectedValueOnce(new Error('Order write failed'));
    try {
      await expect(
        orders.updateStatus(String(order._id), {
          orderStatus: OrderStatus.DELIVERED,
        }),
      ).rejects.toThrow('Order write failed');
    } finally {
      save.mockRestore();
    }
    expect(notifications.create).not.toHaveBeenCalled();
    expect((await userModel.findById(user._id))?.loyaltyPoints).toBe(500);
    expect((await orderModel.findById(order._id))?.orderStatus).toBe(
      OrderStatus.SHIPPING,
    );
  });

  it('awards only paid merchandise after discounts, once across delivery and completion', async () => {
    const user = await customer(500);
    const order = await orderModel.create({
      orderCode: 'net-loyalty',
      customer: user._id,
      items: [],
      subtotal: 1000000,
      discount: 50000,
      loyaltyDiscount: 100000,
      shippingFee: 30000,
      total: 880000,
      shippingAddress: 'Audit',
      phone: '0901234567',
      orderStatus: OrderStatus.SHIPPING,
      paymentMethod: PaymentMethod.COD,
    });
    await orders.updateStatus(String(order._id), {
      orderStatus: OrderStatus.DELIVERED,
    });
    expect((await userModel.findById(user._id))?.loyaltyPoints).toBe(1350);
    const delivered = await orderModel.findById(order._id);
    expect(delivered?.loyaltyPointsAwarded).toBe(850);
    expect(delivered?.paymentStatus).toBe(PaymentStatus.PAID);
    await orders.updateStatus(String(order._id), {
      orderStatus: OrderStatus.COMPLETED,
    });
    expect((await userModel.findById(user._id))?.loyaltyPoints).toBe(1350);
  });

  it.each([PaymentMethod.BANK_TRANSFER, PaymentMethod.VNPAY])(
    'rejects unpaid %s delivery without awarding points',
    async (paymentMethod) => {
      const user = await customer(500);
      const order = await orderModel.create({
        orderCode: 'unpaid-delivery',
        customer: user._id,
        items: [],
        subtotal: 1000000,
        total: 1000000,
        shippingAddress: 'Audit',
        phone: '0901234567',
        orderStatus: OrderStatus.SHIPPING,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod,
      });
      await expect(
        orders.updateStatus(String(order._id), {
          orderStatus: OrderStatus.DELIVERED,
        }),
      ).rejects.toThrow('phải được xác nhận đã thanh toán');
      expect((await userModel.findById(user._id))?.loyaltyPoints).toBe(500);
      expect((await orderModel.findById(order._id))?.orderStatus).toBe(
        OrderStatus.SHIPPING,
      );
      expect(notifications.create).not.toHaveBeenCalled();
    },
  );

  it('refunds points once when two cancellations race', async () => {
    const user = await customer(500);
    const order = await orderModel.create({
      orderCode: 'refund-race',
      customer: user._id,
      items: [],
      subtotal: 1000000,
      total: 900000,
      loyaltyPointsUsed: 1000,
      loyaltyDiscount: 100000,
      shippingAddress: 'Audit',
      phone: '0901234567',
      orderStatus: OrderStatus.PENDING,
    });
    const results = await Promise.allSettled([
      orders.updateStatus(String(order._id), {
        orderStatus: OrderStatus.CANCELLED,
      }),
      orders.updateStatus(String(order._id), {
        orderStatus: OrderStatus.CANCELLED,
      }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect((await userModel.findById(user._id))?.loyaltyPoints).toBe(1500);
    expect((await orderModel.findById(order._id))?.loyaltyPointsRefunded).toBe(
      true,
    );
    expect(notifications.create).toHaveBeenCalledTimes(1);
  });
});
