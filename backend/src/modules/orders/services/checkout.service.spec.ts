/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import 'reflect-metadata';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrderSource, PaymentMethod } from '../../../common/enums';
import { CheckoutService, toCustomerOrderView } from './checkout.service';
import {
  CheckoutPreviewDto,
  CreateOrderDto,
  ORDER_ITEM_MAX_QUANTITY,
  ORDER_MAX_ITEMS,
} from '../dto/order.dto';

/**
 * Cluster C2 — Checkout price integrity + cost exposure + preview limits
 * SEC-001, SEC-004, SEC-032, SEC-013
 */
describe('CheckoutService security (SEC-001/004/032/013)', () => {
  let service: CheckoutService;
  let orderModel: any;
  let landingPageModel: any;
  let productsService: any;
  let currentLandingPage: any;

  const productId = new Types.ObjectId();
  const otherProductId = new Types.ObjectId();
  const landingPageId = new Types.ObjectId().toString();

  const product = {
    _id: productId,
    name: 'Sách Đắc Nhân Tâm',
    price: 100000,
    discountPrice: 85000,
    costPrice: 40000,
    stock: 50,
    images: ['https://example.com/a.jpg'],
    status: 'ACTIVE',
    isDeleted: false,
  };

  const buildLandingPage = (overrides: Record<string, any> = {}) => ({
    _id: new Types.ObjectId(landingPageId),
    status: true,
    price: 70000,
    productId,
    packages: [{ name: 'Combo', price: 60000, productId }],
    ...overrides,
  });

  const baseDto = (
    overrides: Partial<CreateOrderDto> = {},
  ): CreateOrderDto => ({
    items: [{ product: productId.toString(), price: 5000, quantity: 1 }],
    shippingAddress: '123 Nguyễn Trãi, Q.5',
    phone: '0901234567',
    paymentMethod: PaymentMethod.COD,
    ...overrides,
  });

  beforeEach(() => {
    currentLandingPage = buildLandingPage();
    productsService = {
      findByIds: jest.fn().mockResolvedValue([product]),
      findById: jest.fn().mockResolvedValue(product),
    };
    landingPageModel = {
      findById: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(currentLandingPage),
      })),
    };
    orderModel = jest.fn().mockImplementation((doc) => ({
      ...doc,
      save: jest.fn().mockImplementation(async function (this: any) {
        return { ...this, toObject: () => ({ ...this }) };
      }),
    }));
    orderModel.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });
    orderModel.countDocuments = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
    orderModel.distinct = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
    orderModel.db = {};

    service = new CheckoutService(
      orderModel,
      productsService,
      new ConfigService({
        JWT_SECRET: 'test-jwt-secret-key-at-least-32-chars',
        ENABLED_PAYMENT_METHODS: 'COD',
      }),
      { apply: jest.fn(), releaseUsage: jest.fn() } as any,
      { findById: jest.fn() } as any,
      {
        deductOrderStock: jest.fn().mockResolvedValue([]),
        rollbackStock: jest.fn(),
      } as any,
      {
        validateAndSpendPoints: jest.fn(),
        refundLoyaltyPoints: jest.fn(),
      } as any,
      {
        notifyOrderCreated: jest.fn().mockResolvedValue(undefined),
        syncToGoogleSheet: jest.fn().mockResolvedValue(undefined),
      } as any,
      undefined,
      landingPageModel,
    );
  });

  describe('SEC-001: client không tự chọn được giá / nguồn đơn', () => {
    it('LANDING_PAGE + giá thấp không khớp cấu hình -> dùng giá DB', async () => {
      const order = await service.create(
        baseDto({
          orderSource: OrderSource.LANDING_PAGE,
          landingPageId,
        }),
      );
      expect(order.items[0].price).toBe(85000);
      expect(order.subtotal).toBe(85000);
    });

    it('LANDING_PAGE không có landingPageId -> giá DB và nguồn quy về WEB', async () => {
      const order = await service.create(
        baseDto({ orderSource: OrderSource.LANDING_PAGE }),
      );
      expect(order.items[0].price).toBe(85000);
      expect(order.orderSource).toBe(OrderSource.WEB);
      expect(order.landingPageId).toBeUndefined();
    });

    it('landing page đã tắt -> bỏ qua giá landing, nguồn quy về WEB', async () => {
      currentLandingPage = buildLandingPage({ status: false });
      const order = await service.create(
        baseDto({
          items: [{ product: productId.toString(), price: 60000, quantity: 1 }],
          orderSource: OrderSource.LANDING_PAGE,
          landingPageId,
        }),
      );
      expect(order.items[0].price).toBe(85000);
      expect(order.orderSource).toBe(OrderSource.WEB);
    });

    it('landing page không gắn sản phẩm không áp giá cho sản phẩm bất kỳ', async () => {
      currentLandingPage = buildLandingPage({
        productId: undefined,
        packages: [],
      });
      const order = await service.create(
        baseDto({
          items: [{ product: productId.toString(), price: 70000, quantity: 1 }],
          orderSource: OrderSource.LANDING_PAGE,
          landingPageId,
        }),
      );
      expect(order.items[0].price).toBe(85000);
    });

    it('gói gắn với sản phẩm khác không áp giá cho sản phẩm này', async () => {
      currentLandingPage = buildLandingPage({
        productId,
        price: 0,
        packages: [
          { name: 'Gói khác', price: 1000, productId: otherProductId },
        ],
      });
      const order = await service.create(
        baseDto({
          items: [{ product: productId.toString(), price: 1000, quantity: 1 }],
          orderSource: OrderSource.LANDING_PAGE,
          landingPageId,
        }),
      );
      expect(order.items[0].price).toBe(85000);
    });

    it('nguồn POS gửi từ endpoint công khai bị quy về WEB', async () => {
      const order = await service.create(
        baseDto({ orderSource: OrderSource.POS }),
      );
      expect(order.orderSource).toBe(OrderSource.WEB);
    });

    it('giá landing hợp lệ do admin cấu hình vẫn được áp dụng', async () => {
      const order = await service.create(
        baseDto({
          items: [{ product: productId.toString(), price: 60000, quantity: 1 }],
          orderSource: OrderSource.LANDING_PAGE,
          landingPageId,
        }),
      );
      expect(order.items[0].price).toBe(60000);
      expect(order.orderSource).toBe(OrderSource.LANDING_PAGE);
    });

    it('preview: giá giả không khớp cấu hình không được áp dụng', async () => {
      currentLandingPage = buildLandingPage({
        productId: undefined,
        packages: [],
      });
      const preview = await service.checkoutPreview({
        items: [{ product: productId.toString(), price: 70000, quantity: 1 }],
        landingPageId,
      });
      expect(preview.items[0].price).toBe(85000);
    });
  });

  describe('SEC-004 + SEC-032: không lộ giá vốn / hash nội bộ', () => {
    const COST_FIELDS = [
      'costPrice',
      'baseSellingPrice',
      'appliedPolicy',
      'appliedPolicyName',
      'grossMarginPercent',
      'markupPercent',
      'approver',
      'approvalReason',
    ];
    const HASH_FIELDS = [
      'guestAccessTokenHash',
      'idempotencyKeyHash',
      'idempotencyPayloadHash',
      'guestPhoneKey',
      'guestPendingSlot',
    ];

    it('response tạo đơn của khách vãng lai không chứa giá vốn/hash', async () => {
      const order = await service.create(
        baseDto({ idempotencyKey: 'idem-key-secure-0000001' }),
      );
      expect(order.guestAccessToken).toBeDefined();
      for (const field of HASH_FIELDS) expect(order).not.toHaveProperty(field);
      for (const field of COST_FIELDS) {
        expect(order.items[0]).not.toHaveProperty(field);
      }
      // dữ liệu hiển thị vẫn còn
      expect(order.items[0].price).toBe(85000);
      expect(order.items[0].quantity).toBe(1);
    });

    it('response replay idempotent không chứa hash nội bộ và giá vốn', async () => {
      const dto = baseDto({ idempotencyKey: 'idem-key-secure-0000002' });
      const derived = service.deriveGuestAccessToken(dto.idempotencyKey!);
      const existing = {
        _id: new Types.ObjectId(),
        orderCode: 'TT1',
        phone: dto.phone,
        shippingAddress: dto.shippingAddress,
        items: [
          {
            product: productId,
            quantity: 1,
            price: 85000,
            costPrice: 40000,
            grossMarginPercent: 52.9,
          },
        ],
        guestAccessTokenHash: service.hashSecret(derived),
        idempotencyKeyHash: 'hash-of-key',
        idempotencyPayloadHash: service.computeOrderPayloadHash(dto),
        toObject() {
          const { toObject: _omit, ...rest } = this;
          return rest;
        },
      };
      orderModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(existing),
        }),
      });

      const replay = await service.create(dto);
      expect(replay.replayed).toBe(true);
      expect(replay.guestAccessToken).toBe(derived);
      for (const field of HASH_FIELDS) expect(replay).not.toHaveProperty(field);
      for (const field of COST_FIELDS) {
        expect(replay.items[0]).not.toHaveProperty(field);
      }
    });

    it('toCustomerOrderView không mutate đầu vào và xử lý document có toObject', () => {
      const raw = {
        orderCode: 'TT2',
        idempotencyKeyHash: 'x',
        items: [{ name: 'A', price: 1, costPrice: 1, approver: 'u1' }],
      };
      const view: any = toCustomerOrderView({ ...raw, toObject: () => raw });
      expect(view.orderCode).toBe('TT2');
      expect(view).not.toHaveProperty('idempotencyKeyHash');
      expect(view.items[0]).not.toHaveProperty('costPrice');
      expect(view.items[0]).not.toHaveProperty('approver');
      expect(raw.items[0]).toHaveProperty('costPrice');
      expect(raw).toHaveProperty('idempotencyKeyHash');
    });
  });

  describe('SEC-013: giới hạn items/quantity của preview & create', () => {
    const makeItems = (count: number, quantity = 1) =>
      Array.from({ length: count }, () => ({
        product: new Types.ObjectId().toString(),
        quantity,
      }));

    it('CheckoutPreviewDto từ chối quá ORDER_MAX_ITEMS dòng', async () => {
      const tooMany = plainToInstance(CheckoutPreviewDto, {
        items: makeItems(ORDER_MAX_ITEMS + 1),
      });
      const errors = await validate(tooMany);
      expect(errors.some((e) => e.property === 'items')).toBe(true);

      const ok = plainToInstance(CheckoutPreviewDto, {
        items: makeItems(ORDER_MAX_ITEMS),
      });
      expect(await validate(ok)).toHaveLength(0);
    });

    it('CreateOrderDto từ chối quá ORDER_MAX_ITEMS dòng', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        items: makeItems(ORDER_MAX_ITEMS + 1),
        shippingAddress: '123 Nguyễn Trãi',
        phone: '0901234567',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'items')).toBe(true);
    });

    it('từ chối quantity vượt ORDER_ITEM_MAX_QUANTITY ở cả preview và create', async () => {
      const preview = plainToInstance(CheckoutPreviewDto, {
        items: makeItems(1, ORDER_ITEM_MAX_QUANTITY + 1),
      });
      expect((await validate(preview)).length).toBeGreaterThan(0);

      const create = plainToInstance(CreateOrderDto, {
        items: makeItems(1, ORDER_ITEM_MAX_QUANTITY + 1),
        shippingAddress: '123 Nguyễn Trãi',
        phone: '0901234567',
      });
      expect((await validate(create)).length).toBeGreaterThan(0);

      const okPreview = plainToInstance(CheckoutPreviewDto, {
        items: makeItems(1, ORDER_ITEM_MAX_QUANTITY),
      });
      expect(await validate(okPreview)).toHaveLength(0);
    });
  });
});
