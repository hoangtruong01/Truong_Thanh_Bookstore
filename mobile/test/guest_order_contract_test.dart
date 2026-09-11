import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/providers/order_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  test('Guest token persists across providers and authorizes only its own order', () async {
    final requests = <http.Request>[];
    final client = MockClient((request) async {
      requests.add(request);
      if (request.method == 'POST') {
        expect(request.url.path, '/api/orders');
        return http.Response(jsonEncode({'data': {'_id': 'guest-1', 'items': [], 'guestAccessToken': 'private-guest-key'}}), 201);
      }
      expect(request.url.path, '/api/orders/guest/guest-1');
      expect(request.headers['x-guest-order-token'], 'private-guest-key');
      expect(request.headers.containsKey('Authorization'), false);
      return http.Response(jsonEncode({'data': {'_id': 'guest-1', 'items': []}}), 200);
    });
    final first = OrderProvider(client: client);
    await first.placeOrder(items: [], fullName: 'Guest', phone: '0901234567',
      email: 'guest@example.test', address: 'Test address', paymentMethod: 'COD');
    first.dispose();
    final restored = OrderProvider(client: client);
    expect((await restored.fetchOrderById('guest-1', null))?.id, 'guest-1');
    // A later login must not send the guest capability to an authenticated route.
    expect((await restored.fetchOrderById('guest-1', 'account-token'))?.id, 'guest-1');
    final beforeUnknown = requests.length;
    expect(await restored.fetchOrderById('someone-elses-order', null), isNull);
    expect(await restored.cancelOrder('someone-elses-order', null), false);
    expect(requests.length, beforeUnknown);
    await restored.fetchGuestOrders();
    expect(restored.guestOrders.single.id, 'guest-1');
    expect(await restored.cancelOrder('guest-1', null), true);
    expect(requests.any((request) => request.method == 'DELETE'), true);
    restored.dispose();
    client.close();
  });

  test('Authenticated order details continue using a bearer token', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/orders/account-order');
      expect(request.headers['Authorization'], 'Bearer access');
      expect(request.headers.containsKey('x-guest-order-token'), false);
      return http.Response('{"data":{"_id":"account-order","items":[]}}', 200);
    });
    final provider = OrderProvider(client: client);
    expect((await provider.fetchOrderById('account-order', 'access'))?.id, 'account-order');
    provider.dispose();
    client.close();
  });
}
