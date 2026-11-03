/**
 * Chính sách giá dùng chung cho checkout preview, tạo đơn và giỏ hàng.
 * Đây là nguồn duy nhất cho ngưỡng freeship, phí ship và quy tắc tiêu điểm
 * Loyalty — client chỉ hiển thị giá trị do backend trả về.
 *
 * File chỉ chứa hằng số và hàm thuần (không phụ thuộc Nest/Mongoose) để
 * module orders và cart cùng import mà không tạo vòng phụ thuộc.
 */

export const FREE_SHIPPING_THRESHOLD = 299000;
export const SHIPPING_FEE = 30000;

export const LOYALTY_MIN_REDEEM_POINTS = 1000;
/** Giá trị quy đổi của 1 điểm (VNĐ). */
export const LOYALTY_POINT_VALUE = 100;
/** Phần trăm tối đa của subtotal (trước voucher) được giảm bằng điểm. */
export const LOYALTY_MAX_REDEEM_PERCENT = 20;

export interface PricingPolicy {
  freeShippingThreshold: number;
  shippingFee: number;
  loyalty: {
    minRedeemPoints: number;
    pointValue: number;
    maxRedeemPercent: number;
  };
}

/** Phí ship: miễn phí khi giỏ rỗng hoặc subtotal đạt ngưỡng freeship. */
export function computeShippingFee(subtotal: number): number {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEE;
}

/** Số tiền tối đa được giảm bằng điểm Loyalty cho một subtotal. */
export function computeMaxLoyaltyDiscount(subtotal: number): number {
  return Math.floor((Math.max(0, subtotal) * LOYALTY_MAX_REDEEM_PERCENT) / 100);
}

/** Số điểm tối đa được tiêu = min(số dư, hạn mức 20% quy ra điểm). */
export function computeMaxRedeemablePoints(
  subtotal: number,
  balance: number,
): number {
  const capPoints = Math.floor(
    computeMaxLoyaltyDiscount(subtotal) / LOYALTY_POINT_VALUE,
  );
  return Math.max(0, Math.min(Math.floor(balance || 0), capPoints));
}

/** Subtotal tối thiểu để có thể tiêu mức điểm tối thiểu. */
export function computeMinSubtotalToRedeem(): number {
  return Math.ceil(
    (LOYALTY_MIN_REDEEM_POINTS * LOYALTY_POINT_VALUE * 100) /
      LOYALTY_MAX_REDEEM_PERCENT,
  );
}

export function getPricingPolicy(): PricingPolicy {
  return {
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    shippingFee: SHIPPING_FEE,
    loyalty: {
      minRedeemPoints: LOYALTY_MIN_REDEEM_POINTS,
      pointValue: LOYALTY_POINT_VALUE,
      maxRedeemPercent: LOYALTY_MAX_REDEEM_PERCENT,
    },
  };
}
