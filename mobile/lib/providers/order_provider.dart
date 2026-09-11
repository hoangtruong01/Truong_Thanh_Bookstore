import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/api_constants.dart';
import '../models/order_model.dart';
import '../models/cart_item_model.dart';

class OrderProvider with ChangeNotifier {
  OrderProvider({http.Client? client, FlutterSecureStorage? storage})
      : _client = client, _storage = storage ?? const FlutterSecureStorage();
  final http.Client? _client;
  final FlutterSecureStorage _storage;
  bool _disposed = false;

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
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
    _placingOrder = true;
    _isLoading = true;
    notifyListeners();

    try {
      _pendingIdempotencyKey ??= _newIdempotencyKey();
      final orderItems = items.map((i) => {
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

      final response = await (_client?.post ?? http.post)(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (isAuth) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final order = OrderModel.fromJson(body['data']);
        final guestToken = body['data']['guestAccessToken'];
        if (!isAuth && guestToken is String && guestToken.isNotEmpty) {
          await _storage.write(key: _guestTokenKey(order.id), value: guestToken);
        }
        _pendingIdempotencyKey = null;
        _lastPaymentAction = null;
        if (isAuth && paymentMethod != 'COD') {
          try {
            final paymentResponse = await (_client?.post ?? http.post)(
              Uri.parse(ApiConstants.payments),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer $token',
              },
              body: jsonEncode({
                'orderId': order.id,
                'provider': paymentMethod,
              }),
            );
            if (paymentResponse.statusCode == 200 || paymentResponse.statusCode == 201) {
              final paymentBody = jsonDecode(paymentResponse.body);
              final paymentData = paymentBody['data'];
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
        throw Exception(body['message'] ?? 'Đặt hàng thất bại');
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
      final response = await (_client?.get ?? http.get)(
        Uri.parse(ApiConstants.myOrders),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        dynamic dataField = body['data'];
        List rawList = [];
        if (dataField is List) {
          rawList = dataField;
        } else if (dataField is Map && dataField['data'] is List) {
          rawList = dataField['data'];
        }
        _myOrders = rawList.map((item) => OrderModel.fromJson(item)).toList();
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
      final response = await (_client?.delete ?? http.delete)(
        Uri.parse('${ApiConstants.orders}/${isGuest ? 'guest/' : ''}$orderId'),
        headers: isGuest ? {'x-guest-order-token': guestToken} : {'Authorization': 'Bearer $token'},
      );

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
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (isGuest) {
        headers['x-guest-order-token'] = guestToken;
      } else if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await (_client?.get ?? http.get)(
        Uri.parse('${ApiConstants.orders}/${isGuest ? 'guest/' : ''}$orderId'),
        headers: headers,
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final data = body['data'] ?? body;
        return OrderModel.fromJson(data);
      }
    } catch (e) {
      debugPrint('Error fetching order by id: $e');
    }
    return null;
  }
}
