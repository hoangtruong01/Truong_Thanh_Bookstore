import 'dart:async';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/providers/product_provider.dart';
import 'package:mobile/providers/cart_provider.dart';
import 'package:mobile/providers/order_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test('Search -> cart -> authenticated COD -> paginated order history contract', () async {
    final requests = <http.Request>[];
    final client = MockClient((request) async {
      requests.add(request);
      if (request.url.path == '/api/products') {
        expect(request.url.queryParameters['q'], 'sách tiếng Việt');
        return http.Response(jsonEncode({'data': {'data': [{
          '_id': 'product-1', 'name': 'Book', 'price': 100000, 'stock': 3,
        }]}}), 200);
      }
      expect(request.headers['Authorization'], 'Bearer access');
      final order = {'_id': 'order-1', 'orderCode': 'TT-TEST',
        'items': [], 'total': 230000, 'createdAt': '2026-09-06T00:00:00Z'};
      if (request.method == 'POST') {
        expect(request.url.path, '/api/orders/authenticated');
        final body = jsonDecode(request.body);
        expect(body['items'][0]['product'], 'product-1');
        expect(body['items'][0]['quantity'], 2);
        expect(body['paymentMethod'], 'COD');
        expect(body['idempotencyKey'], isNotEmpty);
        return http.Response(jsonEncode({'data': order}), 201);
      }
      expect(request.url.path, '/api/orders/my-orders');
      return http.Response(jsonEncode({'data': {'data': [order], 'total': 1}}), 200);
    });
    final products = ProductProvider(client: client);
    final cart = CartProvider();
    final orders = OrderProvider(client: client);
    await products.fetchProducts(query: 'sách tiếng Việt');
    expect(products.products, hasLength(1));
    cart.addToCart(products.products.single, quantity: 2);
    expect(cart.total, 230000);
    final order = await orders.placeOrder(items: cart.items, fullName: 'QA',
      phone: '0901234567', email: 'qa@example.test', address: 'Test address',
      paymentMethod: 'COD', token: 'access');
    expect(order?.id, 'order-1');
    expect(orders.isLoading, false);
    expect(orders.lastPaymentAction, isNull);
    await orders.fetchMyOrders('access');
    expect(orders.myOrders.single.id, 'order-1');
    expect(requests, hasLength(3));
    products.dispose(); cart.dispose(); orders.dispose(); client.close();
  });

  test('Checkout transport retry retains idempotency key and releases loading', () async {
    final keys = <String>[];
    final client = MockClient((request) async {
      keys.add(jsonDecode(request.body)['idempotencyKey'] as String);
      if (keys.length == 1) throw http.ClientException('Connection lost');
      return http.Response(jsonEncode({'data': {'_id': 'order-1', 'items': []}}), 201);
    });
    final orders = OrderProvider(client: client);
    Future<dynamic> submit() => orders.placeOrder(items: [], fullName: 'QA',
      phone: '0901234567', email: 'qa@example.test', address: 'Test', paymentMethod: 'COD');
    await expectLater(submit(), throwsA(isA<http.ClientException>()));
    expect(orders.isLoading, false);
    await submit();
    expect(keys[1], keys[0]);
    await submit();
    expect(keys[2], isNot(keys[0]));
    orders.dispose(); client.close();
  });

  test('Checkout stays locked until payment initiation finishes', () async {
    final payment = Completer<http.Response>();
    final paymentStarted = Completer<void>();
    var orderRequests = 0;
    final orders = OrderProvider(client: MockClient((request) async {
      if (request.url.path == '/api/payments') {
        paymentStarted.complete();
        return payment.future;
      }
      orderRequests++;
      return http.Response(jsonEncode({'data': {'_id': 'order-1', 'items': []}}), 201);
    }));
    Future<dynamic> submit() => orders.placeOrder(items: [], fullName: 'QA',
      phone: '0901234567', email: 'qa@example.test', address: 'Test',
      paymentMethod: 'VNPAY', token: 'access');
    final first = submit();
    await paymentStarted.future;
    expect(orders.isLoading, true);
    await expectLater(submit(), throwsStateError);
    expect(orderRequests, 1);
    payment.complete(http.Response('{}', 503));
    expect((await first).id, 'order-1');
    expect(orders.isLoading, false);
    orders.dispose();
  });
}
