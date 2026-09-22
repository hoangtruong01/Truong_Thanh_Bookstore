import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { createHmac } from 'crypto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
} from '../../common/enums';
import { PaymentsService } from './payments.service';
import {
  VnPayPaymentProvider,
  MomoPaymentProvider,
} from './providers/payment.providers';

describe('BE-01 & BE-02: Payment Callback Security & Reconciliation Regression Suite', () => {
  const vnpayMockHash = Buffer.from('vnpay_mock_seed').toString('hex');
  const momoMockHash = Buffer.from('momo_mock_seed').toString('hex');

  let configService: ConfigService;
  let vnpayProvider: VnPayPaymentProvider;
  let momoProvider: MomoPaymentProvider;
  let providers: any;
  let paymentModel: any;
  let orderModel: any;
  let service: PaymentsService;

  beforeEach(() => {
    configService = new ConfigService({
      ENABLED_PAYMENT_METHODS: 'COD,BANK_TRANSFER,VNPAY,MOMO',
      VNPAY_HASH_SECRET: vnpayMockHash,
      VNPAY_TMN_CODE: 'TEST_TMN',
      MOMO_SECRET_KEY: momoMockHash,
      MOMO_ACCESS_KEY: 'test-momo-access-key',
    });

    vnpayProvider = new VnPayPaymentProvider(configService);
    momoProvider = new MomoPaymentProvider(configService);

    providers = {
      get: jest.fn((method: PaymentMethod) => {
        if (method === PaymentMethod.VNPAY) return vnpayProvider;
        if (method === PaymentMethod.MOMO) return momoProvider;
        throw new BadRequestException('Unsupported');
      }),
    };

    paymentModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findById: jest.fn(),
      updateMany: jest.fn(),
    };

    orderModel = {
      findById: jest.fn(),
      updateOne: jest.fn(),
    };

    service = new PaymentsService(
      paymentModel,
      orderModel,
      providers,
      configService,
    );
  });

  describe('BE-01: Verified Callback Data & Transaction Security', () => {
    it('extracts verified amount and transactionId from signed VNPay payload', async () => {
      const raw: Record<string, string> = {
        vnp_Amount: '25000000', // 250,000 VND
        vnp_ResponseCode: '00',
        vnp_TransactionStatus: '00',
        vnp_TransactionNo: 'VNPAY_TXN_9999',
        vnp_TxnRef: 'REF_ORDER_001',
        vnp_TmnCode: 'TEST_TMN',
        vnp_CurrCode: 'VND',
      };
      const canonical = Object.keys(raw)
        .sort()
        .map(
          (k) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(raw[k]).replace(/%20/g, '+')}`,
        )
        .join('&');
      const signature = createHmac('sha512', vnpayMockHash)
        .update(canonical)
        .digest('hex');
      raw.vnp_SecureHash = signature;

      const result = await vnpayProvider.verifyCallback({
        provider: PaymentMethod.VNPAY,
        transactionId: 'unverified_client_txn',
        amount: 1000, // unverified
        signature,
        gatewayResponse: raw,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.verifiedData).toBeDefined();
      expect(result.verifiedData?.amount).toBe(250000);
      expect(result.verifiedData?.transactionId).toBe('VNPAY_TXN_9999');
      expect(result.verifiedData?.providerReference).toBe('REF_ORDER_001');
      expect(result.verifiedData?.merchantId).toBe('TEST_TMN');
    });

    it('rejects callback if payment method is not in ENABLED_PAYMENT_METHODS', async () => {
      const disabledConfig = new ConfigService({
        ENABLED_PAYMENT_METHODS: 'COD',
      });
      const disabledService = new PaymentsService(
        paymentModel,
        orderModel,
        providers,
        disabledConfig,
      );

      await expect(
        disabledService.handleCallback({
          provider: PaymentMethod.MOMO,
          transactionId: 'txn-123',
        }),
      ).rejects.toThrow(/chưa được kích hoạt/);
    });

    it('detects and blocks Transaction Reuse when transactionId is already bound to another order', async () => {
      const orderId1 = new Types.ObjectId();
      const orderId2 = new Types.ObjectId();
      const paymentId1 = new Types.ObjectId();
      const paymentId2 = new Types.ObjectId();

      const currentPayment = {
        _id: paymentId1,
        order: orderId1,
        amount: 250000,
        provider: PaymentMethod.MOMO,
        providerReference: 'ORDER_REF_1',
        status: PaymentStatus.PENDING,
      };

      const anotherReusedPayment = {
        _id: paymentId2,
        order: orderId2,
        amount: 250000,
        provider: PaymentMethod.MOMO,
        transactionId: 'momo_shared_txn_001',
      };

      // 1st findOne: locate current payment
      // 2nd findOne: check if transactionId is reused on a different order
      paymentModel.findOne
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(currentPayment),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(anotherReusedPayment),
        });

      jest.spyOn(momoProvider, 'verifyCallback').mockResolvedValue({
        success: true,
        status: PaymentStatus.PAID,
        verifiedData: {
          transactionId: 'momo_shared_txn_001',
          amount: 250000,
          providerReference: 'ORDER_REF_1',
        },
      });

      await expect(
        service.handleCallback({
          provider: PaymentMethod.MOMO,
          transactionId: 'momo_shared_txn_001',
          providerReference: 'ORDER_REF_1',
          amount: 250000,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('BE-02: Late Callbacks & Paid Status Invariants', () => {
    it('handles late successful callback for expired payment with MANUAL_REQUIRED reconciliation', async () => {
      const orderId = new Types.ObjectId();
      const paymentId = new Types.ObjectId();

      const expiredPayment = {
        _id: paymentId,
        order: orderId,
        amount: 150000,
        provider: PaymentMethod.VNPAY,
        providerReference: 'REF_EXPIRED_01',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        status: PaymentStatus.FAILED,
        save: jest.fn().mockResolvedValue(true),
      };

      const order = {
        _id: orderId,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.FAILED,
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expiredPayment),
      });
      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(order),
      });
      orderModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      jest.spyOn(vnpayProvider, 'verifyCallback').mockResolvedValue({
        success: true,
        status: PaymentStatus.PAID,
        verifiedData: {
          transactionId: 'VNPAY_LATE_123',
          amount: 150000,
          providerReference: 'REF_EXPIRED_01',
        },
      });

      const result = await service.handleCallback({
        provider: PaymentMethod.VNPAY,
        transactionId: 'VNPAY_LATE_123',
        providerReference: 'REF_EXPIRED_01',
        amount: 150000,
      });

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(expiredPayment.save).toHaveBeenCalled();
      expect(orderModel.updateOne).toHaveBeenCalledWith(
        { _id: orderId },
        expect.objectContaining({
          $set: expect.objectContaining({
            paymentStatus: PaymentStatus.PAID,
            refundStatus: RefundStatus.MANUAL_REQUIRED,
          }),
        }),
      );
    });

    it('never downgrades an already PAID order status when receiving a failed callback or update', async () => {
      const orderId = new Types.ObjectId();
      const paymentId = new Types.ObjectId();

      const payment = {
        _id: paymentId,
        order: orderId,
        amount: 150000,
        provider: PaymentMethod.VNPAY,
        providerReference: 'REF_002',
        status: PaymentStatus.PENDING,
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(payment),
      });
      paymentModel.findOneAndUpdate.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...payment, status: PaymentStatus.FAILED }),
      });
      orderModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });

      jest.spyOn(vnpayProvider, 'verifyCallback').mockResolvedValue({
        success: false,
        status: PaymentStatus.FAILED,
        failureReason: 'Transaction cancelled by user',
      });

      await service.handleCallback({
        provider: PaymentMethod.VNPAY,
        transactionId: 'txn_fail_999',
        providerReference: 'REF_002',
        amount: 150000,
      });

      expect(orderModel.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: orderId,
          paymentStatus: { $ne: PaymentStatus.PAID },
        }),
        expect.objectContaining({
          $set: expect.objectContaining({
            paymentStatus: PaymentStatus.FAILED,
          }),
        }),
      );
    });
  });
});
