import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CartService } from './cart.service';
import { Cart } from './schemas/cart.schema';
import { Product } from '../products/schemas/product.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '../../common/enums';

describe('CartService Unit Tests', () => {
  let cartService: CartService;

  const validUserId = '507f1f77bcf86cd799439012';
  const validProductId = '507f1f77bcf86cd799439011';

  const mockProduct = {
    _id: validProductId,
    name: 'Bút gel xóa được Pilot',
    price: 35000,
    discountPrice: 30000,
    stock: 20,
    status: ProductStatus.ACTIVE,
    images: ['https://example.com/pen.jpg'],
  };

  const mockCartModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  const mockProductModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getModelToken(Cart.name), useValue: mockCartModel },
        { provide: getModelToken(Product.name), useValue: mockProductModel },
      ],
    }).compile();

    cartService = module.get<CartService>(CartService);
  });

  describe('addToCart', () => {
    it('should throw NotFoundException if product does not exist', async () => {
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

    it('should throw BadRequestException if requested quantity exceeds stock', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockProduct, stock: 2 }),
      });

      await expect(
        cartService.addToCart(validUserId, {
          productId: validProductId,
          quantity: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('clearCart', () => {
    it('should empty cart items and set subtotal to 0', async () => {
      const userCart: any = {
        user: validUserId,
        items: [{ product: validProductId, quantity: 2, price: 30000 }],
        subtotal: 60000,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockCartModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userCart),
      });

      const result = await cartService.clearCart(validUserId);
      expect(result.items.length).toBe(0);
      expect(result.subtotal).toBe(0);
    });
  });
});
