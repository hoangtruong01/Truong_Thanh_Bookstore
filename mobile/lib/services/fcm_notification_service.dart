import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../screens/order/order_detail_screen.dart';

class FcmNotificationService {
  FcmNotificationService._internal();
  static final FcmNotificationService instance = FcmNotificationService._internal();

  GlobalKey<NavigatorState>? _navigatorKey;
  String? _fcmToken;
  bool _firebaseReady = false;

  static const String _prefFcmTokenKey = 'ttb_fcm_device_token';

  /// Sets the global navigator key used for context-free deeplink routing.
  void setNavigatorKey(GlobalKey<NavigatorState> key) {
    _navigatorKey = key;
  }

  /// Initializes the notification service and restores stored device token.
  Future<void> initialize({
    GlobalKey<NavigatorState>? navKey,
    bool firebaseReady = false,
  }) async {
    if (navKey != null) {
      _navigatorKey = navKey;
    }

    _firebaseReady = firebaseReady;
    try {
      final prefs = await SharedPreferences.getInstance();
      _fcmToken = prefs.getString(_prefFcmTokenKey);
      if (!_firebaseReady) return;

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      final token = await messaging.getToken();
      if (token != null && token.isNotEmpty) await setDeviceToken(token);
      messaging.onTokenRefresh.listen((token) => setDeviceToken(token));
      FirebaseMessaging.onMessageOpenedApp.listen(
        (message) => handleNotificationPayload(message.data),
      );
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        WidgetsBinding.instance.addPostFrameCallback(
          (_) => handleNotificationPayload(initialMessage.data),
        );
      }
    } catch (e) {
      debugPrint('FcmNotificationService init error: $e');
    }
  }

  /// Returns the current device token.
  Future<String?> getDeviceToken() async {
    if (_fcmToken != null) return _fcmToken;
    try {
      final prefs = await SharedPreferences.getInstance();
      _fcmToken = prefs.getString(_prefFcmTokenKey);
      return _fcmToken;
    } catch (e) {
      debugPrint('Error getting device token: $e');
      return null;
    }
  }

  /// Saves device token locally and syncs with backend if user is authenticated.
  Future<void> setDeviceToken(String token, {String? authToken}) async {
    _fcmToken = token;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefFcmTokenKey, token);

      if (authToken != null && authToken.isNotEmpty) {
        await syncTokenWithBackend(token, authToken);
      }
    } catch (e) {
      debugPrint('Error storing device token: $e');
    }
  }

  Future<bool> registerForAuthenticatedUser(String authToken) async {
    if (!_firebaseReady) return false;
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) return false;
    await setDeviceToken(token);
    return syncTokenWithBackend(token, authToken);
  }

  Future<void> unregister(String authToken) async {
    final token = await getDeviceToken();
    if (token == null || token.isEmpty) return;
    try {
      await http.patch(
        Uri.parse('${ApiConstants.baseUrl}/notifications/device-token/unregister'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'deviceToken': token,
          'platform': _platform,
        }),
      );
    } catch (e) {
      debugPrint('Failed to unregister device token: $e');
    }
  }

  /// Syncs FCM push token with backend server.
  Future<bool> syncTokenWithBackend(String token, String authToken) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/notifications/device-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'deviceToken': token,
          'platform': _platform,
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Failed to sync device token with backend: $e');
      return false;
    }
  }

  String get _platform =>
      defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';

  /// Parses push notification data and executes deep link navigation.
  bool handleNotificationPayload(Map<String, dynamic> data) {
    debugPrint('FcmNotificationService handling payload: $data');

    final type = (data['type'] ?? '').toString().toLowerCase();
    final orderId = data['orderId']?.toString() ??
        data['order_id']?.toString() ??
        data['id']?.toString();

    // Order Deep Link
    if (type == 'order' || orderId != null) {
      if (orderId != null && orderId.isNotEmpty) {
        return navigateToOrder(orderId);
      }
    }

    return false;
  }

  /// Navigates directly to OrderDetailScreen for the given orderId using navigatorKey.
  bool navigateToOrder(String orderId) {
    try {
      final navState = _navigatorKey?.currentState;
      if (navState != null) {
        navState.push(
          MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: orderId),
          ),
        );
        return true;
      }
    } catch (e) {
      debugPrint('Navigation error in FcmNotificationService: $e');
    }
    return false;
  }
}
