import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { createHash } from 'crypto';
import { PaymentMethod } from '../../common/enums';
import { CheckoutService } from './services/checkout.service';
import { CreateOrderDto } from './dto/order.dto';

describe('BE-03: Guest Checkout Idempotency & Replay Verification Suite', () => {
  let checkoutService: CheckoutService;
  let orderModel: any;
  let productsService: any;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      JWT_SECRET: 'test-jwt-secret-key-at-least-32-chars',
      ENABLED_PAYMENT_METHODS: 'COD',
    });

    orderModel = {
      findOne: jest.fn(),
    };

    productsService = {
      findByIds: jest.fn(),
    };

    checkoutService = new CheckoutService(
      orderModel,
      productsService,
      configService,
      {} as any, // promotionsService
      {} as any, // usersService
      {} as any, // orderInventoryService
      {} as any, // orderLoyaltyService
      {} as any, // orderNotificationService
    );
  });

  it('BE-03.1: Replaying identical intent returns guestAccessToken matching stored hash', async () => {
    const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';
    const derivedToken = checkoutService.deriveGuestAccessToken(idempotencyKey);
    const storedHash = createHash('sha256').update(derivedToken).digest('hex');

    const dto: CreateOrderDto = {
      items: [
        {
          product: '507f1f77bcf86cd799439011',
          name: 'Book A',
          price: 50000,
          quantity: 2,
        },
      ],
      shippingAddress: '123 Le Loi, District 1, HCMC',
      phone: '0901234567',
      paymentMethod: PaymentMethod.COD,
      idempotencyKey,
    };

    const payloadHash = checkoutService.computeOrderPayloadHash(dto);

    const existingOrder = {
      _id: new Types.ObjectId(),
      orderCode: 'TT260901ABCD',
      items: [
        {
          product: new Types.ObjectId('507f1f77bcf86cd799439011'),
          quantity: 2,
        },
      ],
      phone: '0901234567',
      shippingAddress: '123 Le Loi, District 1, HCMC',
      guestAccessTokenHash: storedHash,
      idempotencyPayloadHash: payloadHash,
      toObject: () => ({ orderCode: 'TT260901ABCD' }),
    };

    orderModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingOrder),
      }),
    });

    const result = await checkoutService.create(dto);

    expect(result.replayed).toBe(true);
    expect(result.guestAccessToken).toBe(derivedToken);
    // Verify that hashing result.guestAccessToken matches storedHash
    const checkHash = createHash('sha256')
      .update(result.guestAccessToken)
      .digest('hex');
    expect(checkHash).toBe(storedHash);
  });

  it('BE-03.2: Reusing idempotency key with different payload throws ConflictException', async () => {
    const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';
    const originalDto: CreateOrderDto = {
      items: [
        {
          product: '507f1f77bcf86cd799439011',
          name: 'Book A',
          price: 50000,
          quantity: 2,
        },
      ],
      shippingAddress: '123 Le Loi, District 1, HCMC',
      phone: '0901234567',
      paymentMethod: PaymentMethod.COD,
      idempotencyKey,
    };
    const originalPayloadHash =
      checkoutService.computeOrderPayloadHash(originalDto);

    const differentDto: CreateOrderDto = {
      items: [
        {
          product: '507f1f77bcf86cd799439012',
          name: 'Book B',
          price: 100000,
          quantity: 5,
        },
      ], // Different product & qty!
      shippingAddress: '456 Nguyen Hue, District 1, HCMC', // Different address!
      phone: '0901234567',
      paymentMethod: PaymentMethod.COD,
      idempotencyKey,
    };

    const existingOrder = {
      _id: new Types.ObjectId(),
      orderCode: 'TT260901ABCD',
      items: [
        {
          product: new Types.ObjectId('507f1f77bcf86cd799439011'),
          quantity: 2,
        },
      ],
      phone: '0901234567',
      shippingAddress: '123 Le Loi, District 1, HCMC',
      idempotencyPayloadHash: originalPayloadHash,
      toObject: () => ({ orderCode: 'TT260901ABCD' }),
    };

    orderModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingOrder),
      }),
    });

    await expect(checkoutService.create(differentDto)).rejects.toThrow(
      ConflictException,
    );
  });
});
