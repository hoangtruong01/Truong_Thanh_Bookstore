/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PaymentMethod, PaymentStatus } from '../../../common/enums';
import {
  CodPaymentProvider,
  MomoPaymentProvider,
  VnPayPaymentProvider,
} from './payment.providers';

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
        VNPAY_TMN_CODE: 'TESTTMN',
        VNPAY_RETURN_URL: 'https://shop.example/payment/result',
      }),
    );
    const initiation = await provider.initiate(context);
    expect(initiation.redirectUrl).toContain('https://sandbox.example/pay?');

    const gatewayResponse: Record<string, string> = {
      vnp_Amount: String(context.amount * 100),
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TransactionNo: '12345678',
      vnp_TxnRef: initiation.providerReference,
      vnp_TmnCode: 'TESTTMN',
    };
    const canonical = Object.keys(gatewayResponse)
      .sort()
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(gatewayResponse[key]).replace(/%20/g, '+')}`,
      )
      .join('&');
    gatewayResponse.vnp_SecureHash = createHmac('sha512', secret)
      .update(canonical)
      .digest('hex');
    const callback = {
      provider: PaymentMethod.VNPAY,
      providerReference: initiation.providerReference,
      transactionId: 'VNPAY-TXN-001',
      amount: context.amount,
      status: '00',
      signature: gatewayResponse.vnp_SecureHash,
      gatewayResponse,
    };

    await expect(provider.verifyCallback(callback)).resolves.toMatchObject({
      success: true,
      status: PaymentStatus.PAID,
    });
    await expect(
      provider.verifyCallback({
        ...callback,
        gatewayResponse: { ...gatewayResponse, vnp_SecureHash: '00' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('PAY-01: uses the real signed VNPay protocol in production', async () => {
    const prodConfig = new ConfigService({
      NODE_ENV: 'production',
      VNPAY_HASH_SECRET: 'test-secret',
      VNPAY_PAYMENT_URL: 'https://sandbox.example/pay',
      VNPAY_TMN_CODE: 'TESTTMN',
      VNPAY_RETURN_URL: 'https://shop.example/payment/result',
    });
    const provider = new VnPayPaymentProvider(prodConfig);

    const result = await provider.initiate(context);
    expect(result.redirectUrl).toContain('vnp_Version=2.1.0');
    expect(result.redirectUrl).toContain('vnp_SecureHash=');
    expect(result.redirectUrl).toContain(`vnp_Amount=${context.amount * 100}`);
  });

  it('creates and verifies a signed MoMo captureWallet transaction', async () => {
    const config = new ConfigService({
      MOMO_PAYMENT_URL: 'https://test-payment.momo.vn/v2/gateway/api/create',
      MOMO_SECRET_KEY: 'momo-secret',
      MOMO_ACCESS_KEY: 'momo-access',
      MOMO_PARTNER_CODE: 'MOMOTEST',
      MOMO_IPN_URL: 'https://api.example.com/payments/momo/ipn',
      MOMO_RETURN_URL: 'https://shop.example.com/payment/result',
    });
    const provider = new MomoPaymentProvider(config);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ resultCode: 0, payUrl: 'https://momo.test/pay' }),
    } as any);
    const initiated = await provider.initiate(context);
    expect(initiated.redirectUrl).toBe('https://momo.test/pay');
    const request = JSON.parse(String((fetchSpy.mock.calls[0][1] as any).body));
    expect(request).toMatchObject({
      partnerCode: 'MOMOTEST',
      requestType: 'captureWallet',
      amount: context.amount,
      autoCapture: true,
    });

    const raw: Record<string, any> = {
      amount: context.amount,
      extraData: '',
      message: 'Successful.',
      orderId: initiated.providerReference,
      orderInfo: `Thanh toan don hang ${context.orderCode}`,
      orderType: 'momo_wallet',
      partnerCode: 'MOMOTEST',
      payType: 'qr',
      requestId: 'REQ-1',
      responseTime: 1700000000000,
      resultCode: 0,
      transId: 123456789,
    };
    const canonical =
      `accessKey=momo-access&amount=${raw.amount}&extraData=${raw.extraData}` +
      `&message=${raw.message}&orderId=${raw.orderId}&orderInfo=${raw.orderInfo}` +
      `&orderType=${raw.orderType}&partnerCode=${raw.partnerCode}&payType=${raw.payType}` +
      `&requestId=${raw.requestId}&responseTime=${raw.responseTime}` +
      `&resultCode=${raw.resultCode}&transId=${raw.transId}`;
    raw.signature = createHmac('sha256', 'momo-secret')
      .update(canonical)
      .digest('hex');
    await expect(
      provider.verifyCallback({
        provider: PaymentMethod.MOMO,
        providerReference: raw.orderId,
        transactionId: String(raw.transId),
        amount: raw.amount,
        gatewayResponse: raw,
      }),
    ).resolves.toMatchObject({ success: true, status: PaymentStatus.PAID });
    fetchSpy.mockRestore();
  });
});
