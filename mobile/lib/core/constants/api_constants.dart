import 'package:flutter/foundation.dart';

class ApiConstants {
  // Dynamic base URL supporting --dart-define=API_URL=https://... during build,
  // with fallback to local development platform defaults
  static String get baseUrl {
    const customApiUrl = String.fromEnvironment('API_URL', defaultValue: '');
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

  // Product Endpoints
  static String get products => '$baseUrl/products';
  static String get categories => '$baseUrl/categories';

  // Order Endpoints
  static String get orders => '$baseUrl/orders';
  static String get authenticatedOrders => '$baseUrl/orders/authenticated';
  static String get myOrders => '$baseUrl/orders/my-orders';

  // Payment Endpoints
  static String get payments => '$baseUrl/payments';

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
}
