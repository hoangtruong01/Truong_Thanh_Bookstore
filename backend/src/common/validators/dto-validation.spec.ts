import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsMongoObjectId, IsPhoneNumberVN } from './custom-validators';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from '../../modules/auth/dto/auth.dto';
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '../../modules/users/dto/address.dto';
import {
  CreateProductDto,
  ProductQueryDto,
} from '../../modules/products/dto/product.dto';
import { AddToCartDto, SyncCartDto } from '../../modules/cart/dto/cart.dto';
import {
  CreateOrderDto,
  OrderItemDto,
} from '../../modules/orders/dto/order.dto';
import { CreatePromotionDto } from '../../modules/promotions/dto/promotion.dto';
import { CreateReviewDto } from '../../modules/reviews/dto/review.dto';
import { CreatePaymentDto } from '../../modules/payments/dto/payment.dto';
import { InventoryTransactionDto } from '../../modules/inventory/dto/inventory.dto';
import { DiscountType, PaymentMethod } from '../enums';

describe('Custom Validators & DTO Validation Suite', () => {
  describe('IsMongoObjectId Validator', () => {
    class TestMongoDto {
      @IsMongoObjectId()
      id: string;
    }

    it('should validate valid 24-character hexadecimal MongoDB ObjectId', async () => {
      const dto = plainToInstance(TestMongoDto, {
        id: '507f1f77bcf86cd799439011',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid ObjectId formats', async () => {
      const invalidIds = ['123', 'invalid-id', '507f1f77bcf86cd79943901z', ''];
      for (const id of invalidIds) {
        const dto = plainToInstance(TestMongoDto, { id });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('IsPhoneNumberVN Validator', () => {
    class TestPhoneDto {
      @IsPhoneNumberVN()
      phone: string;
    }

    it('should validate valid Vietnamese 10-digit mobile phone numbers', async () => {
      const validPhones = [
        '0901234567',
        '0389123456',
        '0778889999',
        '0581234567',
        '0898765432',
      ];
      for (const phone of validPhones) {
        const dto = plainToInstance(TestPhoneDto, { phone });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid Vietnamese phone numbers', async () => {
      const invalidPhones = [
        '123456789',
        '0123456789',
        '0201234567',
        'abcdefghij',
        '09012345678',
      ];
      for (const phone of invalidPhones) {
        const dto = plainToInstance(TestPhoneDto, { phone });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Auth DTOs Validation', () => {
    it('RegisterDto: should validate proper email, strong password, and valid phone', async () => {
      const valid = plainToInstance(RegisterDto, {
        fullName: 'Nguyễn Văn A',
        email: 'user@example.com',
        password: 'Password@123',
        phone: '0901234567',
      });
      const errors = await validate(valid);
      expect(errors.length).toBe(0);
    });

    it('RegisterDto: should reject weak password (missing uppercase, number, or too short)', async () => {
      const weak = plainToInstance(RegisterDto, {
        fullName: 'Nguyễn Văn A',
        email: 'user@example.com',
        password: 'weakpassword',
      });
      const errors = await validate(weak);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('VerifyOtpDto: should require 6-digit numeric OTP', async () => {
      const valid = plainToInstance(VerifyOtpDto, {
        email: 'user@example.com',
        otp: '123456',
      });
      expect((await validate(valid)).length).toBe(0);

      const invalid = plainToInstance(VerifyOtpDto, {
        email: 'user@example.com',
        otp: '1234',
      });
      expect((await validate(invalid)).length).toBeGreaterThan(0);
    });
  });

  describe('Address DTOs Validation', () => {
    it('CreateAddressDto: should validate full address with valid VN phone', async () => {
      const valid = plainToInstance(CreateAddressDto, {
        label: 'Nhà riêng',
        recipientName: 'Nguyễn Văn B',
        phone: '0987654321',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        detail: '123 Cầu Giấy',
        isDefault: true,
      });
      const errors = await validate(valid);
      expect(errors.length).toBe(0);
    });
  });

  describe('Product DTOs Validation', () => {
    it('CreateProductDto: should validate valid product with MongoId category and non-negative price', async () => {
      const valid = plainToInstance(CreateProductDto, {
        name: 'Bút bi Thiên Long',
        sku: 'TL-027',
        category: '507f1f77bcf86cd799439011',
        price: 5000,
        discountPrice: 4500,
        stock: 100,
      });
      const errors = await validate(valid);
      expect(errors.length).toBe(0);
    });

    it('CreateProductDto: should reject negative price and invalid category ObjectId', async () => {
      const invalid = plainToInstance(CreateProductDto, {
        name: 'Bút bi',
        sku: 'TL-027',
        category: 'invalid-category-id',
        price: -5000,
      });
      const errors = await validate(invalid);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cart DTOs Validation', () => {
    it('AddToCartDto: should require valid productId and quantity >= 1', async () => {
      const valid = plainToInstance(AddToCartDto, {
        productId: '507f1f77bcf86cd799439011',
        quantity: 2,
      });
      expect((await validate(valid)).length).toBe(0);

      const invalid = plainToInstance(AddToCartDto, {
        productId: 'invalid',
        quantity: 0,
      });
      expect((await validate(invalid)).length).toBeGreaterThan(0);
    });
  });

  describe('Order DTOs Validation', () => {
    it('CreateOrderDto: should validate items array, shippingAddress, and phone', async () => {
      const valid = plainToInstance(CreateOrderDto, {
        items: [
          {
            product: '507f1f77bcf86cd799439011',
            name: 'Bút bi',
            price: 5000,
            quantity: 2,
          },
        ],
        shippingAddress: '123 Nguyễn Huệ, Q1, TP.HCM',
        phone: '0901234567',
        paymentMethod: PaymentMethod.COD,
      });
      const errors = await validate(valid);
      expect(errors.length).toBe(0);
    });
  });

  describe('Promotion DTOs Validation', () => {
    it('CreatePromotionDto: should validate code, discountType, dates, and non-negative values', async () => {
      const valid = plainToInstance(CreatePromotionDto, {
        code: 'SALE50',
        name: 'Giảm 50K',
        discountType: DiscountType.FIXED,
        discountValue: 50000,
        minOrderValue: 200000,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T23:59:59.000Z',
        usageLimit: 100,
      });
      const errors = await validate(valid);
      expect(errors.length).toBe(0);
    });
  });

  describe('Review DTOs Validation', () => {
    it('CreateReviewDto: should enforce rating between 1 and 5 and minimum content length', async () => {
      const valid = plainToInstance(CreateReviewDto, {
        rating: 5,
        content: 'Sách rất hay, đóng gói đẹp!',
      });
      expect((await validate(valid)).length).toBe(0);

      const invalidRating = plainToInstance(CreateReviewDto, {
        rating: 6,
        content: 'Tốt',
      });
      expect((await validate(invalidRating)).length).toBeGreaterThan(0);
    });
  });

  describe('Payment DTOs Validation', () => {
    it('CreatePaymentDto: should require valid orderId MongoId, orderCode, amount >= 0, and provider', async () => {
      const valid = plainToInstance(CreatePaymentDto, {
        orderId: '507f1f77bcf86cd799439011',
        orderCode: 'TT260824001',
        amount: 150000,
        provider: PaymentMethod.COD,
      });
      expect((await validate(valid)).length).toBe(0);
    });
  });

  describe('Inventory DTOs Validation', () => {
    it('InventoryTransactionDto: should require valid product MongoId and quantity >= 1', async () => {
      const valid = plainToInstance(InventoryTransactionDto, {
        product: '507f1f77bcf86cd799439011',
        quantity: 10,
      });
      expect((await validate(valid)).length).toBe(0);
    });
  });
});
