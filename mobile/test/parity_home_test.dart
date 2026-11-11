import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/models/banner_model.dart';
import 'package:mobile/models/category_model.dart';
import 'package:mobile/models/product_model.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/providers/banner_provider.dart';
import 'package:mobile/providers/cart_provider.dart';
import 'package:mobile/providers/notification_provider.dart';
import 'package:mobile/providers/order_provider.dart';
import 'package:mobile/providers/product_provider.dart';
import 'package:mobile/providers/wishlist_provider.dart';
import 'package:mobile/screens/home/deal_hot_screen.dart';
import 'package:mobile/screens/home/home_screen.dart';
import 'package:mobile/screens/home/widgets/featured_categories_section.dart';
import 'package:mobile/screens/home/widgets/flash_sale_section.dart';
import 'package:mobile/screens/home/widgets/home_app_bar.dart';
import 'package:mobile/screens/home/widgets/home_navigation.dart';
import 'package:mobile/screens/notification/notifications_screen.dart';

/// 1x1 PNG trong suốt — ảnh banner dạng data URI để test không cần mạng.
const _pngDataUri =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

http.Response _json(Object data, [int status = 200]) =>
    http.Response(jsonEncode({'success': status < 400, 'data': data}), status,
        headers: {'content-type': 'application/json'});

ProductModel _product(String id, {num price = 100000, num discountPrice = 0}) => ProductModel.fromJson({
      '_id': id,
      'name': 'Sản phẩm $id',
      'slug': 'san-pham-$id',
      'sku': 'SKU-$id',
      'price': price,
      'discountPrice': discountPrice,
      'stock': 10,
      'images': <String>[],
    });

class _LoggedInAuth extends AuthProvider {
  _LoggedInAuth({super.apiClient});
  @override
  bool get isAuthenticated => true;
  @override
  String get token => 'test-token';
}

/// Backend giả: trả dữ liệu theo đường dẫn, ghi lại các path đã gọi.
class _FakeBackend {
  _FakeBackend({this.banners = const {}, this.unreadCount = 0});

  Object banners;
  int unreadCount;
  final List<String> paths = [];

  late final MockClient client = MockClient((request) async {
    final path = request.url.path;
    paths.add(path);
    if (path.endsWith('/banners/active')) return _json(banners);
    if (path.endsWith('/categories')) {
      return _json([
        {'_id': 'cat-sgk', 'name': 'Sách giáo khoa', 'slug': 'sach-giao-khoa'},
        {'_id': 'cat-new', 'name': 'Danh mục mới', 'slug': 'danh-muc-moi', 'description': 'Từ API'},
        {'_id': 'cat-child', 'name': 'Lớp 1', 'slug': 'lop-1', 'parentId': 'cat-sgk'},
      ]);
    }
    if (path.endsWith('/products')) {
      return _json({
        'items': [
          _product('deal', price: 100000, discountPrice: 75000).toJson(),
          _product('plain').toJson(),
        ],
      });
    }
    if (path.endsWith('/notifications/unread-count')) return _json({'unreadCount': unreadCount});
    if (path.endsWith('/notifications/my-notifications')) return _json({'items': [], 'total': 0});
    if (path.endsWith('/promotions/active')) return _json([]);
    return _json({});
  });
}

/// Màn hình điện thoại 390x844 (thay vì 800x600 mặc định của test).
void _usePhoneViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(1170, 2532);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
}

Future<void> _pumpHome(WidgetTester tester, _FakeBackend backend, {bool loggedIn = false}) async {
  _usePhoneViewport(tester);
  final api = ApiClient(httpClient: backend.client);
  final auth = loggedIn ? _LoggedInAuth(apiClient: api) : AuthProvider(apiClient: api);
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>.value(value: auth),
      ChangeNotifierProvider(create: (_) => ProductProvider(apiClient: api)),
      ChangeNotifierProvider(create: (_) => CartProvider(apiClient: api)),
      ChangeNotifierProvider(create: (_) => WishlistProvider(apiClient: api)),
      ChangeNotifierProvider(create: (_) => OrderProvider(apiClient: api)),
      ChangeNotifierProvider(create: (_) => NotificationProvider(apiClient: api)),
      ChangeNotifierProvider(create: (_) => BannerProvider(apiClient: api)),
    ],
    child: MaterialApp(theme: AppTheme.lightTheme, home: const HomeScreen()),
  ));
  await tester.pumpAndSettle();
}

Future<void> _unmount(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(seconds: 1));
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('BannerModel / BannerLink', () {
    test('parses backend schema fields and legacy aliases', () {
      final banner = BannerModel.fromJson({
        '_id': 'b1',
        'title': 'Khai giảng',
        'imageUrl': 'https://cdn.example.com/b1.jpg',
        'linkUrl': '/products/sach-moi',
        'position': 'main_slider',
        'sortOrder': 2,
      });
      expect(banner.id, 'b1');
      expect(banner.imageSource?.isNetwork, isTrue);
      expect(banner.sortOrder, 2);
      expect(banner.link.type, BannerLinkType.product);
      expect(banner.link.value, 'sach-moi');

      final legacy = BannerModel.fromJson({'title': 'x', 'image': _pngDataUri, 'link': '/deal-hot'});
      expect(legacy.position, BannerPositions.mainSlider);
      expect(legacy.imageSource?.isNetwork, isFalse);
      expect(legacy.imageSource?.bytes, isNotEmpty);
      expect(legacy.link.type, BannerLinkType.dealHot);
    });

    test('rejects unsupported image sources', () {
      expect(BannerModel.fromJson({'imageUrl': ''}).hasImage, isFalse);
      expect(BannerModel.fromJson({'imageUrl': '/uploads/a.jpg'}).hasImage, isFalse);
      expect(BannerModel.fromJson({'imageUrl': 'javascript:alert(1)'}).hasImage, isFalse);
    });

    test('maps web routes to app destinations and only opens http(s) externally', () {
      final category = BannerLink.parse('/products?category=sach-giao-khoa&q=toán');
      expect(category.type, BannerLinkType.category);
      expect(category.value, 'sach-giao-khoa');
      expect(category.query, 'toán');

      final search = BannerLink.parse('/products?q=bút');
      expect(search.type, BannerLinkType.productList);
      expect(search.query, 'bút');

      expect(BannerLink.parse('/products').type, BannerLinkType.productList);
      expect(BannerLink.parse('/products/abc').value, 'abc');
      expect(BannerLink.parse('/deal-hot').type, BannerLinkType.dealHot);

      final external = BannerLink.parse('https://truongthanh.vn/khuyen-mai');
      expect(external.type, BannerLinkType.external);
      expect(external.uri?.host, 'truongthanh.vn');
      expect(BannerLink.parse('http://example.com').type, BannerLinkType.external);

      for (final unsafe in [
        null,
        '',
        '   ',
        'javascript:alert(1)',
        'data:text/html,hi',
        'mailto:a@b.c',
        'tel:0900000000',
        'khuyen-mai',
        '//evil.example.com',
        '/t/landing-page',
        '/admin/products',
        '/products/a/b',
      ]) {
        expect(BannerLink.parse(unsafe).type, BannerLinkType.none, reason: '$unsafe');
      }
    });
  });

  group('BannerProvider', () {
    test('keeps only main_slider banners with valid images, sorted by sortOrder', () async {
      late Uri requested;
      final provider = BannerProvider(client: MockClient((request) async {
        requested = request.url;
        return _json({
          'main_slider': [
            {'_id': 'b2', 'title': 'Hai', 'imageUrl': 'https://cdn.example.com/2.jpg', 'position': 'main_slider', 'sortOrder': 2},
            {'_id': 'b0', 'title': 'Không ảnh', 'imageUrl': '', 'position': 'main_slider', 'sortOrder': 0},
            {'_id': 'b1a', 'title': 'Một A', 'imageUrl': 'https://cdn.example.com/1a.jpg', 'position': 'main_slider', 'sortOrder': 1},
            {'_id': 'b1b', 'title': 'Một B', 'imageUrl': 'https://cdn.example.com/1b.jpg', 'position': 'main_slider', 'sortOrder': 1},
          ],
          'sidebar_left': [
            {'_id': 's1', 'title': 'Bên trái', 'imageUrl': 'https://cdn.example.com/s.jpg', 'position': 'sidebar_left'},
          ],
        });
      }));
      expect(provider.hasLoaded, isFalse);
      await provider.fetchActiveBanners();

      expect(requested.path, endsWith('/banners/active'));
      expect(requested.hasQuery, isFalse);
      expect(provider.mainSlider.map((b) => b.id), ['b1a', 'b1b', 'b2']);
      expect(provider.hasLoaded, isTrue);
      expect(provider.errorMessage, isNull);
      provider.dispose();
    });

    test('accepts a flat list payload', () {
      final parsed = BannerProvider.parseMainSlider([
        {'_id': 'a', 'title': 'A', 'imageUrl': 'https://x.y/a.jpg', 'position': 'bottom_row'},
        {'_id': 'b', 'title': 'B', 'imageUrl': 'https://x.y/b.jpg', 'position': 'main_slider'},
      ]);
      expect(parsed.map((b) => b.id), ['b']);
      expect(BannerProvider.parseMainSlider(null), isEmpty);
    });

    test('server error and network failure leave no banners but finish loading', () async {
      final failing = BannerProvider(client: MockClient((_) async => _json({'message': 'boom'}, 500)));
      await failing.fetchActiveBanners();
      expect(failing.mainSlider, isEmpty);
      expect(failing.hasLoaded, isTrue);
      expect(failing.isLoading, isFalse);
      expect(failing.errorMessage, isNotNull);
      failing.dispose();

      final offline = BannerProvider(client: MockClient((_) async => throw http.ClientException('offline')));
      await offline.fetchActiveBanners();
      expect(offline.mainSlider, isEmpty);
      expect(offline.hasLoaded, isTrue);
      expect(offline.errorMessage, isNotNull);
      offline.dispose();
    });

    test('fetchProductByLink loads the product by id or slug', () async {
      final paths = <String>[];
      final provider = BannerProvider(client: MockClient((request) async {
        paths.add(request.url.path);
        if (request.url.path.endsWith('/products/sach-moi')) {
          return _json(_product('p1', price: 50000, discountPrice: 40000).toJson());
        }
        return _json({'message': 'Not found'}, 404);
      }));
      final product = await provider.fetchProductByLink('sach-moi');
      expect(product?.id, 'p1');
      expect(product?.discountPrice, 40000);
      expect(await provider.fetchProductByLink('missing'), isNull);
      expect(await provider.fetchProductByLink('  '), isNull);
      expect(paths, hasLength(2));
      provider.dispose();
    });
  });

  group('Featured categories', () {
    CategoryModel cat(String id, String slug, {String? parentId}) =>
        CategoryModel(id: id, name: 'Tên $id', slug: slug, parentId: parentId);

    test('built from API root categories only, web slugs first, no hardcoded cards', () {
      final items = buildFeaturedCategories([
        cat('x', 'khac'),
        cat('child', 'sach-giao-khoa-lop-1', parentId: 'sgk'),
        cat('combo', 'combo'),
        cat('sgk', 'sach-giao-khoa'),
      ]);
      expect(items.map((i) => i.category.id), ['sgk', 'combo', 'x']);
      expect(items.first.assetImage, 'assets/sgk-bg.jpg');
      expect(items.last.assetImage, isNull);
      expect(buildFeaturedCategories([]), isEmpty);
      expect(buildFeaturedCategories([for (var i = 0; i < 12; i++) cat('c$i', 's$i')]), hasLength(8));
    });

    test('category lookup never falls back to another category', () {
      final categories = [cat('a', 'alpha'), cat('b', 'beta')];
      expect(findCategoryByIdOrSlug(categories, 'beta')?.id, 'b');
      expect(findCategoryByIdOrSlug(categories, 'a')?.id, 'a');
      expect(findCategoryByIdOrSlug(categories, 'gamma'), isNull);
      expect(findCategoryByIdOrSlug(const [], 'alpha'), isNull);
    });
  });

  group('Deal helpers', () {
    test('deal list and headline percent come from server prices only', () {
      final products = [
        _product('a', price: 100000, discountPrice: 75000),
        _product('b', price: 200000, discountPrice: 180000),
        _product('c', price: 100000, discountPrice: 0),
        _product('d', price: 100000, discountPrice: 120000),
      ];
      final deals = dealProducts(products);
      expect(deals.map((p) => p.id), ['a', 'b']);
      expect(maxDiscountPercent(deals), 25);
      expect(dealSubtitle(25), 'Giảm đến 25% cho sản phẩm đang khuyến mãi');
      expect(dealSubtitle(0), 'Sản phẩm đang có giá ưu đãi');
    });

    test('countdown only exists for a future server deadline', () {
      final now = DateTime(2026, 11, 10, 10);
      expect(countdownParts(null, now), isNull);
      expect(countdownParts(now, now), isNull);
      expect(countdownParts(now.subtract(const Duration(minutes: 1)), now), isNull);
      final parts = countdownParts(now.add(const Duration(hours: 26, minutes: 5, seconds: 9)), now)!;
      expect(parts.hours, '26');
      expect(parts.minutes, '05');
      expect(parts.seconds, '09');
    });

    test('unread badge label', () {
      expect(unreadBadgeLabel(0), isNull);
      expect(unreadBadgeLabel(-1), isNull);
      expect(unreadBadgeLabel(7), '7');
      expect(unreadBadgeLabel(120), '99+');
    });
  });

  group('HomeScreen', () {
    testWidgets('shows static slides only when the server has no banners', (tester) async {
      final backend = _FakeBackend(banners: const {});
      await _pumpHome(tester, backend);

      expect(backend.paths.where((p) => p.endsWith('/banners/active')), hasLength(1));
      expect(find.text('Sách và dụng cụ học tập'), findsOneWidget);
      // Không còn khẳng định ưu đãi bịa ra.
      expect(find.textContaining('40%'), findsNothing);
      expect(find.textContaining('TRUONGTHANH50'), findsNothing);
      await _unmount(tester);
    });

    testWidgets('renders admin banners instead of the static slides', (tester) async {
      final backend = _FakeBackend(banners: {
        'main_slider': [
          {'_id': 'b1', 'title': 'Banner thật', 'imageUrl': _pngDataUri, 'linkUrl': '/deal-hot', 'position': 'main_slider'},
        ],
      });
      await _pumpHome(tester, backend);

      expect(find.text('Sách và dụng cụ học tập'), findsNothing);
      expect(find.byWidgetPredicate((w) => w is Image && w.image is MemoryImage), findsOneWidget);
      await _unmount(tester);
    });

    testWidgets('featured categories and deal copy come from API data', (tester) async {
      await _pumpHome(tester, _FakeBackend());

      expect(find.text('Danh mục mới'), findsOneWidget);
      expect(find.text('Sách giáo khoa'), findsOneWidget);
      expect(find.text('Lớp 1'), findsNothing);
      expect(find.text('Đồ chơi'), findsNothing);

      expect(find.text('Giảm đến 25% cho sản phẩm đang khuyến mãi'), findsOneWidget);
      expect(find.textContaining('30%'), findsNothing);
      // Không có flashSaleExpiry → không có đồng hồ đếm ngược giả.
      expect(find.text('Kết thúc sau'), findsNothing);
      expect(find.text('Không có thông báo mới nào.'), findsNothing);
      await _unmount(tester);
    });

    testWidgets('guest bell asks to sign in and shows no unread badge', (tester) async {
      final backend = _FakeBackend(unreadCount: 5);
      await _pumpHome(tester, backend);

      expect(backend.paths.where((p) => p.contains('/notifications/')), isEmpty);
      final badge = tester.widget<Badge>(find.descendant(
        of: find.byType(HomeNotificationBell),
        matching: find.byType(Badge),
      ));
      expect(badge.isLabelVisible, isFalse);

      await tester.tap(find.byType(HomeNotificationBell));
      await tester.pumpAndSettle();
      expect(find.text('Đăng nhập để xem thông báo'), findsOneWidget);
      await tester.tap(find.text('Để sau'));
      await tester.pumpAndSettle();
      expect(find.byType(NotificationsScreen), findsNothing);
      await _unmount(tester);
    });

    testWidgets('signed-in bell shows the server unread count and opens notifications', (tester) async {
      final backend = _FakeBackend(unreadCount: 3);
      await _pumpHome(tester, backend, loggedIn: true);

      expect(backend.paths.where((p) => p.endsWith('/notifications/unread-count')), isNotEmpty);
      expect(find.descendant(of: find.byType(HomeNotificationBell), matching: find.text('3')), findsOneWidget);

      await tester.tap(find.byType(HomeNotificationBell));
      await tester.pumpAndSettle();
      expect(find.byType(NotificationsScreen), findsOneWidget);
      await _unmount(tester);
    });

    // Viewport mặc định 800x600: kiểm tra luôn bố cục màn rộng (không tràn).
    testWidgets('renders in dark mode on a wide screen without exceptions', (tester) async {
      final backend = _FakeBackend();
      final api = ApiClient(httpClient: backend.client);
      await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => ProductProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => CartProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => WishlistProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => NotificationProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => BannerProvider(apiClient: api)),
        ],
        child: MaterialApp(theme: AppTheme.darkTheme, home: const HomeScreen()),
      ));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.text('Danh mục nổi bật'), findsOneWidget);
      await _unmount(tester);
    });
  });

  group('Banner link navigation', () {
    Future<BuildContext> pumpHost(WidgetTester tester) async {
      final backend = _FakeBackend();
      final api = ApiClient(httpClient: backend.client);
      late BuildContext captured;
      await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => ProductProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => CartProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => WishlistProvider(apiClient: api)),
          ChangeNotifierProvider(create: (_) => BannerProvider(apiClient: api)),
        ],
        child: MaterialApp(
          home: Scaffold(body: Builder(builder: (context) {
            captured = context;
            return const SizedBox();
          })),
        ),
      ));
      return captured;
    }

    testWidgets('deal-hot link opens the deal screen', (tester) async {
      final context = await pumpHost(tester);
      await openBannerLink(context, BannerLink.parse('/deal-hot'));
      await tester.pumpAndSettle();
      expect(find.byType(DealHotScreen), findsOneWidget);
      await _unmount(tester);
    });

    testWidgets('http(s) links go to the external launcher; unsafe links do nothing', (tester) async {
      final context = await pumpHost(tester);
      final launched = <Uri>[];
      Future<bool> fake(Uri uri) async {
        launched.add(uri);
        return true;
      }

      await openBannerLink(context, BannerLink.parse('https://example.com/sale'), launcher: fake);
      await openBannerLink(context, BannerLink.parse('javascript:alert(1)'), launcher: fake);
      await tester.pumpAndSettle();
      expect(launched, [Uri.parse('https://example.com/sale')]);

      await openBannerLink(context, BannerLink.parse('https://example.com/x'), launcher: (_) async => false);
      await tester.pump();
      expect(find.text('Không thể mở liên kết'), findsOneWidget);
      await _unmount(tester);
    });
  });
}
