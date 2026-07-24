import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/models/product_model.dart';
import 'package:mobile/models/promotion_model.dart';
import 'package:mobile/providers/cart_provider.dart';
import 'package:mobile/providers/auth_provider.dart';

void main() {
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
      expect(find.text('VĂN PHÒNG PHẨM & DỤNG CỤ HỌC TẬP'), findsOneWidget);

      // Verify Bottom Navigation Bar items (Active item has text, others have icons)
      expect(find.text('Trang chủ'), findsOneWidget);
      expect(find.byIcon(Icons.grid_view_outlined), findsOneWidget);
      expect(find.byIcon(Icons.shopping_bag_outlined), findsOneWidget);
      expect(find.byIcon(Icons.receipt_long_outlined), findsOneWidget);
      expect(find.byIcon(Icons.person_outline_rounded), findsOneWidget);
    });

    test('E2E-02: Cart & Pricing Logic E2E (Add, Quantity, Voucher & Free Shipping)', () {
      final cart = CartProvider();

      // 1. Add 100K item
      cart.addToCart(mockProduct1, quantity: 1);
      expect(cart.items.length, 1);
      expect(cart.totalItemCount, 1);
      expect(cart.subtotal, 85000);
      expect(cart.shippingFee, 30000); // 85K < 299K -> ship 30K
      expect(cart.total, 115000);

      // 2. Add 300K item -> total subtotal >= 299K -> Free Shipping
      cart.addToCart(mockProduct2, quantity: 1);
      expect(cart.items.length, 2);
      expect(cart.totalItemCount, 2);
      expect(cart.subtotal, 385000);
      expect(cart.shippingFee, 0); // 385K >= 299K -> Free shipping (0đ)

      // 3. Update quantity
      cart.updateQuantity(mockProduct1.id, 1); // quantity becomes 2
      expect(cart.totalItemCount, 3);
      expect(cart.subtotal, 470000);

      // 4. Clear cart
      cart.clearCart();
      expect(cart.items.length, 0);
      expect(cart.totalItemCount, 0);
      expect(cart.subtotal, 0);
      expect(cart.shippingFee, 0);
      expect(cart.total, 0);
    });

    test('E2E-03: Voucher Application & Discount Logic', () {
      final cart = CartProvider();
      cart.addToCart(mockProduct2, quantity: 1); // subtotal = 300,000đ

      // Active voucher
      final promo = PromotionModel(
        id: 'promo1',
        code: 'TT10',
        name: 'Giảm 10%',
        discountType: 'PERCENT',
        discountValue: 10,
        minOrderValue: 200000,
        status: true,
      );

      // Inject active promos
      cart.activePromotions.add(promo);

      final success = cart.applyCoupon('TT10');
      expect(success, isTrue);
      expect(cart.appliedPromotion, isNotNull);
      expect(cart.discountAmount, 30000); // 10% of 300K = 30K
      expect(cart.total, 270000); // 300K + 0 ship - 30K discount = 270K

      // Remove coupon
      cart.removeCoupon();
      expect(cart.appliedPromotion, isNull);
      expect(cart.discountAmount, 0);
      expect(cart.total, 300000);
    });

    testWidgets('E2E-04: Bottom Navigation Bar Tab Switching Flow', (WidgetTester tester) async {
      await tester.pumpWidget(const TruongThanhApp());
      await tester.pump();

      // Switch to Products Tab
      await tester.tap(find.byIcon(Icons.grid_view_outlined));
      await tester.pumpAndSettle();
      expect(find.text('DANH SÁCH SẢN PHẨM'), findsOneWidget);

      // Switch to Cart Tab
      await tester.tap(find.byIcon(Icons.shopping_bag_outlined));
      await tester.pumpAndSettle();
      expect(find.text('GIỎ HÀNG CỦA BẠN'), findsOneWidget);

      // Switch to Orders Tab
      await tester.tap(find.byIcon(Icons.receipt_long_outlined));
      await tester.pumpAndSettle();
      expect(find.text('ĐƠN HÀNG CỦA TÔI'), findsOneWidget);

      // Switch to Account Tab
      await tester.tap(find.byIcon(Icons.person_outline_rounded));
      await tester.pumpAndSettle();
      expect(find.text('TÀI KHOẢN'), findsOneWidget);
    });

    test('E2E-05: Auth Provider Session Persistence State', () async {
      final auth = AuthProvider();
      expect(auth.isAuthenticated, isFalse);
      expect(auth.user, isNull);
      expect(auth.token, isNull);
    });
  });
}
