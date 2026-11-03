import 'dart:async';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/models/product_model.dart';
import 'package:mobile/providers/cart_provider.dart';
import 'package:mobile/providers/order_provider.dart';
import 'package:mobile/providers/wishlist_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

ProductModel _product(String id, {num price = 100000}) => ProductModel(
      id: id, name: 'Book $id', slug: id, sku: id, price: price, discountPrice: 0,
      stock: 10, images: [], rating: 5, sold: 0, isFeatured: false,
    );

http.Response _json(Object body, [int status = 200]) => http.Response(jsonEncode(body), status);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('Wishlist toggle reaches the server for logged-in users', () {
    test('authenticated like is POSTed and survives a later server sync', () async {
      final serverIds = <String>{};
      final requests = <http.Request>[];
      final client = MockClient((request) async {
        requests.add(request);
        expect(request.headers['Authorization'], 'Bearer access');
        final segments = request.url.pathSegments;
        if (request.method == 'GET') {
          return _json({'data': {
            'products': serverIds.map((id) => _product(id).toJson()).toList(),
            'ids': serverIds.toList(), 'total': serverIds.length,
          }});
        }
        final id = segments.last;
        if (request.method == 'POST') {
          final added = serverIds.add(id);
          if (!added) serverIds.remove(id);
          return _json({'data': {'isInWishlist': added}}, 201);
        }
        serverIds.remove(id);
        return _json({'data': {'isInWishlist': false}});
      });
      final wishlist = WishlistProvider(client: client);

      expect(await wishlist.toggleFavorite(_product('p1'), 'access'), true);
      expect(serverIds, {'p1'});
      await wishlist.syncWithServer('access');
      expect(wishlist.isFavorite('p1'), true);
      expect(wishlist.itemCount, 1);

      expect(await wishlist.toggleFavorite(_product('p1'), 'access'), true);
      expect(requests.last.method, 'DELETE');
      expect(serverIds, isEmpty);
      await wishlist.syncWithServer('access');
      expect(wishlist.isFavorite('p1'), false);
      wishlist.dispose(); client.close();
    });

    test('stale local cache: POST toggle that removes is re-sent so the like sticks', () async {
      final serverIds = <String>{'p1'};
      var posts = 0;
      final client = MockClient((request) async {
        posts++;
        final added = serverIds.add('p1');
        if (!added) serverIds.remove('p1');
        return _json({'data': {'isInWishlist': added}}, 201);
      });
      final wishlist = WishlistProvider(client: client);
      expect(await wishlist.toggleFavorite(_product('p1'), 'access'), true);
      expect(posts, 2);
      expect(serverIds, {'p1'});
      expect(wishlist.isFavorite('p1'), true);
      wishlist.dispose(); client.close();
    });

    test('failed server toggle rolls back the optimistic like', () async {
      final client = MockClient((_) async => _json({'message': 'boom'}, 500));
      final wishlist = WishlistProvider(client: client);
      expect(await wishlist.toggleFavorite(_product('p1'), 'access'), false);
      expect(wishlist.isFavorite('p1'), false);
      expect(wishlist.itemCount, 0);
      wishlist.dispose(); client.close();
    });

    test('guest like stays local and is merged into the server list on sync', () async {
      final serverIds = <String>{'p2'};
      final requests = <http.Request>[];
      final client = MockClient((request) async {
        requests.add(request);
        if (request.method == 'GET') {
          return _json({'data': {
            'products': serverIds.map((id) => _product(id).toJson()).toList(),
          }});
        }
        serverIds.add(request.url.pathSegments.last);
        return _json({'data': {'isInWishlist': true}}, 201);
      });
      final wishlist = WishlistProvider(client: client);

      expect(await wishlist.toggleFavorite(_product('p1')), true);
      expect(requests, isEmpty);
      expect(wishlist.isFavorite('p1'), true);

      await wishlist.syncWithServer('access');
      expect(serverIds, {'p1', 'p2'});
      expect(wishlist.isFavorite('p1'), true);
      expect(wishlist.isFavorite('p2'), true);
      expect(wishlist.itemCount, 2);

      // Already merged: a second sync must not POST (and thus toggle off) again.
      final postsBefore = requests.where((r) => r.method == 'POST').length;
      await wishlist.syncWithServer('access');
      expect(requests.where((r) => r.method == 'POST').length, postsBefore);
      expect(wishlist.itemCount, 2);
      wishlist.dispose(); client.close();
    });

    test('second tap while the request is in flight is ignored (null), not a failure', () async {
      final gate = Completer<void>();
      var posts = 0;
      final client = MockClient((_) async {
        posts++;
        await gate.future;
        return _json({'data': {'isInWishlist': true}}, 201);
      });
      final wishlist = WishlistProvider(client: client);
      final first = wishlist.toggleFavorite(_product('p1'), 'access');
      expect(wishlist.isToggling('p1'), true);
      expect(await wishlist.toggleFavorite(_product('p1'), 'access'), isNull);
      gate.complete();
      expect(await first, true);
      expect(posts, 1);
      expect(wishlist.isFavorite('p1'), true);
      expect(wishlist.isToggling('p1'), false);
      wishlist.dispose(); client.close();
    });

    test('toggles made while a sync GET is in flight are not overwritten by its snapshot', () async {
      final serverIds = <String>{'p2'};
      Completer<void>? getGate;
      final snapshotTaken = Completer<void>();
      final client = MockClient((request) async {
        final id = request.url.pathSegments.last;
        if (request.method == 'GET') {
          final snapshot = serverIds.map((id) => _product(id).toJson()).toList();
          if (getGate != null) {
            snapshotTaken.complete();
            await getGate.future;
          }
          return _json({'data': {'products': snapshot}});
        }
        if (request.method == 'POST') {
          serverIds.add(id);
          return _json({'data': {'isInWishlist': true}}, 201);
        }
        serverIds.remove(id);
        return _json({'data': {'isInWishlist': false}});
      });
      final wishlist = WishlistProvider(client: client);
      await wishlist.syncWithServer('access');
      expect(wishlist.isFavorite('p2'), true);

      getGate = Completer<void>();
      final staleSync = wishlist.syncWithServer('access');
      // Snapshot (p2 only) is taken; now like p1 and unlike p2 before it returns.
      await snapshotTaken.future;
      expect(await wishlist.toggleFavorite(_product('p1'), 'access'), true);
      expect(await wishlist.toggleFavorite(_product('p2'), 'access'), true);
      getGate.complete();
      await staleSync;

      expect(serverIds, {'p1'});
      expect(wishlist.isFavorite('p1'), true);
      expect(wishlist.isFavorite('p2'), false);
      expect(wishlist.itemCount, 1);
      wishlist.dispose(); client.close();
    });

    test('pending guest like survives a 401/429 on sync and is dropped only on 404', () async {
      var postStatus = 401;
      var posts = 0;
      final client = MockClient((request) async {
        if (request.method == 'GET') return _json({'data': {'products': []}});
        posts++;
        return _json({'message': 'x'}, postStatus);
      });
      final wishlist = WishlistProvider(client: client);
      expect(await wishlist.toggleFavorite(_product('p1')), true);

      await wishlist.syncWithServer('access');
      expect(wishlist.isFavorite('p1'), true);
      postStatus = 429;
      await wishlist.syncWithServer('access');
      expect(wishlist.isFavorite('p1'), true);
      expect(posts, 2);

      postStatus = 404;
      await wishlist.syncWithServer('access');
      expect(wishlist.isFavorite('p1'), false);
      await wishlist.syncWithServer('access');
      expect(posts, 3);
      wishlist.dispose(); client.close();
    });
  });

  group('Checkout orders only selected cart items', () {
    test('placeOrder sends only selected items and cart keeps the rest', () async {
      List<dynamic>? sentItems;
      final client = MockClient((request) async {
        sentItems = jsonDecode(request.body)['items'] as List<dynamic>;
        return _json({'data': {'_id': 'order-1', 'items': []}}, 201);
      });
      final cart = CartProvider()
        ..addToCart(_product('a'), quantity: 2)
        ..addToCart(_product('b', price: 50000));
      cart.items.firstWhere((i) => i.product.id == 'b').selected = false;
      expect(cart.subtotal, 200000);

      final orders = OrderProvider(client: client);
      final order = await orders.placeOrder(items: cart.items, fullName: 'QA',
        phone: '0901234567', email: 'qa@example.test', address: 'Test', paymentMethod: 'COD');
      expect(order?.id, 'order-1');
      expect(sentItems, hasLength(1));
      expect(sentItems!.single['product'], 'a');
      expect(sentItems!.single['quantity'], 2);

      cart.removeOrderedItems();
      expect(cart.items.map((i) => i.product.id), ['b']);
      orders.dispose(); cart.dispose(); client.close();
    });

    test('items default to selected, so an untouched cart is ordered in full', () async {
      List<dynamic>? sentItems;
      final client = MockClient((request) async {
        sentItems = jsonDecode(request.body)['items'] as List<dynamic>;
        return _json({'data': {'_id': 'order-1', 'items': []}}, 201);
      });
      final cart = CartProvider()
        ..addToCart(_product('a'))
        ..addToCart(_product('b'));
      final orders = OrderProvider(client: client);
      await orders.placeOrder(items: cart.items, fullName: 'QA',
        phone: '0901234567', email: 'qa@example.test', address: 'Test', paymentMethod: 'COD');
      expect(sentItems, hasLength(2));
      cart.removeOrderedItems();
      expect(cart.items, isEmpty);
      orders.dispose(); cart.dispose(); client.close();
    });

    test('nothing selected is rejected without calling the API', () async {
      var calls = 0;
      final client = MockClient((_) async {
        calls++;
        return _json({'data': {'_id': 'order-1', 'items': []}}, 201);
      });
      final cart = CartProvider()..addToCart(_product('a'));
      cart.items.single.selected = false;
      final orders = OrderProvider(client: client);
      await expectLater(orders.placeOrder(items: cart.items, fullName: 'QA',
        phone: '0901234567', email: 'qa@example.test', address: 'Test', paymentMethod: 'COD'),
        throwsException);
      expect(calls, 0);
      expect(orders.isLoading, false);
      orders.dispose(); cart.dispose(); client.close();
    });
  });
}
