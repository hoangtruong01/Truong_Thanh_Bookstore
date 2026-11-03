import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/order_model.dart';
import '../models/cart_item_model.dart';

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
    String? token,
  }) async {
    if (_placingOrder) throw StateError('Đơn hàng đang được xử lý');
    // Only checked-out (selected) items are ordered, matching CartProvider.subtotal.
    final selectedItems = items.where((i) => i.selected).toList();
    if (items.isNotEmpty && selectedItems.isEmpty) {
      throw Exception('Vui lòng chọn ít nhất một sản phẩm để đặt hàng');
    }
    _placingOrder = true;
    _isLoading = true;
    notifyListeners();

    try {
      _pendingIdempotencyKey ??= _newIdempotencyKey();
      final orderItems = selectedItems.map((i) => {
        'product': i.product.id,
        'name': i.product.name,
        'price': i.product.effectivePrice,
        'quantity': i.quantity,
        'image': i.product.images.isNotEmpty ? i.product.images[0] : '',
      }).toList();

      final payload = {
        'items': orderItems,
        'shippingAddress': address,
        'phone': phone,
        if (note != null && note.isNotEmpty) 'note': note,
        'paymentMethod': paymentMethod,
        if (promotionCode != null && promotionCode.isNotEmpty) 'promotionCode': promotionCode,
        'customerName': fullName,
        'customerEmail': email,
        'idempotencyKey': _pendingIdempotencyKey,
      };

      final isAuth = token != null && token.isNotEmpty;
      final url = isAuth ? ApiConstants.authenticatedOrders : ApiConstants.orders;

      final response = await _api.post(url, token: isAuth ? token : null, body: payload);

      if (response.isSuccess) {
        final order = OrderModel.fromJson(response.mapData);
        final guestToken = response.mapData['guestAccessToken'];
        if (!isAuth && guestToken is String && guestToken.isNotEmpty) {
          await _storage.write(key: _guestTokenKey(order.id), value: guestToken);
        }
        _pendingIdempotencyKey = null;
        _lastPaymentAction = null;
        if (isAuth && paymentMethod != 'COD') {
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
          } catch (e) {
            debugPrint('Order created but payment initiation failed: $e');
          }
        }
        return order;
      } else {
        throw Exception(response.message ?? 'Đặt hàng thất bại');
      }
    } finally {
      _placingOrder = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMyOrders(String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.get(ApiConstants.myOrders, token: token);

      if (response.statusCode == 200) {
        _myOrders = response.listData().map((item) => OrderModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching my orders: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
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
