import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/order_model.dart';
import '../models/cart_item_model.dart';
import '../models/payment_methods_model.dart';

class OrderProvider with ChangeNotifier {
  OrderProvider({ApiClient? apiClient, http.Client? client, FlutterSecureStorage? storage})
      : _api = apiClient ?? ApiClient(httpClient: client),
        _ownsApi = apiClient == null,
        _storage = storage ?? const FlutterSecureStorage();
  final ApiClient _api;
  final bool _ownsApi;
  final FlutterSecureStorage _storage;
  bool _disposed = false;

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    if (_ownsApi) _api.close();
    super.dispose();
  }
  String _guestTokenKey(String orderId) => 'guest_order_token_$orderId';
  List<OrderModel> _myOrders = [];
  List<OrderModel> _guestOrders = [];
  String? _guestOrdersError;
  bool _isLoading = false;
  bool _placingOrder = false;
  Map<String, dynamic>? _lastPaymentAction;
  String? _pendingIdempotencyKey;

  List<OrderModel> get myOrders => _myOrders;
  List<OrderModel> get guestOrders => List.unmodifiable(_guestOrders);
  String? get guestOrdersError => _guestOrdersError;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get lastPaymentAction => _lastPaymentAction;

  // Payment methods enabled on the server (GET /payments/methods). COD until loaded.
  static const String _paymentInitFailedMessage =
      'Chưa khởi tạo được phiên thanh toán trực tuyến. Bạn có thể thanh toán lại từ chi tiết đơn hàng.';
  String? _lastPaymentError;
  PaymentMethodsConfig _paymentMethods = PaymentMethodsConfig.codOnly;
  bool _paymentMethodsLoading = false;
  String? get lastPaymentError => _lastPaymentError;
  PaymentMethodsConfig get paymentMethods => _paymentMethods;
  bool get paymentMethodsLoading => _paymentMethodsLoading;

  /// Loads the enabled methods; on any failure the app offers COD only (like web).
  Future<PaymentMethodsConfig> fetchPaymentMethods() async {
    _paymentMethodsLoading = true;
    notifyListeners();
    try {
      final response = await _api.get(ApiConstants.paymentMethods);
      _paymentMethods = response.isSuccess && response.data is Map
          ? PaymentMethodsConfig.fromJson(response.mapData)
          : PaymentMethodsConfig.codOnly;
    } catch (e) {
      debugPrint('Error fetching payment methods: $e');
      _paymentMethods = PaymentMethodsConfig.codOnly;
    } finally {
      _paymentMethodsLoading = false;
      notifyListeners();
    }
    return _paymentMethods;
  }

  // Order history paging: GET /orders/my-orders?page&limit -> meta.totalPages.
  static const int myOrdersPageSize = 10;
  int _myOrdersPage = 0;
  int _myOrdersGeneration = 0;
  bool _myOrdersHasMore = false;
  bool _isLoadingMoreMyOrders = false;
  String? _myOrdersError;
  String? _loadMoreMyOrdersError;
  bool get myOrdersHasMore => _myOrdersHasMore;
  bool get isLoadingMoreMyOrders => _isLoadingMoreMyOrders;
  String? get myOrdersError => _myOrdersError;
  String? get loadMoreMyOrdersError => _loadMoreMyOrdersError;

  String? _pendingFingerprint;

  void _clearPendingIdempotencyKey() {
    _pendingIdempotencyKey = null;
    _pendingFingerprint = null;
  }

  // ---------------------------------------------------------------------------
  // Session binding: per-user data never survives a sign-out or account switch.
  // ---------------------------------------------------------------------------
  bool? _boundAuthenticated;

  /// Called by the provider tree whenever the session changes. Leaving an account
  /// (sign-out, expired session) drops that account's order list.
  void bindAuth({required bool isAuthenticated}) {
    final previous = _boundAuthenticated;
    _boundAuthenticated = isAuthenticated;
    if (previous == true && !isAuthenticated) {
      resetMyOrders(notify: false);
      // Deferred: this runs while the provider tree builds.
      scheduleMicrotask(notifyListeners);
    }
  }

  /// Clears the signed-in user's order history and paging; in-flight loads are ignored.
  void resetMyOrders({bool notify = true}) {
    _myOrdersGeneration++;
    _myOrders = [];
    _myOrdersPage = 0;
    _myOrdersHasMore = false;
    _isLoadingMoreMyOrders = false;
    _myOrdersError = null;
    _loadMoreMyOrdersError = null;
    _isLoading = false;
    _clearPendingIdempotencyKey();
    if (notify) notifyListeners();
  }

  String _newIdempotencyKey() {
    final random = Random.secure();
    return List.generate(24, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
  }

  Future<OrderModel?> placeOrder({
    required List<CartItemModel> items,
    required String fullName,
    required String phone,
    required String email,
    required String address,
    String? note,
    required String paymentMethod,
    String? promotionCode,
    int? loyaltyPointsUsed,
    String? token,
  }) async {
    if (_placingOrder) throw StateError('Đơn hàng đang được xử lý');
    // Only checked-out (selected) items are ordered, matching CartProvider.selectedItems.
    final selectedItems = items.where((i) => i.selected).toList();
    if (items.isNotEmpty && selectedItems.isEmpty) {
      throw Exception('Vui lòng chọn ít nhất một sản phẩm để đặt hàng');
    }
    _placingOrder = true;
    _isLoading = true;
    notifyListeners();

    try {
      // Only product + quantity: the backend prices every line from the database.
      final orderItems = selectedItems.map((i) => {
        'product': i.product.id,
        'quantity': i.quantity,
      }).toList();

      final payload = <String, dynamic>{
        'items': orderItems,
        'shippingAddress': address,
        'phone': phone,
        if (note != null && note.isNotEmpty) 'note': note,
        'paymentMethod': paymentMethod,
        if (promotionCode != null && promotionCode.isNotEmpty) 'promotionCode': promotionCode,
        if (loyaltyPointsUsed != null && loyaltyPointsUsed > 0) 'loyaltyPointsUsed': loyaltyPointsUsed,
        'customerName': fullName,
        'customerEmail': email,
        'orderSource': 'MOBILE',
      };
      // The key is reused only when the exact same order is retried (e.g. after a timeout);
      // any change to the payload is a new order and gets a new key.
      final fingerprint = jsonEncode(payload);
      if (_pendingIdempotencyKey == null || fingerprint != _pendingFingerprint) {
        _pendingIdempotencyKey = _newIdempotencyKey();
        _pendingFingerprint = fingerprint;
      }
      payload['idempotencyKey'] = _pendingIdempotencyKey;

      final isAuth = token != null && token.isNotEmpty;
      final url = isAuth ? ApiConstants.authenticatedOrders : ApiConstants.orders;

      final response = await _api.post(url, token: isAuth ? token : null, body: payload);

      if (response.isSuccess) {
        final order = OrderModel.fromJson(response.mapData);
        final guestToken = response.mapData['guestAccessToken'];
        if (!isAuth && guestToken is String && guestToken.isNotEmpty) {
          await _storage.write(key: _guestTokenKey(order.id), value: guestToken);
        }
        _clearPendingIdempotencyKey();
        _lastPaymentAction = null;
        _lastPaymentError = null;
        // Same as web: only gateways need a payment session. BANK_TRANSFER shows the
        // account from GET /payments/methods; guests can only order COD.
        if (isAuth && PaymentMethodsConfig.isOnlineGateway(paymentMethod)) {
          try {
            final paymentResponse = await _api.post(
              ApiConstants.payments,
              token: token,
              body: {
                'orderId': order.id,
                'provider': paymentMethod,
              },
            );
            if (paymentResponse.isSuccess) {
              final paymentData = paymentResponse.data;
              if (paymentData is Map && paymentData['action'] is Map) {
                _lastPaymentAction = Map<String, dynamic>.from(paymentData['action']);
              }
            }
            if (_lastPaymentAction == null) {
              _lastPaymentError = paymentResponse.message ?? _paymentInitFailedMessage;
            }
          } catch (e) {
            debugPrint('Order created but payment initiation failed: $e');
            _lastPaymentError = _paymentInitFailedMessage;
          }
        }
        return order;
      } else {
        // 409: the key was already used for another payload; never send it again.
        if (response.statusCode == 409) _clearPendingIdempotencyKey();
        throw Exception(response.message ?? 'Đặt hàng thất bại');
      }
    } finally {
      _placingOrder = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Loads the first page of the signed-in user's orders (resets paging).
  Future<void> fetchMyOrders(String token) async {
    final generation = ++_myOrdersGeneration;
    _isLoading = true;
    _isLoadingMoreMyOrders = false;
    _myOrdersError = null;
    _loadMoreMyOrdersError = null;
    notifyListeners();

    try {
      final page = await _fetchMyOrdersPage(token, 1);
      if (generation != _myOrdersGeneration) return;
      _myOrders = page.orders;
      _myOrdersPage = 1;
      _myOrdersHasMore = page.hasMore;
    } catch (e) {
      debugPrint('Error fetching my orders: $e');
      if (generation == _myOrdersGeneration) {
        _myOrdersError = 'Không thể tải lịch sử đơn hàng. Vui lòng thử lại.';
      }
    } finally {
      if (generation == _myOrdersGeneration) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  /// Appends the next page; no-op while a load is running or on the last page.
  Future<void> loadMoreMyOrders(String token) async {
    if (_isLoading || _isLoadingMoreMyOrders || !_myOrdersHasMore) return;
    final generation = _myOrdersGeneration;
    _isLoadingMoreMyOrders = true;
    _loadMoreMyOrdersError = null;
    notifyListeners();
    try {
      final next = _myOrdersPage + 1;
      final page = await _fetchMyOrdersPage(token, next);
      if (generation != _myOrdersGeneration) return;
      final known = _myOrders.map((o) => o.id).toSet();
      _myOrders = [..._myOrders, ...page.orders.where((o) => !known.contains(o.id))];
      _myOrdersPage = next;
      _myOrdersHasMore = page.hasMore;
    } catch (e) {
      debugPrint('Error loading more orders: $e');
      if (generation == _myOrdersGeneration) {
        _loadMoreMyOrdersError = 'Không tải thêm được đơn hàng.';
      }
    } finally {
      if (generation == _myOrdersGeneration) {
        _isLoadingMoreMyOrders = false;
        notifyListeners();
      }
    }
  }

  Future<({List<OrderModel> orders, bool hasMore})> _fetchMyOrdersPage(String token, int page) async {
    final response = await _api.get(ApiConstants.myOrders, token: token,
        query: {'page': '$page', 'limit': '$myOrdersPageSize'});
    if (response.statusCode != 200) {
      throw Exception(response.message ?? 'HTTP ${response.statusCode}');
    }
    final orders = response.listData()
        .whereType<Map>()
        .map((item) => OrderModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
    // Envelope meta {page, limit, total, totalPages}; legacy body nests total in data.
    final meta = response.meta ?? response.mapData;
    final totalPages = (meta['totalPages'] as num?)?.toInt();
    final total = (meta['total'] as num?)?.toInt();
    final limit = (meta['limit'] as num?)?.toInt() ?? myOrdersPageSize;
    final hasMore = totalPages != null
        ? page < totalPages
        : total != null
            ? page * limit < total
            : orders.length >= myOrdersPageSize;
    return (orders: orders, hasMore: hasMore);
  }

  /// POST /orders/:id/return-request (JWT only; backend checks owner, status
  /// DELIVERED/COMPLETED and the 7-day window). Throws with the server message.
  Future<OrderModel?> requestReturn(String orderId, String reason, String token) async {
    final trimmed = reason.trim();
    if (trimmed.isEmpty) throw Exception('Vui lòng nhập lý do trả hàng');
    final response = await _api.post(ApiConstants.orderReturnRequest(orderId),
        token: token, body: {'reason': trimmed});
    if (!response.isSuccess) {
      throw Exception(response.message ?? 'Gửi yêu cầu trả hàng thất bại');
    }
    // Re-read the customer view of the order instead of trusting the raw document.
    final refreshed = await fetchOrderById(orderId, token);
    final updated = refreshed ??
        (response.mapData.isNotEmpty ? OrderModel.fromJson(response.mapData) : null);
    if (updated != null) {
      final index = _myOrders.indexWhere((o) => o.id == orderId);
      if (index != -1) {
        _myOrders = [..._myOrders]..[index] = updated;
        notifyListeners();
      }
    }
    return updated;
  }

  Future<void> fetchGuestOrders() async {
    _isLoading = true;
    _guestOrdersError = null;
    _guestOrders = [];
    notifyListeners();
    try {
      final stored = await _storage.readAll().timeout(const Duration(seconds: 5));
      final orders = <OrderModel>[];
      for (final key in stored.keys.where((key) => key.startsWith('guest_order_token_'))) {
        if (_disposed) return;
        final order = await fetchOrderById(key.substring('guest_order_token_'.length), null);
        if (order != null) {
          orders.add(order);
        } else {
          _guestOrdersError = 'Một số đơn chưa tải được. Vui lòng thử lại.';
        }
      }
      _guestOrders = orders.reversed.toList();
    } catch (_) {
      _guestOrdersError = 'Không thể đọc danh sách đơn trên thiết bị. Vui lòng thử lại.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> cancelOrder(String orderId, String? token) async {
    try {
      final guestToken = await _storage.read(key: _guestTokenKey(orderId));
      if ((guestToken == null || guestToken.isEmpty) && (token == null || token.isEmpty)) return false;
      final isGuest = guestToken != null && guestToken.isNotEmpty;
      // Guest capability and account bearer are never sent together.
      final response = isGuest
          ? await _api.delete(ApiConstants.guestOrder(orderId),
              headers: {'x-guest-order-token': guestToken})
          : await _api.delete(ApiConstants.order(orderId), token: token);

      if (response.statusCode == 200) {
        if (isGuest) {
          await fetchGuestOrders();
        } else if (token != null) {
          await fetchMyOrders(token);
        }
        return true;
      }
    } catch (e) {
      debugPrint('Error canceling order: $e');
    }
    return false;
  }

  Future<OrderModel?> fetchOrderById(String orderId, String? token) async {
    try {
      final guestToken = await _storage.read(key: _guestTokenKey(orderId));
      final isGuest = guestToken != null && guestToken.isNotEmpty;
      if (!isGuest && (token == null || token.isEmpty)) return null;
      final response = isGuest
          ? await _api.get(ApiConstants.guestOrder(orderId),
              headers: {'x-guest-order-token': guestToken})
          : await _api.get(ApiConstants.order(orderId), token: token);

      if (response.statusCode == 200) {
        return OrderModel.fromJson(response.mapData);
      }
    } catch (e) {
      debugPrint('Error fetching order by id: $e');
    }
    return null;
  }
}
