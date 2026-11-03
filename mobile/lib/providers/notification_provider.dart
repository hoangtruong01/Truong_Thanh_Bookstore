import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationProvider with ChangeNotifier {
  NotificationProvider({ApiClient? apiClient, http.Client? client})
      : _api = apiClient ?? ApiClient(httpClient: client),
        _ownsApi = apiClient == null;
  final ApiClient _api;
  final bool _ownsApi;

  @override
  void dispose() {
    if (_ownsApi) _api.close();
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
      final res = await _api.get(ApiConstants.myNotifications, token: token);

      if (res.statusCode == 200) {
        final dynamic items = res.data is Map ? res.data['items'] : res.data;
        if (items is List) {
          _notifications = items.map((item) => NotificationModel.fromJson(item)).toList();
        }
        await fetchUnreadCount(token);
      } else {
        _errorMessage = 'Không thể tải thông báo';
      }
    } catch (e) {
      _errorMessage = e is ApiNetworkException ? e.toString() : 'Không thể tải thông báo';
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
      final res = await _api.get(ApiConstants.unreadNotificationCount, token: token);

      if (res.statusCode == 200) {
        _unreadCount = (res.mapData['unreadCount'] as num?)?.toInt() ?? 0;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Lỗi tải unread count: $e');
    }
  }

  Future<bool> markAsRead(String id, String? token) async {
    if (token == null || token.isEmpty) return false;

    try {
      final res = await _api.patch(ApiConstants.markNotificationRead(id), token: token);

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
      final res = await _api.patch(ApiConstants.markAllNotificationsRead, token: token);

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
