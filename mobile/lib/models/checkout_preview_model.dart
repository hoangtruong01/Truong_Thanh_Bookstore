/// Pricing contract of `POST /orders/checkout-preview` (and `GET /orders/pricing-policy`).
///
/// Every money value here is computed by the backend from the database. The app
/// displays these values and never recomputes subtotal, shipping, discounts or totals.
library;

num _num(dynamic value) => value is num ? value : num.tryParse('${value ?? ''}') ?? 0;

int _int(dynamic value) => _num(value).toInt();

/// Checkout-only inputs that change the preview (loyalty, payment method) or the guest
/// voucher identity (phone / email). Empty values are never sent.
class PricingContext {
  final int? loyaltyPointsUsed;
  final String? phone;
  final String? customerEmail;
  final String? shippingAddress;
  final String? paymentMethod;

  const PricingContext({
    this.loyaltyPointsUsed,
    this.phone,
    this.customerEmail,
    this.shippingAddress,
    this.paymentMethod,
  });

  static String? _clean(String? value) {
    final trimmed = value?.trim();
    return trimmed == null || trimmed.isEmpty ? null : trimmed;
  }

  Map<String, dynamic> toJson() => {
        if (loyaltyPointsUsed != null && loyaltyPointsUsed! > 0) 'loyaltyPointsUsed': loyaltyPointsUsed,
        if (_clean(paymentMethod) != null) 'paymentMethod': _clean(paymentMethod),
        if (_clean(phone) != null) 'phone': _clean(phone),
        if (_clean(customerEmail) != null) 'customerEmail': _clean(customerEmail),
        if (_clean(shippingAddress) != null) 'shippingAddress': _clean(shippingAddress),
      };

  @override
  bool operator ==(Object other) =>
      other is PricingContext &&
      other.loyaltyPointsUsed == loyaltyPointsUsed &&
      _clean(other.phone) == _clean(phone) &&
      _clean(other.customerEmail) == _clean(customerEmail) &&
      _clean(other.shippingAddress) == _clean(shippingAddress) &&
      _clean(other.paymentMethod) == _clean(paymentMethod);

  @override
  int get hashCode => Object.hash(loyaltyPointsUsed, _clean(phone), _clean(customerEmail),
      _clean(shippingAddress), _clean(paymentMethod));
}

class CheckoutPreviewItem {
  final String product;
  final String name;
  final num price;
  final num originalPrice;
  final int quantity;
  final int requestedQuantity;
  final int stock;
  final String image;
  final num subtotal;

  const CheckoutPreviewItem({
    required this.product,
    required this.name,
    required this.price,
    required this.originalPrice,
    required this.quantity,
    required this.requestedQuantity,
    required this.stock,
    required this.image,
    required this.subtotal,
  });

  factory CheckoutPreviewItem.fromJson(Map<String, dynamic> json) {
    final price = _num(json['price']);
    final quantity = _int(json['quantity']);
    return CheckoutPreviewItem(
      product: '${json['product'] ?? ''}',
      name: '${json['name'] ?? ''}',
      price: price,
      originalPrice: json['originalPrice'] is num ? json['originalPrice'] as num : price,
      quantity: quantity,
      requestedQuantity: json['requestedQuantity'] is num ? _int(json['requestedQuantity']) : quantity,
      stock: _int(json['stock']),
      image: '${json['image'] ?? ''}',
      subtotal: _num(json['subtotal']),
    );
  }
}

class CheckoutPreviewUnavailableItem {
  final String product;
  final String name;

  /// `UNAVAILABLE` (deleted / inactive) or `OUT_OF_STOCK`.
  final String reason;
  final int stock;
  final int requestedQuantity;

  const CheckoutPreviewUnavailableItem({
    required this.product,
    required this.name,
    required this.reason,
    required this.stock,
    required this.requestedQuantity,
  });

  factory CheckoutPreviewUnavailableItem.fromJson(Map<String, dynamic> json) =>
      CheckoutPreviewUnavailableItem(
        product: '${json['product'] ?? ''}',
        name: '${json['name'] ?? ''}',
        reason: '${json['reason'] ?? 'UNAVAILABLE'}',
        stock: _int(json['stock']),
        requestedQuantity: _int(json['requestedQuantity']),
      );
}

/// Loyalty block of the preview (null for guests). Limits and errors come from the server.
class CheckoutPreviewLoyalty {
  final int availablePoints;
  final int minRedeemPoints;
  final num pointValue;
  final num maxRedeemPercent;
  final int maxRedeemablePoints;
  final num minSubtotalToRedeem;
  final bool canRedeem;
  final int requestedPoints;
  final int appliedPoints;
  final String? error;

  const CheckoutPreviewLoyalty({
    required this.availablePoints,
    required this.minRedeemPoints,
    required this.pointValue,
    required this.maxRedeemPercent,
    required this.maxRedeemablePoints,
    required this.minSubtotalToRedeem,
    required this.canRedeem,
    required this.requestedPoints,
    required this.appliedPoints,
    this.error,
  });

  factory CheckoutPreviewLoyalty.fromJson(Map<String, dynamic> json) => CheckoutPreviewLoyalty(
        availablePoints: _int(json['availablePoints']),
        minRedeemPoints: _int(json['minRedeemPoints']),
        pointValue: _num(json['pointValue']),
        maxRedeemPercent: _num(json['maxRedeemPercent']),
        maxRedeemablePoints: _int(json['maxRedeemablePoints']),
        minSubtotalToRedeem: _num(json['minSubtotalToRedeem']),
        canRedeem: json['canRedeem'] == true,
        requestedPoints: _int(json['requestedPoints']),
        appliedPoints: _int(json['appliedPoints']),
        error: json['error'] is String && (json['error'] as String).isNotEmpty ? json['error'] as String : null,
      );
}

class AppliedPromotion {
  final String code;
  final num discount;

  const AppliedPromotion({required this.code, required this.discount});
}

class CheckoutPreview {
  final List<CheckoutPreviewItem> items;
  final List<CheckoutPreviewUnavailableItem> unavailableItems;
  final num subtotal;
  final num shippingFee;
  final num? standardShippingFee;
  final num? freeShippingThreshold;
  final bool isEligibleForFreeShipping;
  final num amountNeededForFreeShipping;

  /// Server progress towards free shipping, 0..100.
  final num freeShippingProgress;
  final num discount;
  final AppliedPromotion? appliedPromotion;
  final String? promotionError;
  final num loyaltyDiscount;
  final CheckoutPreviewLoyalty? loyalty;
  final num total;
  final List<String> warnings;
  final bool isValidForCheckout;

  const CheckoutPreview({
    required this.items,
    required this.unavailableItems,
    required this.subtotal,
    required this.shippingFee,
    this.standardShippingFee,
    this.freeShippingThreshold,
    required this.isEligibleForFreeShipping,
    required this.amountNeededForFreeShipping,
    required this.freeShippingProgress,
    required this.discount,
    this.appliedPromotion,
    this.promotionError,
    required this.loyaltyDiscount,
    this.loyalty,
    required this.total,
    required this.warnings,
    required this.isValidForCheckout,
  });

  /// Returns null when [json] is not a preview (no numeric `total`).
  static CheckoutPreview? tryParse(dynamic json) {
    if (json is! Map || json['total'] is! num) return null;
    final map = Map<String, dynamic>.from(json);
    List<Map<String, dynamic>> maps(dynamic value) => value is List
        ? value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : const [];
    final promo = map['appliedPromotion'];
    final loyalty = map['loyalty'];
    return CheckoutPreview(
      items: maps(map['items']).map(CheckoutPreviewItem.fromJson).toList(),
      unavailableItems: maps(map['unavailableItems']).map(CheckoutPreviewUnavailableItem.fromJson).toList(),
      subtotal: _num(map['subtotal']),
      shippingFee: _num(map['shippingFee']),
      standardShippingFee: map['standardShippingFee'] is num ? map['standardShippingFee'] as num : null,
      freeShippingThreshold: map['freeShippingThreshold'] is num ? map['freeShippingThreshold'] as num : null,
      isEligibleForFreeShipping: map['isEligibleForFreeShipping'] == true,
      amountNeededForFreeShipping: _num(map['amountNeededForFreeShipping']),
      freeShippingProgress: _num(map['freeShippingProgress']),
      discount: _num(map['discount']),
      appliedPromotion: promo is Map && promo['code'] is String
          ? AppliedPromotion(code: promo['code'] as String, discount: _num(promo['discount']))
          : null,
      promotionError: map['promotionError'] is String ? map['promotionError'] as String : null,
      loyaltyDiscount: _num(map['loyaltyDiscount']),
      loyalty: loyalty is Map ? CheckoutPreviewLoyalty.fromJson(Map<String, dynamic>.from(loyalty)) : null,
      total: map['total'] as num,
      warnings: map['warnings'] is List ? (map['warnings'] as List).map((w) => '$w').toList() : const [],
      isValidForCheckout: map['isValidForCheckout'] == true,
    );
  }

  CheckoutPreviewItem? itemFor(String productId) {
    for (final item in items) {
      if (item.product == productId) return item;
    }
    return null;
  }

  CheckoutPreviewUnavailableItem? unavailableFor(String productId) {
    for (final item in unavailableItems) {
      if (item.product == productId) return item;
    }
    return null;
  }
}

/// `GET /orders/pricing-policy`: public constants used only for explanatory copy.
class PricingPolicy {
  final num freeShippingThreshold;
  final num shippingFee;

  const PricingPolicy({required this.freeShippingThreshold, required this.shippingFee});

  static PricingPolicy? tryParse(dynamic json) {
    if (json is! Map || json['freeShippingThreshold'] is! num) return null;
    return PricingPolicy(
      freeShippingThreshold: json['freeShippingThreshold'] as num,
      shippingFee: _num(json['shippingFee']),
    );
  }
}
