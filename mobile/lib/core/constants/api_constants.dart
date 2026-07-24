import 'package:flutter/foundation.dart';

class ApiConstants {
  // Dynamic base URL for local development and production fallback
  static String get baseUrl {
    // If you want to force production URL, uncomment below:
    // return 'https://truong-thanh-backend.onrender.com/api';
    
    if (kIsWeb) return 'http://localhost:3000/api';
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:3000/api'
        : 'http://localhost:3000/api';
  }

  // Auth Endpoints
  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/register';
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

  // Promotion Endpoints
  static String get activePromotions => '$baseUrl/promotions/active';
  static String get applyPromotion => '$baseUrl/promotions/apply';
}

