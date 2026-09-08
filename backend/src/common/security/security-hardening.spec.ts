/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  ValidationPipe,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { RegisterDto } from '../../modules/auth/dto/auth.dto';
import { PaymentsController } from '../../modules/payments/payments.controller';
import { AuthController } from '../../modules/auth/auth.controller';
import { CartController } from '../../modules/cart/cart.controller';
import { ProductsController } from '../../modules/products/products.controller';
import { SubscribeStockAlertDto } from '../../modules/products/dto/stock-alert.dto';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { ErrorCode } from '../enums/error-code.enum';

describe('Security Hardening Test Suite (SEC-01 through SEC-07)', () => {
  describe('SEC-03: Input Validation & Mass Assignment Hardening', () => {
    let pipe: ValidationPipe;

    beforeEach(() => {
      pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
    });

    it('rejects forbidden extra fields (Mass Assignment) such as role or permissions in RegisterDto', async () => {
      const maliciousPayload = {
        fullName: 'Attacker User',
        email: 'attacker@example.com',
        password: 'Password@123',
        role: 'SUPER_ADMIN', // Attempted privilege escalation
        permissions: ['MANAGE_ORDERS'],
      };

      await expect(
        pipe.transform(maliciousPayload, {
          type: 'body',
          metatype: RegisterDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('validates SubscribeStockAlertDto and rejects invalid emails', async () => {
      const invalidAlert = { email: 'not-an-email' };
      await expect(
        pipe.transform(invalidAlert, {
          type: 'body',
          metatype: SubscribeStockAlertDto,
        }),
      ).rejects.toThrow(BadRequestException);

      const validAlert = { email: ' ValidUser@Domain.COM ' };
      const result = await pipe.transform(validAlert, {
        type: 'body',
        metatype: SubscribeStockAlertDto,
      });
      expect(result.email).toBe('validuser@domain.com');
    });
  });

  describe('SEC-05: Rate Limiting (Throttling) Configuration Hardening', () => {
    it('ensures payment webhook and IPN endpoints have SkipThrottle applied (Zero dropped transactions)', () => {
      // VNPay IPN must skip throttling
      const vnpaySkip = Reflect.getMetadata(
        'THROTTLER:SKIPdefault',
        PaymentsController.prototype.handleVnPayIpn,
      );
      expect(vnpaySkip).toBe(true);

      // MoMo IPN must skip throttling
      const momoSkip = Reflect.getMetadata(
        'THROTTLER:SKIPdefault',
        PaymentsController.prototype.handleMomoIpn,
      );
      expect(momoSkip).toBe(true);

      // Generic callback must skip throttling
      const callbackSkip = Reflect.getMetadata(
        'THROTTLER:SKIPdefault',
        PaymentsController.prototype.handleCallback,
      );
      expect(callbackSkip).toBe(true);
    });

    it('ensures critical authentication endpoints have strict throttles', () => {
      // register: 3 per 10m (600,000ms)
      const registerLimit = Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        AuthController.prototype.register,
      );
      const registerTtl = Reflect.getMetadata(
        'THROTTLER:TTLdefault',
        AuthController.prototype.register,
      );
      expect(registerLimit).toBe(3);
      expect(registerTtl).toBe(600000);

      // forgot-password: 3 per 5m (300,000ms)
      const forgotLimit = Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        AuthController.prototype.forgotPassword,
      );
      const forgotTtl = Reflect.getMetadata(
        'THROTTLER:TTLdefault',
        AuthController.prototype.forgotPassword,
      );
      expect(forgotLimit).toBe(3);
      expect(forgotTtl).toBe(300000);

      // verify-otp: 5 per 5m (300,000ms)
      const verifyOtpLimit = Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        AuthController.prototype.verifyOtp,
      );
      const verifyOtpTtl = Reflect.getMetadata(
        'THROTTLER:TTLdefault',
        AuthController.prototype.verifyOtp,
      );
      expect(verifyOtpLimit).toBe(5);
      expect(verifyOtpTtl).toBe(300000);
    });

    it('ensures cart voucher apply has rate limiting against brute force', () => {
      const voucherLimit = Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        CartController.prototype.applyVoucher,
      );
      const voucherTtl = Reflect.getMetadata(
        'THROTTLER:TTLdefault',
        CartController.prototype.applyVoucher,
      );
      expect(voucherLimit).toBe(15);
      expect(voucherTtl).toBe(60000);
    });

    it('ensures stock alert endpoint has rate limiting against spam', () => {
      const alertLimit = Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        ProductsController.prototype.subscribeToStockAlert,
      );
      const alertTtl = Reflect.getMetadata(
        'THROTTLER:TTLdefault',
        ProductsController.prototype.subscribeToStockAlert,
      );
      expect(alertLimit).toBe(5);
      expect(alertTtl).toBe(60000);
    });
  });

  describe('SEC-07: Error Response Sanitization Hardening', () => {
    let filter: HttpExceptionFilter;
    let mockHost: any;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;

    beforeEach(() => {
      filter = new HttpExceptionFilter();
      mockStatus = jest.fn().mockReturnThis();
      mockJson = jest.fn().mockReturnThis();
      mockHost = {
        switchToHttp: () => ({
          getResponse: () => ({ status: mockStatus, json: mockJson }),
          getRequest: () => ({
            url: '/api/v1/resource',
            method: 'POST',
            headers: {},
            query: {},
            body: {},
          }),
        }),
      };
    });

    it('sanitizes duplicate key errors without leaking internal collection or database details', () => {
      const duplicateError = {
        name: 'MongoServerError',
        code: 11000,
        message:
          'E11000 duplicate key error collection: bookstore.users index: email_1 dup key: { email: "taken@bookstore.vn" }',
        keyValue: { email: 'taken@bookstore.vn' },
      };

      filter.catch(duplicateError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_DUPLICATE_KEY,
          message: 'Email này đã tồn tại trên hệ thống',
          details: { duplicateFields: ['email'] },
        }),
      );
    });

    it('sanitizes duplicate slug errors with a user-friendly slug message', () => {
      const duplicateSlugError = {
        name: 'MongoServerError',
        code: 11000,
        keyValue: { slug: 'dac-nhan-tam' },
      };

      filter.catch(duplicateSlugError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_DUPLICATE_KEY,
          message: 'Đường dẫn (slug) này đã tồn tại trên hệ thống',
        }),
      );
    });

    it('masks internal 500 error details in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const unexpectedError = new Error(
          'Database password failed to decrypt on connection 10.0.1.5',
        );
        filter.catch(unexpectedError, mockHost);

        expect(mockStatus).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Đã có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.',
            details: {},
          }),
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
