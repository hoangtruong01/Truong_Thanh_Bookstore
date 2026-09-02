import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/order_model.dart';
import '../models/cart_item_model.dart';

class OrderProvider with ChangeNotifier {
  List<OrderModel> _myOrders = [];
  bool _isLoading = false;
  Map<String, dynamic>? _lastPaymentAction;
  String? _pendingIdempotencyKey;

  List<OrderModel> get myOrders => _myOrders;
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

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (isAuth) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );

      final body = jsonDecode(response.body);
      _isLoading = false;
      notifyListeners();

      if (response.statusCode == 200 || response.statusCode == 201) {
        final order = OrderModel.fromJson(body['data']);
        _pendingIdempotencyKey = null;
        _lastPaymentAction = null;
        if (isAuth && paymentMethod != 'COD') {
          try {
            final paymentResponse = await http.post(
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
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> fetchMyOrders(String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.get(
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

  Future<bool> cancelOrder(String orderId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiConstants.orders}/$orderId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        await fetchMyOrders(token);
        return true;
      }
    } catch (e) {
      debugPrint('Error canceling order: $e');
    }
    return false;
  }
}
