import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/config/app_config.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/widgets/product_grid_card.dart';
import 'package:mobile/models/product_model.dart';
import 'package:mobile/providers/cart_provider.dart';
import 'package:mobile/providers/product_provider.dart';
import 'package:mobile/providers/review_provider.dart';
import 'package:mobile/providers/wishlist_provider.dart';
import 'package:mobile/screens/product/product_detail_screen.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';

ProductModel _product({
  String id = 'p1',
  String slug = 'sach-hay',
  num rating = 0,
  int? reviewCount,
  int stock = 5,
  String? description,
  String? brand,
  String sku = '',
}) =>
    ProductModel(
      id: id,
      name: 'Sách $id',
      slug: slug,
      sku: sku,
      description: description,
      brand: brand,
      price: 100000,
      discountPrice: 0,
      stock: stock,
      images: const [],
      rating: rating,
      reviewCount: reviewCount,
      sold: 3,
      isFeatured: false,
    );

Map<String, dynamic> _productJson(String id, {int stock = 5}) => {
      '_id': id,
      'name': 'Sản phẩm $id',
      'slug': 'slug-$id',
      'price': 50000,
      'stock': stock,
    };

http.Response _json(Object body, [int status = 200]) => http.Response.bytes(
      utf8.encode(jsonEncode(body)),
      status,
      headers: {'content-type': 'application/json'},
    );

http.Response _page(List<String> ids, {required int page, required int totalPages, int total = 0}) =>
    _json({
      'success': true,
      'data': ids.map(_productJson).toList(),
      'meta': {'page': page, 'limit': ids.length, 'total': total, 'totalPages': totalPages},
    });

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('ProductModel honest rating and stock rules', () {
    test('missing rating parses as 0 (no fake 5.0) and shows no stars', () {
      final p = ProductModel.fromJson({'_id': 'x', 'name': 'A', 'price': 1000});
      expect(p.rating, 0);
      expect(p.hasRating, isFalse);
    });

    test('rating with zero reviewCount is not shown; positive rating is', () {
      expect(_product(rating: 4.5, reviewCount: 0).hasRating, isFalse);
      expect(_product(rating: 4.5, reviewCount: 3).hasRating, isTrue);
      expect(_product(rating: 4.5).hasRating, isTrue);
      expect(ProductModel.fromJson({'_id': 'x', 'rating': 4, 'numReviews': 2}).reviewCount, 2);
    });

    test('addableQuantity is capped by stock minus quantity already in cart', () {
      final p = _product(stock: 5);
      expect(p.addableQuantity(requested: 3), 3);
      expect(p.addableQuantity(inCart: 4, requested: 3), 1);
      expect(p.addableQuantity(inCart: 5, requested: 1), 0);
      expect(_product(stock: 0).addableQuantity(requested: 1), 0);
      expect(p.addableQuantity(requested: 0), 0);
    });

    test('urlKey prefers slug and falls back to id', () {
      expect(_product(slug: 'abc').urlKey, 'abc');
      expect(_product(id: 'id-1', slug: '').urlKey, 'id-1');
    });
  });

  group('AppConfig web URL', () {
    test('falls back to the official web URL and strips trailing slashes', () {
      expect(AppConfig.resolveWebBaseUrl(''), AppConfig.defaultWebUrl);
      expect(AppConfig.resolveWebBaseUrl('ftp://x'), AppConfig.defaultWebUrl);
      expect(AppConfig.resolveWebBaseUrl('https://shop.example.vn///'), 'https://shop.example.vn');
    });

    test('product share URL mirrors the web route /products/:slug', () {
      expect(AppConfig.productUrl('sach-hay', baseUrl: 'https://shop.example.vn/'),
          'https://shop.example.vn/products/sach-hay');
      expect(AppConfig.productUrl('a b', baseUrl: 'https://shop.example.vn'),
          'https://shop.example.vn/products/a%20b');
    });
  });

  group('ProductCatalog (list screen state)', () {
    test('sort options match backend ProductQueryDto values', () {
      expect(productSortOptions.map((o) => o.value), [
        'newest', 'price_asc', 'price_desc', 'best_selling',
        'rating', 'name_asc', 'name_desc', 'discount_desc',
      ]);
    });

    test('paginates with page/limit and stops at meta.totalPages', () async {
      final requests = <Uri>[];
      final api = ApiClient(httpClient: MockClient((req) async {
        requests.add(req.url);
        final page = int.parse(req.url.queryParameters['page']!);
        return page == 1
            ? _page(['a', 'b'], page: 1, totalPages: 2, total: 3)
            : _page(['b', 'c'], page: 2, totalPages: 2, total: 3);
      }));
      final catalog = ProductCatalog(api: api, pageSize: 2);
      await catalog.setSortBy('price_desc');
      expect(catalog.items.map((p) => p.id), ['a', 'b']);
      expect(catalog.hasMore, isTrue);
      expect(catalog.total, 3);

      await catalog.loadMore();
      // Duplicate 'b' across pages is not rendered twice.
      expect(catalog.items.map((p) => p.id), ['a', 'b', 'c']);
      expect(catalog.hasMore, isFalse);
      await catalog.loadMore(); // no request past the last page
      expect(requests, hasLength(2));
      expect(requests.first.path, '/api/products');
      expect(requests.first.queryParameters, containsPair('limit', '2'));
      expect(requests.first.queryParameters, containsPair('sort', 'price_desc'));
      expect(requests.last.queryParameters, containsPair('page', '2'));
      catalog.dispose();
      api.close();
    });

    test('builds backend query from filters (no hard limit 50)', () {
      final api = ApiClient(httpClient: MockClient((_) async => _json({'data': []})));
      final catalog = ProductCatalog(api: api);
      catalog.applyFilters(minPrice: 200000, maxPrice: 10000, brand: 'Deli', minRating: 4, onlyInStock: true);
      final q = catalog.buildQuery(1);
      expect(q['limit'], '${ProductCatalog.defaultPageSize}');
      expect(q['minPrice'], '10000'); // swapped when min > max
      expect(q['maxPrice'], '200000');
      expect(q['brand'], 'Deli');
      expect(q['minRating'], '4');
      expect(q['inStock'], 'true');
      expect(catalog.hasActiveFilters, isTrue);
      catalog.dispose();
      api.close();
    });

    test('search is debounced: rapid typing sends one request with the last query', () async {
      final queries = <String?>[];
      final api = ApiClient(httpClient: MockClient((req) async {
        queries.add(req.url.queryParameters['q']);
        return _page(['a'], page: 1, totalPages: 1);
      }));
      final catalog = ProductCatalog(api: api, searchDebounce: const Duration(milliseconds: 40));
      catalog.setSearchQuery('s');
      catalog.setSearchQuery('sá');
      catalog.setSearchQuery('sách');
      await Future<void>.delayed(const Duration(milliseconds: 20));
      expect(queries, isEmpty);
      await Future<void>.delayed(const Duration(milliseconds: 80));
      expect(queries, ['sách']);
      catalog.dispose();
      api.close();
    });

    test('error state is exposed and retry recovers', () async {
      var fail = true;
      final api = ApiClient(httpClient: MockClient((req) async {
        if (fail) throw http.ClientException('offline');
        return _page(['a'], page: 1, totalPages: 1);
      }));
      final catalog = ProductCatalog(api: api);
      await catalog.refresh();
      expect(catalog.errorMessage, isNotNull);
      expect(catalog.isLoading, isFalse);
      fail = false;
      await catalog.refresh();
      expect(catalog.errorMessage, isNull);
      expect(catalog.items, hasLength(1));
      catalog.dispose();
      api.close();
    });

    test('a stale response from an older filter does not overwrite the newer one', () async {
      final slow = Completer<http.Response>();
      final api = ApiClient(httpClient: MockClient((req) async {
        if (req.url.queryParameters['sort'] == 'newest') return slow.future;
        return _page(['new'], page: 1, totalPages: 1);
      }));
      final catalog = ProductCatalog(api: api);
      final first = catalog.refresh();
      await catalog.setSortBy('rating');
      slow.complete(_page(['old'], page: 1, totalPages: 1));
      await first;
      expect(catalog.items.map((p) => p.id), ['new']);
      catalog.dispose();
      api.close();
    });

    test('catalogue filters never clobber Home data in ProductProvider', () async {
      final homeQueries = <Map<String, String>>[];
      final client = MockClient((req) async {
        final ids = req.url.queryParameters['limit'] == '50' ? ['home-1', 'home-2'] : ['cat-1'];
        if (req.url.queryParameters['limit'] == '50') homeQueries.add(req.url.queryParameters);
        return _page(ids, page: 1, totalPages: 1);
      });
      final provider = ProductProvider(client: client);
      await provider.fetchProducts();
      final catalog = provider.createCatalog();
      await catalog.applyFilters(brand: 'Deli', onlyInStock: true);
      await catalog.setSortBy('price_asc');
      expect(catalog.items.single.id, 'cat-1');
      expect(provider.products.map((p) => p.id), ['home-1', 'home-2']);
      expect(homeQueries.single.containsKey('brand'), isFalse);
      catalog.dispose();
      provider.dispose();
    });
  });

  group('Related products', () {
    test('uses GET /products/:id/related and drops the current product', () async {
      final client = MockClient((req) async {
        expect(req.url.path, '/api/products/p1/related');
        expect(req.url.queryParameters['limit'], '6');
        return _json({'success': true, 'data': [_productJson('p1'), _productJson('p2')]});
      });
      final provider = ProductProvider(client: client);
      final related = await provider.fetchRelatedProducts('p1');
      expect(related.map((p) => p.id), ['p2']);
      provider.dispose();
    });

    test('throws on HTTP error so the screen can show a retry', () async {
      final provider = ProductProvider(client: MockClient((_) async => _json({'message': 'x'}, 500)));
      await expectLater(provider.fetchRelatedProducts('p1'), throwsA(isA<ProductLoadException>()));
      provider.dispose();
    });
  });

  group('ReviewProvider per-product state (shared global instance)', () {
    test('reviews of product A survive opening product B', () async {
      final client = MockClient((req) async {
        final id = req.url.pathSegments[3];
        if (req.url.path.endsWith('/breakdown')) {
          return _json({'data': {'averageRating': 4.5, 'totalReviews': 2,
            'breakdown': {'5': 1, '4': 1}, 'percentages': {'5': 50, '4': 50}}});
        }
        return _json({'data': [{'_id': 'r-$id', 'user': {'fullName': 'U'}, 'rating': 5, 'content': 'Review $id'}]});
      });
      final provider = ReviewProvider(client: client);
      await provider.fetchReviews('A');
      await provider.fetchReviews('B');
      expect(provider.stateFor('A').reviews.single.content, 'Review A');
      expect(provider.stateFor('B').reviews.single.content, 'Review B');
      expect(provider.stateFor('A').breakdown?.total, 2);
      expect(provider.reviews.single.content, 'Review B'); // legacy getter = latest
      expect(provider.stateFor('unknown').reviews, isEmpty);
      provider.dispose();
    });
  });

  group('Detail helpers', () {
    test('description fallback is honest, markdown is stripped', () {
      expect(productDescriptionText(null), kNoDescriptionText);
      expect(productDescriptionText('   '), kNoDescriptionText);
      expect(productDescriptionText('## Giới thiệu\n- **Bìa cứng**'), 'Giới thiệu\n• Bìa cứng');
    });

    test('spec rows hide missing brand/SKU instead of fake values', () {
      final labels = productSpecRows(_product()).map((e) => e.key).toList();
      expect(labels, ['Tình trạng']);
      final full = productSpecRows(_product(brand: 'Deli', sku: 'SKU-1'));
      expect(full.map((e) => e.value), containsAll(['Deli', 'SKU-1']));
      expect(full.any((e) => e.value == 'Trường Thành Official' || e.value == 'TT-BOOKSTORE'), isFalse);
    });
  });

  group('Widgets', () {
    Widget host(Widget child, {required List<SingleChildWidget> providers, ThemeData? theme}) =>
        MultiProvider(
          providers: providers,
          child: MaterialApp(theme: theme ?? AppTheme.lightTheme, home: child),
        );

    testWidgets('card: no fake rating, out-of-stock badge and disabled quick add', (tester) async {
      final cart = CartProvider();
      final wishlist = WishlistProvider(client: MockClient((_) async => _json({'data': []})));
      for (final theme in [AppTheme.lightTheme, AppTheme.darkTheme]) {
        await tester.pumpWidget(host(
          Scaffold(
            body: Center(
              child: SizedBox(
                width: 170,
                height: 270,
                child: ProductGridCard(product: _product(rating: 0, stock: 0)),
              ),
            ),
          ),
          providers: [
            ChangeNotifierProvider<CartProvider>.value(value: cart),
            ChangeNotifierProvider<WishlistProvider>.value(value: wishlist),
          ],
          theme: theme,
        ));
        await tester.pump();
        expect(find.text('Chưa có đánh giá'), findsOneWidget);
        expect(find.text('4.8'), findsNothing);
        expect(find.text('Hết hàng'), findsOneWidget);
        await tester.tap(find.byIcon(Icons.remove_shopping_cart_outlined));
        await tester.pump();
        expect(cart.items, isEmpty);
        expect(tester.takeException(), isNull);
      }
    });

    testWidgets('detail: breakdown, honest description, related endpoint, capped stepper, share link',
        (tester) async {
      final requested = <String>[];
      final client = MockClient((req) async {
        requested.add(req.url.path);
        if (req.url.path.endsWith('/related')) {
          return _json({'data': [_productJson('rel-1')]});
        }
        if (req.url.path.endsWith('/breakdown')) {
          return _json({'data': {'averageRating': 4.0, 'totalReviews': 1,
            'breakdown': {'4': 1}, 'percentages': {'4': 100}}});
        }
        if (req.url.path.startsWith('/api/reviews/product/')) {
          return _json({'data': [{'_id': 'r1', 'user': {'fullName': 'Khách A'}, 'rating': 4, 'content': 'Sách đẹp'}]});
        }
        return _json({'data': []});
      });
      String? copied;
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
        if (call.method == 'Clipboard.setData') {
          copied = (call.arguments as Map)['text'] as String?;
        }
        return null;
      });
      addTearDown(() => tester.binding.defaultBinaryMessenger
          .setMockMethodCallHandler(SystemChannels.platform, null));

      final products = ProductProvider(client: client);
      final reviews = ReviewProvider(client: client);
      final cart = CartProvider();
      final wishlist = WishlistProvider(client: client);
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 3;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(host(
        ProductDetailScreen(product: _product(stock: 2, slug: 'sach-hay')),
        providers: [
          ChangeNotifierProvider<ProductProvider>.value(value: products),
          ChangeNotifierProvider<ReviewProvider>.value(value: reviews),
          ChangeNotifierProvider<CartProvider>.value(value: cart),
          ChangeNotifierProvider<WishlistProvider>.value(value: wishlist),
        ],
      ));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      expect(requested, contains('/api/products/p1/related'));
      expect(find.text('4.8'), findsNothing);
      expect(find.text(kNoDescriptionText), findsOneWidget);
      expect(find.text('Trường Thành Official'), findsNothing);
      expect(find.text('TT-BOOKSTORE'), findsNothing);
      expect(find.byType(RatingBreakdownView), findsOneWidget);
      expect(find.text('Sách đẹp'), findsOneWidget);
      expect(find.text('Sản phẩm rel-1'), findsOneWidget);

      // Stepper: stock 2 -> after one increase the "+" is disabled.
      final plus = find.widgetWithIcon(IconButton, Icons.add);
      await tester.tap(plus);
      await tester.pump();
      expect(tester.widget<IconButton>(plus).onPressed, isNull);

      await tester.tap(find.byIcon(Icons.link_rounded));
      await tester.pump();
      expect(copied, AppConfig.productUrl('sach-hay'));
      expect(find.text('Đã sao chép liên kết sản phẩm'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
      products.dispose();
      reviews.dispose();
    });
  });
}
