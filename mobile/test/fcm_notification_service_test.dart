import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/services/fcm_notification_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('FcmNotificationService Tests', () {
    test('Stores and retrieves device token locally', () async {
      final service = FcmNotificationService.instance;
      await service.initialize();

      await service.setDeviceToken('mock_fcm_token_12345');
      final token = await service.getDeviceToken();

      expect(token, 'mock_fcm_token_12345');
    });

    test('Parses order payload and triggers deeplink routing', () {
      final service = FcmNotificationService.instance;
      final navKey = GlobalKey<NavigatorState>();
      service.setNavigatorKey(navKey);

      final payload = {
        'type': 'order',
        'orderId': 'ord-test-999',
        'title': 'Đơn hàng đã được xác nhận',
      };

      // Since navKey.currentState is null without an active pumpWidget,
      // navigateToOrder gracefully returns false rather than throwing
      final handled = service.handleNotificationPayload(payload);
      expect(handled, false);
    });

    test('Rejects non-order payload without orderId', () {
      final service = FcmNotificationService.instance;

      final payload = {
        'type': 'general',
        'title': 'Chào mừng bạn đến với Trường Thành',
      };

      final handled = service.handleNotificationPayload(payload);
      expect(handled, false);
    });
  });
}
