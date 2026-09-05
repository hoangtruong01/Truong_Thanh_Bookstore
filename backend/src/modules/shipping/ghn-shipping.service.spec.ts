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
});
