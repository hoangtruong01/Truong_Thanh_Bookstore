import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/main.dart';
import 'package:mobile/models/product_model.dart';
import 'package:mobile/providers/cart_provider.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/core/widgets/glass_bottom_navigation.dart';

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));
  final mockProduct1 = ProductModel(
    id: 'prod1',
    name: 'Bút bi Thiên Long TL-027',
    slug: 'but-bi-tl-027',
    sku: 'TL-027',
    description: 'Bút bi cao cấp',
    price: 100000,
    discountPrice: 85000,
    stock: 20,
    images: [],
    rating: 5.0,
    sold: 10,
    isFeatured: true,
  );

  final mockProduct2 = ProductModel(
    id: 'prod2',
    name: 'Sổ tay bìa da A5',
    slug: 'so-tay-a5',
    sku: 'ST-A5',
    description: 'Sổ tay cao cấp',
    price: 300000,
    discountPrice: 0,
    stock: 5,
    images: [],
    rating: 4.8,
    sold: 5,
    isFeatured: false,
  );

  group('TRƯỜNG THÀNH MOBILE — END-TO-END (E2E) INTEGRATION TEST SUITE', () {
    testWidgets('E2E-01: App Launch & Home Screen Navigation Rendering', (WidgetTester tester) async {
      await tester.pumpWidget(const TruongThanhApp());
      await tester.pump();

      // Verify Header Brand Title
      expect(find.text('TRƯỜNG THÀNH'), findsOneWidget);
      expect(find.text('STATIONERY'), findsOneWidget);

      // Verify Bottom Navigation Bar items (Liquid Glass Nav Bar icons)
      expect(
        find.descendant(
          of: find.byType(LiquidGlassBottomNav),
          matching: find.byIcon(Icons.home_rounded),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: find.byType(LiquidGlassBottomNav),
          matching: find.byIcon(Icons.grid_view_outlined),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: find.byType(LiquidGlassBottomNav),
          matching: find.byIcon(Icons.shopping_bag_outlined),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: find.byType(LiquidGlassBottomNav),
          matching: find.byIcon(Icons.receipt_long_outlined),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: find.byType(LiquidGlassBottomNav),
          matching: find.byIcon(Icons.person_outline_rounded),
        ),
        findsOneWidget,
      );
    });

    // Plays the backend checkout-preview: the server prices lines from its own catalogue
    // and validates vouchers; the app only displays the response.
    MockClient fakePreviewServer(List<Map<String, dynamic>> bodies) => MockClient((request) async {
          expect(request.url.path, '/api/orders/checkout-preview');
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          bodies.add(body);
          const prices = {'prod1': 85000, 'prod2': 300000};
          final subtotal = (body['items'] as List)
              .fold<int>(0, (sum, i) => sum + prices[i['product']]! * (i['quantity'] as int));
          final shipping = subtotal >= 299000 ? 0 : 30000;
          final code = body['promotionCode'];
          final discount = code == 'TT10' ? subtotal ~/ 10 : 0;
          return http.Response(jsonEncode({'data': {
            'items': [], 'subtotal': subtotal, 'shippingFee': shipping,
            'isEligibleForFreeShipping': shipping == 0, 'amountNeededForFreeShipping': 0,
            'discount': discount,
            'appliedPromotion': code == 'TT10' ? {'code': 'TT10', 'discount': discount} : null,
            'promotionError': code != null && code != 'TT10' ? 'Mã giảm giá không tồn tại' : null,
            'loyaltyDiscount': 0, 'total': subtotal + shipping - discount,
            'warnings': [], 'isValidForCheckout': true,
          }}), 200, headers: {'content-type': 'application/json; charset=utf-8'});
        });

    test('E2E-02: Cart lines are local, totals come from the server preview', () async {
      final bodies = <Map<String, dynamic>>[];
      final client = fakePreviewServer(bodies);
      final cart = CartProvider(client: client, pricingDebounce: Duration.zero);

      // 1. Add an 85K item
      cart.addToCart(mockProduct1, quantity: 1);
      expect(cart.items.length, 1);
      expect(cart.totalItemCount, 1);
      await cart.refreshPricing(immediate: true);
      expect(bodies.last['items'], [{'product': 'prod1', 'quantity': 1}]);
      expect(cart.subtotal, 85000);
      expect(cart.shippingFee, 30000);
      expect(cart.total, 115000);

      // 2. Add a 300K item -> the server grants free shipping
      cart.addToCart(mockProduct2, quantity: 1);
      expect(cart.totalItemCount, 2);
      await cart.refreshPricing(immediate: true);
      expect(cart.subtotal, 385000);
      expect(cart.shippingFee, 0);

      // 3. Quantity changes are capped at stock (prod2 has 5)
      cart.updateQuantity(mockProduct1.id, 1);
      cart.updateQuantity(mockProduct2.id, 10);
      expect(cart.items.firstWhere((i) => i.product.id == 'prod2').quantity, 5);
      await cart.refreshPricing(immediate: true);
      expect(cart.subtotal, 1670000);

      // 4. Clear cart -> no selection, no pricing
      cart.clearCart();
      expect(cart.items.length, 0);
      expect(cart.totalItemCount, 0);
      expect(cart.pricing, isNull);
      expect(cart.total, 0);
      cart.dispose();
      client.close();
    });

    test('E2E-03: Voucher is validated and priced by the server', () async {
      final bodies = <Map<String, dynamic>>[];
      final client = fakePreviewServer(bodies);
      final cart = CartProvider(client: client, pricingDebounce: Duration.zero);
      cart.addToCart(mockProduct2, quantity: 1);

      expect(await cart.applyCoupon('tt10'), isTrue);
      expect(bodies.last['promotionCode'], 'TT10');
      expect(cart.appliedPromotion?.code, 'TT10');
      expect(cart.discountAmount, 30000);
      expect(cart.total, 270000);

      await cart.removeCoupon();
      expect(bodies.last.containsKey('promotionCode'), isFalse);
      expect(cart.appliedPromotion, isNull);
      expect(cart.discountAmount, 0);
      expect(cart.total, 300000);

      // A code the server rejects is dropped with the server's message.
      expect(await cart.applyCoupon('FAKE'), isFalse);
      expect(cart.promoError, 'Mã giảm giá không tồn tại');
      expect(cart.promotionCode, isEmpty);
      cart.dispose();
      client.close();
    });

    testWidgets('E2E-04: Bottom Navigation Bar Tab Switching Flow', (WidgetTester tester) async {
      await tester.pumpWidget(const TruongThanhApp());
      await tester.pump();

      // Switch to Products Tab
      await tester.tap(find.descendant(
        of: find.byType(LiquidGlassBottomNav),
        matching: find.byIcon(Icons.grid_view_outlined),
      ));
      await tester.pumpAndSettle();
      expect(find.text('Danh sách sản phẩm'), findsOneWidget);

      // Switch to Cart Tab
      await tester.tap(find.descendant(
        of: find.byType(LiquidGlassBottomNav),
        matching: find.byIcon(Icons.shopping_bag_outlined),
      ));
      await tester.pumpAndSettle();
      expect(find.text('Giỏ hàng của bạn'), findsOneWidget);

      // Switch to Orders Tab
      await tester.tap(find.descendant(
        of: find.byType(LiquidGlassBottomNav),
        matching: find.byIcon(Icons.receipt_long_outlined),
      ));
      await tester.pumpAndSettle();
      expect(find.text('Đơn hàng của tôi'), findsOneWidget);

      // Switch to Account Tab
      await tester.tap(find.descendant(
        of: find.byType(LiquidGlassBottomNav),
        matching: find.byIcon(Icons.person_outline_rounded),
      ));
      await tester.pumpAndSettle();
      expect(find.widgetWithText(AppBar, 'Tài khoản'), findsOneWidget);
    });

    test('E2E-05: Auth Provider Session Persistence State', () async {
      final auth = AuthProvider();
      expect(auth.isAuthenticated, isFalse);
      expect(auth.user, isNull);
      expect(auth.token, isNull);
    });
  });
}
