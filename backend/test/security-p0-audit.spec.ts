import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  UserRole,
} from '../src/common/enums';
import { OrderLifecycleService } from '../src/modules/orders/services/order-lifecycle.service';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { AuthService } from '../src/modules/auth/auth.service';

describe('QA-01: CTO Security P0 Audit Regression Suite', () => {
  // =========================================================================
  // SUITE 1: BE-01 Guest Order Cancellation Security
  // =========================================================================
  describe('BE-01: Guest Order Cancellation Security', () => {
    let orderLifecycleService: OrderLifecycleService;
    let mockOrderModel: any;
    let mockProductsService: any;
    let mockPromotionsService: any;
    let mockInventoryService: any;
    let mockLoyaltyService: any;
    let mockNotificationService: any;

    const guestRawToken = 'legitimate-guest-secret-token-32bytes-hex';
    const guestTokenHash = createHash('sha256')
      .update(guestRawToken)
      .digest('hex');

    beforeEach(() => {
      mockOrderModel = {
        findById: jest.fn(),
        db: {
          transaction: undefined,
        },
      };
      mockProductsService = {
        updateStock: jest.fn().mockResolvedValue(true),
      };
      mockPromotionsService = {
        rollbackUsage: jest.fn().mockResolvedValue(true),
      };
      mockInventoryService = {
        restoreOrderStock: jest.fn().mockResolvedValue(true),
      };
      mockLoyaltyService = {
        rollbackLoyaltyForCancelledOrder: jest.fn().mockResolvedValue(true),
      };
      mockNotificationService = {
        notifyStatusChanged: jest.fn().mockResolvedValue(true),
        syncToGoogleSheet: jest.fn().mockResolvedValue(true),
      };

      orderLifecycleService = new OrderLifecycleService(
        mockOrderModel,
        mockProductsService,
        mockPromotionsService,
        mockInventoryService,
        mockLoyaltyService,
        mockNotificationService,
      );
    });

    it('BE-01.1: Rejects guest cancellation when token is completely missing', async () => {
      const orderId = new Types.ObjectId().toHexString();

      await expect(
        orderLifecycleService.cancelGuest(orderId, undefined),
      ).rejects.toThrow(ForbiddenException);

      expect(mockOrderModel.findById).not.toHaveBeenCalled();
      expect(mockInventoryService.restoreOrderStock).not.toHaveBeenCalled();
    });

    it('BE-01.2: Rejects guest cancellation when provided token does not match stored hash', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const mockGuestOrder: any = {
        _id: orderId,
        customer: undefined,
        guestAccessTokenHash: guestTokenHash,
        orderStatus: OrderStatus.PENDING,
        items: [],
      };

      mockOrderModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGuestOrder),
        }),
      });

      await expect(
        orderLifecycleService.cancelGuest(orderId, 'wrong-forged-token'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockInventoryService.restoreOrderStock).not.toHaveBeenCalled();
    });

    it('BE-01.3: Rejects guest cancellation if order is not in PENDING state', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const mockGuestOrder: any = {
        _id: orderId,
        customer: undefined,
        guestAccessTokenHash: guestTokenHash,
        orderStatus: OrderStatus.PROCESSING,
        items: [],
      };

      mockOrderModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGuestOrder),
        }),
      });

      await expect(
        orderLifecycleService.cancelGuest(orderId, guestRawToken),
      ).rejects.toThrow(BadRequestException);

      expect(mockInventoryService.restoreOrderStock).not.toHaveBeenCalled();
    });

    it('BE-01.4: Rejects guest cancellation if order belongs to a registered customer', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const mockCustomerOrder: any = {
        _id: orderId,
        customer: new Types.ObjectId(),
        guestAccessTokenHash: guestTokenHash,
        orderStatus: OrderStatus.PENDING,
      };

      mockOrderModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCustomerOrder),
        }),
      });

      await expect(
        orderLifecycleService.cancelGuest(orderId, guestRawToken),
      ).rejects.toThrow(NotFoundException);

      expect(mockInventoryService.restoreOrderStock).not.toHaveBeenCalled();
    });

    it('BE-01.5: Successfully cancels guest order when valid token is provided', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const createOrder = () => ({
        _id: orderId,
        customer: undefined,
        guestAccessTokenHash: guestTokenHash,
        orderStatus: OrderStatus.PENDING,
        items: [
          {
            product: new Types.ObjectId(),
            quantity: 2,
          },
        ],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      });

      const guestOrder = createOrder();

      mockOrderModel.findById.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(guestOrder),
        }),
      });

      mockOrderModel.findById.mockReturnValueOnce({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(guestOrder),
        }),
        exec: jest.fn().mockResolvedValue(guestOrder),
      });

      const result = await orderLifecycleService.cancelGuest(
        orderId,
        guestRawToken,
        'Khách hủy đơn',
      );

      expect(result.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(mockInventoryService.restoreOrderStock).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // SUITE 2: BE-02 Payment Callback Integrity & Authentication Ordering
  // =========================================================================
  describe('BE-02: Payment Callback Authentication Ordering', () => {
    let paymentsService: PaymentsService;
    let paymentModel: any;
    let orderModel: any;
    let providers: any;

    beforeEach(() => {
      paymentModel = {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findById: jest.fn(),
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

    it('BE-02.1: Invalid provider signature throws BadRequestException with ZERO DB writes', async () => {
      const mockPayment: any = {
        _id: new Types.ObjectId(),
        order: new Types.ObjectId(),
        amount: 250000,
        provider: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      providers.get.mockReturnValue({
        method: PaymentMethod.VNPAY,
        verifyCallback: jest
          .fn()
          .mockRejectedValue(
            new BadRequestException('Chữ ký callback thanh toán không hợp lệ'),
          ),
      });

      await expect(
        paymentsService.handleCallback({
          provider: PaymentMethod.VNPAY,
          transactionId: 'forged_txn_999',
          amount: 250000,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPayment.save).not.toHaveBeenCalled();
      expect(orderModel.updateOne).not.toHaveBeenCalled();
    });

    it('BE-02.2: Valid signature with Amount Tampering marks Payment FAILED & Order MANUAL_REQUIRED', async () => {
      const mockPayment: any = {
        _id: new Types.ObjectId(),
        order: new Types.ObjectId(),
        amount: 500000,
        provider: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      providers.get.mockReturnValue({
        method: PaymentMethod.VNPAY,
        verifyCallback: jest.fn().mockResolvedValue({
          success: true,
          status: PaymentStatus.PAID,
        }),
      });

      await expect(
        paymentsService.handleCallback({
          provider: PaymentMethod.VNPAY,
          transactionId: 'txn_tampered_123',
          amount: 50000,
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

    it('BE-02.3: Valid signature and matching amount updates Payment to PAID and Order to CONFIRMED', async () => {
      const mockPayment: any = {
        _id: new Types.ObjectId(),
        order: new Types.ObjectId(),
        amount: 300000,
        provider: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      const updatedPayment: any = {
        ...mockPayment,
        status: PaymentStatus.PAID,
        transactionId: 'txn_valid_456',
        paidAt: new Date(),
        callbackProcessedAt: new Date(),
      };

      paymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      paymentModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedPayment),
      });

      providers.get.mockReturnValue({
        method: PaymentMethod.VNPAY,
        verifyCallback: jest.fn().mockResolvedValue({
          success: true,
          status: PaymentStatus.PAID,
        }),
      });

      const result = await paymentsService.handleCallback({
        provider: PaymentMethod.VNPAY,
        transactionId: 'txn_valid_456',
        amount: 300000,
      });

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(orderModel.updateOne).toHaveBeenCalledWith(
        { _id: mockPayment.order },
        expect.objectContaining({
          $set: expect.objectContaining({
            paymentStatus: PaymentStatus.PAID,
          }),
        }),
      );
      expect(orderModel.updateOne).toHaveBeenCalledWith(
        { _id: mockPayment.order, orderStatus: OrderStatus.PENDING },
        expect.objectContaining({
          $set: expect.objectContaining({
            orderStatus: OrderStatus.CONFIRMED,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // SUITE 3: BE-03 Logout Token Identity Verification
  // =========================================================================
  describe('BE-03: Logout Token Identity Verification', () => {
    let authService: AuthService;
    let mockUsersService: any;
    let mockJwtService: any;
    let mockTokenBlacklistService: any;
    let mockConfigService: any;

    beforeEach(() => {
      mockUsersService = {
        findByIdWithPassword: jest.fn(),
      };
      mockJwtService = {
        decode: jest.fn(),
        verifyAsync: jest.fn(),
      };
      mockTokenBlacklistService = {
        blacklistJti: jest.fn().mockResolvedValue(undefined),
        blacklistToken: jest.fn().mockResolvedValue(undefined),
      };
      mockConfigService = {
        getOrThrow: jest.fn().mockImplementation((key: string) => {
          if (key === 'JWT_SECRET')
            return 'test-jwt-secret-key-at-least-32-chars';
          if (key === 'JWT_REFRESH_SECRET')
            return 'test-refresh-secret-key-at-least-32';
          return 'mock-secret';
        }),
        get: jest.fn().mockReturnValue('30d'),
      };

      authService = new AuthService(
        mockUsersService,
        mockJwtService,
        {} as any,
        {} as any,
        mockTokenBlacklistService,
        mockConfigService,
      );
    });

    it('BE-03.1: Forged JWT in logout fails signature check and NEVER mutates victim user', async () => {
      const victimId = 'victim_user_id_12345';
      const forgedToken = 'header.forged_payload.invalid_signature';

      mockJwtService.decode.mockReturnValue({
        sub: victimId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: 'attacker-jti-1',
      });

      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('invalid signature'),
      );

      const result = await authService.logout(
        undefined,
        forgedToken,
        undefined,
      );

      expect(result.success).toBe(true);
      expect(mockUsersService.findByIdWithPassword).not.toHaveBeenCalled();
    });

    it('BE-03.2: Validly signed token clears user session in DB', async () => {
      const realUserId = 'real_user_id_99999';
      const validToken = 'valid.signed.jwt';

      const mockUser: any = {
        _id: realUserId,
        refreshTokenHash: 'active_session_hash',
        save: jest.fn().mockResolvedValue(true),
      };
      mockUsersService.findByIdWithPassword.mockResolvedValue(mockUser);

      mockJwtService.decode.mockReturnValue({
        sub: realUserId,
        exp: Math.floor(Date.now() / 1000) + 900,
        jti: 'valid-jti-2',
      });
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: realUserId,
        type: 'access',
      });

      const result = await authService.logout(undefined, validToken, undefined);

      expect(result.success).toBe(true);
      expect(mockUsersService.findByIdWithPassword).toHaveBeenCalledWith(
        realUserId,
      );
      expect(mockUser.refreshTokenHash).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // SUITE 4: BE-04 Transient MongoDB Transaction Retries
  // =========================================================================
  describe('BE-04: Transient MongoDB Transaction Retries', () => {
    let orderLifecycleService: OrderLifecycleService;
    let mockOrderModel: any;
    let mockInventoryService: any;
    let mockNotificationService: any;

    beforeEach(() => {
      mockInventoryService = {
        restoreOrderStock: jest.fn().mockResolvedValue(true),
      };
      mockNotificationService = {
        notifyStatusChanged: jest.fn().mockResolvedValue(true),
        syncToGoogleSheet: jest.fn().mockResolvedValue(true),
      };
    });

    it('BE-04.1: Retries transaction on WriteConflict (code 112) and succeeds on retry', async () => {
      const orderId = new Types.ObjectId().toHexString();

      let attempt = 0;
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockImplementation(() => {
          attempt++;
          if (attempt === 1) {
            const error: any = new Error(
              'WriteConflict: retry multi-document transaction',
            );
            error.code = 112;
            throw error;
          }
          return Promise.resolve();
        }),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn().mockResolvedValue(undefined),
      };

      mockOrderModel = {
        findById: jest.fn().mockImplementation(() => {
          const freshOrder: any = {
            _id: orderId,
            orderStatus: OrderStatus.PENDING,
            items: [{ product: new Types.ObjectId(), quantity: 1 }],
            save: jest.fn().mockImplementation(function (this: any) {
              return Promise.resolve(this);
            }),
          };
          return {
            session: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(freshOrder),
            }),
            exec: jest.fn().mockResolvedValue(freshOrder),
          };
        }),
        db: {
          transaction: undefined,
          startSession: jest.fn().mockResolvedValue(mockSession),
        },
      };

      orderLifecycleService = new OrderLifecycleService(
        mockOrderModel,
        {} as any,
        { rollbackUsage: jest.fn().mockResolvedValue(true) } as any,
        mockInventoryService,
        {
          rollbackLoyaltyForCancelledOrder: jest.fn().mockResolvedValue(true),
        } as any,
        mockNotificationService,
      );

      const result = await orderLifecycleService.updateStatus(orderId, {
        orderStatus: OrderStatus.CANCELLED,
      });

      expect(result.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.commitTransaction).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.notifyStatusChanged).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  // =========================================================================
  // SUITE 5: BE-05 Enforce Payable Order State Invariant
  // =========================================================================
  describe('BE-05: Enforce Payable Order State Invariant', () => {
    let paymentsService: PaymentsService;
    let paymentModel: any;
    let orderModel: any;
    let providers: any;
    const customerId = new Types.ObjectId().toHexString();
    const customerActor = { _id: customerId, role: UserRole.CUSTOMER };

    beforeEach(() => {
      const mockPaymentConstructor: any = function (this: any, data: any) {
        Object.assign(this, data);
        this._id = new Types.ObjectId();
        this.save = jest.fn().mockResolvedValue(this);
      };
      mockPaymentConstructor.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
        exec: jest.fn().mockResolvedValue(null),
      });
      mockPaymentConstructor.findOneAndUpdate = jest.fn();
      mockPaymentConstructor.create = jest.fn();
      paymentModel = mockPaymentConstructor;

      orderModel = {
        findById: jest.fn(),
        updateOne: jest.fn(),
      };
      providers = {
        get: jest.fn().mockReturnValue({
          initiate: jest.fn().mockResolvedValue({
            status: PaymentStatus.PENDING,
            providerReference: 'REF-123',
          }),
        }),
      };
      paymentsService = new PaymentsService(
        paymentModel,
        orderModel,
        providers,
      );
    });

    it('BE-05.1: Rejects payment creation for CANCELLED order with ConflictException', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const mockOrder = {
        _id: orderId,
        orderCode: 'TT-CANCELLED-1',
        customer: customerId,
        paymentMethod: PaymentMethod.VNPAY,
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.UNPAID,
        total: 200000,
      };
      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      await expect(
        paymentsService.createPayment(
          { orderId, provider: PaymentMethod.VNPAY },
          customerActor,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('BE-05.2: Rejects payment creation for RETURNED order with ConflictException', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const mockOrder = {
        _id: orderId,
        orderCode: 'TT-RETURNED-1',
        customer: customerId,
        paymentMethod: PaymentMethod.VNPAY,
        orderStatus: OrderStatus.RETURNED,
        paymentStatus: PaymentStatus.UNPAID,
        total: 200000,
      };
      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      await expect(
        paymentsService.createPayment(
          { orderId, provider: PaymentMethod.VNPAY },
          customerActor,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('BE-05.3: Rejects payment creation for COMPLETED order with ConflictException', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const mockOrder = {
        _id: orderId,
        orderCode: 'TT-COMPLETED-1',
        customer: customerId,
        paymentMethod: PaymentMethod.VNPAY,
        orderStatus: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.UNPAID,
        total: 200000,
      };
      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      await expect(
        paymentsService.createPayment(
          { orderId, provider: PaymentMethod.VNPAY },
          customerActor,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('BE-05.4: Rejects payment creation for already PAID order with ConflictException', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const mockOrder = {
        _id: orderId,
        orderCode: 'TT-PAID-1',
        customer: customerId,
        paymentMethod: PaymentMethod.VNPAY,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PAID,
        total: 200000,
      };
      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      await expect(
        paymentsService.createPayment(
          { orderId, provider: PaymentMethod.VNPAY },
          customerActor,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('BE-05.5: Allows payment creation for payable PENDING order', async () => {
      const orderId = new Types.ObjectId().toHexString();
      const mockOrder = {
        _id: orderId,
        orderCode: 'TT-PENDING-1',
        customer: customerId,
        paymentMethod: PaymentMethod.VNPAY,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        total: 200000,
      };
      orderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });
      paymentModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
        exec: jest.fn().mockResolvedValue(null),
      });
      const createdPayment = {
        _id: new Types.ObjectId(),
        order: orderId,
        amount: 200000,
        provider: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      };
      paymentModel.create.mockResolvedValue(createdPayment);

      const result = await paymentsService.createPayment(
        { orderId, provider: PaymentMethod.VNPAY },
        customerActor,
      );

      expect(result).toBeDefined();
      expect(providers.get).toHaveBeenCalledWith(PaymentMethod.VNPAY);
    });
  });
});
