/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  UserRole,
} from '../../common/enums';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { fetchWithTimeout } from '../../common/http/http-client';

describe('QA-02: Payment & Order Safety Verification Suite', () => {
  describe('BE-04: Third-Party Timeout Management', () => {
    it('fetchWithTimeout throws ServiceUnavailableException when request times out', async () => {
      const originalFetch = global.fetch;
      try {
        global.fetch = jest.fn().mockImplementation(
          (_url, options) =>
            new Promise((_resolve, reject) => {
              const signal = options?.signal;
              if (signal) {
                signal.addEventListener('abort', () => {
                  const abortError = new Error('The operation was aborted');
                  abortError.name = 'AbortError';
                  reject(abortError);
                });
              }
            }),
        );

        await expect(
          fetchWithTimeout('https://payment-gateway.example.com/api', {}, 50),
        ).rejects.toThrow(ServiceUnavailableException);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('fetchWithTimeout succeeds when request completes within timeout', async () => {
      const originalFetch = global.fetch;
      try {
        const mockResponse = {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        };
        global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

        const res = await fetchWithTimeout(
          'https://payment-gateway.example.com/api',
          {},
          1000,
        );
        expect(res.status).toBe(200);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('BE-03: Webhook Verification, Amount Tampering & Idempotency', () => {
    let paymentsService: PaymentsService;
    let paymentModel: any;
    let orderModel: any;
    let providers: any;

    beforeEach(() => {
      paymentModel = {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findById: jest.fn(),
        find: jest.fn(),
      };
      orderModel = {
        updateOne: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        }),
        findById: jest.fn(),
      };
      providers = {
        get: jest.fn(),
      };
      paymentsService = new PaymentsService(
        paymentModel,
        orderModel,
        providers,
      );
    });

    it('BE-03: Amount Tampering detected freezes Payment and marks Order MANUAL_REQUIRED', async () => {
      const mockPayment: any = {
        _id: new Types.ObjectId(),
        order: new Types.ObjectId(),
        amount: 500000,
        provider: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        failureReason: undefined,
        save: jest.fn().mockResolvedValue(true),
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      // Attacker modifies amount from 500,000 to 50,000
      await expect(
        paymentsService.handleCallback({
          provider: PaymentMethod.VNPAY,
          transactionId: 'txn_fake_123',
          amount: 50000, // Tampered!
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPayment.status).toBe(PaymentStatus.FAILED);
      expect(mockPayment.failureReason).toContain('Amount Tampering');
      expect(mockPayment.save).toHaveBeenCalled();

      expect(orderModel.updateOne).toHaveBeenCalledWith(
        { _id: mockPayment.order },
        expect.objectContaining({
          $set: expect.objectContaining({
            refundStatus: RefundStatus.MANUAL_REQUIRED,
          }),
        }),
      );
    });

    it('BE-03: Idempotent replay returns existing payment without duplicating actions', async () => {
      const paidAt = new Date('2026-09-08T10:00:00Z');
      const mockPayment: any = {
        _id: new Types.ObjectId(),
        order: new Types.ObjectId(),
        amount: 250000,
        provider: PaymentMethod.MOMO,
        transactionId: 'momo_txn_999',
        status: PaymentStatus.PAID,
        callbackProcessedAt: paidAt,
        paidAt,
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      // Same callback received again (retry by payment gateway)
      const result = await paymentsService.handleCallback({
        provider: PaymentMethod.MOMO,
        transactionId: 'momo_txn_999',
        amount: 250000,
      });

      expect(result).toBe(mockPayment);
      expect(providers.get).not.toHaveBeenCalled(); // Short-circuited safely
      expect(orderModel.updateOne).toHaveBeenCalledWith(
        { _id: mockPayment.order },
        expect.objectContaining({
          $set: expect.objectContaining({ paymentStatus: PaymentStatus.PAID }),
        }),
      );
    });

    it('BE-03: Conflicting callback on already paid transaction throws ConflictException', async () => {
      const mockPayment: any = {
        _id: new Types.ObjectId(),
        order: new Types.ObjectId(),
        amount: 250000,
        provider: PaymentMethod.MOMO,
        transactionId: 'momo_txn_original',
        status: PaymentStatus.PAID,
        callbackProcessedAt: new Date(),
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      // Different transactionId attempting to overwrite
      await expect(
        paymentsService.handleCallback({
          provider: PaymentMethod.MOMO,
          transactionId: 'momo_txn_different',
          amount: 250000,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('BE-02: Atomic Consistency & Auto-Reconciliation', () => {
    let paymentsService: PaymentsService;
    let paymentModel: any;
    let orderModel: any;
    let providers: any;

    beforeEach(() => {
      paymentModel = {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findById: jest.fn(),
        find: jest.fn(),
      };
      orderModel = {
        updateOne: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        }),
        findById: jest.fn(),
      };
      providers = {
        get: jest.fn(),
      };
      paymentsService = new PaymentsService(
        paymentModel,
        orderModel,
        providers,
      );
    });

    it('BE-02: Successful callback atomically updates Payment to PAID and Order to CONFIRMED', async () => {
      const orderId = new Types.ObjectId();
      const mockPayment = {
        _id: new Types.ObjectId(),
        order: orderId,
        amount: 150000,
        provider: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      providers.get.mockReturnValue({
        verifyCallback: jest.fn().mockResolvedValue({
          success: true,
          status: PaymentStatus.PAID,
        }),
      });

      const updatedPayment = {
        ...mockPayment,
        status: PaymentStatus.PAID,
        transactionId: 'vnp_9999',
        callbackProcessedAt: new Date(),
        paidAt: new Date(),
      };

      paymentModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedPayment),
      });

      const result = await paymentsService.handleCallback({
        provider: PaymentMethod.VNPAY,
        transactionId: 'vnp_9999',
        amount: 150000,
      });

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(orderModel.updateOne).toHaveBeenCalledWith(
        { _id: orderId },
        expect.objectContaining({
          $set: expect.objectContaining({ paymentStatus: PaymentStatus.PAID }),
        }),
      );
      expect(orderModel.updateOne).toHaveBeenCalledWith(
        { _id: orderId, orderStatus: OrderStatus.PENDING },
        expect.objectContaining({
          $set: expect.objectContaining({ orderStatus: OrderStatus.CONFIRMED }),
        }),
      );
    });

    it('BE-02: Auto-reconciliation cancels expired online pending payments', async () => {
      const expiredPayments = [
        {
          _id: new Types.ObjectId(),
          provider: PaymentMethod.VNPAY,
          status: PaymentStatus.PENDING,
          save: jest.fn().mockResolvedValue(true),
        },
        {
          _id: new Types.ObjectId(),
          provider: PaymentMethod.MOMO,
          status: PaymentStatus.PENDING,
          save: jest.fn().mockResolvedValue(true),
        },
      ];

      paymentModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expiredPayments),
      });

      const count = await paymentsService.reconcilePendingPayments();
      expect(count).toBe(2);
      expect(expiredPayments[0].status).toBe(PaymentStatus.FAILED);
      expect(expiredPayments[1].status).toBe(PaymentStatus.FAILED);
    });
  });

  describe('BA-01 & BE-01: Business Rules & Refund Lifecycle', () => {
    let ordersService: OrdersService;
    let orderModel: any;
    let productsService: any;
    let configService: any;
    let promotionsService: any;
    let notificationsService: any;
    let emailService: any;
    let usersService: any;

    const createMockOrderDoc = (overrides: Record<string, any> = {}) => {
      const doc: any = {
        _id: new Types.ObjectId(),
        orderCode: 'TT123456',
        customer: new Types.ObjectId(),
        customerEmail: 'customer@example.com',
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.COD,
        total: 100000,
        items: [],
        timeline: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
        populate: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
        $session: jest.fn(),
        ...overrides,
      };
      return doc;
    };

    beforeEach(() => {
      orderModel = {
        findById: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        updateOne: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        }),
      };
      productsService = { restoreStock: jest.fn() };
      configService = { get: jest.fn().mockReturnValue(undefined) };
      promotionsService = { revertUsage: jest.fn() };
      notificationsService = {
        create: jest.fn().mockResolvedValue({}),
        createNotification: jest.fn().mockResolvedValue({}),
      };
      emailService = {
        sendOrderStatusEmail: jest.fn().mockResolvedValue(true),
        sendOrderStatusUpdate: jest.fn().mockResolvedValue(true),
      };
      usersService = { findById: jest.fn() };

      ordersService = new OrdersService(
        orderModel,
        productsService,
        configService,
        promotionsService,
        notificationsService,
        emailService,
        usersService,
      );
    });

    it('BA-01: Customer CANNOT cancel order when status is PROCESSING', async () => {
      const customerId = new Types.ObjectId();
      const mockOrder = createMockOrderDoc({
        customer: customerId,
        orderStatus: OrderStatus.PROCESSING,
      });

      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      await expect(
        ordersService.cancelForActor(
          mockOrder._id.toString(),
          { _id: customerId.toString(), role: UserRole.CUSTOMER },
          'Khách đổi ý',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('BA-01: Admin/Staff CAN cancel order in PROCESSING status with reason', async () => {
      const orderId = new Types.ObjectId();
      const adminId = new Types.ObjectId().toString();
      const mockOrder = createMockOrderDoc({
        _id: orderId,
        orderStatus: OrderStatus.PROCESSING,
      });

      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const cancelledOrder = await ordersService.cancelForActor(
        orderId.toString(),
        { _id: adminId, role: UserRole.ADMIN },
        'Hết hàng đột xuất trong kho',
      );

      expect(cancelledOrder.orderStatus).toBe(OrderStatus.CANCELLED);
    });

    it('BE-01: Invariance Rule - Cancelling a PAID order automatically sets refundStatus to REQUESTED', async () => {
      const orderId = new Types.ObjectId();
      const adminId = new Types.ObjectId().toString();
      const mockOrder = createMockOrderDoc({
        _id: orderId,
        orderStatus: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        total: 350000,
      });

      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const result = await ordersService.cancelForActor(
        orderId.toString(),
        { _id: adminId, role: UserRole.ADMIN },
        'Khách yêu cầu hủy đơn đã thanh toán',
      );

      expect(result.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(result.refundStatus).toBe(RefundStatus.REQUESTED);
      expect(result.refundAmount).toBe(350000);
    });

    it('BA-01: Return request rejected if delivered more than 7 days ago', async () => {
      const orderId = new Types.ObjectId();
      const customerId = new Types.ObjectId();
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      const mockOrder = createMockOrderDoc({
        _id: orderId,
        customer: customerId,
        orderStatus: OrderStatus.DELIVERED,
        deliveredAt: eightDaysAgo,
      });

      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      await expect(
        ordersService.requestReturn(
          orderId.toString(),
          { _id: customerId.toString(), role: UserRole.CUSTOMER },
          { reason: 'Sách bị rách gáy' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('BA-01 & BE-01: Return request within 7 days succeeds and transitions correctly', async () => {
      const orderId = new Types.ObjectId();
      const customerId = new Types.ObjectId();
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const mockOrder = createMockOrderDoc({
        _id: orderId,
        customer: customerId,
        orderStatus: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        total: 120000,
        deliveredAt: twoDaysAgo,
      });

      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const returnedOrder = await ordersService.requestReturn(
        orderId.toString(),
        { _id: customerId.toString(), role: UserRole.CUSTOMER },
        { reason: 'Sách bị in nhầm trang' },
      );

      expect(returnedOrder.orderStatus).toBe(OrderStatus.RETURN_REQUESTED);
      expect(returnedOrder.returnReason).toBe('Sách bị in nhầm trang');
    });

    it('BE-01: Anti Double-Refund atomic lock prevents duplicate refunds', async () => {
      const orderId = new Types.ObjectId();
      const adminId = new Types.ObjectId().toString();
      const mockOrder = createMockOrderDoc({
        _id: orderId,
        orderCode: 'TT999888',
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.PAID,
        refundStatus: RefundStatus.REQUESTED,
        total: 500000,
        paymentMethod: PaymentMethod.VNPAY,
      });

      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      // First refund attempt: succeeds in atomic transition to PROCESSING
      orderModel.findOneAndUpdate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          ...mockOrder,
          refundStatus: RefundStatus.PROCESSING,
        }),
      });

      const firstRefund = await ordersService.processRefund(
        orderId.toString(),
        { _id: adminId, role: UserRole.ADMIN },
        {
          reason: 'Hoàn tiền đơn hủy',
          amount: 500000,
        },
      );

      expect(firstRefund.refundStatus).toBe(RefundStatus.REFUNDED);
      expect(firstRefund.refundTransactionRef).toBeDefined();

      // Second concurrent/duplicate refund attempt: order is already REFUNDED
      const alreadyRefundedOrder = createMockOrderDoc({
        ...mockOrder,
        refundStatus: RefundStatus.REFUNDED,
      });
      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(alreadyRefundedOrder),
      });

      await expect(
        ordersService.processRefund(
          orderId.toString(),
          { _id: adminId, role: UserRole.ADMIN },
          {
            reason: 'Thử hoàn tiền lần 2',
          },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
