import 'package:flutter/foundation.dart';

class ApiConstants {
  // Dynamic base URL supporting --dart-define=API_URL=https://... during build,
  // with fallback to local development platform defaults
  static String get baseUrl {
    const customApiUrl = String.fromEnvironment('API_URL', defaultValue: '');
    return resolveBaseUrl(customApiUrl, release: kReleaseMode);
  }

  static String resolveBaseUrl(String configured, {required bool release}) {
    final customApiUrl = configured.trim().replaceFirst(RegExp(r'/+$'), '');
    if (release) {
      final uri = Uri.tryParse(customApiUrl);
      if (uri == null || uri.scheme != 'https' || uri.host.isEmpty ||
          uri.userInfo.isNotEmpty || uri.hasQuery || uri.hasFragment ||
          uri.path != '/api' ||
          ['localhost', '127.0.0.1', '10.0.2.2', '::1'].contains(uri.host)) {
        throw StateError('Release requires API_URL=https://your-api-host/api');
      }
    }
    if (customApiUrl.isNotEmpty) {
      return customApiUrl;
    }

    if (kIsWeb) return 'http://localhost:3000/api';
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:3000/api'
        : 'http://localhost:3000/api';
  }

  // Auth Endpoints
  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/register';
  static String get refreshToken => '$baseUrl/auth/refresh';
  static String get logout => '$baseUrl/auth/logout';
  static String get profile => '$baseUrl/auth/me';
  static String get updateProfile => '$baseUrl/auth/profile';
  static String get changePassword => '$baseUrl/auth/change-password';
  static String get forgotPassword => '$baseUrl/auth/forgot-password';
  static String get verifyOtp => '$baseUrl/auth/verify-otp';
  static String get resetPassword => '$baseUrl/auth/reset-password';

  // Addresses Endpoints
  static String get addresses => '$baseUrl/addresses';
  static String address(String id) => '$baseUrl/addresses/$id';
  static String setDefaultAddress(String id) => '$baseUrl/addresses/$id/default';

  // Product Endpoints
  static String get products => '$baseUrl/products';
  static String relatedProducts(String id) => '$baseUrl/products/${Uri.encodeComponent(id)}/related';
  // Public list of products with a discount price (`?limit=` capped at 100 by the backend).
  static String get discountedProducts => '$baseUrl/products/discounted';
  static String get categories => '$baseUrl/categories';

  // Banner Endpoints (public, grouped by position)
  static String get activeBanners => '$baseUrl/banners/active';

  // Order Endpoints
  static String get orders => '$baseUrl/orders';
  static String get authenticatedOrders => '$baseUrl/orders/authenticated';
  static String get myOrders => '$baseUrl/orders/my-orders';
  static String order(String id) => '$baseUrl/orders/$id';
  static String guestOrder(String id) => '$baseUrl/orders/guest/$id';
  static String orderReturnRequest(String id) => '$baseUrl/orders/$id/return-request';
  // PDF invoice: JWT (or x-guest-order-token) header required, no query-token auth.
  static String orderInvoice(String id) => '$baseUrl/orders/$id/invoice';
  static String guestOrderInvoice(String id) => '$baseUrl/orders/guest/$id/invoice';
  // Server pricing (optional JWT): the only source of cart/checkout money values.
  static String get checkoutPreview => '$baseUrl/orders/checkout-preview';
  static String get pricingPolicy => '$baseUrl/orders/pricing-policy';

  // Cart Endpoints (JWT): server copy of the cart for logged-in users.
  static String get cart => '$baseUrl/cart';
  static String get cartSync => '$baseUrl/cart/sync';

  // Payment Endpoints
  static String get payments => '$baseUrl/payments';
  static String get paymentMethods => '$baseUrl/payments/methods';

  // Promotion Endpoints
  static String get activePromotions => '$baseUrl/promotions/active';
  static String get applyPromotion => '$baseUrl/promotions/apply';

  // Wishlist Endpoints
  static String get wishlist => '$baseUrl/users/wishlist';
  static String toggleWishlist(String productId) => '$baseUrl/users/wishlist/$productId';
  static String moveToCart(String productId) => '$baseUrl/users/wishlist/move-to-cart/$productId';

  // Review Endpoints
  static String getReviews(String productId) => '$baseUrl/reviews/product/$productId';
  static String getRatingBreakdown(String productId) => '$baseUrl/reviews/product/$productId/breakdown';
  static String canReview(String productId) => '$baseUrl/reviews/product/$productId/can-review';

  // Notification Endpoints
  static String get myNotifications => '$baseUrl/notifications/my-notifications';
  static String get unreadNotificationCount => '$baseUrl/notifications/unread-count';
  static String markNotificationRead(String id) => '$baseUrl/notifications/$id/read';
  static String get markAllNotificationsRead => '$baseUrl/notifications/read-all';
  static String get deviceToken => '$baseUrl/notifications/device-token';
  static String get unregisterDeviceToken => '$baseUrl/notifications/device-token/unregister';
}
