import { PaymentMethod, PaymentStatus } from '../../../common/enums';

export interface PaymentInitiationContext {
  paymentId: string;
  orderId: string;
  orderCode: string;
  amount: number;
  returnUrl?: string;
  providerReference?: string;
}

export interface PaymentInitiationResult {
  status: PaymentStatus;
  providerReference: string;
  expiresAt?: Date;
  redirectUrl?: string;
  qrCodeData?: string;
  instructions?: string;
}

export interface PaymentCallbackPayload {
  provider: PaymentMethod;
  transactionId: string;
  providerReference?: string;
  orderCode?: string;
  amount?: number;
  status?: string;
  signature?: string;
  gatewayResponse?: Record<string, any>;
}

export interface PaymentCallbackResult {
  success: boolean;
  status: PaymentStatus;
  failureReason?: string;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  initiate(context: PaymentInitiationContext): Promise<PaymentInitiationResult>;
  verifyCallback(
    payload: PaymentCallbackPayload,
  ): Promise<PaymentCallbackResult>;
}
