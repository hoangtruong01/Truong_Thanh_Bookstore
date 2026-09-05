import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/order_model.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/providers/notification_provider.dart';
import 'package:mobile/providers/order_provider.dart';
import 'package:mobile/screens/notification/notifications_screen.dart';
import 'package:mobile/screens/order/order_detail_screen.dart';
import 'package:mobile/screens/order/order_history_screen.dart';

class TestAuth extends AuthProvider {
  @override
  bool get isAuthenticated => true;
  @override
  String get token => 'test-token';
}

class TestOrders extends OrderProvider {
  String? requestedOrderId;
  @override
  Future<void> fetchMyOrders(String token) async {}
  @override
  Future<OrderModel?> fetchOrderById(String orderId, String? token) async {
    requestedOrderId = orderId;
    return OrderModel.fromJson({
      '_id': orderId, 'orderCode': 'TT-AUDIT', 'createdAt': '2026-09-05T00:00:00Z',
      'subtotal': 1000000, 'total': 900000, 'loyaltyDiscount': 100000,
      'loyaltyPointsUsed': 1000, 'items': [], 'timeline': [],
    });
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  for (final hasOrderId in [true, false]) {
    testWidgets('Notification tap opens ${hasOrderId ? 'order detail' : 'order history'}', (tester) async {
      final auth = TestAuth();
      final orders = TestOrders();
      final notifications = NotificationProvider(client: MockClient((request) async {
        return http.Response(jsonEncode({'data': request.url.path.endsWith('unread-count')
            ? {'unreadCount': 0}
            : {'items': [{
                '_id': 'notification-1', 'title': 'Audit notification', 'type': 'order',
                'message': 'Order update', 'isRead': true,
                'meta': hasOrderId ? {'orderId': 'order-123'} : {},
              }], 'total': 1}}), 200);
      }));
      await tester.pumpWidget(MultiProvider(providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: auth),
        ChangeNotifierProvider<OrderProvider>.value(value: orders),
        ChangeNotifierProvider<NotificationProvider>.value(value: notifications),
      ], child: const MaterialApp(home: NotificationsScreen())));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Audit notification'));
      await tester.pumpAndSettle();
      if (hasOrderId) {
        expect(find.byType(OrderDetailScreen), findsOneWidget);
        expect(orders.requestedOrderId, 'order-123');
        expect(find.text('ĐƠN HÀNG #TT-AUDIT'), findsOneWidget);
        expect(find.text('Điểm thưởng (1000 điểm)'), findsOneWidget);
      } else {
        expect(find.byType(OrderHistoryScreen), findsOneWidget);
      }
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      notifications.dispose();
      orders.dispose();
      auth.dispose();
    });
  }
}
