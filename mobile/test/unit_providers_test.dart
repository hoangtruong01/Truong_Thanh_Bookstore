import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/product_model.dart';
import 'package:mobile/models/address_model.dart';
import 'package:mobile/models/review_model.dart';
import 'package:mobile/models/notification_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/models/promotion_model.dart';
import 'package:mobile/providers/cart_provider.dart';
import 'package:mobile/providers/wishlist_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Mobile Models JSON Parsing & Serialization', () {
    test('ProductModel parses JSON and calculates discount / display price', () {
      final json = {
        '_id': 'prod-001',
        'name': 'Đắc Nhân Tâm',
        'slug': 'dac-nhan-tam-1234',
        'sku': 'BOOK-001',
        'price': 100000,
        'discountPrice': 80000,
        'stock': 15,
        'images': ['https://example.com/image.jpg'],
        'rating': 4.8,
        'sold': 120,
        'isFeatured': true,
        'author': 'Dale Carnegie',
        'publisher': 'NXB Trẻ',
        'isbn': '978-604-1-12345-6',
        'publicationYear': 2023,
      };

      final product = ProductModel.fromJson(json);
      expect(product.id, 'prod-001');
      expect(product.name, 'Đắc Nhân Tâm');
      expect(product.hasDiscount, true);
      expect(product.displayPrice, 80000);
      expect(product.effectivePrice, 80000);
      expect(product.author, 'Dale Carnegie');
      expect(product.publicationYear, 2023);

      final outJson = product.toJson();
      expect(outJson['_id'], 'prod-001');
      expect(outJson['author'], 'Dale Carnegie');
    });

    test('AddressModel parses JSON with Default Invariant', () {
      final json = {
        '_id': 'addr-001',
        'user': 'user-123',
        'label': 'Văn phòng',
        'recipientName': 'Nguyễn Văn A',
        'phone': '0901234567',
        'province': 'TP. Hồ Chí Minh',
        'district': 'Quận 1',
        'ward': 'Phường Bến Nghé',
        'detail': '123 Lê Lợi',
        'isDefault': true,
        'isDeleted': false,
      };

      final address = AddressModel.fromJson(json);
      expect(address.id, 'addr-001');
      expect(address.label, 'Văn phòng');
      expect(address.isDefault, true);
      expect(address.fullAddress, contains('123 Lê Lợi'));
      expect(address.fullAddress, contains('TP. Hồ Chí Minh'));
    });

    test('ReviewModel and RatingBreakdownModel parse correctly', () {
      final reviewJson = {
        '_id': 'rev-001',
        'product': 'prod-001',
        'user': {'_id': 'u1', 'fullName': 'Trần Thị B', 'avatar': 'https://avatar.png'},
        'rating': 5,
        'content': 'Sách rất hay và giao hàng nhanh!',
        'isVerifiedPurchase': true,
        'adminReply': 'Cảm ơn bạn đã ủng hộ Trường Thành Bookstore!',
      };

      final review = ReviewModel.fromJson(reviewJson);
      expect(review.id, 'rev-001');
      expect(review.isVerifiedPurchase, true);
      expect(review.rating, 5);
      expect(review.adminReply, contains('Trường Thành Bookstore'));
      expect(review.user.fullName, 'Trần Thị B');

      final breakdownJson = {
        'total': 20,
        'average': 4.75,
        'counts': {'5': 15, '4': 5, '3': 0, '2': 0, '1': 0},
        'percentages': {'5': 75.0, '4': 25.0, '3': 0.0, '2': 0.0, '1': 0.0},
      };

      final breakdown = RatingBreakdownModel.fromJson(breakdownJson);
      expect(breakdown.total, 20);
      expect(breakdown.average, 4.75);
      expect(breakdown.counts[5], 15);
      expect(breakdown.percentages[5], 75.0);
    });

    test('NotificationModel parses JSON correctly', () {
      final notifJson = {
        '_id': 'notif-001',
        'title': 'Đơn hàng đã được xác nhận',
        'message': 'Đơn hàng TT20260901 của bạn đang được đóng gói',
        'type': 'ORDER',
        'isRead': false,
        'createdAt': '2026-09-01T12:00:00.000Z',
      };

      final notif = NotificationModel.fromJson(notifJson);
      expect(notif.id, 'notif-001');
      expect(notif.type, 'ORDER');
      expect(notif.isRead, false);
      expect(notif.createdAt != null, true);
    });

    test('UserModel and PromotionModel parse correctly', () {
      final userJson = {
        '_id': 'u-001',
        'fullName': 'Admin User',
        'email': 'admin@truongthanh.vn',
        'role': 'ADMIN',
      };
      final user = UserModel.fromJson(userJson);
      expect(user.isAdmin, true);
      expect(user.isCustomer, false);

      final promoJson = {
        '_id': 'p-001',
        'code': 'TRUONGTHANH50',
        'discountType': 'PERCENT',
        'discountValue': 20,
        'minOrderValue': 200000,
        'maxDiscount': 50000,
        'isActive': true,
      };
      final promo = PromotionModel.fromJson(promoJson);
      expect(promo.code, 'TRUONGTHANH50');
      expect(promo.discountValue, 20);
    });
  });

  group('CartProvider Business Logic & 299K Freeship Rule', () {
    test('Cart calculates subtotal, shipping fee and freeship threshold 299K', () {
      final cart = CartProvider();
      final p1 = ProductModel(
        id: 'p1',
        name: 'Vở kẻ ngang 200 trang',
        slug: 'vo-ke-ngang',
        sku: 'VO-001',
        price: 20000,
        discountPrice: 0,
        stock: 50,
        images: [],
        rating: 5,
        sold: 10,
        isFeatured: false,
      );

      // Add 5 items -> Subtotal = 100,000đ (< 299,000đ => Shipping fee = 30,000đ)
      for (int i = 0; i < 5; i++) {
        cart.addToCart(p1);
      }
      expect(cart.totalAmount, 100000);
      expect(cart.shippingFee, 30000);
      expect(cart.isEligibleForFreeShipping, false);
      expect(cart.amountNeededForFreeShipping, 199000);
      expect(cart.finalTotal, 130000);

      // Add 10 more items -> Total 15 items * 20,000 = 300,000đ (>= 299,000đ => Shipping fee = 0đ)
      for (int i = 0; i < 10; i++) {
        cart.addToCart(p1);
      }
      expect(cart.totalAmount, 300000);
      expect(cart.shippingFee, 0);
      expect(cart.isEligibleForFreeShipping, true);
      expect(cart.amountNeededForFreeShipping, 0);
      expect(cart.finalTotal, 300000);
    });
  });

  group('WishlistProvider & NotificationProvider Operations', () {
    test('WishlistProvider toggles favorite state and item count', () {
      final wishlist = WishlistProvider();
      final p1 = ProductModel(
        id: 'p1',
        name: 'Bút bi Thiên Long',
        slug: 'but-bi',
        sku: 'BUT-01',
        price: 5000,
        discountPrice: 0,
        stock: 100,
        images: [],
        rating: 5,
        sold: 100,
        isFeatured: false,
      );

      expect(wishlist.isFavorite('p1'), false);
      expect(wishlist.itemCount, 0);

      wishlist.toggleFavorite(p1);
      expect(wishlist.isFavorite('p1'), true);
      expect(wishlist.itemCount, 1);

      wishlist.toggleFavorite(p1);
      expect(wishlist.isFavorite('p1'), false);
      expect(wishlist.itemCount, 0);
    });
  });
}
