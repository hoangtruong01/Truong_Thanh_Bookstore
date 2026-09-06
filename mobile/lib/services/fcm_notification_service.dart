import 'dart:async';
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
  @visibleForTesting
  FcmNotificationService.forTesting({required http.Client client,
    required Future<String?> Function() tokenLoader})
      : _client = client, _tokenLoader = tokenLoader;
  static final FcmNotificationService instance = FcmNotificationService._internal();
  http.Client? _client;
  Future<String?> Function()? _tokenLoader;
  String? Function()? _authTokenProvider;
  StreamSubscription<String>? _tokenSubscription;
  StreamSubscription<RemoteMessage>? _openSubscription;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  GlobalKey<ScaffoldMessengerState>? _messengerKey;

  void setMessengerKey(GlobalKey<ScaffoldMessengerState> key) {
    _messengerKey = key;
  }

  /// In-app foreground notice. Private payload text is not shown on screen.
  void handleForegroundMessage(RemoteMessage message) {
    final messenger = _messengerKey?.currentState;
    if (messenger == null) return;
    messenger.hideCurrentSnackBar();
    final orderId = _orderId(message.data);
    messenger.showSnackBar(SnackBar(
      content: const Text('Bạn có thông báo mới'),
      action: orderId == null ? null : SnackBarAction(
        label: 'Xem đơn',
        onPressed: () => navigateToOrder(orderId),
      ),
    ));
  }

  void setAuthTokenProvider(String? Function() provider) {
    _authTokenProvider = provider;
  }

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
      await _tokenSubscription?.cancel();
      await _openSubscription?.cancel();
      await _foregroundSubscription?.cancel();
      _foregroundSubscription = FirebaseMessaging.onMessage.listen(handleForegroundMessage);
      _tokenSubscription = messaging.onTokenRefresh.listen(
        (token) => unawaited(setDeviceToken(token)),
      );
      _openSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
        (message) => handleNotificationPayload(message.data),
      );
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        WidgetsBinding.instance.addPostFrameCallback(
          (_) => handleNotificationPayload(initialMessage.data),
        );
        WidgetsBinding.instance.ensureVisualUpdate();
      }
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      final token = await messaging.getToken();
      if (token != null && token.isNotEmpty) await setDeviceToken(token);
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

      final currentAuthToken = authToken ?? _authTokenProvider?.call();
      if (currentAuthToken != null && currentAuthToken.isNotEmpty) {
        await syncTokenWithBackend(token, currentAuthToken);
      }
    } catch (e) {
      debugPrint('Error storing device token: $e');
    }
  }

  Future<bool> registerForAuthenticatedUser(String authToken) async {
    if ((!_firebaseReady && _tokenLoader == null) || authToken.isEmpty) return false;
    try {
      final token = await (_tokenLoader?.call() ?? FirebaseMessaging.instance.getToken())
          .timeout(const Duration(seconds: 10));
      if (token == null || token.isEmpty) return false;
      // Authentication may have changed while Firebase was resolving the token.
      if (_authTokenProvider != null && _authTokenProvider!() != authToken) return false;
      _fcmToken = token;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefFcmTokenKey, token);
      if (_authTokenProvider != null && _authTokenProvider!() != authToken) return false;
      return await syncTokenWithBackend(token, authToken);
    } catch (_) {
      debugPrint('Push registration unavailable; authentication remains active.');
      return false;
    }
  }

  Future<void> unregister(String authToken) async {
    final token = await getDeviceToken();
    if (token == null || token.isEmpty) return;
    try {
      await (_client?.patch ?? http.patch)(
        Uri.parse('${ApiConstants.baseUrl}/notifications/device-token/unregister'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'deviceToken': token,
          'platform': _platform,
        }),
      ).timeout(const Duration(seconds: 10));
    } catch (e) {
      debugPrint('Failed to unregister device token: $e');
    }
  }

  /// Syncs FCM push token with backend server.
  Future<bool> syncTokenWithBackend(String token, String authToken) async {
    try {
      final response = await (_client?.post ?? http.post)(
        Uri.parse('${ApiConstants.baseUrl}/notifications/device-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'deviceToken': token,
          'platform': _platform,
        }),
      ).timeout(const Duration(seconds: 10));
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
    final orderId = _orderId(data);
    return orderId != null && navigateToOrder(orderId);
  }

  String? _orderId(Map<String, dynamic> data) {
    final meta = data['meta'];
    final value = data['orderId'] ?? data['order_id'] ??
        (meta is Map ? meta['orderId'] : null) ??
        (data['type']?.toString().toLowerCase() == 'order' ? data['id'] : null);
    if (value is! String || value.trim().isEmpty) return null;
    return value.trim();
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
