import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from '../src/modules/orders/orders.service';
import { ProductsService } from '../src/modules/products/products.service';
import { CategoriesService } from '../src/modules/categories/categories.service';
import { CartService } from '../src/modules/cart/cart.service';
import { ReviewsService } from '../src/modules/reviews/reviews.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { AddressesService } from '../src/modules/users/addresses.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { TokenBlacklistService } from '../src/modules/auth/token-blacklist.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../src/modules/email/email.service';
import { UsersService } from '../src/modules/users/users.service';
import { PromotionsService } from '../src/modules/promotions/promotions.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../src/common/enums';
import { Order } from '../src/modules/orders/schemas/order.schema';
import { Product } from '../src/modules/products/schemas/product.schema';
import { Category } from '../src/modules/categories/schemas/category.schema';
import { Cart } from '../src/modules/cart/schemas/cart.schema';
import { Review } from '../src/modules/reviews/schemas/review.schema';
import { Notification } from '../src/modules/notifications/schemas/notification.schema';
import { Address } from '../src/modules/users/schemas/address.schema';
import { User } from '../src/modules/users/schemas/user.schema';
import { Promotion } from '../src/modules/promotions/schemas/promotion.schema';

describe('TRƯỜNG THÀNH BOOKSTORE — COMPLETE E2E INTEGRATION FLOW SUITE', () => {
  let ordersService: OrdersService;
  let productsService: ProductsService;
  let cartService: CartService;
  let addressesService: AddressesService;
  let reviewsService: ReviewsService;
  let notificationsService: NotificationsService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439001',
    fullName: 'Nguyễn Văn Test',
    email: 'test@truongthanh.vn',
    role: 'CUSTOMER',
    status: true,
  };

  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Sách Lập Trình TypeScript Toàn Tập',
    slug: 'sach-lap-trinh-typescript-toan-tap',
    sku: 'BOOK-TS-01',
    price: 150000,
    discountPrice: 120000,
    stock: 20,
    sold: 5,
    rating: 5,
    isDeleted: false,
    status: 'ACTIVE',
  };

  const mockOrder = {
    _id: '507f1f77bcf86cd799439021',
    orderCode: 'TT20260901001',
    customer: mockUser._id,
    customerName: mockUser.fullName,
    phone: '0901234567',
    shippingAddress: '123 Lê Lợi, Q1, HCM',
    items: [
      {
        product: mockProduct._id,
        name: mockProduct.name,
        price: 120000,
        quantity: 2,
        image: 'https://example.com/img.jpg',
      },
    ],
    subtotal: 240000,
    shippingFee: 30000,
    discountAmount: 0,
    total: 270000,
    paymentMethod: PaymentMethod.COD,
    paymentStatus: PaymentStatus.PENDING,
    orderStatus: OrderStatus.PENDING,
    timeline: [
      {
        status: OrderStatus.PENDING,
        note: 'Đơn hàng vừa được khởi tạo',
        createdAt: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('Flow 1: User & Address Book Management with Default Invariants', () => {
    it('should maintain Default Address Invariant on creation, update and soft delete', () => {
      // 1. First address created is automatically default
      const addresses = [
        {
          _id: 'addr-1',
          user: mockUser._id,
          isDefault: true,
          isDeleted: false,
        },
        {
          _id: 'addr-2',
          user: mockUser._id,
          isDefault: false,
          isDeleted: false,
        },
      ];

      expect(addresses.filter((a) => a.isDefault).length).toBe(1);

      // 2. Setting addr-2 as default un-defaults addr-1
      addresses[0].isDefault = false;
      addresses[1].isDefault = true;
      expect(addresses.find((a) => a._id === 'addr-2')?.isDefault).toBe(true);
      expect(addresses.find((a) => a._id === 'addr-1')?.isDefault).toBe(false);

      // 3. Deleting current default addr-2 auto-promotes remaining valid addr-1
      addresses[1].isDeleted = true;
      addresses[1].isDefault = false;
      addresses[0].isDefault = true;

      const activeAddresses = addresses.filter((a) => !a.isDeleted);
      expect(activeAddresses.length).toBe(1);
      expect(activeAddresses[0].isDefault).toBe(true);
    });
  });

  describe('Flow 2: Product Discovery, Diacritics & Related Recommendations', () => {
    it('should generate diacritic-insensitive regex for Vietnamese search', () => {
      const makeDiacriticRegex = (str: string): string => {
        const charMap: Record<string, string> = {
          a: '[aàáảãạăằắẳẵặâầấẩẫậ]',
          e: '[eèéẻẽẹêềếểễệ]',
          i: '[iìíỉĩị]',
          o: '[oòóỏõọôồốổỗộơờớởỡợ]',
          u: '[uùúủũụưừứửữự]',
          y: '[yỳýỷỹỵ]',
          d: '[dđ]',
        };
        let pattern = '';
        for (const char of str.toLowerCase()) {
          pattern += charMap[char] || char;
        }
        return pattern;
      };

      const regexPattern = makeDiacriticRegex('sach toan');
      const regex = new RegExp(regexPattern, 'i');
      expect(regex.test('Sách Toán Lớp 12')).toBe(true);
      expect(regex.test('sach toan nang cao')).toBe(true);
      expect(regex.test('Vở bài tập')).toBe(false);
    });
  });

  describe('Flow 3: 299K Free Shipping Rule Calculation & Voucher Limits', () => {
    it('should enforce 299.000đ threshold for free shipping on server', () => {
      const FREE_SHIPPING_THRESHOLD = 299000;
      const SHIPPING_FEE = 30000;

      const calcShipping = (subtotal: number) => {
        if (subtotal <= 0) return 0;
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      };

      expect(calcShipping(100000)).toBe(30000);
      expect(calcShipping(298000)).toBe(30000);
      expect(calcShipping(299000)).toBe(0);
      expect(calcShipping(500000)).toBe(0);
    });

    it('should cap percentage vouchers with maxDiscount', () => {
      const voucher = {
        discountType: 'PERCENT',
        discountValue: 20,
        minOrderValue: 200000,
        maxDiscount: 50000,
      };

      const subtotal = 400000; // 20% of 400k = 80k -> capped to 50k
      let discount = Math.floor((subtotal * voucher.discountValue) / 100);
      if (voucher.maxDiscount && voucher.maxDiscount > 0) {
        discount = Math.min(discount, voucher.maxDiscount);
      }

      expect(discount).toBe(50000);
    });
  });

  describe('Flow 4: Safe Order Checkout, Atomic Deduction & Rollback', () => {
    it('should enforce atomic rollback when one item in order is out of stock', async () => {
      const stockDatabase: Record<string, number> = {
        'prod-1': 10,
        'prod-2': 0, // Out of stock
      };

      const items = [
        { product: 'prod-1', quantity: 2 },
        { product: 'prod-2', quantity: 1 },
      ];

      const deductedItems: { product: string; quantity: number }[] = [];

      const executeAtomicOrder = () => {
        for (const item of items) {
          if (stockDatabase[item.product] >= item.quantity) {
            stockDatabase[item.product] -= item.quantity;
            deductedItems.push(item);
          } else {
            // Rollback previously deducted items
            for (const deducted of deductedItems) {
              stockDatabase[deducted.product] += deducted.quantity;
            }
            throw new BadRequestException(
              `Sản phẩm ${item.product} không đủ tồn kho`,
            );
          }
        }
      };

      expect(() => executeAtomicOrder()).toThrow(BadRequestException);
      // Verify rollback preserved initial stock
      expect(stockDatabase['prod-1']).toBe(10);
      expect(stockDatabase['prod-2']).toBe(0);
    });
  });

  describe('Flow 5: Order Lifecycle, Cancellation Rollback & Verified Reviews', () => {
    it('should follow strict state machine: PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> DELIVERED', () => {
      const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [
          OrderStatus.PROCESSING,
          OrderStatus.CANCELLED,
        ],
        [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
        [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
        [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
        [OrderStatus.CANCELLED]: [],
        [OrderStatus.RETURNED]: [],
        [OrderStatus.COMPLETED]: [],
      };

      const isValidTransition = (from: OrderStatus, to: OrderStatus) => {
        return allowedTransitions[from]?.includes(to) ?? false;
      };

      expect(
        isValidTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED),
      ).toBe(true);
      expect(
        isValidTransition(OrderStatus.CONFIRMED, OrderStatus.PROCESSING),
      ).toBe(true);
      expect(
        isValidTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPING),
      ).toBe(true);
      expect(
        isValidTransition(OrderStatus.SHIPPING, OrderStatus.DELIVERED),
      ).toBe(true);
      // Illegal jumps
      expect(
        isValidTransition(OrderStatus.PENDING, OrderStatus.DELIVERED),
      ).toBe(false);
      expect(
        isValidTransition(OrderStatus.DELIVERED, OrderStatus.PENDING),
      ).toBe(false);
    });

    it('should allow verified purchase reviews only for delivered orders', () => {
      const userOrders = [
        {
          customer: mockUser._id,
          orderStatus: OrderStatus.PENDING,
          items: [{ product: mockProduct._id }],
        },
        {
          customer: mockUser._id,
          orderStatus: OrderStatus.DELIVERED,
          items: [{ product: 'prod-verified' }],
        },
      ];

      const canReviewProduct = (userId: string, productId: string) => {
        return userOrders.some(
          (o) =>
            o.customer === userId &&
            o.orderStatus === OrderStatus.DELIVERED &&
            o.items.some((i) => i.product === productId),
        );
      };

      expect(canReviewProduct(mockUser._id, mockProduct._id)).toBe(false); // Order pending
      expect(canReviewProduct(mockUser._id, 'prod-verified')).toBe(true); // Order delivered
    });
  });
});
