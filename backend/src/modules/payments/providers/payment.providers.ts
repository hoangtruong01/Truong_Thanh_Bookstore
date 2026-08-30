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

  async initiate(context: PaymentInitiationContext): Promise<PaymentInitiationResult> {
    return {
      status: PaymentStatus.UNPAID,
      providerReference: context.providerReference || makeReference('COD', context.orderCode),
      instructions: 'Thanh toán cho nhân viên giao hàng sau khi nhận và kiểm tra hàng.',
    };
  }

  async verifyCallback(): Promise<PaymentCallbackResult> {
    throw new BadRequestException('COD không hỗ trợ callback từ cổng thanh toán');
  }
}

@Injectable()
export class BankTransferPaymentProvider implements PaymentProvider {
  readonly method = PaymentMethod.BANK_TRANSFER;
  constructor(private readonly configService: ConfigService) {}

  async initiate(context: PaymentInitiationContext): Promise<PaymentInitiationResult> {
    const bankName = this.configService.get<string>('BANK_NAME') || 'Ngân hàng của cửa hàng';
    const bankAccount = this.configService.get<string>('BANK_ACCOUNT_NUMBER') || 'Liên hệ cửa hàng';
    return {
      status: PaymentStatus.PENDING,
      providerReference: context.providerReference || makeReference('BANK', context.orderCode),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      instructions: `${bankName} - ${bankAccount}; nội dung chuyển khoản: ${context.orderCode}`,
    };
  }

  async verifyCallback(payload: PaymentCallbackPayload): Promise<PaymentCallbackResult> {
    verifySignature(payload, this.configService.get<string>('PAYMENT_WEBHOOK_SECRET'));
    return callbackResult(payload);
  }
}

abstract class SignedOnlinePaymentProvider implements PaymentProvider {
  abstract readonly method: PaymentMethod;
  abstract readonly secretKey: string;
  abstract readonly gatewayUrlKey: string;

  constructor(protected readonly configService: ConfigService) {}

  async initiate(context: PaymentInitiationContext): Promise<PaymentInitiationResult> {
    const secret = this.configService.get<string>(this.secretKey);
    const gatewayUrl = this.configService.get<string>(this.gatewayUrlKey);
    if (!secret || !gatewayUrl) {
      throw new ServiceUnavailableException(
        `Cổng ${this.method} chưa được cấu hình đầy đủ`,
      );
    }
    const providerReference = context.providerReference || makeReference(this.method, context.orderCode);
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

  async verifyCallback(payload: PaymentCallbackPayload): Promise<PaymentCallbackResult> {
    verifySignature(payload, this.configService.get<string>(this.secretKey));
    return callbackResult(payload);
  }
}

@Injectable()
export class VnPayPaymentProvider extends SignedOnlinePaymentProvider {
  readonly method = PaymentMethod.VNPAY;
  readonly secretKey = 'VNPAY_HASH_SECRET';
  readonly gatewayUrlKey = 'VNPAY_PAYMENT_URL';

  constructor(configService: ConfigService) {
    super(configService);
  }
}

@Injectable()
export class MomoPaymentProvider extends SignedOnlinePaymentProvider {
  readonly method = PaymentMethod.MOMO;
  readonly secretKey = 'MOMO_SECRET_KEY';
  readonly gatewayUrlKey = 'MOMO_PAYMENT_URL';

  constructor(configService: ConfigService) {
    super(configService);
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
      throw new BadRequestException('Vui lòng chọn cổng ví điện tử cụ thể: VNPAY hoặc MOMO');
    }
    const provider = this.providers.get(method);
    if (!provider) throw new BadRequestException('Phương thức thanh toán không được hỗ trợ');
    return provider;
  }
}

function callbackResult(payload: PaymentCallbackPayload): PaymentCallbackResult {
  const successValues = new Set(['SUCCESS', 'PAID', '00', '0']);
  const success = successValues.has((payload.status || '').toUpperCase());
  return {
    success,
    status: success ? PaymentStatus.PAID : PaymentStatus.FAILED,
    failureReason: success ? undefined : 'Cổng thanh toán báo giao dịch thất bại',
  };
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

function verifySignature(payload: PaymentCallbackPayload, secret?: string): void {
  if (!secret || !payload.signature || !payload.providerReference || payload.amount === undefined) {
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
