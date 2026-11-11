import 'dart:async';
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
  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  String? _errorMessage;

  /// Bumped on reset so answers for the previous session are dropped.
  int _generation = 0;
  bool? _boundAuthenticated;

  /// Called by the provider tree whenever the session changes. Leaving an account
  /// (sign-out, expired session) drops that account's notifications and badge.
  void bindAuth({required bool isAuthenticated}) {
    final previous = _boundAuthenticated;
    _boundAuthenticated = isAuthenticated;
    if (previous == true && !isAuthenticated) {
      _clear();
      // Deferred: this runs while the provider tree builds.
      scheduleMicrotask(notifyListeners);
    }
  }

  void _clear() {
    _generation++;
    _notifications = [];
    _unreadCount = 0;
    _errorMessage = null;
    _isLoading = false;
  }

  List<NotificationModel> get notifications => List.unmodifiable(_notifications);
  /// Server-side unread count (GET /notifications/unread-count), for the home bell.
  int get unreadCount => _unreadCount;
  bool get hasUnread => _unreadCount > 0;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Clears per-user state (call on logout so the bell does not keep a stale badge).
  void reset() {
    _clear();
    notifyListeners();
  }

  Future<void> fetchNotifications(String? token) async {
    if (token == null || token.isEmpty) return;
    final generation = _generation;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.myNotifications, token: token);
      if (generation != _generation) return;

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
      if (generation != _generation) return;
      _errorMessage = e is ApiNetworkException ? e.toString() : 'Không thể tải thông báo';
    } finally {
      if (generation == _generation) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  Future<void> fetchUnreadCount(String? token) async {
    if (token == null || token.isEmpty) {
      _unreadCount = 0;
      notifyListeners();
      return;
    }
    final generation = _generation;

    try {
      final res = await _api.get(ApiConstants.unreadNotificationCount, token: token);
      if (generation != _generation) return;

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

      if (res.isSuccess) {
        final index = _notifications.indexWhere((n) => n.id == id);
        if (index != -1 && !_notifications[index].isRead) {
          _notifications[index] = _notifications[index].copyWith(isRead: true);
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

      if (res.isSuccess) {
        _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
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
