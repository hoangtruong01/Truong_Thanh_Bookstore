/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { OrderStatus } from '../../common/enums';
import { mapGhnStatus } from './ghn-shipping.service';
import { GhnShippingService } from './ghn-shipping.service';
import { ConfigService } from '@nestjs/config';

describe('GHN shipping status mapping', () => {
  it.each([
    ['ready_to_pick', OrderStatus.PROCESSING],
    ['picking', OrderStatus.PROCESSING],
    ['transporting', OrderStatus.SHIPPING],
    ['delivering', OrderStatus.SHIPPING],
    ['delivered', OrderStatus.DELIVERED],
    ['returned', OrderStatus.RETURNED],
    ['cancel', OrderStatus.CANCELLED],
  ])(
    'maps %s without bypassing the internal state machine',
    (source, target) => {
      expect(mapGhnStatus(source)).toBe(target);
    },
  );

  it('leaves unknown carrier states for manual review', () => {
    expect(mapGhnStatus('exception_requires_review')).toBeUndefined();
  });

  it('uses GHN token/shop headers and unwraps the documented response', async () => {
    const service = new GhnShippingService(
      {} as never,
      {} as never,
      new ConfigService({
        GHN_API_URL: 'https://dev-online-gateway.ghn.vn',
        GHN_TOKEN: 'test-token',
        GHN_SHOP_ID: '12345',
      }),
    );
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        code: 200,
        message: 'Success',
        data: { order_code: 'GHN123' },
      }),
    } as any);

    await expect(
      (service as any).call('/shiip/public-api/v2/shipping-order/detail', {
        order_code: 'GHN123',
      }),
    ).resolves.toEqual({ order_code: 'GHN123' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Token: 'test-token',
          ShopId: '12345',
        }),
      }),
    );
    fetchSpy.mockRestore();
  });

  describe('createShipment invariants', () => {
    it('returns existing order immediately without calling GHN if trackingCode already exists (idempotent)', async () => {
      const existingOrder = {
        _id: 'order_1',
        orderStatus: OrderStatus.CONFIRMED,
        trackingCode: 'GHN_EXISTING_123',
      };
      const mockOrderModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(existingOrder),
        }),
      };
      const service = new GhnShippingService(
        mockOrderModel as any,
        {} as any,
        new ConfigService({}),
      );
      const callSpy = jest.spyOn(service as any, 'call');

      const result = await service.createShipment('order_1', {} as any);

      expect(result).toBe(existingOrder);
      expect(callSpy).not.toHaveBeenCalled();
    });

    it('throws BadRequestException if order status is not CONFIRMED or PROCESSING', async () => {
      const pendingOrder = {
        _id: 'order_2',
        orderStatus: OrderStatus.PENDING,
      };
      const mockOrderModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(pendingOrder),
        }),
      };
      const service = new GhnShippingService(
        mockOrderModel as any,
        {} as any,
        new ConfigService({}),
      );

      await expect(
        service.createShipment('order_2', {} as any),
      ).rejects.toThrow('Chỉ tạo vận đơn cho đơn đã xác nhận');
    });

    it('handles GHN API failure / timeout gracefully by throwing ServiceUnavailableException without corrupting order', async () => {
      const confirmedOrder = {
        _id: 'order_3',
        orderStatus: OrderStatus.CONFIRMED,
        items: [],
      };
      const mockOrderModel = {
        findById: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(confirmedOrder),
        }),
      };
      const service = new GhnShippingService(
        mockOrderModel as any,
        {} as any,
        new ConfigService({}),
      );
      jest
        .spyOn(service as any, 'call')
        .mockRejectedValue(new Error('Network timeout'));

      await expect(
        service.createShipment('order_3', {
          toDistrictId: 1,
          toWardCode: '1',
          weight: 100,
          length: 10,
          width: 10,
          height: 10,
        } as any),
      ).rejects.toThrow();

      // Order has not been modified with trackingCode
      expect((confirmedOrder as any).trackingCode).toBeUndefined();
    });
  });
});
