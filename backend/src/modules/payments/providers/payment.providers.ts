import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { PaymentMethod, PaymentStatus } from '../../../common/enums';
import {
  PaymentCallbackPayload,
  PaymentCallbackResult,
  PaymentInitiationContext,
  PaymentInitiationResult,
  PaymentProvider,
} from './payment-provider.interface';

const makeReference = (prefix: string, orderCode: string) =>
  `${prefix}-${orderCode}-${randomBytes(5).toString('hex').toUpperCase()}`;

@Injectable()
export class CodPaymentProvider implements PaymentProvider {
  readonly method = PaymentMethod.COD;

  async initiate(
    context: PaymentInitiationContext,
  ): Promise<PaymentInitiationResult> {
    return {
      status: PaymentStatus.UNPAID,
      providerReference:
        context.providerReference || makeReference('COD', context.orderCode),
      instructions:
        'Thanh toán cho nhân viên giao hàng sau khi nhận và kiểm tra hàng.',
    };
  }

  async verifyCallback(): Promise<PaymentCallbackResult> {
    throw new BadRequestException(
      'COD không hỗ trợ callback từ cổng thanh toán',
    );
  }
}

@Injectable()
export class BankTransferPaymentProvider implements PaymentProvider {
  readonly method = PaymentMethod.BANK_TRANSFER;
  constructor(private readonly configService: ConfigService) {}

  async initiate(
    context: PaymentInitiationContext,
  ): Promise<PaymentInitiationResult> {
    const bankName =
      this.configService.get<string>('BANK_NAME') || 'Ngân hàng của cửa hàng';
    const bankAccount =
      this.configService.get<string>('BANK_ACCOUNT_NUMBER') ||
      'Liên hệ cửa hàng';
    return {
      status: PaymentStatus.PENDING,
      providerReference:
        context.providerReference || makeReference('BANK', context.orderCode),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      instructions: `${bankName} - ${bankAccount}; nội dung chuyển khoản: ${context.orderCode}`,
    };
  }

  async verifyCallback(
    payload: PaymentCallbackPayload,
  ): Promise<PaymentCallbackResult> {
    verifySignature(
      payload,
      this.configService.get<string>('PAYMENT_WEBHOOK_SECRET'),
    );
    return callbackResult(payload);
  }
}

/**
 * BE-08: MockSignedPaymentProvider simulates online signed payments (VNPay, MoMo)
 * with internal HMAC SHA256 signatures for development and staging environments only.
 *
 * IMPORTANT: Mock online payment providers are strictly forbidden in production (NODE_ENV === 'production').
 * Production environments must configure and integrate direct merchant bank APIs.
 */
export abstract class MockSignedPaymentProvider implements PaymentProvider {
  abstract readonly method: PaymentMethod;
  abstract readonly secretKey: string;
  abstract readonly gatewayUrlKey: string;

  constructor(protected readonly configService: ConfigService) {}

  async initiate(
    context: PaymentInitiationContext,
  ): Promise<PaymentInitiationResult> {
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      throw new ServiceUnavailableException(
        `Cổng thanh toán giả lập (${this.method}) bị nghiêm cấm trong môi trường production`,
      );
    }

    const secret = this.configService.get<string>(this.secretKey);
    const gatewayUrl = this.configService.get<string>(this.gatewayUrlKey);
    if (!secret || !gatewayUrl) {
      throw new ServiceUnavailableException(
        `Cổng ${this.method} chưa được cấu hình đầy đủ`,
      );
    }
    const providerReference =
      context.providerReference ||
      makeReference(this.method, context.orderCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const signature = sign(
      `${providerReference}|${context.orderCode}|${context.amount}`,
      secret,
    );
    const params = new URLSearchParams({
      reference: providerReference,
      orderCode: context.orderCode,
      amount: context.amount.toString(),
      signature,
    });
    if (context.returnUrl) params.set('returnUrl', context.returnUrl);
    return {
      status: PaymentStatus.PENDING,
      providerReference,
      expiresAt,
      redirectUrl: `${gatewayUrl}${gatewayUrl.includes('?') ? '&' : '?'}${params.toString()}`,
    };
  }

  async verifyCallback(
    payload: PaymentCallbackPayload,
  ): Promise<PaymentCallbackResult> {
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      throw new ServiceUnavailableException(
        `Cổng thanh toán giả lập (${this.method}) bị nghiêm cấm trong môi trường production`,
      );
    }

    verifySignature(payload, this.configService.get<string>(this.secretKey));
    return callbackResult(payload);
  }
}

// Backwards compatibility alias
export const SignedOnlinePaymentProvider = MockSignedPaymentProvider;

@Injectable()
export class VnPayPaymentProvider extends MockSignedPaymentProvider {
  readonly method = PaymentMethod.VNPAY;
  readonly secretKey = 'VNPAY_HASH_SECRET';
  readonly gatewayUrlKey = 'VNPAY_PAYMENT_URL';

  constructor(configService: ConfigService) {
    super(configService);
  }

  override async initiate(
    context: PaymentInitiationContext,
  ): Promise<PaymentInitiationResult> {
    const paymentUrl = required(this.configService, 'VNPAY_PAYMENT_URL');
    const secret = required(this.configService, 'VNPAY_HASH_SECRET');
    const tmnCode = required(this.configService, 'VNPAY_TMN_CODE');
    const returnUrl = safeReturnUrl(
      this.configService,
      context.returnUrl,
      'VNPAY_RETURN_URL',
    );
    const providerReference =
      context.providerReference || makeReference('VNPAY', context.orderCode);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(Math.round(context.amount * 100)),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: providerReference,
      vnp_OrderInfo: `Thanh toan don hang ${context.orderCode}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr:
        this.configService.get<string>('VNPAY_IP_ADDRESS') || '127.0.0.1',
      vnp_CreateDate: formatVnPayDate(createdAt),
      vnp_ExpireDate: formatVnPayDate(expiresAt),
    };
    const canonical = canonicalQuery(params);
    const secureHash = createHmac('sha512', secret)
      .update(canonical)
      .digest('hex');
    return {
      status: PaymentStatus.PENDING,
      providerReference,
      expiresAt,
      redirectUrl: `${paymentUrl}${paymentUrl.includes('?') ? '&' : '?'}${canonical}&vnp_SecureHash=${secureHash}`,
    };
  }

  override async verifyCallback(
    payload: PaymentCallbackPayload,
  ): Promise<PaymentCallbackResult> {
    const raw = payload.gatewayResponse || {};
    const signature = String(raw.vnp_SecureHash || payload.signature || '');
    const params = Object.fromEntries(
      Object.entries(raw)
        .filter(
          ([key, value]) =>
            key.startsWith('vnp_') &&
            !['vnp_SecureHash', 'vnp_SecureHashType'].includes(key) &&
            value !== undefined &&
            value !== null,
        )
        .map(([key, value]) => [key, String(value)]),
    );
    verifyDigest(
      createHmac('sha512', required(this.configService, 'VNPAY_HASH_SECRET'))
        .update(canonicalQuery(params))
        .digest('hex'),
      signature,
    );
    const success =
      String(raw.vnp_ResponseCode) === '00' &&
      String(raw.vnp_TransactionStatus) === '00';
    return {
      success,
      status: success ? PaymentStatus.PAID : PaymentStatus.FAILED,
      failureReason: success ? undefined : 'VNPay báo giao dịch thất bại',
    };
  }
}

@Injectable()
export class MomoPaymentProvider extends MockSignedPaymentProvider {
  readonly method = PaymentMethod.MOMO;
  readonly secretKey = 'MOMO_SECRET_KEY';
  readonly gatewayUrlKey = 'MOMO_PAYMENT_URL';

  constructor(configService: ConfigService) {
    super(configService);
  }

  override async initiate(
    context: PaymentInitiationContext,
  ): Promise<PaymentInitiationResult> {
    const paymentUrl = required(this.configService, 'MOMO_PAYMENT_URL');
    const secret = required(this.configService, 'MOMO_SECRET_KEY');
    const accessKey = required(this.configService, 'MOMO_ACCESS_KEY');
    const partnerCode = required(this.configService, 'MOMO_PARTNER_CODE');
    const ipnUrl = required(this.configService, 'MOMO_IPN_URL');
    const redirectUrl = safeReturnUrl(
      this.configService,
      context.returnUrl,
      'MOMO_RETURN_URL',
    );
    const orderId =
      context.providerReference || makeReference('MOMO', context.orderCode);
    const requestId = makeReference('REQ', context.orderCode);
    const orderInfo = `Thanh toan don hang ${context.orderCode}`;
    const extraData = '';
    const requestType = 'captureWallet';
    const rawSignature =
      `accessKey=${accessKey}&amount=${context.amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=${requestType}`;
    const signature = createHmac('sha256', secret)
      .update(rawSignature)
      .digest('hex');
    const response = await fetch(paymentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerCode,
        requestId,
        amount: context.amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        requestType,
        extraData,
        lang: 'vi',
        autoCapture: true,
        signature,
      }),
    });
    const result = (await response.json()) as {
      resultCode?: number;
      message?: string;
      payUrl?: string;
    };
    if (!response.ok || result.resultCode !== 0 || !result.payUrl) {
      throw new ServiceUnavailableException(
        `MoMo không thể tạo giao dịch: ${result.message || response.status}`,
      );
    }
    return {
      status: PaymentStatus.PENDING,
      providerReference: orderId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      redirectUrl: result.payUrl,
    };
  }

  override async verifyCallback(
    payload: PaymentCallbackPayload,
  ): Promise<PaymentCallbackResult> {
    const raw = payload.gatewayResponse || {};
    const accessKey = required(this.configService, 'MOMO_ACCESS_KEY');
    const keys = [
      'amount',
      'extraData',
      'message',
      'orderId',
      'orderInfo',
      'orderType',
      'partnerCode',
      'payType',
      'requestId',
      'responseTime',
      'resultCode',
      'transId',
    ];
    const canonical = keys
      .map((key) =>
        key === 'amount'
          ? `accessKey=${accessKey}&amount=${String(raw[key] ?? '')}`
          : `${key}=${String(raw[key] ?? '')}`,
      )
      .join('&');
    verifyDigest(
      createHmac('sha256', required(this.configService, 'MOMO_SECRET_KEY'))
        .update(canonical)
        .digest('hex'),
      String(raw.signature || payload.signature || ''),
    );
    const success = Number(raw.resultCode) === 0;
    return {
      success,
      status: success ? PaymentStatus.PAID : PaymentStatus.FAILED,
      failureReason: success
        ? undefined
        : String(raw.message || 'MoMo báo giao dịch thất bại'),
    };
  }
}

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers: Map<PaymentMethod, PaymentProvider>;

  constructor(
    cod: CodPaymentProvider,
    bank: BankTransferPaymentProvider,
    vnpay: VnPayPaymentProvider,
    momo: MomoPaymentProvider,
  ) {
    this.providers = new Map<PaymentMethod, PaymentProvider>([
      [cod.method, cod],
      [bank.method, bank],
      [vnpay.method, vnpay],
      [momo.method, momo],
    ]);
  }

  get(method: PaymentMethod): PaymentProvider {
    // EWALLET is retained in old orders, but new payments must name a concrete provider.
    if (method === PaymentMethod.EWALLET) {
      throw new BadRequestException(
        'Vui lòng chọn cổng ví điện tử cụ thể: VNPAY hoặc MOMO',
      );
    }
    const provider = this.providers.get(method);
    if (!provider)
      throw new BadRequestException('Phương thức thanh toán không được hỗ trợ');
    return provider;
  }
}

function callbackResult(
  payload: PaymentCallbackPayload,
): PaymentCallbackResult {
  const successValues = new Set(['SUCCESS', 'PAID', '00', '0']);
  const success = successValues.has((payload.status || '').toUpperCase());
  return {
    success,
    status: success ? PaymentStatus.PAID : PaymentStatus.FAILED,
    failureReason: success
      ? undefined
      : 'Cổng thanh toán báo giao dịch thất bại',
  };
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

function verifySignature(
  payload: PaymentCallbackPayload,
  secret?: string,
): void {
  if (
    !secret ||
    !payload.signature ||
    !payload.providerReference ||
    payload.amount === undefined
  ) {
    throw new BadRequestException('Thiếu dữ liệu xác thực callback thanh toán');
  }
  const expected = Buffer.from(
    sign(
      `${payload.providerReference}|${payload.transactionId}|${payload.amount}|${payload.status || ''}`,
      secret,
    ),
    'hex',
  );
  const actual = Buffer.from(payload.signature, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new BadRequestException('Chữ ký callback thanh toán không hợp lệ');
  }
}

function required(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) {
    throw new ServiceUnavailableException(`Thiếu cấu hình ${key}`);
  }
  return value;
}

function safeReturnUrl(
  config: ConfigService,
  requested: string | undefined,
  fallbackKey: string,
): string {
  const fallback = required(config, fallbackKey);
  const candidate = requested || fallback;
  try {
    const allowedOrigins = new Set(
      [fallback, ...(config.get<string>('FRONTEND_URL') || '').split(',')]
        .filter(Boolean)
        .map((value) => new URL(value.trim()).origin),
    );
    if (!allowedOrigins.has(new URL(candidate).origin)) {
      throw new Error('origin is not allowed');
    }
    return candidate;
  } catch {
    throw new BadRequestException('URL quay lại sau thanh toán không hợp lệ');
  }
}

function canonicalQuery(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort();
  return sorted
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`,
    )
    .join('&');
}

function formatVnPayDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}${value.month}${value.day}${value.hour}${value.minute}${value.second}`;
}

function verifyDigest(expectedHex: string, actualHex: string): void {
  if (
    !/^[a-f\d]+$/i.test(actualHex) ||
    actualHex.length !== expectedHex.length
  ) {
    throw new BadRequestException('Chữ ký callback thanh toán không hợp lệ');
  }
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  if (!timingSafeEqual(expected, actual)) {
    throw new BadRequestException('Chữ ký callback thanh toán không hợp lệ');
  }
}
