import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/models/checkout_preview_model.dart';
import 'package:mobile/models/payment_methods_model.dart';
import 'package:mobile/models/product_model.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/providers/cart_provider.dart';
import 'package:mobile/providers/order_provider.dart';
import 'package:mobile/screens/checkout/checkout_screen.dart';
import 'package:mobile/screens/checkout/order_success_screen.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

ProductModel _product(String id, {num price = 100000, num discountPrice = 0, int stock = 10}) => ProductModel(
      id: id, name: 'Sách $id', slug: id, sku: id, price: price, discountPrice: discountPrice,
      stock: stock, images: const [], rating: 5, sold: 0, isFeatured: false,
    );

http.Response _json(Object body, [int status = 200]) => http.Response(jsonEncode(body), status,
    headers: {'content-type': 'application/json; charset=utf-8'});

Map<String, dynamic> _preview({
  num subtotal = 200000,
  num shippingFee = 30000,
  num discount = 0,
  num loyaltyDiscount = 0,
  num? total,
  List<Map<String, dynamic>> items = const [],
  List<Map<String, dynamic>> unavailable = const [],
  Map<String, dynamic>? appliedPromotion,
  String? promotionError,
  Map<String, dynamic>? loyalty,
  List<String> warnings = const [],
  bool valid = true,
}) =>
    {
      'items': items,
      'unavailableItems': unavailable,
      'itemCount': 1,
      'subtotal': subtotal,
      'shippingFee': shippingFee,
      'standardShippingFee': 30000,
      'freeShippingThreshold': 299000,
      'isEligibleForFreeShipping': shippingFee == 0,
      'amountNeededForFreeShipping': 99000,
      'freeShippingProgress': 66,
      'discount': discount,
      'appliedPromotion': appliedPromotion,
      'promotionError': promotionError,
      'loyaltyDiscount': loyaltyDiscount,
      'loyalty': loyalty,
      'total': total ?? subtotal + shippingFee - discount - loyaltyDiscount,
      'warnings': warnings,
      'isValidForCheckout': valid,
    };

/// Lets queued microtasks/events run (MockClient reads the body before calling the handler).
Future<void> _settle() async {
  for (var i = 0; i < 10; i++) {
    await Future<void>.delayed(Duration.zero);
  }
}

/// Waits for the next request held by a pending-completer mock and returns its completer.
Future<Completer<http.Response>> _next(List<Completer<http.Response>> pending) async {
  for (var i = 0; i < 50 && pending.isEmpty; i++) {
    await Future<void>.delayed(Duration.zero);
  }
  return pending.removeAt(0);
}

/// In-memory replacement for shared_preferences.
class _MemoryCartStorage implements CartStorage {
  String? value;
  int writes = 0;

  @override
  Future<String?> read() async => value;

  @override
  Future<void> write(String next) async {
    value = next;
    writes++;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('Checkout preview drives every money value', () {
    test('request carries only selected lines (product + quantity) and the checkout context', () async {
      final bodies = <Map<String, dynamic>>[];
      final client = MockClient((request) async {
        expect(request.url.path, '/api/orders/checkout-preview');
        bodies.add(jsonDecode(request.body) as Map<String, dynamic>);
        return _json({'success': true, 'data': _preview()});
      });
      final cart = CartProvider(client: client, storage: _MemoryCartStorage(), pricingDebounce: Duration.zero)
        ..addToCart(_product('a'), quantity: 2)
        ..addToCart(_product('b'));
      cart.toggleItemSelection('b');

      await cart.refreshPricing(
        context: const PricingContext(
          loyaltyPointsUsed: 1000,
          phone: '0901234567',
          customerEmail: '',
          shippingAddress: '  ',
          paymentMethod: 'COD',
        ),
        immediate: true,
      );
      expect(bodies.last, {
        'items': [{'product': 'a', 'quantity': 2}],
        'loyaltyPointsUsed': 1000,
        'paymentMethod': 'COD',
        'phone': '0901234567',
      });
      cart.dispose();
    });

    test('totals, shipping and free-ship progress are the server values (not 299K/30K math)', () async {
      // Deliberately "wrong" numbers versus client math: the app must show them as-is.
      final client = MockClient((_) async => _json({'data': _preview(
            subtotal: 123000, shippingFee: 15000, total: 138000,
            items: [{'product': 'a', 'name': 'Sách a', 'price': 61500, 'originalPrice': 70000,
              'quantity': 2, 'stock': 4, 'subtotal': 123000}],
          )}));
      final cart = CartProvider(client: client, storage: _MemoryCartStorage(), pricingDebounce: Duration.zero)
        ..addToCart(_product('a'), quantity: 2);
      expect(cart.total, 0);
      final result = await cart.refreshPricing(immediate: true);
      expect(result, isNotNull);
      expect(cart.subtotal, 123000);
      expect(cart.shippingFee, 15000);
      expect(cart.total, 138000);
      expect(cart.freeShippingThreshold, 299000);
      expect(cart.freeShippingProgress, closeTo(0.66, 0.001));
      // Snapshot follows the server line (price + stock) so quantity limits are current.
      final line = cart.items.single;
      expect(cart.unitPrice(line).price, 61500);
      expect(cart.unitPrice(line).fromServer, isTrue);
      expect(line.product.stock, 4);
      expect(line.product.price, 70000);
      expect(line.product.discountPrice, 61500);
      cart.dispose();
    });

    test('shows loading while pending, keeps last numbers on error and recovers on retry', () async {
      final pending = <Completer<http.Response>>[];
      final client = MockClient((_) {
        final completer = Completer<http.Response>();
        pending.add(completer);
        return completer.future;
      });
      final cart = CartProvider(client: client, storage: _MemoryCartStorage(), pricingDebounce: Duration.zero)
        ..addToCart(_product('a'));
      final first = cart.refreshPricing(immediate: true);
      expect(cart.pricingLoading, isTrue);
      expect(cart.isPricingReady, isFalse);
      (await _next(pending)).complete(_json({'data': _preview(total: 230000)}));
      await first;
      expect(cart.pricingLoading, isFalse);
      expect(cart.total, 230000);

      final second = cart.refreshPricing(immediate: true);
      (await _next(pending)).complete(http.Response('{"message":"boom"}', 500));
      expect(await second, isNull);
      expect(cart.pricingError, CartProvider.pricingErrorMessage);
      expect(cart.total, 230000, reason: 'last good numbers stay visible');
      expect(cart.isValidForCheckout, isFalse);

      final retry = cart.refreshPricing(immediate: true);
      (await _next(pending)).complete(_json({'data': _preview(total: 240000)}));
      await retry;
      expect(cart.pricingError, isNull);
      expect(cart.total, 240000);
      expect(cart.isValidForCheckout, isTrue);
      cart.dispose();
    });

    test('debounced calls collapse into one request and stale answers are ignored', () async {
      final pending = <Completer<http.Response>>[];
      final client = MockClient((_) {
        final completer = Completer<http.Response>();
        pending.add(completer);
        return completer.future;
      });
      final cart = CartProvider(
        client: client,
        storage: _MemoryCartStorage(),
        pricingDebounce: const Duration(milliseconds: 20),
      )..addToCart(_product('a'));

      final slow = cart.refreshPricing(immediate: true);
      await _settle();
      expect(pending, hasLength(1));
      final a = cart.refreshPricing();
      final b = cart.refreshPricing();
      await Future<void>.delayed(const Duration(milliseconds: 60));
      await _settle();
      expect(pending, hasLength(2), reason: 'two debounced calls -> one request');
      pending[1].complete(_json({'data': _preview(total: 111000)}));
      expect((await a)?.total, 111000);
      expect((await b)?.total, 111000);
      expect((await slow)?.total, 111000);
      pending[0].complete(_json({'data': _preview(total: 999000)}));
      await Future<void>.delayed(Duration.zero);
      expect(cart.total, 111000, reason: 'the older response must not win');
      cart.dispose();
    });

    test('a voucher the server rejects is dropped and the order is re-priced without it', () async {
      final bodies = <Map<String, dynamic>>[];
      final client = MockClient((request) async {
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        bodies.add(body);
        return body['promotionCode'] == null
            ? _json({'data': _preview()})
            : _json({'data': _preview(promotionError: 'Đơn hàng chưa đạt giá trị tối thiểu', valid: false,
                warnings: ['Đơn hàng chưa đạt giá trị tối thiểu'])});
      });
      final cart = CartProvider(client: client, storage: _MemoryCartStorage(), pricingDebounce: Duration.zero)
        ..addToCart(_product('a'));
      expect(await cart.applyCoupon(' big50 '), isFalse);
      expect(bodies.first['promotionCode'], 'BIG50');
      expect(cart.promoError, 'Đơn hàng chưa đạt giá trị tối thiểu');
      expect(cart.promotionCode, isEmpty);
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);
      expect(bodies.last.containsKey('promotionCode'), isFalse);
      expect(cart.isValidForCheckout, isTrue);
      cart.dispose();
    });

    test('signed-in preview sends the session token and exposes loyalty limits', () async {
      final api = ApiClient(httpClient: MockClient((request) async {
        expect(request.headers['Authorization'], 'Bearer access');
        // Sign-in also syncs the account cart; it holds the same line.
        if (request.url.path == '/api/cart/sync') return _json({'data': {}}, 201);
        if (request.url.path == '/api/cart') {
          return _json({'data': {'items': [{'product': _product('a').toJson(), 'quantity': 10}]}});
        }
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        expect(body['loyaltyPointsUsed'], 1500);
        return _json({'data': _preview(loyaltyDiscount: 150000, loyalty: {
          'availablePoints': 2400, 'minRedeemPoints': 1000, 'pointValue': 100, 'maxRedeemPercent': 20,
          'maxRedeemablePoints': 2000, 'minSubtotalToRedeem': 500000, 'canRedeem': true,
          'requestedPoints': 1500, 'appliedPoints': 1500, 'error': null,
        })});
      }));
      api.bindSession(
        tokenProvider: () => 'access',
        refresher: () async => TokenRefreshResult.unavailable,
        onSessionExpired: () {},
      );
      final cart = CartProvider(apiClient: api, storage: _MemoryCartStorage(), pricingDebounce: Duration.zero)
        ..addToCart(_product('a'), quantity: 10);
      cart.bindAuth(isAuthenticated: true);
      await _settle();
      await cart.syncWithServer();
      expect(cart.items.single.quantity, 10);
      await cart.refreshPricing(context: const PricingContext(loyaltyPointsUsed: 1500), immediate: true);
      expect(cart.loyalty?.availablePoints, 2400);
      expect(cart.loyalty?.maxRedeemablePoints, 2000);
      expect(cart.loyalty?.canRedeem, isTrue);
      expect(cart.loyalty?.appliedPoints, 1500);
      expect(cart.loyaltyDiscount, 150000);
      cart.bindAuth(isAuthenticated: false);
      cart.dispose();
    });

    test('empty selection never calls the server', () async {
      var calls = 0;
      final client = MockClient((_) async {
        calls++;
        return _json({'data': _preview()});
      });
      final cart = CartProvider(client: client, storage: _MemoryCartStorage(), pricingDebounce: Duration.zero)
        ..addToCart(_product('a'));
      cart.toggleAllSelection(false);
      expect(await cart.refreshPricing(immediate: true), isNull);
      expect(await cart.applyCoupon('ABC'), isFalse);
      expect(calls, 0);
      cart.dispose();
    });
  });

  group('Cart lines: stock cap, local persistence, account sync', () {
    test('quantities are capped at the known stock', () {
      final cart = CartProvider(storage: _MemoryCartStorage(), restoreFromStorage: false)
        ..addToCart(_product('a', stock: 3), quantity: 5);
      expect(cart.items.single.quantity, 3);
      cart.updateQuantity('a', 2);
      expect(cart.items.single.quantity, 3);
      cart.setQuantity('a', 0);
      expect(cart.items, isEmpty);
      cart.addToCart(_product('z', stock: 0));
      expect(cart.items, isEmpty);
      cart.dispose();
    });

    test('guest cart survives an app restart (local storage)', () async {
      final storage = _MemoryCartStorage();
      final first = CartProvider(storage: storage)
        ..addToCart(_product('a'), quantity: 2)
        ..addToCart(_product('b', price: 50000));
      first.toggleItemSelection('b');
      await Future<void>.delayed(Duration.zero);
      first.dispose();

      final second = CartProvider(storage: storage);
      await second.restored;
      expect(second.items.map((i) => '${i.product.id}:${i.quantity}:${i.selected}'), ['a:2:true', 'b:1:false']);
      expect(second.items.last.product.price, 50000);
      second.dispose();
    });

    test('shared_preferences storage round-trips and tolerates corrupt data', () async {
      SharedPreferences.setMockInitialValues({SharedPreferencesCartStorage.key: 'not json'});
      final broken = CartProvider();
      await broken.restored;
      expect(broken.items, isEmpty);
      broken.addToCart(_product('a'), quantity: 2);
      await Future<void>.delayed(Duration.zero);
      broken.dispose();

      final restored = CartProvider();
      await restored.restored;
      expect(restored.items.single.quantity, 2);
      restored.dispose();
    });

    test('sign-in replaces the account cart with the local list, then adopts the server copy', () async {
      final requests = <http.Request>[];
      final api = ApiClient(httpClient: MockClient((request) async {
        requests.add(request);
        expect(request.headers['Authorization'], 'Bearer access');
        if (request.method == 'POST') return _json({'data': {}}, 201);
        return _json({'data': {'items': [
          // Server capped the quantity to stock and resolved the product.
          {'product': _product('a', stock: 1).toJson(), 'quantity': 1, 'price': 1},
          {'product': _product('c').toJson(), 'quantity': 3},
        ]}});
      }));
      api.bindSession(
        tokenProvider: () => 'access',
        refresher: () async => TokenRefreshResult.unavailable,
        onSessionExpired: () {},
      );
      final cart = CartProvider(apiClient: api, storage: _MemoryCartStorage(), syncDebounce: Duration.zero)
        ..addToCart(_product('a'), quantity: 2);
      cart.toggleItemSelection('a');
      cart.bindAuth(isAuthenticated: true);
      await Future<void>.delayed(Duration.zero);
      await cart.syncWithServer();

      expect(requests.first.url.path, '/api/cart/sync');
      expect(jsonDecode(requests.first.body), {
        'items': [{'productId': 'a', 'quantity': 2}],
        'mode': 'merge',
      });
      expect(requests.any((r) => r.method == 'GET' && r.url.path == '/api/cart'), isTrue);
      expect(cart.items.map((i) => '${i.product.id}:${i.quantity}:${i.selected}'), ['a:1:false', 'c:3:true']);
      cart.dispose();
    });

    test('changes are pushed (debounced) while signed in; an empty cart clears the account cart', () async {
      final requests = <http.Request>[];
      final api = ApiClient(httpClient: MockClient((request) async {
        requests.add(request);
        return request.method == 'GET' ? _json({'data': {'items': []}}) : _json({'data': {}});
      }));
      api.bindSession(
        tokenProvider: () => 'access',
        refresher: () async => TokenRefreshResult.unavailable,
        onSessionExpired: () {},
      );
      final cart = CartProvider(
        apiClient: api,
        storage: _MemoryCartStorage(),
        syncDebounce: const Duration(milliseconds: 10),
        restoreFromStorage: false,
      );
      cart.bindAuth(isAuthenticated: true);
      await Future<void>.delayed(const Duration(milliseconds: 5));
      await cart.syncWithServer();
      requests.clear();

      cart.addToCart(_product('a'));
      cart.updateQuantity('a', 1);
      await Future<void>.delayed(const Duration(milliseconds: 40));
      expect(requests, hasLength(1), reason: 'two edits -> one push');
      expect(requests.single.url.path, '/api/cart/sync');
      expect(jsonDecode(requests.single.body)['items'], [{'productId': 'a', 'quantity': 2}]);

      cart.removeItem('a');
      await Future<void>.delayed(const Duration(milliseconds: 40));
      expect(requests.last.method, 'DELETE');
      expect(requests.last.url.path, '/api/cart');

      cart.bindAuth(isAuthenticated: false);
      requests.clear();
      cart.addToCart(_product('b'));
      await Future<void>.delayed(const Duration(milliseconds: 40));
      expect(requests, isEmpty, reason: 'guests never touch /cart');
      cart.dispose();
    });
  });

  group('Payment methods and order payload', () {
    test('guests only get COD; signed-in users get the enabled server methods', () async {
      final orders = OrderProvider(client: MockClient((request) async {
        expect(request.url.path, '/api/payments/methods');
        return _json({'data': {
          'methods': ['MOMO', 'COD', 'BANK_TRANSFER', 'PAYPAL'],
          'bankTransfer': {'bankName': 'MB', 'accountNumber': '0123456789', 'accountHolder': ''},
        }});
      }));
      final config = await orders.fetchPaymentMethods();
      expect(config.availableFor(isAuthenticated: false), ['COD']);
      expect(config.availableFor(isAuthenticated: true), ['COD', 'BANK_TRANSFER', 'MOMO']);
      expect(config.bankTransfer?.accountNumber, '0123456789');
      expect(config.bankTransfer?.displayHolder, 'TRUONG THANH BOOKSTORE');
      orders.dispose();
    });

    test('a failing methods endpoint falls back to COD only', () async {
      final orders = OrderProvider(client: MockClient((_) async => http.Response('oops', 500)));
      final config = await orders.fetchPaymentMethods();
      expect(config.methods, ['COD']);
      expect(orders.paymentMethodsLoading, isFalse);
      orders.dispose();
    });

    test('order payload: product + quantity only, loyalty points, mobile source, idempotency key', () async {
      Map<String, dynamic>? body;
      final orders = OrderProvider(client: MockClient((request) async {
        body = jsonDecode(request.body) as Map<String, dynamic>;
        return _json({'data': {'_id': 'o1', 'orderCode': 'TT1', 'items': [], 'total': 1}}, 201);
      }));
      final cart = CartProvider(storage: _MemoryCartStorage(), restoreFromStorage: false)
        ..addToCart(_product('a', discountPrice: 80000), quantity: 2);
      await orders.placeOrder(items: cart.items, fullName: 'QA', phone: '0901234567',
          email: 'qa@example.test', address: 'HN', paymentMethod: 'BANK_TRANSFER',
          promotionCode: 'SALE', loyaltyPointsUsed: 1000, token: 'access');
      expect(body!['items'], [{'product': 'a', 'quantity': 2}]);
      expect(body!['loyaltyPointsUsed'], 1000);
      expect(body!['orderSource'], 'MOBILE');
      expect(body!['promotionCode'], 'SALE');
      expect(body!['idempotencyKey'], isNotEmpty);
      cart.dispose();
      orders.dispose();
    });

    test('BANK_TRANSFER does not start a gateway session; VNPAY returns the redirect URL', () async {
      final paths = <String>[];
      final orders = OrderProvider(client: MockClient((request) async {
        paths.add(request.url.path);
        if (request.url.path == '/api/payments') {
          return _json({'data': {'action': {'redirectUrl': 'https://pay.example/vnpay?x=1'}}}, 201);
        }
        return _json({'data': {'_id': 'o1', 'orderCode': 'TT1', 'items': [], 'total': 1}}, 201);
      }));
      await orders.placeOrder(items: [], fullName: 'QA', phone: '0901234567', email: 'qa@example.test',
          address: 'HN', paymentMethod: 'BANK_TRANSFER', token: 'access');
      expect(paths, ['/api/orders/authenticated']);

      await orders.placeOrder(items: [], fullName: 'QA', phone: '0901234567', email: 'qa@example.test',
          address: 'HN', paymentMethod: 'VNPAY', token: 'access');
      expect(paths.last, '/api/payments');
      expect(orders.lastPaymentAction?['redirectUrl'], 'https://pay.example/vnpay?x=1');
      expect(orders.lastPaymentError, isNull);
      orders.dispose();
    });

    test('VietQR image URL matches the web success screen format', () {
      const bank = BankTransferConfig(bankName: 'MB', accountNumber: '0123 456', accountHolder: 'TRUONG THANH');
      expect(
        bank.vietQrUrl(amount: 230000, orderCode: 'TT-001'),
        'https://img.vietqr.io/image/MB-0123%20456-compact2.png?amount=230000&addInfo=TT-001&accountName=TRUONG%20THANH',
      );
      expect(PaymentMethodsConfig.isOnlineGateway('MOMO'), isTrue);
      expect(PaymentMethodsConfig.isOnlineGateway('BANK_TRANSFER'), isFalse);
    });

    test('preview parsing rejects bodies without a numeric total', () {
      expect(CheckoutPreview.tryParse({'subtotal': 1}), isNull);
      expect(CheckoutPreview.tryParse(null), isNull);
      expect(CheckoutPreview.tryParse(_preview())?.total, 230000);
    });
  });

  group('Checkout screen (guest)', () {
    Future<({CartProvider cart, List<Completer<http.Response>> previews})> pumpCheckout(
      WidgetTester tester, {
      Brightness brightness = Brightness.light,
    }) async {
      // Tall viewport so the whole checkout list (summary + CTA) is built.
      tester.view.physicalSize = const Size(900, 6000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
      final previews = <Completer<http.Response>>[];
      final client = MockClient((request) {
        if (request.url.path == '/api/payments/methods') {
          return Future.value(_json({'data': {'methods': ['COD', 'VNPAY', 'MOMO', 'BANK_TRANSFER']}}));
        }
        final completer = Completer<http.Response>();
        previews.add(completer);
        return completer.future;
      });
      final api = ApiClient(httpClient: client);
      final cart = CartProvider(apiClient: api, storage: _MemoryCartStorage(), pricingDebounce: Duration.zero,
          restoreFromStorage: false)
        ..addToCart(_product('a'), quantity: 2);
      await tester.pumpWidget(MultiProvider(
        providers: [
          Provider<ApiClient>.value(value: api),
          ChangeNotifierProvider(create: (_) => AuthProvider(apiClient: api)),
          ChangeNotifierProvider<CartProvider>.value(value: cart),
          ChangeNotifierProvider(create: (_) => OrderProvider(apiClient: api)),
        ],
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: brightness == Brightness.dark ? ThemeMode.dark : ThemeMode.light,
          home: const CheckoutScreen(),
        ),
      ));
      await tester.pump();
      await tester.pump();
      return (cart: cart, previews: previews);
    }

    Future<Completer<http.Response>> nextPreview(WidgetTester tester, List<Completer<http.Response>> previews) async {
      for (var i = 0; i < 20 && !previews.any((c) => !c.isCompleted); i++) {
        await tester.pump();
      }
      return previews.firstWhere((c) => !c.isCompleted);
    }

    /// Unmounts the screen (which re-prices the cart for the cart tab) and answers
    /// every outstanding request so no client timeout timer outlives the test.
    Future<void> finish(WidgetTester tester, CartProvider cart, List<Completer<http.Response>> previews) async {
      await tester.pumpWidget(const SizedBox());
      for (var i = 0; i < 5; i++) {
        await tester.pump();
        for (final c in previews.where((c) => !c.isCompleted)) {
          c.complete(_json({'data': _preview()}));
        }
      }
      cart.dispose();
    }

    testWidgets('skeleton while pricing, then server totals and the fixed CTA copy', (tester) async {
      final setup = await pumpCheckout(tester);
      final first = await nextPreview(tester, setup.previews);
      expect(find.byKey(const ValueKey('pricing-skeleton')), findsOneWidget);
      expect(find.text('Đang cập nhật giá...'), findsWidgets);
      expect(find.text('XÁC NHẬN ĐẶT HÀNG NOW'), findsNothing);

      first.complete(_json({'data': _preview(subtotal: 200000, shippingFee: 30000)}));
      await tester.pump();
      await tester.pump();
      expect(find.byKey(const ValueKey('pricing-skeleton')), findsNothing);
      expect(find.textContaining('230.000'), findsWidgets);
      expect(find.text('Xác nhận đặt hàng'), findsOneWidget);

      // Guests: online methods are hidden, COD only.
      expect(find.text('Thanh toán khi nhận hàng (COD)'), findsOneWidget);
      expect(find.text('Cổng thanh toán VNPay'), findsNothing);
      expect(find.text('Ví điện tử MoMo'), findsNothing);
      expect(find.textContaining('Đăng nhập để thanh toán trực tuyến'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await finish(tester, setup.cart, setup.previews);
    });

    testWidgets('pricing error shows a retry that re-runs the preview (dark mode)', (tester) async {
      final setup = await pumpCheckout(tester, brightness: Brightness.dark);
      (await nextPreview(tester, setup.previews)).complete(http.Response('{"message":"down"}', 503));
      await tester.pump();
      await tester.pump();
      expect(find.text(CartProvider.pricingErrorMessage), findsOneWidget);
      expect(find.text('Không thể cập nhật giá'), findsOneWidget);

      await tester.tap(find.text('Thử lại'));
      await tester.pump();
      (await nextPreview(tester, setup.previews)).complete(_json({'data': _preview()}));
      await tester.pump();
      await tester.pump();
      expect(find.text(CartProvider.pricingErrorMessage), findsNothing);
      expect(find.text('Xác nhận đặt hàng'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await finish(tester, setup.cart, setup.previews);
    });
  });

  testWidgets('order success screen renders bank transfer instructions with copyable fields', (tester) async {
    tester.view.physicalSize = const Size(900, 3000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.lightTheme,
      home: const OrderSuccessScreen(
        data: OrderSuccessData(
          orderId: 'o1',
          orderCode: 'TT-001',
          total: 230000,
          recipientName: 'QA',
          recipientPhone: '0901234567',
          address: 'Hà Nội',
          paymentMethod: 'BANK_TRANSFER',
          bankTransfer: BankTransferConfig(bankName: 'MB', accountNumber: '0123456789', accountHolder: 'TT'),
        ),
      ),
    ));
    await tester.pump();
    expect(find.text('Hướng dẫn chuyển khoản ngân hàng'), findsOneWidget);
    expect(find.text('0123456789'), findsOneWidget);
    expect(find.text('Nội dung (bắt buộc)'), findsOneWidget);
    expect(find.text('Sao chép'), findsWidgets);
    expect(find.text('Chuyển khoản ngân hàng'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });
}
