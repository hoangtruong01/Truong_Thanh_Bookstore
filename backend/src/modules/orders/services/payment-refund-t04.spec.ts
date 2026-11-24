import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { OrderLifecycleService } from './order-lifecycle.service';
import { PaymentsService } from '../../payments/payments.service';
import { OrderDocument } from '../schemas/order.schema';
import { PaymentDocument } from '../../payments/schemas/payment.schema';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  UserRole,
} from '../../../common/enums';
import { PaymentProviderRegistry } from '../../payments/providers/payment.providers';

describe('T04: Payment & Refund Invariants Suite (Trường Thành Bookstore)', () => {
  describe('1. Trace from Order to Income, Refund Ref, Approver & Partial Refund', () => {
    let orderModel: any;
    let orderLifecycleService: OrderLifecycleService;
    const orderId = new Types.ObjectId().toString();
    const actorId = new Types.ObjectId().toString();
    const actor = {
      _id: actorId,
      role: UserRole.ADMIN,
      name: 'Nguyễn Kế Toán',
    };

    let sampleOrder: any;

    beforeEach(() => {
      sampleOrder = {
        _id: new Types.ObjectId(orderId),
        orderCode: 'DH-20261124-001',
        orderStatus: OrderStatus.RETURNED,
        paymentStatus: PaymentStatus.PAID,
        total: 500000,
        refundStatus: RefundStatus.NONE,
        totalRefundedAmount: 0,
        refundHistory: [],
        timeline: [],
      };

      orderModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockImplementation(() => Promise.resolve(sampleOrder)),
        }),
        findOneAndUpdate: jest.fn().mockImplementation((filter, update) => {
          // Simulate MongoDB findOneAndUpdate
          if (update.$set) {
            Object.assign(sampleOrder, update.$set);
          }
          if (update.$push) {
            for (const key of Object.keys(update.$push)) {
              if (!sampleOrder[key]) sampleOrder[key] = [];
              sampleOrder[key].push(update.$push[key]);
            }
          }
          return {
            exec: jest.fn().mockResolvedValue(sampleOrder),
          };
        }),
      };

      orderLifecycleService = new OrderLifecycleService(
        orderModel,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
      );
    });

    it('T04-1: Hoàn một phần đợt 1 (200k/500k) -> Trạng thái PARTIAL, lưu mã chi hoàn và người duyệt', async () => {
      const result = await orderLifecycleService.confirmRefund(orderId, actor, {
        amount: 200000,
        reason: 'Khách trả bớt 2 cuốn sách',
        refundTransactionRef: 'PC261124-0001',
        idempotencyKey: 'IDEMP_REF_BATCH_1',
      });

      expect(result.refundStatus).toBe(RefundStatus.PARTIAL);
      expect(result.totalRefundedAmount).toBe(200000);
      expect(result.refundTransactionRef).toBe('PC261124-0001');
      expect(result.refundActor?.toString()).toBe(actorId);
      expect(result.refundActorName).toBe('Nguyễn Kế Toán');
      expect(result.refundHistory.length).toBe(1);
      expect(result.refundHistory[0].amount).toBe(200000);
      expect(result.refundHistory[0].refundTransactionRef).toBe(
        'PC261124-0001',
      );
      expect(result.refundHistory[0].actorName).toBe('Nguyễn Kế Toán');
    });

    it('T04-2: Hoàn một phần đợt 2 (300k còn lại) -> Trạng thái REFUNDED, hoàn tất toàn bộ', async () => {
      // Simulate state after batch 1
      sampleOrder.refundStatus = RefundStatus.PARTIAL;
      sampleOrder.totalRefundedAmount = 200000;
      sampleOrder.refundHistory = [
        {
          refundId: 'REF-DH-20261124-001-1',
          amount: 200000,
          reason: 'Đợt 1',
          refundTransactionRef: 'PC261124-0001',
          refundedAt: new Date(),
          actor: new Types.ObjectId(actorId),
          actorName: 'Nguyễn Kế Toán',
          idempotencyKey: 'IDEMP_REF_BATCH_1',
        },
      ];

      const result = await orderLifecycleService.confirmRefund(orderId, actor, {
        amount: 300000,
        reason: 'Hoàn nốt phần còn lại của đơn hàng',
        refundTransactionRef: 'PC261124-0002',
        idempotencyKey: 'IDEMP_REF_BATCH_2',
      });

      expect(result.refundStatus).toBe(RefundStatus.REFUNDED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(result.totalRefundedAmount).toBe(500000);
      expect(result.refundHistory.length).toBe(2);
      expect(result.refundTransactionRef).toBe('PC261124-0002');
    });

    it('T04-3: Hoàn tiền vượt quá số tiền còn lại có thể hoàn -> Bị từ chối với BadRequestException', async () => {
      // Đã hoàn 400k trên tổng 500k, chỉ còn 100k
      sampleOrder.refundStatus = RefundStatus.PARTIAL;
      sampleOrder.totalRefundedAmount = 400000;

      await expect(
        orderLifecycleService.confirmRefund(orderId, actor, {
          amount: 150000, // vượt quá 100k còn lại
          refundTransactionRef: 'PC261124-0003',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('T04-4: Retry cùng idempotencyKey không tạo thêm khoản chi và không tăng số tiền hoàn', async () => {
      // Đã hoàn đợt 1 thành công
      sampleOrder.refundStatus = RefundStatus.PARTIAL;
      sampleOrder.totalRefundedAmount = 200000;
      sampleOrder.refundHistory = [
        {
          refundId: 'REF-DH-20261124-001-1',
          amount: 200000,
          reason: 'Đợt 1',
          refundTransactionRef: 'PC261124-0001',
          refundedAt: new Date(),
          actor: new Types.ObjectId(actorId),
          actorName: 'Nguyễn Kế Toán',
          idempotencyKey: 'IDEMP_REF_BATCH_1',
        },
      ];

      // Gửi lại đúng request đợt 1 (network retry / double-click)
      const replayed = await orderLifecycleService.confirmRefund(
        orderId,
        actor,
        {
          amount: 200000,
          reason: 'Đợt 1',
          refundTransactionRef: 'PC261124-0001',
          idempotencyKey: 'IDEMP_REF_BATCH_1',
        },
      );

      // Số tiền không bị cộng dồn lần 2, mảng refundHistory không bị nhân bản
      expect(replayed.totalRefundedAmount).toBe(200000);
      expect(replayed.refundHistory.length).toBe(1);
    });

    it('T04-5: Cùng idempotencyKey nhưng đổi amount -> Bị từ chối với ConflictException (Payload mismatch)', async () => {
      sampleOrder.refundHistory = [
        {
          refundId: 'REF-DH-20261124-001-1',
          amount: 200000,
          reason: 'Đợt 1',
          refundTransactionRef: 'PC261124-0001',
          refundedAt: new Date(),
          actor: new Types.ObjectId(actorId),
          actorName: 'Nguyễn Kế Toán',
          idempotencyKey: 'IDEMP_REF_BATCH_1',
        },
      ];

      await expect(
        orderLifecycleService.confirmRefund(orderId, actor, {
          amount: 300000, // Đổi số tiền khác với key cũ
          refundTransactionRef: 'PC261124-0001',
          idempotencyKey: 'IDEMP_REF_BATCH_1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('2. Delayed Callback on Cancelled / Terminal Order & Income Trace', () => {
    let paymentModel: any;
    let orderModel: any;
    let registry: PaymentProviderRegistry;
    let paymentsService: PaymentsService;

    const mockOrderId = new Types.ObjectId();
    const mockPaymentId = new Types.ObjectId();

    beforeEach(() => {
      const mockPayment = {
        _id: mockPaymentId,
        order: mockOrderId,
        orderCode: 'DH-VNPAY-001',
        amount: 350000,
        provider: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        providerReference: 'VNP_INIT_REF_01',
        save: jest.fn().mockResolvedValue(true),
      };

      paymentModel = {
        findOne: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayment),
        }),
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayment),
        }),
      };

      const mockCancelledOrder = {
        _id: mockOrderId,
        orderCode: 'DH-VNPAY-001',
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.UNPAID,
        total: 350000,
      };

      orderModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCancelledOrder),
        }),
        updateOne: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        }),
      };

      const mockVnPayProvider = {
        method: PaymentMethod.VNPAY,
        initiate: jest.fn(),
        verifyCallback: jest.fn().mockResolvedValue({
          success: true,
          status: PaymentStatus.PAID,
          verifiedData: {
            transactionId: 'VNPAY_TXN_DELAYED_999',
            amount: 350000,
            providerReference: 'VNP_INIT_REF_01',
            orderCode: 'DH-VNPAY-001',
          },
        }),
      };

      registry = {
        get: jest.fn().mockReturnValue(mockVnPayProvider),
      } as unknown as PaymentProviderRegistry;

      paymentsService = new PaymentsService(
        paymentModel,
        orderModel,
        registry,
        {
          get: jest.fn().mockImplementation((k: string) => {
            if (k === 'ENABLED_PAYMENT_METHODS') return 'COD,VNPAY,MOMO';
            return null;
          }),
        } as any,
        undefined,
      );
    });

    it('T04-6: Callback trễ trên đơn đã CANCELLED -> Ghi nhận PAID cho Payment, đánh dấu MANUAL_REQUIRED cho Order để hoàn tiền, không tự tiện đổi orderStatus thành giao hàng', async () => {
      const result = await paymentsService.handleCallback({
        provider: PaymentMethod.VNPAY,
        transactionId: 'VNPAY_TXN_DELAYED_999',
        providerReference: 'VNP_INIT_REF_01',
        amount: 350000,
      });

      // Payment document ghi nhận tiền đã vào tài khoản cổng
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.transactionId).toBe('VNPAY_TXN_DELAYED_999');
      expect(result.failureReason).toContain('CANCELLED');

      // Order document nhận cờ đối soát hoàn tiền MANUAL_REQUIRED và lưu mã giao dịch thu
      expect(orderModel.updateOne).toHaveBeenCalledWith(
        { _id: mockOrderId },
        expect.objectContaining({
          $set: expect.objectContaining({
            paymentStatus: PaymentStatus.PAID,
            paymentTransactionId: 'VNPAY_TXN_DELAYED_999',
            refundStatus: RefundStatus.MANUAL_REQUIRED,
            refundReason: expect.stringContaining('CANCELLED'),
          }),
        }),
      );
    });
  });
});
