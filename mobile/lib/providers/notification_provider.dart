import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/notification_model.dart';

class NotificationProvider with ChangeNotifier {
  NotificationProvider({http.Client? client}) : _client = client ?? http.Client();
  final http.Client _client;

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }
  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  String? _errorMessage;

  List<NotificationModel> get notifications => List.unmodifiable(_notifications);
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchNotifications(String? token) async {
    if (token == null || token.isEmpty) return;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _client.get(
        Uri.parse(ApiConstants.myNotifications),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        final dynamic data = body['data'] ?? body;
        final dynamic items = data is Map ? data['items'] : data;
        if (items is List) {
          _notifications = items.map((item) => NotificationModel.fromJson(item)).toList();
        }
        await fetchUnreadCount(token);
      } else {
        _errorMessage = 'Không thể tải thông báo';
      }
    } catch (e) {
      _errorMessage = 'Lỗi kết nối mạng: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchUnreadCount(String? token) async {
    if (token == null || token.isEmpty) {
      _unreadCount = 0;
      notifyListeners();
      return;
    }

    try {
      final res = await _client.get(
        Uri.parse(ApiConstants.unreadNotificationCount),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        final data = body['data'] ?? body;
        _unreadCount = (data['unreadCount'] as num?)?.toInt() ?? 0;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Lỗi tải unread count: $e');
    }
  }

  Future<bool> markAsRead(String id, String? token) async {
    if (token == null || token.isEmpty) return false;

    try {
      final res = await _client.patch(
        Uri.parse(ApiConstants.markNotificationRead(id)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (res.statusCode == 200) {
        final index = _notifications.indexWhere((n) => n.id == id);
        if (index != -1) {
          final old = _notifications[index];
          _notifications[index] = NotificationModel(
            id: old.id,
            title: old.title,
            message: old.message,
            type: old.type,
            data: old.data,
            isRead: true,
            createdAt: old.createdAt,
          );
          if (_unreadCount > 0) _unreadCount--;
          notifyListeners();
        }
        return true;
      }
    } catch (e) {
      debugPrint('Lỗi markAsRead: $e');
    }
    return false;
  }

  Future<bool> markAllAsRead(String? token) async {
    if (token == null || token.isEmpty) return false;

    try {
      final res = await _client.patch(
        Uri.parse(ApiConstants.markAllNotificationsRead),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (res.statusCode == 200) {
        _notifications = _notifications.map((n) {
          return NotificationModel(
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            data: n.data,
            isRead: true,
            createdAt: n.createdAt,
          );
        }).toList();
        _unreadCount = 0;
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Lỗi markAllAsRead: $e');
    }
    return false;
  }
}
