import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/product_model.dart';

class WishlistProvider with ChangeNotifier {
  WishlistProvider({ApiClient? apiClient, http.Client? client})
      : _api = apiClient ?? ApiClient(httpClient: client),
        _ownsApi = apiClient == null {
    _loadFromPrefs();
  }

  final ApiClient _api;
  final bool _ownsApi;

  @override
  void dispose() {
    if (_ownsApi) _api.close();
    super.dispose();
  }

  final List<ProductModel> _wishlistItems = [];
  final Set<String> _wishlistIds = {};
  // Likes made as a guest; pushed to the server on the next authenticated sync.
  final Set<String> _pendingIds = {};
  final Set<String> _togglingIds = {};
  // Sequence number of each id's latest local toggle, so a sync never overwrites
  // a change the user made after its GET was sent.
  final Map<String, int> _lastToggleSeq = {};
  int _toggleSeq = 0;
  bool _isLoading = false;

  List<ProductModel> get wishlistItems => List.unmodifiable(_wishlistItems);
  int get itemCount => _wishlistItems.length;
  bool get isLoading => _isLoading;

  bool isFavorite(String productId) {
    return _wishlistIds.contains(productId);
  }

  bool isToggling(String productId) => _togglingIds.contains(productId);

  void _markToggled(String productId) => _lastToggleSeq[productId] = ++_toggleSeq;

  Future<void> syncWithServer(String? token) async {
    if (token == null || token.isEmpty) return;

    _isLoading = true;
    notifyListeners();
    final int syncStartSeq = _toggleSeq;

    try {
      final res = await _api.get(ApiConstants.wishlist, token: token);

      if (res.statusCode == 200) {
        final dynamic data = res.data;
        // Backend returns { products, ids, total }; older builds returned a bare list.
        final dynamic list = data is Map ? data['products'] : data;
        if (list is List) {
          final serverItems = list.map((item) => ProductModel.fromJson(item)).toList();
          final serverIds = serverItems.map((p) => p.id).toSet();

          // Merge guest likes instead of silently dropping them.
          for (final id in _pendingIds.toList()) {
            final local = _wishlistItems.where((p) => p.id == id).toList();
            if (serverIds.contains(id) || local.isEmpty) {
              _pendingIds.remove(id);
              continue;
            }
            final added = await _addOnServer(id, token);
            // null = network/server error: keep it pending and visible for the next sync.
            if (added != null) _pendingIds.remove(id);
            if (added != false && serverIds.add(id)) serverItems.add(local.first);
          }

          // The snapshot may predate toggles still in flight or made since the GET:
          // keep the current local state for those ids.
          final touched = {
            ..._togglingIds,
            ..._lastToggleSeq.keys.where((id) => _lastToggleSeq[id]! > syncStartSeq),
          };
          for (final id in touched) {
            if (_wishlistIds.contains(id)) {
              if (serverIds.add(id)) serverItems.add(_wishlistItems.firstWhere((p) => p.id == id));
            } else if (serverIds.remove(id)) {
              serverItems.removeWhere((p) => p.id == id);
            }
          }

          _wishlistItems
            ..clear()
            ..addAll(serverItems);
          _wishlistIds
            ..clear()
            ..addAll(serverIds);
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

  /// Guests (no token) keep a local-only wishlist. With a token the server is
  /// updated and the optimistic local change is rolled back on failure (returns false).
  /// Returns null when ignored because a request for this product is still in flight.
  Future<bool?> toggleFavorite(ProductModel product, [String? token]) async {
    if (_togglingIds.contains(product.id)) return null;
    final bool isAdding = !_wishlistIds.contains(product.id);
    final bool isAuth = token != null && token.isNotEmpty;

    _setLocal(product, isAdding);
    _markToggled(product.id);
    if (!isAuth && isAdding) {
      _pendingIds.add(product.id);
    } else {
      _pendingIds.remove(product.id);
    }
    _saveToPrefs();
    notifyListeners();

    if (!isAuth) return true;

    _togglingIds.add(product.id);
    try {
      bool ok;
      if (isAdding) {
        ok = await _addOnServer(product.id, token) == true;
      } else {
        final res = await _api.delete(ApiConstants.toggleWishlist(product.id), token: token);
        ok = res.statusCode == 200 || res.statusCode == 201;
      }
      if (ok) return true;
    } catch (e) {
      debugPrint('Lỗi toggle wishlist API: $e');
    } finally {
      _togglingIds.remove(product.id);
      _markToggled(product.id);
    }

    // Server rejected or unreachable: revert so the UI matches the server.
    _setLocal(product, !isAdding);
    _saveToPrefs();
    notifyListeners();
    return false;
  }

  /// POST /users/wishlist/:id is a server-side toggle: if the product was already
  /// liked on the server (stale local cache) the first call removes it, so a second
  /// call restores the intended liked state.
  /// Returns true when liked on the server, false when the server rejects the
  /// product (400 invalid / 404 missing), null on transient errors (401, 403, 429,
  /// 5xx, network) so a pending guest like is retried on the next sync.
  Future<bool?> _addOnServer(String productId, String token) async {
    try {
      for (var attempt = 0; attempt < 2; attempt++) {
        final res = await _api.post(ApiConstants.toggleWishlist(productId), token: token);
        if (res.statusCode != 200 && res.statusCode != 201) {
          return res.statusCode == 400 || res.statusCode == 404 ? false : null;
        }
        final dynamic data = res.body is Map ? res.data : null;
        if (data is! Map || data['isInWishlist'] != false) return true;
      }
    } catch (e) {
      debugPrint('Lỗi thêm wishlist API: $e');
    }
    return null;
  }

  void _setLocal(ProductModel product, bool liked) {
    if (liked) {
      if (_wishlistIds.add(product.id)) _wishlistItems.add(product);
    } else {
      _wishlistIds.remove(product.id);
      _wishlistItems.removeWhere((item) => item.id == product.id);
    }
  }

  Future<bool> moveToCart(String productId, String? token) async {
    _wishlistIds.remove(productId);
    _wishlistItems.removeWhere((item) => item.id == productId);
    _pendingIds.remove(productId);
    _saveToPrefs();
    notifyListeners();

    if (token != null && token.isNotEmpty) {
      try {
        final res = await _api.post(ApiConstants.moveToCart(productId), token: token);
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
        _pendingIds
          ..addAll(prefs.getStringList('wishlist_pending_ids') ?? [])
          ..retainWhere(_wishlistIds.contains);
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
      // Pending ids first, so a concurrent _loadFromPrefs never sees products without them.
      await prefs.setStringList('wishlist_pending_ids', _pendingIds.toList());
      await prefs.setString('wishlist_products', jsonStr);
    } catch (e) {
      debugPrint('Lỗi lưu Wishlist vào prefs: $e');
    }
  }
}
