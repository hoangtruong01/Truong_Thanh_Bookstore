import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../models/product_model.dart';

class WishlistProvider with ChangeNotifier {
  final List<ProductModel> _wishlistItems = [];
  final Set<String> _wishlistIds = {};
  bool _isLoading = false;

  List<ProductModel> get wishlistItems => List.unmodifiable(_wishlistItems);
  int get itemCount => _wishlistItems.length;
  bool get isLoading => _isLoading;

  WishlistProvider() {
    _loadFromPrefs();
  }

  bool isFavorite(String productId) {
    return _wishlistIds.contains(productId);
  }

  Future<void> syncWithServer(String? token) async {
    if (token == null || token.isEmpty) return;

    _isLoading = true;
    notifyListeners();

    try {
      final res = await http.get(
        Uri.parse(ApiConstants.wishlist),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        final dynamic data = body['data'] ?? body;
        if (data is List) {
          _wishlistItems.clear();
          _wishlistIds.clear();
          for (var item in data) {
            final prod = ProductModel.fromJson(item);
            _wishlistItems.add(prod);
            _wishlistIds.add(prod.id);
          }
          await _saveToPrefs();
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Lỗi sync Wishlist: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleFavorite(ProductModel product, [String? token]) async {
    final bool isAdding = !_wishlistIds.contains(product.id);

    if (isAdding) {
      _wishlistIds.add(product.id);
      _wishlistItems.add(product);
    } else {
      _wishlistIds.remove(product.id);
      _wishlistItems.removeWhere((item) => item.id == product.id);
    }
    _saveToPrefs();
    notifyListeners();

    if (token != null && token.isNotEmpty) {
      try {
        if (isAdding) {
          await http.post(
            Uri.parse(ApiConstants.toggleWishlist(product.id)),
            headers: {'Authorization': 'Bearer $token'},
          );
        } else {
          await http.delete(
            Uri.parse(ApiConstants.toggleWishlist(product.id)),
            headers: {'Authorization': 'Bearer $token'},
          );
        }
      } catch (e) {
        debugPrint('Lỗi toggle wishlist API: $e');
      }
    }
  }

  Future<bool> moveToCart(String productId, String? token) async {
    _wishlistIds.remove(productId);
    _wishlistItems.removeWhere((item) => item.id == productId);
    _saveToPrefs();
    notifyListeners();

    if (token != null && token.isNotEmpty) {
      try {
        final res = await http.post(
          Uri.parse(ApiConstants.moveToCart(productId)),
          headers: {'Authorization': 'Bearer $token'},
        );
        return res.statusCode == 200 || res.statusCode == 201;
      } catch (e) {
        debugPrint('Lỗi moveToCart API: $e');
      }
    }
    return true;
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
      debugPrint('Lỗi tải Wishlist từ prefs: $e');
    }
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String jsonStr = json.encode(_wishlistItems.map((e) => e.toJson()).toList());
      await prefs.setString('wishlist_products', jsonStr);
    } catch (e) {
      debugPrint('Lỗi lưu Wishlist vào prefs: $e');
    }
  }
}
