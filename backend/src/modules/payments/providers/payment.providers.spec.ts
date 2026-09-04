import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PaymentMethod, PaymentStatus } from '../../../common/enums';
import { CodPaymentProvider, VnPayPaymentProvider } from './payment.providers';

describe('Task 18: Payment provider abstraction', () => {
  const context = {
    paymentId: '507f1f77bcf86cd799439011',
    orderId: '507f1f77bcf86cd799439012',
    orderCode: 'TT260830ABC123',
    amount: 150000,
  };

  it('initiates COD without an external redirect', async () => {
    const result = await new CodPaymentProvider().initiate(context);
    expect(result.status).toBe(PaymentStatus.UNPAID);
    expect(result.providerReference).toContain(context.orderCode);
    expect(result.redirectUrl).toBeUndefined();
  });

  it('fails fast when an enabled online gateway has no configuration', async () => {
    const provider = new VnPayPaymentProvider(new ConfigService({}));
    await expect(provider.initiate(context)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('creates a signed VNPay URL and verifies a valid callback', async () => {
    const secret = 'a-secure-vnpay-test-secret';
    const provider = new VnPayPaymentProvider(
      new ConfigService({
        VNPAY_HASH_SECRET: secret,
        VNPAY_PAYMENT_URL: 'https://sandbox.example/pay',
      }),
    );
    const initiation = await provider.initiate(context);
    expect(initiation.redirectUrl).toContain('https://sandbox.example/pay?');

    const callback = {
      provider: PaymentMethod.VNPAY,
      providerReference: initiation.providerReference,
      transactionId: 'VNPAY-TXN-001',
      amount: context.amount,
      status: 'SUCCESS',
      signature: '',
    };
    callback.signature = createHmac('sha256', secret)
      .update(
        `${callback.providerReference}|${callback.transactionId}|${callback.amount}|${callback.status}`,
      )
      .digest('hex');

    await expect(provider.verifyCallback(callback)).resolves.toMatchObject({
      success: true,
      status: PaymentStatus.PAID,
    });
    await expect(
      provider.verifyCallback({ ...callback, signature: '00' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('BE-08: rejects mock signed payment initiation and callback in production', async () => {
    const prodConfig = new ConfigService({
      NODE_ENV: 'production',
      VNPAY_HASH_SECRET: 'test-secret',
      VNPAY_PAYMENT_URL: 'https://sandbox.example/pay',
    });
    const provider = new VnPayPaymentProvider(prodConfig);

    await expect(provider.initiate(context)).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(
      provider.verifyCallback({
        provider: PaymentMethod.VNPAY,
        providerReference: 'VNPAY-REF-1',
        transactionId: 'TXN-1',
        amount: 100000,
        status: 'SUCCESS',
        signature: 'mock-sig',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
