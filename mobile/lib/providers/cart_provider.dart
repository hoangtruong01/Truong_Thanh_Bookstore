import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/cart_item_model.dart';
import '../models/product_model.dart';
import '../models/promotion_model.dart';

class CartProvider with ChangeNotifier {
  final List<CartItemModel> _items = [];
  PromotionModel? _appliedPromotion;
  List<PromotionModel> _activePromotions = [];
  String? _promoError;

  List<CartItemModel> get items => _items;
  PromotionModel? get appliedPromotion => _appliedPromotion;
  List<PromotionModel> get activePromotions => _activePromotions;
  String? get promoError => _promoError;

  int get totalItemCount => _items.fold(0, (sum, i) => sum + i.quantity);

  num get subtotal => _items
      .where((i) => i.selected)
      .fold(0, (sum, i) => sum + (i.product.effectivePrice * i.quantity));

  num get shippingFee {
    if (subtotal == 0) return 0;
    return (subtotal >= 299000) ? 0 : 30000;
  }

  num get discountAmount {
    if (_appliedPromotion == null) return 0;
    if (subtotal < _appliedPromotion!.minOrderValue) return 0;

    if (_appliedPromotion!.discountType == 'PERCENT') {
      num disc = (subtotal * _appliedPromotion!.discountValue) / 100;
      if (_appliedPromotion!.maxDiscount != null && _appliedPromotion!.maxDiscount! > 0) {
        disc = disc > _appliedPromotion!.maxDiscount! ? _appliedPromotion!.maxDiscount! : disc;
      }
      return disc;
    } else {
      return _appliedPromotion!.discountValue;
    }
  }

  num get total {
    final t = subtotal + shippingFee - discountAmount;
    return t > 0 ? t : 0;
  }

  void addToCart(ProductModel product, {int quantity = 1}) {
    final index = _items.indexWhere((i) => i.product.id == product.id);
    if (index >= 0) {
      _items[index].quantity += quantity;
    } else {
      _items.add(CartItemModel(product: product, quantity: quantity));
    }
    notifyListeners();
  }

  void updateQuantity(String productId, int delta) {
    final index = _items.indexWhere((i) => i.product.id == productId);
    if (index >= 0) {
      _items[index].quantity += delta;
      if (_items[index].quantity <= 0) {
        _items.removeAt(index);
      }
      notifyListeners();
    }
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    _appliedPromotion = null;
    _promoError = null;
    notifyListeners();
  }

  Future<void> fetchActivePromotions() async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.activePromotions));
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final List dataList = body['data'] ?? [];
        _activePromotions = dataList.map((item) => PromotionModel.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching promotions: $e');
    }
  }

  bool applyCoupon(String code) {
    _promoError = null;
    final codeUpper = code.trim().toUpperCase();
    final promo = _activePromotions.firstWhere(
      (p) => p.code.toUpperCase() == codeUpper,
      orElse: () => PromotionModel(
        id: '', code: '', name: '', discountType: 'PERCENT', discountValue: 0, minOrderValue: 0, status: false
      ),
    );

    if (promo.id.isEmpty) {
      _promoError = 'Mã giảm giá không tồn tại';
      notifyListeners();
      return false;
    }

    if (subtotal < promo.minOrderValue) {
      _promoError = 'Đơn hàng chưa đạt giá trị tối thiểu ${promo.minOrderValue}đ';
      notifyListeners();
      return false;
    }

    _appliedPromotion = promo;
    notifyListeners();
    return true;
  }

  void removeCoupon() {
    _appliedPromotion = null;
    _promoError = null;
    notifyListeners();
  }
}
