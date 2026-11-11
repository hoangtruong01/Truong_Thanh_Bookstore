import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/cart_item_model.dart';
import '../models/checkout_preview_model.dart';
import '../models/product_model.dart';
import '../models/promotion_model.dart';

/// Where the cart line list is kept on the device (guests and signed-in users alike).
abstract class CartStorage {
  Future<String?> read();
  Future<void> write(String value);
}

class SharedPreferencesCartStorage implements CartStorage {
  const SharedPreferencesCartStorage();

  static const String key = 'cart_items_v1';

  @override
  Future<String?> read() async => (await SharedPreferences.getInstance()).getString(key);

  @override
  Future<void> write(String value) async =>
      (await SharedPreferences.getInstance()).setString(key, value);
}

/// checkout-preview answered 400/422: the request itself is invalid (not a transient error).
class _PricingRejected implements Exception {
  const _PricingRejected(this.message);
  final String message;

  @override
  String toString() => 'checkout-preview rejected: $message';
}

/// Result of the pre-checkout server validation (same contract as the web cart store).
class CartCheckoutValidation {
  final bool isValidForCheckout;
  final List<String> warnings;
  final String? error;

  const CartCheckoutValidation({required this.isValidForCheckout, this.warnings = const [], this.error});
}

/// Cart state. Money is never computed here: subtotal, shipping, discounts and total come
/// from `POST /orders/checkout-preview`. The provider keeps the line list (persisted locally,
/// mirrored to `/cart` for signed-in users) and the latest server pricing of the selected lines.
class CartProvider with ChangeNotifier {
  CartProvider({
    ApiClient? apiClient,
    http.Client? client,
    CartStorage? storage,
    this.pricingDebounce = const Duration(milliseconds: 400),
    this.syncDebounce = const Duration(milliseconds: 800),
    bool restoreFromStorage = true,
  })  : _api = apiClient ?? ApiClient(httpClient: client),
        _ownsApi = apiClient == null,
        _storage = storage ?? const SharedPreferencesCartStorage() {
    _restored = restoreFromStorage ? _restoreLocal() : Future<void>.value();
  }

  static const String pricingErrorMessage = 'Không thể cập nhật giá. Vui lòng thử lại sau giây lát.';
  static const String promoRejectedMessage = 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.';

  final ApiClient _api;
  final bool _ownsApi;
  final CartStorage _storage;
  final Duration pricingDebounce;
  final Duration syncDebounce;
  late final Future<void> _restored;
  bool _disposed = false;

  /// Completes once the locally persisted cart has been loaded.
  Future<void> get restored => _restored;

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _pricingTimer?.cancel();
    _syncTimer?.cancel();
    _settleWaiters(null);
    if (_ownsApi) _api.close();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Line items
  // ---------------------------------------------------------------------------
  final List<CartItemModel> _items = [];
  int _localGeneration = 0;

  List<CartItemModel> get items => UnmodifiableListView(_items);
  List<CartItemModel> get selectedItems => _items.where((i) => i.selected).toList();
  bool get hasSelection => _items.any((i) => i.selected);
  bool get isAllSelected => _items.isNotEmpty && _items.every((i) => i.selected);
  int get totalItemCount => _items.fold(0, (sum, i) => sum + i.quantity);

  /// Identity of what is priced: selected product ids and quantities.
  String get selectionKey => selectedItems.map((i) => '${i.product.id}:${i.quantity}').join(',');

  CartItemModel? itemFor(String productId) {
    for (final item in _items) {
      if (item.product.id == productId) return item;
    }
    return null;
  }

  void addToCart(ProductModel product, {int quantity = 1}) {
    if (product.stock <= 0 || quantity <= 0) return;
    final existing = itemFor(product.id);
    if (existing != null) {
      final newQty = existing.quantity + quantity;
      existing.product = product;
      existing.quantity = newQty > product.stock ? product.stock : newQty;
      existing.selected = true;
    } else {
      _items.add(CartItemModel(product: product, quantity: quantity > product.stock ? product.stock : quantity));
    }
    _onItemsChanged();
  }

  /// Changes a line by [delta]; the result is capped at the known stock and removed at 0.
  void updateQuantity(String productId, int delta) {
    final item = itemFor(productId);
    if (item == null) return;
    setQuantity(productId, item.quantity + delta);
  }

  void setQuantity(String productId, int quantity) {
    final item = itemFor(productId);
    if (item == null) return;
    if (quantity <= 0) {
      _items.remove(item);
    } else {
      final stock = item.product.stock;
      item.quantity = stock > 0 && quantity > stock ? stock : quantity;
    }
    _onItemsChanged();
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    _onItemsChanged();
  }

  void removeSelectedItems() {
    _items.removeWhere((i) => i.selected);
    _onItemsChanged();
  }

  void toggleItemSelection(String productId) {
    final item = itemFor(productId);
    if (item == null) return;
    item.selected = !item.selected;
    _onItemsChanged();
  }

  void toggleAllSelection(bool selected) {
    for (final item in _items) {
      item.selected = selected;
    }
    _onItemsChanged();
  }

  /// Removes the items that were just ordered (selected ones) and keeps the rest.
  void removeOrderedItems() {
    _items.removeWhere((i) => i.selected);
    // The voucher was consumed by the order that was just placed.
    _promotionCode = '';
    _promoError = null;
    _resetPricing();
    _onItemsChanged(reprice: false);
  }

  void clearCart() {
    _items.clear();
    _promotionCode = '';
    _promoError = null;
    _resetPricing();
    _onItemsChanged(reprice: false);
  }

  void _onItemsChanged({bool reprice = true}) {
    _localGeneration++;
    // Lines edited while signed out are a guest cart: they are merged (not replaced)
    // into the account cart at the next sign-in.
    if (!_isAuthenticated) _accountOwned = false;
    notifyListeners();
    _saveLocal();
    _scheduleServerPush();
    if (reprice && _pricingActive && selectionKey != _requestedSelectionKey) {
      unawaited(refreshPricing());
    }
  }

  // ---------------------------------------------------------------------------
  // Local persistence
  // ---------------------------------------------------------------------------
  Future<void> _restoreLocal() async {
    try {
      final raw = await _storage.read();
      if (raw == null || raw.isEmpty || _disposed) return;
      final decoded = jsonDecode(raw);
      final List<dynamic> entries;
      final bool restoredAccountOwned;
      if (decoded is Map && decoded['items'] is List) {
        entries = decoded['items'] as List;
        restoredAccountOwned = decoded['accountOwned'] == true;
      } else if (decoded is List) {
        // Legacy shape (bare list): treated as the account's copy, so a restored session
        // pulls the server cart instead of adding these quantities on top of it.
        entries = decoded;
        restoredAccountOwned = true;
      } else {
        return;
      }
      if (_items.isEmpty) _accountOwned = restoredAccountOwned;
      var added = false;
      for (final entry in entries) {
        final item = CartItemModel.tryFromJson(entry);
        // Lines added before the cache finished loading win over the cached copy.
        if (item != null && itemFor(item.product.id) == null) {
          _items.add(item);
          added = true;
        }
      }
      if (added) {
        notifyListeners();
        if (_pricingActive) unawaited(refreshPricing());
      }
    } catch (e) {
      debugPrint('Cart restore skipped: $e');
    }
  }

  void _saveLocal() {
    final payload = jsonEncode({
      'accountOwned': _accountOwned,
      'items': _items.map((i) => i.toJson()).toList(),
    });
    unawaited(_storage.write(payload).catchError((Object e) {
      debugPrint('Cart save skipped: $e');
    }));
  }

  // ---------------------------------------------------------------------------
  // Server cart (signed-in users).
  // - Sign-in with a guest cart: POST /cart/sync {mode: merge}, then GET /cart.
  // - Restored session (cart already belongs to the account): GET /cart only.
  // - Edits while signed in: POST /cart/sync {mode: replace} (debounced).
  // - Sign-out: the local copy is cleared so the next account never sees it.
  // ---------------------------------------------------------------------------
  bool _isAuthenticated = false;
  Timer? _syncTimer;
  Future<void> _syncChain = Future<void>.value();

  bool _serverSyncing = false;

  /// True when the local lines are the signed-in account's copy (pulled from or pushed to
  /// `/cart`); false for a guest cart that still has to be merged into the account.
  bool _accountOwned = false;

  /// A pull failed after the guest lines were merged: the next push re-reads the server first.
  bool _pullPending = false;

  bool get isAuthenticated => _isAuthenticated;

  /// True while the account cart is being merged in (login / app start).
  bool get serverSyncing => _serverSyncing;

  /// Called by the provider tree whenever the session changes. Signing in (or restoring
  /// a stored session at app start) syncs the cart with the account; signing out clears
  /// the device copy (the account cart stays on the server).
  void bindAuth({required bool isAuthenticated}) {
    if (isAuthenticated == _isAuthenticated) return;
    final signedOut = _isAuthenticated && !isAuthenticated;
    _isAuthenticated = isAuthenticated;
    if (!isAuthenticated) {
      _syncTimer?.cancel();
      _syncTimer = null;
      _pullPending = false;
    }
    if (signedOut) {
      _items.clear();
      _promotionCode = '';
      _promoError = null;
      _resetPricing();
      _localGeneration++;
      _accountOwned = false;
      _saveLocal();
      // Deferred: this runs while the provider tree builds.
      scheduleMicrotask(notifyListeners);
    }
    // Deferred: this runs while the provider tree builds.
    scheduleMicrotask(() {
      if (_disposed) return;
      if (_isAuthenticated) unawaited(syncWithServer());
      // Loyalty is only priced for signed-in users.
      if (_pricingActive) unawaited(refreshPricing());
    });
  }

  /// Mirrors the local list to the account cart, then adopts the server copy
  /// (stock-capped, deleted products dropped). Server money fields are ignored.
  Future<void> syncWithServer() {
    _syncTimer?.cancel();
    _syncTimer = null;
    return _enqueueSync(_syncNow);
  }

  Future<void> _enqueueSync(Future<void> Function() task) {
    final next = _syncChain.then((_) => task()).catchError((Object e) {
      debugPrint('Cart sync failed: $e');
    });
    _syncChain = next;
    return next;
  }

  List<Map<String, dynamic>> _syncPayload() =>
      _items.map((i) => {'productId': i.product.id, 'quantity': i.quantity}).toList();

  Future<void> _syncNow() async {
    await _restored;
    if (!_isAuthenticated || _disposed) return;
    _serverSyncing = true;
    notifyListeners();
    try {
      await _pullFromServer();
    } finally {
      _serverSyncing = false;
      notifyListeners();
    }
  }

  Future<void> _pullFromServer() async {
    var generation = _localGeneration;
    if (_items.isNotEmpty && !_accountOwned) {
      // A guest cart joins the account cart once ('merge' adds quantities); a cart that
      // already belongs to the account is never pushed back on top of newer server data.
      final pushed = await _api.post(ApiConstants.cartSync,
          authenticated: true, body: {'items': _syncPayload(), 'mode': 'merge'});
      if (!pushed.isSuccess || !_isAuthenticated || _disposed) return;
      _accountOwned = true;
      _pullPending = true;
      _saveLocal();
      generation = _localGeneration;
    }
    final response = await _api.get(ApiConstants.cart, authenticated: true);
    if (!response.isSuccess || !_isAuthenticated || _disposed) return;
    _pullPending = false;
    _accountOwned = true;
    final serverItems = _parseServerItems(response);
    if (generation != _localGeneration) {
      // The user edited the cart meanwhile: keep the local lines, add the server-only
      // ones, then push the result.
      final known = _items.map((i) => i.product.id).toSet();
      _items.addAll(serverItems.where((i) => !known.contains(i.product.id)));
      notifyListeners();
      _saveLocal();
      _scheduleServerPush();
      return;
    }
    _items
      ..clear()
      ..addAll(serverItems);
    notifyListeners();
    _saveLocal();
    if (_pricingActive && selectionKey != _requestedSelectionKey) unawaited(refreshPricing());
  }

  List<CartItemModel> _parseServerItems(ApiResponse response) {
    final previous = {for (final i in _items) i.product.id: i};
    final serverItems = <CartItemModel>[];
    for (final line in response.listData(const ['items']).whereType<Map>()) {
      final rawProduct = line['product'];
      final quantity = line['quantity'] is num ? (line['quantity'] as num).toInt() : 0;
      if (quantity <= 0) continue;
      ProductModel? product;
      if (rawProduct is Map) {
        product = ProductModel.fromJson(Map<String, dynamic>.from(rawProduct));
      } else if (rawProduct != null) {
        product = previous['$rawProduct']?.product;
      }
      if (product == null || product.id.isEmpty) continue;
      serverItems.add(CartItemModel(
        product: product,
        quantity: quantity,
        selected: previous[product.id]?.selected ?? true,
      ));
    }
    return serverItems;
  }

  void _scheduleServerPush() {
    if (!_isAuthenticated) return;
    _syncTimer?.cancel();
    _syncTimer = Timer(syncDebounce, () {
      _syncTimer = null;
      unawaited(_enqueueSync(_pushNow));
    });
  }

  Future<void> _pushNow() async {
    if (!_isAuthenticated || _disposed) return;
    if (!_accountOwned) {
      // The guest lines were never merged (the sign-in sync failed): merge, never replace.
      await _pullFromServer();
      return;
    }
    if (_pullPending) {
      // The account cart was merged but never read back: read it before replacing it,
      // otherwise lines that only exist on the server would be wiped.
      final response = await _api.get(ApiConstants.cart, authenticated: true);
      if (!response.isSuccess || !_isAuthenticated || _disposed) return;
      _pullPending = false;
      final known = _items.map((i) => i.product.id).toSet();
      final serverOnly = _parseServerItems(response).where((i) => !known.contains(i.product.id)).toList();
      if (serverOnly.isNotEmpty) {
        _items.addAll(serverOnly);
        notifyListeners();
        _saveLocal();
      }
    }
    if (_items.isEmpty) {
      await _api.delete(ApiConstants.cart, authenticated: true);
    } else {
      await _api.post(ApiConstants.cartSync,
          authenticated: true, body: {'items': _syncPayload(), 'mode': 'replace'});
    }
  }

  // ---------------------------------------------------------------------------
  // Server pricing (checkout-preview): debounced, latest request wins
  // ---------------------------------------------------------------------------
  CheckoutPreview? _pricing;
  PricingPolicy? _pricingPolicy;
  bool _pricingLoading = false;
  String? _pricingError;
  List<String> _warnings = const [];
  PricingContext _pricingContext = const PricingContext();
  String _promotionCode = '';
  String? _promoError;
  bool _pricingActive = false;
  String? _requestedSelectionKey;
  Timer? _pricingTimer;
  int _pricingSeq = 0;
  List<Completer<CheckoutPreview?>> _waiters = [];

  CheckoutPreview? get pricing => _pricing;
  bool get pricingLoading => _pricingLoading;
  String? get pricingError => _pricingError;
  List<String> get warnings => _warnings;
  PricingContext get pricingContext => _pricingContext;
  String get promotionCode => _promotionCode;
  String? get promoError => _promoError;
  PricingPolicy? get pricingPolicy => _pricingPolicy;

  // Plain views over the server response (0 until a preview has loaded).
  num get subtotal => _pricing?.subtotal ?? 0;
  num get shippingFee => _pricing?.shippingFee ?? 0;
  num get discountAmount => _pricing?.discount ?? 0;
  num get loyaltyDiscount => _pricing?.loyaltyDiscount ?? 0;
  num get total => _pricing?.total ?? 0;
  bool get isFreeShipping => _pricing?.isEligibleForFreeShipping ?? false;
  num get amountNeededForFreeShipping => _pricing?.amountNeededForFreeShipping ?? 0;

  /// 0..1 for progress bars (the server sends 0..100).
  double get freeShippingProgress =>
      ((_pricing?.freeShippingProgress ?? 0) / 100).clamp(0.0, 1.0).toDouble();
  num? get freeShippingThreshold =>
      _pricing?.freeShippingThreshold ?? _pricingPolicy?.freeShippingThreshold;
  num? get standardShippingFee => _pricing?.standardShippingFee ?? _pricingPolicy?.shippingFee;
  AppliedPromotion? get appliedPromotion => _pricing?.appliedPromotion;
  CheckoutPreviewLoyalty? get loyalty => _pricing?.loyalty;
  List<CheckoutPreviewUnavailableItem> get unavailableItems => _pricing?.unavailableItems ?? const [];
  bool get isValidForCheckout =>
      _pricing != null && _pricing!.isValidForCheckout && _pricingError == null;

  /// Pricing is ready to order from: loaded, current and without error.
  bool get isPricingReady => _pricing != null && !_pricingLoading && _pricingError == null;

  CheckoutPreviewItem? previewItem(String productId) => _pricing?.itemFor(productId);

  /// Unit price to show on a line: the server preview price once loaded, the cached
  /// product snapshot before that (labelled as provisional by the screens).
  ({num price, num originalPrice, bool fromServer}) unitPrice(CartItemModel item) {
    final line = previewItem(item.product.id);
    if (line != null) return (price: line.price, originalPrice: line.originalPrice, fromServer: true);
    return (price: item.product.effectivePrice, originalPrice: item.product.price, fromServer: false);
  }

  /// Asks the backend to price the selected lines. Calls are debounced ([pricingDebounce])
  /// and only the latest response is applied. Passing [context] replaces the stored
  /// checkout context; omitting it reuses the previous one. Resolves with the applied
  /// response, or null on error / empty selection.
  Future<CheckoutPreview?> refreshPricing({PricingContext? context, bool immediate = false}) {
    if (_disposed) return Future<CheckoutPreview?>.value(null);
    _pricingActive = true;
    if (context != null) _pricingContext = context;
    _pricingTimer?.cancel();
    _pricingTimer = null;
    final completer = Completer<CheckoutPreview?>();
    _waiters.add(completer);
    _requestedSelectionKey = selectionKey;
    if (!hasSelection) {
      _pricingSeq++;
      _pricing = null;
      _pricingError = null;
      _warnings = const [];
      _pricingLoading = false;
      _settleWaiters(null);
      notifyListeners();
      return completer.future;
    }
    _pricingLoading = true;
    notifyListeners();
    if (immediate || pricingDebounce == Duration.zero) {
      unawaited(_runPricing());
    } else {
      _pricingTimer = Timer(pricingDebounce, () {
        _pricingTimer = null;
        unawaited(_runPricing());
      });
    }
    return completer.future;
  }

  Map<String, dynamic> _previewBody() => {
        // Only selected lines, and never a client price: the backend reads prices from the DB.
        'items': selectedItems.map((i) => {'product': i.product.id, 'quantity': i.quantity}).toList(),
        if (_promotionCode.isNotEmpty) 'promotionCode': _promotionCode,
        ..._pricingContext.toJson(),
      };

  Future<void> _runPricing() async {
    final seq = ++_pricingSeq;
    bool isLatest() => seq == _pricingSeq && _pricingTimer == null && !_disposed;
    if (!hasSelection) {
      _pricing = null;
      _pricingError = null;
      _warnings = const [];
      _pricingLoading = false;
      _settleWaiters(null);
      notifyListeners();
      return;
    }
    try {
      final response = await _api.post(ApiConstants.checkoutPreview,
          body: _previewBody(), authenticated: _isAuthenticated);
      if (!isLatest()) return;
      final rejected = response.statusCode == 400 || response.statusCode == 422;
      final serverMessage = response.message?.trim() ?? '';
      if (rejected && serverMessage.isNotEmpty) {
        // Validation errors (phone format, too many lines, quantity...) will not go away
        // by retrying, so the backend's reason is shown instead of the generic text.
        throw _PricingRejected(serverMessage);
      }
      final data = response.isSuccess ? CheckoutPreview.tryParse(response.data) : null;
      if (data == null) throw StateError('Invalid checkout-preview response (${response.statusCode})');

      _pricing = data;
      _pricingError = null;
      _warnings = data.warnings;
      _syncSnapshotsFromPreview(data);

      final rejectedCode = _promotionCode.isNotEmpty && data.appliedPromotion == null;
      if (rejectedCode) {
        // The voucher no longer applies: drop it and re-price without it so the summary
        // and isValidForCheckout reflect the real order.
        _promoError = data.promotionError ?? promoRejectedMessage;
        _promotionCode = '';
      }
      _settleWaiters(data);
      if (rejectedCode) unawaited(refreshPricing(immediate: true));
    } catch (e) {
      if (!isLatest()) return;
      // Keep the last good numbers on screen, flagged so checkout stays blocked.
      debugPrint('Checkout preview failed: $e');
      _pricingError = e is _PricingRejected ? e.message : pricingErrorMessage;
      _settleWaiters(null);
    } finally {
      if (seq == _pricingSeq && _pricingTimer == null) _pricingLoading = false;
      notifyListeners();
    }
  }

  void _settleWaiters(CheckoutPreview? result) {
    final pending = _waiters;
    _waiters = [];
    for (final waiter in pending) {
      if (!waiter.isCompleted) waiter.complete(result);
    }
  }

  void _resetPricing() {
    _pricingTimer?.cancel();
    _pricingTimer = null;
    _pricingSeq++;
    _settleWaiters(null);
    _pricing = null;
    _pricingLoading = false;
    _pricingError = null;
    _warnings = const [];
    _requestedSelectionKey = null;
  }

  /// Refreshes cached snapshots so the list and stock limits follow the server.
  void _syncSnapshotsFromPreview(CheckoutPreview data) {
    var changed = false;
    ProductModel patched(ProductModel p, {num? price, num? discountPrice, required int stock}) =>
        ProductModel.fromJson({
          ...p.toJson(),
          'price': price ?? p.price,
          'discountPrice': discountPrice ?? p.discountPrice,
          'stock': stock,
        });
    for (final line in data.items) {
      final local = itemFor(line.product);
      if (local == null) continue;
      final discountPrice = line.price < line.originalPrice ? line.price : 0;
      if (local.product.price != line.originalPrice ||
          local.product.discountPrice != discountPrice ||
          local.product.stock != line.stock) {
        local.product = patched(local.product,
            price: line.originalPrice, discountPrice: discountPrice, stock: line.stock);
        changed = true;
      }
    }
    for (final missing in data.unavailableItems) {
      final local = itemFor(missing.product);
      if (local != null && local.product.stock != missing.stock) {
        local.product = patched(local.product, stock: missing.stock);
        changed = true;
      }
    }
    if (changed) _saveLocal();
  }

  /// Optional explanatory data (free-shipping threshold copy); failures are silent.
  Future<PricingPolicy?> loadPricingPolicy() async {
    if (_pricingPolicy != null) return _pricingPolicy;
    try {
      final response = await _api.get(ApiConstants.pricingPolicy);
      final policy = response.isSuccess ? PricingPolicy.tryParse(response.data) : null;
      if (policy != null) {
        _pricingPolicy = policy;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Pricing policy unavailable: $e');
    }
    return _pricingPolicy;
  }

  /// Validates [code] by re-pricing with it on the server. True when the server applied it.
  Future<bool> applyCoupon(String code) async {
    final normalized = code.trim().toUpperCase();
    _promoError = null;
    if (normalized.isEmpty) return false;
    if (!hasSelection) {
      _promoError = 'Vui lòng chọn sản phẩm trước khi áp dụng mã giảm giá';
      notifyListeners();
      return false;
    }
    _promotionCode = normalized;
    final result = await refreshPricing(immediate: true);
    if (result == null) {
      // The code could not be verified, so it is not kept.
      _promotionCode = '';
      _promoError ??= _pricingError ?? 'Không thể kiểm tra mã giảm giá';
      notifyListeners();
      return false;
    }
    return result.appliedPromotion != null && _promoError == null;
  }

  Future<CheckoutPreview?> removeCoupon() {
    _promotionCode = '';
    _promoError = null;
    return refreshPricing(immediate: true);
  }

  /// Gates checkout on a fresh server preview of the selected lines (guests too).
  Future<CartCheckoutValidation> validateCartBeforeCheckout() async {
    final result = await refreshPricing(immediate: true);
    return CartCheckoutValidation(
      isValidForCheckout: result != null && result.isValidForCheckout && _pricingError == null,
      warnings: result?.warnings ?? const [],
      error: _pricingError,
    );
  }

  // ---------------------------------------------------------------------------
  // Suggested vouchers (display only; validation is always done by the server)
  // ---------------------------------------------------------------------------
  List<PromotionModel> _activePromotions = [];
  bool _promotionsLoading = false;
  String? _promotionsError;

  List<PromotionModel> get activePromotions => _activePromotions;
  bool get promotionsLoading => _promotionsLoading;
  String? get promotionsError => _promotionsError;

  Future<void> fetchActivePromotions() async {
    _promotionsLoading = true;
    _promotionsError = null;
    notifyListeners();
    try {
      final response = await _api.get(ApiConstants.activePromotions);
      if (response.isSuccess) {
        _activePromotions = response
            .listData()
            .whereType<Map>()
            .map((item) => PromotionModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
      } else {
        _promotionsError = 'Không tải được danh sách mã giảm giá.';
      }
    } catch (e) {
      debugPrint('Error fetching promotions: $e');
      _promotionsError = 'Không tải được danh sách mã giảm giá.';
    } finally {
      _promotionsLoading = false;
      notifyListeners();
    }
  }
}
