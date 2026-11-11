import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CartService, DEFAULT_SHIPPING_FEE } from './cart.service';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product } from '../products/schemas/product.schema';
import { Promotion } from '../promotions/schemas/promotion.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductStatus, DiscountType } from '../../common/enums';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SyncCartDto } from './dto/cart.dto';
import { Types } from 'mongoose';

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
    find: jest.fn(),
  };

  /** Giả lập productModel.find({_id:{$in}}).select().lean().exec() trên một bảng sản phẩm. */
  const mockProductFind = (
    table: Record<string, Record<string, unknown> | null>,
  ) => {
    mockProductModel.find.mockImplementation(
      (filter: { _id: { $in: Array<{ toString(): string }> } }) => {
        const found = filter._id.$in
          .map((id) => table[id.toString()])
          .filter((p): p is Record<string, unknown> => !!p);
        return {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(found),
        };
      },
    );
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

  describe('getCart (batched product lookup)', () => {
    it('validates N items with ONE product query and keeps order, stock caps and snapshots', async () => {
      const deletedId = '507f1f77bcf86cd799439016';
      const missingId = '507f1f77bcf86cd799439017';
      const outOfStockId = '507f1f77bcf86cd799439018';
      mockProductFind({
        [validProductId]: { ...mockProduct, name: 'Bút gel (tên mới)' },
        [validProductId2]: {
          ...mockProduct,
          _id: validProductId2,
          name: 'Vở Campus',
          price: 20000,
          discountPrice: 0,
          stock: 3,
          images: [],
        },
        [deletedId]: { ...mockProduct, _id: deletedId, isDeleted: true },
        [outOfStockId]: { ...mockProduct, _id: outOfStockId, stock: 0 },
      });

      const cart = {
        _id: '507f1f77bcf86cd799439099',
        user: validUserId,
        items: [
          // populated product object (đường đi thật sau populate)
          {
            product: { _id: new Types.ObjectId(validProductId) },
            name: 'Bút gel xóa được Pilot',
            price: 35000,
            discountPrice: 30000,
            image: 'old.jpg',
            quantity: 2,
          },
          // populate trả null vì sản phẩm đã bị xóa cứng
          { product: null, name: 'X', price: 1, quantity: 1 },
          { product: new Types.ObjectId(deletedId), price: 1, quantity: 1 },
          { product: new Types.ObjectId(missingId), price: 1, quantity: 1 },
          { product: new Types.ObjectId(outOfStockId), price: 1, quantity: 1 },
          {
            product: new Types.ObjectId(validProductId2),
            name: 'Vở Campus',
            price: 20000,
            discountPrice: 0,
            image: 'keep.jpg',
            quantity: 10,
          },
        ],
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        totalPrice: 0,
        appliedVoucher: null,
        isModified: jest.fn().mockReturnValue(false),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockCartModel.findOne.mockReturnValue(createMockQuery(cart));
      mockCartModel.findById.mockReturnValue(createMockQuery(cart));

      const result = await cartService.getCart(validUserId);

      expect(mockProductModel.find).toHaveBeenCalledTimes(1);
      expect(mockProductModel.findById).not.toHaveBeenCalled();
      expect(result).toBe(cart);
      expect(
        cart.items.map((i) => ({
          product: (i.product as Types.ObjectId | null)?.toString(),
          name: i.name,
          price: i.price,
          discountPrice: i.discountPrice,
          image: (i as { image?: string }).image,
          quantity: i.quantity,
        })),
      ).toEqual([
        {
          product: validProductId,
          name: 'Bút gel (tên mới)',
          price: 35000,
          discountPrice: 30000,
          image: 'https://example.com/pen.jpg',
          quantity: 2,
        },
        {
          product: validProductId2,
          name: 'Vở Campus',
          price: 20000,
          discountPrice: 0,
          image: 'keep.jpg',
          quantity: 3,
        },
      ]);
      expect(cart.subtotal).toBe(2 * 30000 + 3 * 20000);
      expect(cart.save).toHaveBeenCalledTimes(1);
    });

    it('does not query products at all for an empty cart', async () => {
      const cart = {
        _id: '507f1f77bcf86cd799439099',
        items: [],
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        totalPrice: 0,
        isModified: jest.fn().mockReturnValue(false),
        save: jest.fn(),
      };
      mockCartModel.findOne.mockReturnValue(createMockQuery(cart));
      mockCartModel.findById.mockReturnValue(createMockQuery(cart));

      await cartService.getCart(validUserId);

      expect(mockProductModel.find).not.toHaveBeenCalled();
      expect(cart.save).not.toHaveBeenCalled();
    });
  });

  describe('syncCart', () => {
    const products: Record<string, Record<string, unknown> | null> = {
      [validProductId]: mockProduct,
      [validProductId2]: {
        ...mockProduct,
        _id: validProductId2,
        name: 'Vở Campus',
        price: 20000,
        discountPrice: 0,
        stock: 3,
      },
    };

    const buildCart = (items: MockCartItem[]): MockCart => ({
      _id: '507f1f77bcf86cd799439099',
      user: validUserId,
      items,
      subtotal: 0,
      shippingFee: 0,
      discountAmount: 0,
      totalPrice: 0,
      save: jest.fn().mockImplementation(function (this: MockCart) {
        return Promise.resolve(this);
      }) as jest.Mock<Promise<MockCart>>,
    });

    const useCart = (cart: MockCart) => {
      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(cart),
      });
      mockCartModel.findById.mockReturnValue(createMockQuery(cart));
    };

    beforeEach(() => {
      mockProductFind(products);
    });

    it('loads all payload products with ONE query (no N+1) and never calls findById', async () => {
      const cart = buildCart([]);
      useCart(cart);
      const missingId = '507f1f77bcf86cd799439015';

      await cartService.syncCart(validUserId, {
        items: [
          { productId: validProductId, quantity: 1 },
          { productId: missingId, quantity: 1 },
          { productId: validProductId2, quantity: 2 },
        ],
        mode: 'replace',
      });

      expect(mockProductModel.find).toHaveBeenCalledTimes(1);
      expect(mockProductModel.findById).not.toHaveBeenCalled();
      // Thứ tự dòng giữ nguyên theo payload, sản phẩm không tồn tại bị bỏ qua.
      expect(cart.items.map((i) => String(i.product))).toEqual([
        validProductId,
        validProductId2,
      ]);
      expect(cart.items.map((i) => i.quantity)).toEqual([1, 2]);
    });

    it('treats a legacy product with no stored stock as stock 0 (lean skips schema defaults)', async () => {
      const legacyId = '507f1f77bcf86cd799439016';
      const legacy: Record<string, unknown> = { ...mockProduct, _id: legacyId };
      delete legacy.stock;
      mockProductFind({ ...products, [legacyId]: legacy });
      const cart = buildCart([]);
      useCart(cart);

      await cartService.syncCart(validUserId, {
        items: [
          { productId: legacyId, quantity: 2 },
          { productId: validProductId2, quantity: 1 },
        ],
        mode: 'replace',
      });

      expect(cart.items.some((i) => String(i.product) === legacyId)).toBe(
        false,
      );
      expect(cart.items.every((i) => Number.isFinite(i.quantity))).toBe(true);
    });

    it('merge (default, backward compatible): adds quantities and keeps server-only items', async () => {
      const cart = buildCart([
        {
          product: validProductId,
          price: 35000,
          discountPrice: 30000,
          quantity: 2,
        },
        { product: validProductId2, price: 20000, quantity: 1 },
      ]);
      useCart(cart);

      await cartService.syncCart(validUserId, {
        items: [{ productId: validProductId, quantity: 3 }],
      });

      expect(cart.items).toHaveLength(2);
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.items[1].quantity).toBe(1);
    });

    it('merge caps the summed quantity at stock', async () => {
      const cart = buildCart([
        { product: validProductId2, price: 20000, quantity: 2 },
      ]);
      useCart(cart);

      await cartService.syncCart(validUserId, {
        items: [{ productId: validProductId2, quantity: 2 }],
        mode: 'merge',
      });

      expect(cart.items[0].quantity).toBe(3);
    });

    it('replace: sets quantities from the payload and removes server items missing from it', async () => {
      const cart = buildCart([
        {
          product: validProductId,
          price: 35000,
          discountPrice: 30000,
          quantity: 2,
        },
        { product: validProductId2, price: 20000, quantity: 1 },
      ]);
      useCart(cart);

      await cartService.syncCart(validUserId, {
        items: [{ productId: validProductId, quantity: 3 }],
        mode: 'replace',
      });

      expect(cart.items).toHaveLength(1);
      expect(String(cart.items[0].product)).toBe(validProductId);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.subtotal).toBe(90000);
    });

    it('replace is idempotent: repeated syncs never double quantities (Cart page remount bug)', async () => {
      const cart = buildCart([]);
      useCart(cart);
      const payload = {
        items: [
          { productId: validProductId, quantity: 2 },
          { productId: validProductId2, quantity: 1 },
        ],
        mode: 'replace' as const,
      };

      await cartService.syncCart(validUserId, payload);
      await cartService.syncCart(validUserId, payload);
      await cartService.syncCart(validUserId, payload);

      expect(cart.items.map((item) => item.quantity)).toEqual([2, 1]);
    });

    it('replace caps at stock and drops payload lines that are no longer available', async () => {
      const unavailableId = '507f1f77bcf86cd799439014';
      products[unavailableId] = {
        ...mockProduct,
        _id: unavailableId,
        stock: 0,
      };
      const cart = buildCart([
        { product: unavailableId, price: 35000, quantity: 1 },
      ]);
      useCart(cart);

      await cartService.syncCart(validUserId, {
        items: [
          { productId: validProductId2, quantity: 10 },
          { productId: unavailableId, quantity: 1 },
        ],
        mode: 'replace',
      });

      expect(cart.items).toHaveLength(1);
      expect(String(cart.items[0].product)).toBe(validProductId2);
      expect(cart.items[0].quantity).toBe(3);
      delete products[unavailableId];
    });

    it('SyncCartDto validates mode and caps the number of lines', async () => {
      const item = { productId: validProductId, quantity: 1 };
      const errorsFor = async (payload: Record<string, unknown>) =>
        validate(plainToInstance(SyncCartDto, payload));

      expect(await errorsFor({ items: [item] })).toHaveLength(0);
      expect(await errorsFor({ items: [item], mode: 'replace' })).toHaveLength(
        0,
      );
      const badMode = await errorsFor({ items: [item], mode: 'overwrite' });
      expect(badMode.map((error) => error.property)).toContain('mode');
      const tooMany = await errorsFor({
        items: Array.from({ length: 201 }, () => item),
      });
      expect(tooMany.map((error) => error.property)).toContain('items');
    });
  });
});
