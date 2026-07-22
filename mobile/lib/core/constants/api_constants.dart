class ApiConstants {
  // Configurable base URL:
  // For local development on Android emulator: http://10.0.2.2:3000/api
  // For local development on iOS simulator or physical device: http://<YOUR_IP>:3000/api
  // For production backend deployed on Render: https://truong-thanh-backend.onrender.com/api
  static const String baseUrl = 'https://truong-thanh-backend.onrender.com/api';

  // Auth Endpoints
  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';
  static const String profile = '$baseUrl/auth/me';
  static const String updateProfile = '$baseUrl/auth/profile';
  static const String changePassword = '$baseUrl/auth/change-password';

  // Product Endpoints
  static const String products = '$baseUrl/products';
  static const String categories = '$baseUrl/categories';

  // Order Endpoints
  static const String orders = '$baseUrl/orders';
  static const String authenticatedOrders = '$baseUrl/orders/authenticated';
  static const String myOrders = '$baseUrl/orders/my-orders';

  // Promotion Endpoints
  static const String activePromotions = '$baseUrl/promotions/active';
  static const String applyPromotion = '$baseUrl/promotions/apply';
}
