import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/providers/notification_provider.dart';

void main() {
  test('Loads backend items, unreadCount and order metadata', () async {
    final provider = NotificationProvider(client: MockClient((request) async {
      expect(request.headers['Authorization'], 'Bearer test-token');
      return http.Response(jsonEncode({
        'success': true,
        'data': request.url.path.endsWith('unread-count')
            ? {'unreadCount': 2}
            : {'items': [{
                '_id': 'notification-1', 'title': 'Order confirmed',
                'message': 'Ready', 'type': 'order', 'isRead': false,
                'meta': {'orderId': 'order-1'},
              }], 'total': 1, 'page': 1, 'unreadCount': 2},
      }), 200);
    }));
    addTearDown(provider.dispose);
    await provider.fetchNotifications('test-token');
    expect(provider.notifications, hasLength(1));
    expect(provider.notifications.single.data?['orderId'], 'order-1');
    expect(provider.unreadCount, 2);
    expect(provider.errorMessage, isNull);
  });
}
