import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { SalesChannelsService } from './sales-channels.service';
import {
  ChannelAccount,
  ChannelProvider,
  ChannelStatus,
} from './schemas/channel-account.schema';
import {
  ChannelSkuMapping,
  MappingSyncStatus,
} from './schemas/channel-sku-mapping.schema';
import { ChannelWebhookInbox } from './schemas/channel-webhook-inbox.schema';
import {
  ChannelException,
  ChannelExceptionType,
} from './schemas/channel-exception.schema';
import {
  ChannelSettlement,
  SettlementStatus,
} from './schemas/channel-settlement.schema';
import { Order } from '../orders/schemas/order.schema';
import { ProductsService } from '../products/products.service';
import { OrderSource } from '../../common/enums';

describe('SalesChannelsService (Release R3 — Channel Pilot)', () => {
  let service: SalesChannelsService;
  let mockAccountModel: any;
  let mockMappingModel: any;
  let mockInboxModel: any;
  let mockExceptionModel: any;
  let mockSettlementModel: any;
  let mockOrderModel: any;
  let mockProductsService: any;

  beforeEach(async () => {
    mockAccountModel = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'acc123' }),
      };
    };
    mockAccountModel.findOne = jest.fn();
    mockAccountModel.find = jest.fn();
    mockAccountModel.findById = jest.fn();

    mockMappingModel = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'map123' }),
      };
    };
    mockMappingModel.findOne = jest.fn();
    mockMappingModel.find = jest.fn();

    mockInboxModel = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
    };
    mockInboxModel.findOne = jest.fn();

    mockExceptionModel = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'exc123' }),
      };
    };
    mockExceptionModel.find = jest.fn();
    mockExceptionModel.findById = jest.fn();

    mockSettlementModel = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'stmt123' }),
      };
    };
    mockSettlementModel.findOne = jest.fn();
    mockSettlementModel.find = jest.fn();

    mockOrderModel = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'order123' }),
      };
    };
    mockOrderModel.findOne = jest.fn();
    mockOrderModel.find = jest.fn();

    mockProductsService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesChannelsService,
        {
          provide: getModelToken(ChannelAccount.name),
          useValue: mockAccountModel,
        },
        {
          provide: getModelToken(ChannelSkuMapping.name),
          useValue: mockMappingModel,
        },
        {
          provide: getModelToken(ChannelWebhookInbox.name),
          useValue: mockInboxModel,
        },
        {
          provide: getModelToken(ChannelException.name),
          useValue: mockExceptionModel,
        },
        {
          provide: getModelToken(ChannelSettlement.name),
          useValue: mockSettlementModel,
        },
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<SalesChannelsService>(SalesChannelsService);
  });

  describe('1. Channel Account Connection & Discovery (CHN-01)', () => {
    it('should connect a TikTok Shop channel account and encrypt secret/tokens', async () => {
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.connectAccount({
        provider: ChannelProvider.TIKTOK_SHOP,
        shopId: 'tts_shop_vn_01',
        shopName: 'Trường Thành TikTok Shop Official',
        appSecret: 'secret_app_key_123',
        accessToken: 'access_token_tts_abc',
      });

      expect(res.shopName).toBe('Trường Thành TikTok Shop Official');
      expect(res.status).toBe(ChannelStatus.ACTIVE);
      expect(res.encryptedAppSecret).toBeDefined();
      expect(res.encryptedAccessToken).toBeDefined();
    });
  });

  describe('2. SKU Mapping & Sellable Stock Calculation (CHN-02)', () => {
    it('should calculate sellable stock considering pack multiplier', async () => {
      mockProductsService.findById.mockResolvedValue({
        _id: 'prod123',
        stock: 55, // 55 individual pens
      });

      // 1 box = 10 pens
      const sellableBoxes = await service.calculateSellableStock('prod123', 10);
      expect(sellableBoxes).toBe(5); // Math.floor(55 / 10) = 5 boxes

      // 1 box = 1 pen
      const sellableSingles = await service.calculateSellableStock(
        'prod123',
        1,
      );
      expect(sellableSingles).toBe(55);
    });

    it('should create SKU mapping and push initial sellable stock', async () => {
      mockProductsService.findById.mockResolvedValue({
        _id: 'prod123',
        sku: 'TL-027',
        stock: 100,
      });
      mockMappingModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.createSkuMapping({
        provider: ChannelProvider.TIKTOK_SHOP,
        shopId: 'tts_shop_vn_01',
        externalSkuId: 'ext_sku_999',
        externalProductId: 'ext_prod_888',
        externalSkuName: 'Hộp 20 Bút Bi TL-027',
        productId: '6b05606010010e99466479f0',
        sku: 'TL-027',
        packMultiplier: 20,
      });

      expect(res.externalSkuId).toBe('ext_sku_999');
      expect(res.packMultiplier).toBe(20);
      expect(res.lastStockPushed).toBe(5); // 100 / 20 = 5 packs
      expect(res.syncStatus).toBe(MappingSyncStatus.SYNCED);
    });
  });

  describe('3. Webhook Inbox, Signature & External Order Import (CHN-03)', () => {
    it('should verify valid HMAC-SHA256 signature', () => {
      const rawBody = JSON.stringify({ event: 'test', timestamp: 12345 });
      const secret = 'my_test_secret';
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const isOk = service.verifySignature(rawBody, validSignature, secret);
      expect(isOk).toBe(true);

      const isInvalid = service.verifySignature(rawBody, 'invalid_sig', secret);
      expect(isInvalid).toBe(false);
    });

    it('should handle webhook idempotency and reject duplicate eventId before ACK', async () => {
      mockInboxModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ eventId: 'evt_dup_123' }),
      });

      const res = await service.processWebhook({
        eventId: 'evt_dup_123',
        provider: ChannelProvider.TIKTOK_SHOP,
        shopId: 'tts_01',
        eventType: 'ORDER_CREATED',
        payload: { orderId: 'ord_123' },
      });

      expect(res.status).toBe('DUPLICATE');
    });

    it('should import external order and create internal Order with OrderSource.TIKTOK_SHOP', async () => {
      mockInboxModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockMappingModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          productId: 'prod123',
          packMultiplier: 1,
          sku: 'TL-027',
        }),
      });

      mockProductsService.findById.mockResolvedValue({
        _id: 'prod123',
        name: 'Bút Bi Thiên Long TL-027',
        sku: 'TL-027',
        stock: 50,
        price: 5000,
      });

      const res = await service.processWebhook({
        eventId: 'evt_order_1001',
        provider: ChannelProvider.TIKTOK_SHOP,
        shopId: 'tts_01',
        eventType: 'ORDER_CREATED',
        payload: {
          orderId: 'TTS_ORDER_9988',
          items: [
            {
              externalSkuId: 'ext_sku_01',
              quantity: 2,
              price: 5000,
            },
          ],
          subtotal: 10000,
          totalAmount: 10000,
          recipientName: 'Nguyễn Văn A',
        },
      });

      expect(res.status).toBe('PROCESSED');
      expect(res.orderId).toBeDefined();
    });

    it('should quarantine order into exception queue when SKU is unknown', async () => {
      mockInboxModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // No mapping found
      mockMappingModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.processWebhook({
        eventId: 'evt_order_1002',
        provider: ChannelProvider.TIKTOK_SHOP,
        shopId: 'tts_01',
        eventType: 'ORDER_CREATED',
        payload: {
          orderId: 'TTS_ORDER_UNKNOWN_SKU',
          items: [{ externalSkuId: 'non_existent_sku', quantity: 1 }],
        },
      });

      expect(res.status).toBe('EXCEPTION_QUARANTINED');
      expect(res.message).toContain('chưa được ánh xạ');
    });
  });

  describe('4. Settlement Reconciliation & Discrepancy Detection (CHN-04)', () => {
    it('should reconcile settlement against matching internal channel orders', async () => {
      mockOrderModel.find.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue([{ total: 10000000 }, { total: 15000000 }]),
      });

      mockSettlementModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.reconcileSettlement({
        settlementId: 'stmt_tts_01',
        provider: ChannelProvider.TIKTOK_SHOP,
        shopId: 'tts_01',
        periodStart: '2026-11-01',
        periodEnd: '2026-11-15',
        grossSalesVnd: 26000000,
        platformFeesVnd: 1000000,
        netSettlementVnd: 25000000, // matches 10m + 15m = 25m
      });

      expect(res.settlementId).toBe('stmt_tts_01');
      expect(res.internalAttributedSalesVnd).toBe(25000000);
      expect(res.discrepancyVnd).toBe(0);
      expect(res.status).toBe(SettlementStatus.RECONCILED);
    });

    it('should flag status as DISCREPANCY if net settlement does not match orders', async () => {
      mockOrderModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ total: 20000000 }]),
      });

      mockSettlementModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.reconcileSettlement({
        settlementId: 'stmt_tts_02',
        provider: ChannelProvider.TIKTOK_SHOP,
        shopId: 'tts_01',
        periodStart: '2026-11-01',
        periodEnd: '2026-11-15',
        grossSalesVnd: 25000000,
        platformFeesVnd: 1000000,
        netSettlementVnd: 24000000, // 24m vs 20m internal orders -> 4m discrepancy
      });

      expect(res.discrepancyVnd).toBe(4000000);
      expect(res.status).toBe(SettlementStatus.DISCREPANCY);
    });
  });
});
