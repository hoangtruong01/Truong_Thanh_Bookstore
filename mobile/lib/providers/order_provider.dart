import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/order_model.dart';
import '../models/cart_item_model.dart';

class OrderProvider with ChangeNotifier {
  List<OrderModel> _myOrders = [];
  bool _isLoading = false;

  List<OrderModel> get myOrders => _myOrders;
  bool get isLoading => _isLoading;

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
        return OrderModel.fromJson(body['data']);
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
