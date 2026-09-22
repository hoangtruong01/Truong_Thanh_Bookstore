import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CartService, DEFAULT_SHIPPING_FEE } from './cart.service';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product } from '../products/schemas/product.schema';
import { Promotion } from '../promotions/schemas/promotion.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductStatus, DiscountType } from '../../common/enums';

interface MockCartItem {
  product?: string;
  name?: string;
  price: number;
  discountPrice?: number;
  quantity: number;
}

interface MockAppliedVoucher {
  code: string;
  name?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  status?: boolean;
}

interface MockCart {
  _id?: string;
  user?: string;
  items: MockCartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  appliedVoucher?: MockAppliedVoucher | null;
  isModified?: jest.Mock<boolean>;
  save?: jest.Mock<Promise<MockCart>>;
}

interface MockCartModelType {
  (dto: Partial<MockCart>): MockCart;
  findOne: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
}

describe('CartService Unit Tests', () => {
  let cartService: CartService;

  const validUserId = '507f1f77bcf86cd799439012';
  const validProductId = '507f1f77bcf86cd799439011';
  const validProductId2 = '507f1f77bcf86cd799439013';

  const mockProduct = {
    _id: validProductId,
    name: 'Bút gel xóa được Pilot',
    price: 35000,
    discountPrice: 30000,
    stock: 20,
    status: ProductStatus.ACTIVE,
    isDeleted: false,
    images: ['https://example.com/pen.jpg'],
  };

  const createMockQuery = <T>(result: T) => ({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  const fnConstructor = jest
    .fn()
    .mockImplementation((dto: Partial<MockCart>) => ({
      ...dto,
      _id: '507f1f77bcf86cd799439099',
      isModified: jest.fn().mockReturnValue(false),
      save: jest.fn().mockImplementation(function (this: MockCart) {
        return Promise.resolve(this);
      }) as jest.Mock<Promise<MockCart>>,
    })) as unknown as MockCartModelType;

  const mockCartModel: MockCartModelType = fnConstructor;

  mockCartModel.findOne = jest.fn();
  mockCartModel.findById = jest.fn();
  mockCartModel.create = jest.fn();

  const mockProductModel = {
    findById: jest.fn(),
  };

  const mockPromotionModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getModelToken(Cart.name), useValue: mockCartModel },
        { provide: getModelToken(Product.name), useValue: mockProductModel },
        {
          provide: getModelToken(Promotion.name),
          useValue: mockPromotionModel,
        },
      ],
    }).compile();

    cartService = module.get<CartService>(CartService);
  });

  describe('calculateCartTotals', () => {
    it('should charge 30,000 VND shipping if subtotal < 299,000 VND', () => {
      const cart: Partial<MockCart> = {
        items: [{ price: 100000, discountPrice: 0, quantity: 2 }],
      };
      cartService.calculateCartTotals(cart as unknown as CartDocument);
      expect(cart.subtotal).toBe(200000);
      expect(cart.shippingFee).toBe(DEFAULT_SHIPPING_FEE);
      expect(cart.totalPrice).toBe(230000);
    });

    it('should offer 0 VND free shipping if subtotal >= 299,000 VND', () => {
      const cart: Partial<MockCart> = {
        items: [{ price: 150000, discountPrice: 0, quantity: 2 }],
      };
      cartService.calculateCartTotals(cart as unknown as CartDocument);
      expect(cart.subtotal).toBe(300000);
      expect(cart.shippingFee).toBe(0);
      expect(cart.totalPrice).toBe(300000);
    });

    it('should correctly calculate percent discount voucher capped by maxDiscount', () => {
      const cart: Partial<MockCart> = {
        items: [{ price: 200000, discountPrice: 0, quantity: 2 }],
        appliedVoucher: {
          code: 'SALE20',
          discountType: DiscountType.PERCENT,
          discountValue: 20,
          maxDiscount: 50000,
          minOrderValue: 200000,
        },
      };
      cartService.calculateCartTotals(cart as unknown as CartDocument);
      expect(cart.subtotal).toBe(400000);
      expect(cart.shippingFee).toBe(0);
      // 20% of 400k = 80k, capped at 50k
      expect(cart.discountAmount).toBe(50000);
      expect(cart.totalPrice).toBe(350000);
    });
  });

  describe('addToCart', () => {
    it('should throw NotFoundException if product does not exist or is inactive', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        cartService.addToCart(validUserId, {
          productId: validProductId,
          quantity: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if product stock is 0', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockProduct, stock: 0 }),
      });

      await expect(
        cartService.addToCart(validUserId, {
          productId: validProductId,
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully add new item to cart and calculate totals', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      const userCart: MockCart = {
        _id: '507f1f77bcf86cd799439099',
        user: validUserId,
        items: [],
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        totalPrice: 0,
        save: jest.fn().mockImplementation(function (this: MockCart) {
          return Promise.resolve(this);
        }) as jest.Mock<Promise<MockCart>>,
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userCart),
      });

      mockCartModel.findById.mockReturnValue(createMockQuery(userCart));

      await cartService.addToCart(validUserId, {
        productId: validProductId,
        quantity: 2,
      });

      expect(userCart.items.length).toBe(1);
      expect(userCart.subtotal).toBe(60000);
      expect(userCart.shippingFee).toBe(30000);
      expect(userCart.totalPrice).toBe(90000);
    });
  });

  describe('updateItemQuantity', () => {
    it('should throw BadRequestException if new quantity exceeds stock', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockProduct, stock: 5 }),
      });

      await expect(
        cartService.updateItemQuantity(validUserId, validProductId, {
          quantity: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully update quantity of existing item', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      const userCart: MockCart = {
        _id: '507f1f77bcf86cd799439099',
        user: validUserId,
        items: [
          {
            product: validProductId,
            name: mockProduct.name,
            price: 35000,
            discountPrice: 30000,
            quantity: 2,
          },
        ],
        subtotal: 60000,
        shippingFee: 30000,
        discountAmount: 0,
        totalPrice: 90000,
        save: jest.fn().mockImplementation(function (this: MockCart) {
          return Promise.resolve(this);
        }) as jest.Mock<Promise<MockCart>>,
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userCart),
      });
      mockCartModel.findById.mockReturnValue(createMockQuery(userCart));

      await cartService.updateItemQuantity(validUserId, validProductId, {
        quantity: 4,
      });

      expect(userCart.items[0].quantity).toBe(4);
      expect(userCart.subtotal).toBe(120000);
    });
  });

  describe('removeItem and clearCart', () => {
    it('should remove item and recalculate totals', async () => {
      const userCart: MockCart = {
        _id: '507f1f77bcf86cd799439099',
        user: validUserId,
        items: [
          { product: validProductId, quantity: 1, price: 30000 },
          { product: validProductId2, quantity: 2, price: 50000 },
        ],
        subtotal: 130000,
        shippingFee: 30000,
        discountAmount: 0,
        totalPrice: 160000,
        save: jest.fn().mockImplementation(function (this: MockCart) {
          return Promise.resolve(this);
        }) as jest.Mock<Promise<MockCart>>,
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userCart),
      });
      mockCartModel.findById.mockReturnValue(createMockQuery(userCart));

      await cartService.removeItem(validUserId, validProductId);
      expect(userCart.items.length).toBe(1);
      expect(userCart.items[0].product).toBe(validProductId2);
    });

    it('should clear cart and reset all totals and voucher', async () => {
      const userCart: MockCart = {
        user: validUserId,
        items: [{ product: validProductId, quantity: 2, price: 30000 }],
        subtotal: 60000,
        shippingFee: 30000,
        discountAmount: 0,
        totalPrice: 90000,
        appliedVoucher: {
          code: 'SALE',
          discountType: DiscountType.FIXED,
          discountValue: 10000,
        },
        save: jest.fn().mockImplementation(function (this: MockCart) {
          return Promise.resolve(this);
        }) as jest.Mock<Promise<MockCart>>,
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userCart),
      });

      const result = await cartService.clearCart(validUserId);
      expect(result.items.length).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.appliedVoucher).toBeFalsy();
    });
  });

  describe('applyVoucher and removeVoucher', () => {
    it('should throw NotFoundException if voucher code does not exist', async () => {
      const userCart: Partial<MockCart> = {
        items: [{ product: validProductId, quantity: 1, price: 100000 }],
      };
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userCart),
      });
      mockPromotionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        cartService.applyVoucher(validUserId, { code: 'INVALID' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if subtotal is less than minOrderValue', async () => {
      const userCart: Partial<MockCart> = {
        items: [
          {
            product: validProductId,
            quantity: 1,
            price: 100000,
            discountPrice: 0,
          },
        ],
        subtotal: 100000,
      };
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userCart),
      });
      mockPromotionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          code: 'BIGSALE',
          name: 'Giảm 50K',
          discountType: DiscountType.FIXED,
          discountValue: 50000,
          minOrderValue: 200000,
          status: true,
        }),
      });

      await expect(
        cartService.applyVoucher(validUserId, { code: 'BIGSALE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should apply valid voucher and calculate discount', async () => {
      const userCart: MockCart = {
        _id: '507f1f77bcf86cd799439099',
        items: [
          {
            product: validProductId,
            quantity: 2,
            price: 150000,
            discountPrice: 0,
          },
        ],
        subtotal: 300000,
        shippingFee: 0,
        discountAmount: 0,
        totalPrice: 300000,
        save: jest.fn().mockImplementation(function (this: MockCart) {
          return Promise.resolve(this);
        }) as jest.Mock<Promise<MockCart>>,
      };
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userCart),
      });
      mockPromotionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          code: 'FREESHIP50',
          name: 'Giảm 50K',
          discountType: DiscountType.FIXED,
          discountValue: 50000,
          minOrderValue: 200000,
          status: true,
        }),
      });
      mockCartModel.findById.mockReturnValue(createMockQuery(userCart));

      await cartService.applyVoucher(validUserId, { code: 'FREESHIP50' });
      expect(userCart.appliedVoucher?.code).toBe('FREESHIP50');
      expect(userCart.discountAmount).toBe(50000);
      expect(userCart.totalPrice).toBe(250000);
    });
  });
});
