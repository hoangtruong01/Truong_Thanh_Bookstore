import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product_model.dart';

class WishlistProvider with ChangeNotifier {
  final List<ProductModel> _wishlistItems = [];
  final Set<String> _wishlistIds = {};

  List<ProductModel> get wishlistItems => List.unmodifiable(_wishlistItems);

  int get itemCount => _wishlistItems.length;

  WishlistProvider() {
    _loadFromPrefs();
  }

  bool isFavorite(String productId) {
    return _wishlistIds.contains(productId);
  }

  void toggleFavorite(ProductModel product) {
    if (_wishlistIds.contains(product.id)) {
      _wishlistIds.remove(product.id);
      _wishlistItems.removeWhere((item) => item.id == product.id);
    } else {
      _wishlistIds.add(product.id);
      _wishlistItems.add(product);
    }
    _saveToPrefs();
    notifyListeners();
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? wishlistData = prefs.getString('wishlist_products');
      if (wishlistData != null) {
        final List<dynamic> jsonList = json.decode(wishlistData);
        _wishlistItems.clear();
        _wishlistIds.clear();
        for (var item in jsonList) {
          final prod = ProductModel.fromJson(item);
          _wishlistItems.add(prod);
          _wishlistIds.add(prod.id);
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Lỗi tải Wishlist: $e');
    }
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String jsonStr = json.encode(_wishlistItems.map((e) => e.toJson()).toList());
      await prefs.setString('wishlist_products', jsonStr);
    } catch (e) {
      debugPrint('Lỗi lưu Wishlist: $e');
    }
  }
}
