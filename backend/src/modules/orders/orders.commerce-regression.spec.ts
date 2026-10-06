import { BadRequestException } from '@nestjs/common';
import { OrderStatus, UserRole } from '../../common/enums';
import { OrderLifecycleService } from './services/order-lifecycle.service';

describe('QA-01 & COMMERCE REGRESSION TEST SUITE', () => {
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

  describe('SHIP-01: GHN Authoritative Shipping Guard', () => {
    it('blocks non-SUPER_ADMIN from manually changing status to SHIPPING when GHN tracking exists', async () => {
      const order = {
        _id: 'order_ghn_01',
        orderStatus: OrderStatus.PROCESSING,
        shippingProvider: 'GHN',
        trackingCode: 'GHN_TEST_123',
        timeline: [],
        save: jest.fn().mockResolvedValue(this),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      await expect(
        orderLifecycleService.updateStatus(
          'order_ghn_01',
          { orderStatus: OrderStatus.SHIPPING },
          { _id: 'staff_1', role: UserRole.STAFF },
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        orderLifecycleService.updateStatus(
          'order_ghn_01',
          { orderStatus: OrderStatus.DELIVERED },
          { _id: 'admin_1', role: UserRole.ADMIN },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows SUPER_ADMIN to override GHN shipping status manually', async () => {
      const order: any = {
        _id: 'order_ghn_02',
        orderStatus: OrderStatus.PROCESSING,
        shippingProvider: 'GHN',
        trackingCode: 'GHN_TEST_456',
        timeline: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      const updated = await orderLifecycleService.updateStatus(
        'order_ghn_02',
        { orderStatus: OrderStatus.SHIPPING },
        { _id: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      );

      expect(updated.orderStatus).toBe(OrderStatus.SHIPPING);
    });

    it('allows GHN sync updates with _ghnSync flag regardless of actor role', async () => {
      const order: any = {
        _id: 'order_ghn_03',
        orderStatus: OrderStatus.SHIPPING,
        shippingProvider: 'GHN',
        trackingCode: 'GHN_TEST_789',
        timeline: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      const updated = await orderLifecycleService.updateStatus('order_ghn_03', {
        orderStatus: OrderStatus.DELIVERED,
        _ghnSync: true,
      } as any);

      expect(updated.orderStatus).toBe(OrderStatus.DELIVERED);
    });
  });

  describe('BA/BE-RETURN-01: Two-Stage Return Approval and Stock Restoration', () => {
    it('approveReturn transitions to RETURN_APPROVED and does NOT restore stock', async () => {
      const order: any = {
        _id: 'order_ret_01',
        orderStatus: OrderStatus.RETURN_REQUESTED,
        returnReason: 'Sách in mờ',
        timeline: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      const result = await orderLifecycleService.approveReturn(
        'order_ret_01',
        { _id: 'staff_1', role: UserRole.STAFF },
        'Đã duyệt yêu cầu hoàn trả',
      );

      expect(result.orderStatus).toBe(OrderStatus.RETURN_APPROVED);
      expect(result.returnApprovedAt).toBeDefined();
      // Verify restoreOrderStock was NOT called
      expect(
        mockOrderInventoryService.restoreOrderStock,
      ).not.toHaveBeenCalled();
    });

    it('confirmReturnReceived transitions to RETURNED and RESTORES stock', async () => {
      const order: any = {
        _id: 'order_ret_02',
        orderStatus: OrderStatus.RETURN_APPROVED,
        timeline: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      const result = await orderLifecycleService.confirmReturnReceived(
        'order_ret_02',
        { _id: 'staff_1', role: UserRole.STAFF },
        'Đã nhận lại kiện hàng',
      );

      expect(result.orderStatus).toBe(OrderStatus.RETURNED);
      // Verify restoreOrderStock was called
      expect(mockOrderInventoryService.restoreOrderStock).toHaveBeenCalled();
    });

    it('rejects confirmReturnReceived if order is not in RETURN_APPROVED status', async () => {
      const order: any = {
        _id: 'order_ret_03',
        orderStatus: OrderStatus.RETURN_REQUESTED, // Not approved yet
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      await expect(
        orderLifecycleService.confirmReturnReceived('order_ret_03', {
          _id: 'staff_1',
          role: UserRole.STAFF,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid state transition from PENDING directly to DELIVERED', async () => {
      const order: any = {
        _id: 'order_inv_01',
        orderStatus: OrderStatus.PENDING,
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      await expect(
        orderLifecycleService.updateStatus('order_inv_01', {
          orderStatus: OrderStatus.DELIVERED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('INV-01: restores inventory only ONCE when inventoryRestoredAt is already set', async () => {
      const order: any = {
        _id: 'order_inv_02',
        orderStatus: OrderStatus.RETURN_APPROVED,
        inventoryRestoredAt: new Date(), // Already restored previously
        items: [{ product: 'prod_1', quantity: 1 }],
        timeline: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      await orderLifecycleService.updateStatus('order_inv_02', {
        orderStatus: OrderStatus.RETURNED,
      });

      // Should NOT restore stock again
      expect(
        mockOrderInventoryService.restoreOrderStock,
      ).not.toHaveBeenCalled();
    });

    it('rejects customer cancellation when order is already in SHIPPING status', async () => {
      const order: any = {
        _id: 'order_cancel_ship',
        orderStatus: OrderStatus.SHIPPING,
        customer: 'cust_01',
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      await expect(
        orderLifecycleService.updateStatus(
          'order_cancel_ship',
          { orderStatus: OrderStatus.CANCELLED },
          { _id: 'cust_01', role: UserRole.CUSTOMER },
        ),
      ).rejects.toThrow();
    });
  });
});
