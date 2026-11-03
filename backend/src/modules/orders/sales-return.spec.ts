import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, UserRole } from '../../common/enums';
import { OrderLifecycleService } from './services/order-lifecycle.service';

describe('SALES-RET-01: Customer Sales Return & Refund Suite', () => {
  let orderLifecycleService: OrderLifecycleService;

  const mockOrderModel: any = jest.fn();
  const mockProductsService: any = {
    updateStock: jest.fn().mockResolvedValue(undefined),
    incrementSold: jest.fn().mockResolvedValue(undefined),
  };
  const mockPromotionsService: any = {
    releaseUsage: jest.fn().mockResolvedValue(undefined),
  };
  const mockOrderInventoryService: any = {
    restoreOrderStock: jest.fn().mockResolvedValue(undefined),
    rollbackStock: jest.fn().mockResolvedValue(undefined),
  };
  const mockOrderLoyaltyService: any = {
    rollbackLoyaltyPoints: jest.fn().mockResolvedValue(undefined),
    refundLoyaltyPoints: jest.fn().mockResolvedValue(undefined),
    deductAwardedPoints: jest.fn().mockResolvedValue(undefined),
  };
  const mockOrderNotificationService: any = {
    notifyStatusChange: jest.fn().mockResolvedValue(undefined),
    notifyStatusChanged: jest.fn().mockResolvedValue(undefined),
    recordAuditLog: jest.fn().mockResolvedValue(undefined),
    syncToGoogleSheet: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderModel.db = {};
    orderLifecycleService = new OrderLifecycleService(
      mockOrderModel,
      mockProductsService,
      mockPromotionsService,
      mockOrderInventoryService,
      mockOrderLoyaltyService,
      mockOrderNotificationService,
    );
  });

  describe('SALES-RET-T01 & T07: Standard Return Lifecycle', () => {
    it('successfully requests, approves, and completes customer sales return with inventory restoration', async () => {
      const order: any = {
        _id: 'order_ret_full_01',
        orderCode: 'ORD-2026-RET-01',
        customer: 'cust_123',
        orderStatus: OrderStatus.DELIVERED,
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (within 7 days)
        total: 250000,
        items: [
          {
            product: 'prod_1',
            name: 'Sách Văn Học',
            quantity: 1,
            price: 250000,
          },
        ],
        timeline: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      // 1. Request return by customer
      const requested = await orderLifecycleService.requestReturn(
        'order_ret_full_01',
        { _id: 'cust_123', role: UserRole.CUSTOMER },
        { reason: 'Trang sách bị rách' },
      );
      expect(requested.orderStatus).toBe(OrderStatus.RETURN_REQUESTED);
      expect(
        mockOrderInventoryService.restoreOrderStock,
      ).not.toHaveBeenCalled();

      // 2. Approve return by staff
      const approved = await orderLifecycleService.approveReturn(
        'order_ret_full_01',
        { _id: 'staff_1', role: UserRole.STAFF },
        'Đã kiểm tra và đồng ý hoàn trả',
      );
      expect(approved.orderStatus).toBe(OrderStatus.RETURN_APPROVED);
      expect(
        mockOrderInventoryService.restoreOrderStock,
      ).not.toHaveBeenCalled();

      // 3. Confirm return received by warehouse/staff -> triggers stock restoration
      const returned = await orderLifecycleService.confirmReturnReceived(
        'order_ret_full_01',
        { _id: 'staff_1', role: UserRole.STAFF },
        'Đã nhận lại sách tại kho',
      );
      expect(returned.orderStatus).toBe(OrderStatus.RETURNED);
      expect(mockOrderInventoryService.restoreOrderStock).toHaveBeenCalledWith(
        order.items,
        expect.any(String),
        'order_ret_full_01',
        undefined,
      );
    });
  });

  describe('SALES-RET-T05 & T06: 7-Day Return Window Policy & Manager Override', () => {
    it('SALES-RET-T05: rejects return requested after 7 days without override token', async () => {
      const deliveredTenDaysAgo = new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000,
      );
      const order: any = {
        _id: 'order_ret_expired',
        customer: 'cust_123',
        orderStatus: OrderStatus.DELIVERED,
        deliveredAt: deliveredTenDaysAgo,
        timeline: [],
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      await expect(
        orderLifecycleService.requestReturn(
          'order_ret_expired',
          { _id: 'cust_123', role: UserRole.CUSTOMER },
          { reason: 'Đổi ý không muốn đọc' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('SALES-RET-T06: permits return requested after 7 days with valid Manager Override Token', async () => {
      const deliveredTenDaysAgo = new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000,
      );
      const order: any = {
        _id: 'order_ret_override',
        customer: 'cust_123',
        orderStatus: OrderStatus.DELIVERED,
        deliveredAt: deliveredTenDaysAgo,
        timeline: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      const result = await orderLifecycleService.requestReturn(
        'order_ret_override',
        { _id: 'cust_123', role: UserRole.CUSTOMER },
        {
          reason: 'Khách VIP đổi sách sau 10 ngày',
          overrideToken: 'MGR-OVR-778899',
        },
      );

      expect(result.orderStatus).toBe(OrderStatus.RETURN_REQUESTED);
      expect(result.timeline[result.timeline.length - 1].note).toContain(
        'Đặc cách phê duyệt quá hạn',
      );
    });
  });

  describe('SALES-RET-T11 & T12: Security & Status Invariance', () => {
    it('SALES-RET-T11: rejects return when order is in PROCESSING or SHIPPING', async () => {
      const order: any = {
        _id: 'order_ret_processing',
        customer: 'cust_123',
        orderStatus: OrderStatus.PROCESSING,
        timeline: [],
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      await expect(
        orderLifecycleService.requestReturn(
          'order_ret_processing',
          { _id: 'cust_123', role: UserRole.CUSTOMER },
          { reason: 'Muốn trả lại hàng' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('SALES-RET-T12: rejects return request from unauthorized non-owner customer', async () => {
      const order: any = {
        _id: 'order_other_cust',
        customer: 'cust_owner_999',
        orderStatus: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
        timeline: [],
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      await expect(
        orderLifecycleService.requestReturn(
          'order_other_cust',
          { _id: 'attacker_cust_001', role: UserRole.CUSTOMER },
          { reason: 'Tấn công IDOR' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
