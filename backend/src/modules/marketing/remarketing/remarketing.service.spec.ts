import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RemarketingService } from './remarketing.service';
import { RemarketingLog, RemarketingType } from './schemas/remarketing-log.schema';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { Cart } from '../../cart/schemas/cart.schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { OutboxService } from '../../outbox/outbox.service';

describe('RemarketingService (Release R4 - OPT-02)', () => {
  let service: RemarketingService;
  let mockLogModel: any;
  let mockProductModel: any;
  let mockUserModel: any;
  let mockCartModel: any;
  let mockNotificationsService: any;
  let mockOutboxService: any;

  const productId = new Types.ObjectId();
  const userId = new Types.ObjectId();

  const mockProduct = {
    _id: productId,
    name: 'Bút máy Picasso Cao Cấp',
    slug: 'but-may-picasso',
    stock: 20,
    price: 350000,
  };

  const mockUser = {
    _id: userId,
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    wishlist: [productId],
  };

  beforeEach(async () => {
    mockLogModel = {
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue({ _id: 'log_1' }),
      countDocuments: jest.fn(),
    };

    mockProductModel = {
      findById: jest.fn(),
    };

    mockUserModel = {
      find: jest.fn(),
    };

    mockCartModel = {
      find: jest.fn(),
    };

    mockNotificationsService = {
      create: jest.fn().mockResolvedValue({ _id: 'notif_1' }),
    };

    mockOutboxService = {
      recordEvent: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemarketingService,
        {
          provide: getModelToken(RemarketingLog.name),
          useValue: mockLogModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Cart.name),
          useValue: mockCartModel,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
      ],
    }).compile();

    service = module.get<RemarketingService>(RemarketingService);
  });

  describe('triggerRestockAlert()', () => {
    it('should dispatch restock alerts to users who wishlisted the product', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUser]),
      });

      mockLogModel.findOne.mockResolvedValue(null); // No recent alert in 24h

      const res = await service.triggerRestockAlert(productId.toString(), 25);

      expect(res.success).toBe(true);
      expect(res.notifiedCount).toBe(1);
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId.toString(),
          type: 'promotion',
          title: expect.stringContaining('có hàng trở lại'),
        }),
      );
      expect(mockLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: RemarketingType.RESTOCK,
          targetId: productId.toString(),
        }),
      );
    });

    it('should respect 24h frequency cap and not duplicate restock notification', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUser]),
      });

      mockLogModel.findOne.mockResolvedValue({ _id: 'recent_log' }); // Already notified

      const res = await service.triggerRestockAlert(productId.toString(), 25);

      expect(res.notifiedCount).toBe(0);
      expect(mockNotificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('triggerPriceDropAlert()', () => {
    it('should dispatch price drop alerts when newPrice < oldPrice', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUser]),
      });

      mockLogModel.findOne.mockResolvedValue(null);

      const res = await service.triggerPriceDropAlert(productId.toString(), 350000, 290000);

      expect(res.success).toBe(true);
      expect(res.notifiedCount).toBe(1);
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId.toString(),
          type: 'promotion',
          title: expect.stringContaining('Giảm giá sản phẩm'),
        }),
      );
    });

    it('should not dispatch if newPrice is not lower than oldPrice', async () => {
      const res = await service.triggerPriceDropAlert(productId.toString(), 350000, 350000);
      expect(res.notifiedCount).toBe(0);
      expect(mockNotificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('triggerAbandonedCartRemarketing()', () => {
    it('should notify users with abandoned carts and respect 7-day cap', async () => {
      const mockCart = {
        _id: new Types.ObjectId(),
        userId,
        items: [{ product: productId, quantity: 1 }],
      };

      mockCartModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockCart]),
      });

      mockLogModel.findOne.mockResolvedValue(null); // No notice in 7 days

      const res = await service.triggerAbandonedCartRemarketing(120, 48);

      expect(res.success).toBe(true);
      expect(res.notifiedCount).toBe(1);
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId.toString(),
          type: 'promotion',
          title: expect.stringContaining('sản phẩm đang chờ trong giỏ hàng'),
        }),
      );
    });
  });

  describe('getRemarketingAnalytics()', () => {
    it('should return aggregated counts and conversion rate', async () => {
      mockLogModel.countDocuments
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(40)  // restock
        .mockResolvedValueOnce(30)  // price drop
        .mockResolvedValueOnce(30)  // abandoned cart
        .mockResolvedValueOnce(15); // converted

      const stats = await service.getRemarketingAnalytics();

      expect(stats.totalDispatched).toBe(100);
      expect(stats.byType.restock).toBe(40);
      expect(stats.byType.priceDrop).toBe(30);
      expect(stats.byType.abandonedCart).toBe(30);
      expect(stats.totalConverted).toBe(15);
      expect(stats.conversionRate).toBe(15);
    });
  });
});
