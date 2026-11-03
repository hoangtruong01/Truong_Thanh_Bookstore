import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  computeMaxLoyaltyDiscount,
  computeMaxRedeemablePoints,
  computeMinSubtotalToRedeem,
  computeShippingFee,
  getPricingPolicy,
} from './checkout-policy';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import {
  FREE_SHIPPING_THRESHOLD as CART_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FEE,
} from '../cart/cart.service';

describe('checkout-policy (shared pricing rules)', () => {
  it('computeShippingFee: free for an empty cart and at/above the threshold', () => {
    expect(computeShippingFee(0)).toBe(0);
    expect(computeShippingFee(1)).toBe(SHIPPING_FEE);
    expect(computeShippingFee(298999)).toBe(30000);
    expect(computeShippingFee(299000)).toBe(0);
    expect(computeShippingFee(1000000)).toBe(0);
  });

  it('computeMaxRedeemablePoints = min(balance, floor(floor(subtotal × 20%) / 100))', () => {
    expect(computeMaxLoyaltyDiscount(100000)).toBe(20000);
    expect(computeMaxRedeemablePoints(100000, 5000)).toBe(200);
    expect(computeMaxRedeemablePoints(1000000, 1500)).toBe(1500);
    expect(computeMaxRedeemablePoints(1000000, 0)).toBe(0);
    expect(computeMaxRedeemablePoints(0, 5000)).toBe(0);
    // 20% của 4.999đ = 999đ -> 9 điểm (không làm tròn lên)
    expect(computeMaxRedeemablePoints(4999, 5000)).toBe(9);
  });

  it('minimum subtotal to redeem the 1,000-point minimum is 500.000đ', () => {
    expect(computeMinSubtotalToRedeem()).toBe(500000);
    expect(computeMaxRedeemablePoints(500000, 5000)).toBe(1000);
    expect(computeMaxRedeemablePoints(499999, 5000)).toBe(999);
  });

  it('getPricingPolicy exposes only the public constants', () => {
    expect(getPricingPolicy()).toEqual({
      freeShippingThreshold: 299000,
      shippingFee: 30000,
      loyalty: { minRedeemPoints: 1000, pointValue: 100, maxRedeemPercent: 20 },
    });
  });

  it('cart.service keeps re-exporting the same constants', () => {
    expect(CART_FREE_SHIPPING_THRESHOLD).toBe(FREE_SHIPPING_THRESHOLD);
    expect(DEFAULT_SHIPPING_FEE).toBe(SHIPPING_FEE);
  });
});

describe('GET /orders/pricing-policy', () => {
  const controller = new OrdersController({} as OrdersService);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const handler = OrdersController.prototype.getPricingPolicy;

  it('returns the pricing policy without touching the orders service', () => {
    expect(controller.getPricingPolicy()).toEqual(getPricingPolicy());
  });

  it('is a public route (no guards) mapped to "pricing-policy"', () => {
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('pricing-policy');
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
    expect(
      Reflect.getMetadata(GUARDS_METADATA, OrdersController),
    ).toBeUndefined();
  });

  it('is declared before GET :id so ":id" cannot capture it', () => {
    const methods = Object.getOwnPropertyNames(OrdersController.prototype);
    expect(methods.indexOf('getPricingPolicy')).toBeGreaterThan(-1);
    expect(methods.indexOf('getPricingPolicy')).toBeLessThan(
      methods.indexOf('findById'),
    );
  });
});
