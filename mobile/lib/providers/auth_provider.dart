import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/user_model.dart';
import '../services/fcm_notification_service.dart';

class AuthProvider with ChangeNotifier {
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();
  final ApiClient _api;
  UserModel? _user;
  String? _token;
  String? _refreshToken;
  bool _isLoading = false;
  late final Future<void> sessionReady;

  UserModel? get user => _user;
  String? get token => _token;
  String? get refreshToken => _refreshToken;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  bool get isLoading => _isLoading;

  AuthProvider({ApiClient? apiClient}) : _api = apiClient ?? ApiClient() {
    // Authenticated calls through this client refresh once on 401 and retry.
    _api.bindSession(
      tokenProvider: () => token,
      refresher: _exchangeRefreshToken,
      onSessionExpired: () => unawaited(_clearLocalSession()),
    );
    FcmNotificationService.instance.setApiClient(_api);
    FcmNotificationService.instance.setAuthTokenProvider(() => _token);
    sessionReady = _restoreSessionSafely();
  }

  Future<void> _restoreSessionSafely() async {
    try {
      await _loadStoredSession();
    } catch (_) {
      _token = null;
      _refreshToken = null;
      _user = null;
      debugPrint('Stored session unavailable; sign in again.');
    }
  }

  Future<void> _loadStoredSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = await _secureStorage.read(key: 'token');
    _refreshToken = await _secureStorage.read(key: 'refreshToken');

    // One-time migration from plaintext storage used by earlier app versions.
    _token ??= prefs.getString('token');
    _refreshToken ??= prefs.getString('refreshToken');
    if (_token != null) await _secureStorage.write(key: 'token', value: _token);
    if (_refreshToken != null) {
      await _secureStorage.write(key: 'refreshToken', value: _refreshToken);
    }
    await prefs.remove('token');
    await prefs.remove('refreshToken');
    final userJsonStr = prefs.getString('user');

    if (userJsonStr != null) {
      try {
        _user = UserModel.fromJson(jsonDecode(userJsonStr));
      } catch (_) {}
    }
    notifyListeners();
    if (_token != null && _token!.isNotEmpty) {
      unawaited(FcmNotificationService.instance.registerForAuthenticatedUser(_token!));
    }
  }

  Future<void> _persistSession() async {
    final prefs = await SharedPreferences.getInstance();
    if (_token != null) await _secureStorage.write(key: 'token', value: _token);
    if (_refreshToken != null) {
      await _secureStorage.write(key: 'refreshToken', value: _refreshToken);
    }
    if (_user != null) await prefs.setString('user', jsonEncode(_user!.toJson()));
  }

  Future<bool> login(String email, String password) async {
    await sessionReady;
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiConstants.login,
        body: {'email': email, 'password': password},
      );

      if (response.isSuccess) {
        final data = response.mapData;
        _token = data['accessToken'];
        _refreshToken = data['refreshToken'];
        _user = UserModel.fromJson(data['user']);

        await _persistSession();
        unawaited(FcmNotificationService.instance.registerForAuthenticatedUser(_token!));

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw Exception(response.message ?? 'Đăng nhập thất bại');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> register(String fullName, String email, String password, String? phone) async {
    await sessionReady;
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiConstants.register,
        body: {
          'fullName': fullName,
          'email': email,
          'password': password,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
        },
      );

      if (response.isSuccess) {
        final data = response.mapData;
        _token = data['accessToken'];
        _refreshToken = data['refreshToken'];
        _user = UserModel.fromJson(data['user']);

        await _persistSession();
        unawaited(FcmNotificationService.instance.registerForAuthenticatedUser(_token!));

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw Exception(response.message ?? 'Đăng ký thất bại');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Rotates the token pair, sharing any refresh already in flight from
  /// ApiClient's automatic 401 handling. Only a server rejection ends the session.
  Future<bool> refreshAuthToken() async {
    return await _api.refreshSession() == TokenRefreshResult.refreshed;
  }

  /// Refresh exchange used by ApiClient; it never clears the session itself
  /// (ApiClient calls onSessionExpired once when the result is rejected).
  Future<TokenRefreshResult> _exchangeRefreshToken() async {
    if (_refreshToken == null || _refreshToken!.isEmpty) return TokenRefreshResult.rejected;

    try {
      final response = await _api.post(
        ApiConstants.refreshToken,
        token: _token,
        body: {'refreshToken': _refreshToken},
        refreshOnUnauthorized: false,
      );

      if (response.isSuccess) {
        final data = response.mapData;
        _token = data['accessToken'];
        _refreshToken = data['refreshToken'];
        if (data['user'] != null) {
          _user = UserModel.fromJson(data['user']);
        }

        await _persistSession();

        notifyListeners();
        return TokenRefreshResult.refreshed;
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        // MOB-01: Only clear session when server explicitly rejects refresh token (invalid/expired/revoked)
        return TokenRefreshResult.rejected;
      } else {
        // MOB-01: Server errors (500, 502, 503) or rate limits - do NOT logout user
        return TokenRefreshResult.unavailable;
      }
    } catch (_) {
      // MOB-01: Offline, network timeout, SocketException - do NOT logout user
      return TokenRefreshResult.unavailable;
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.put(
        ApiConstants.changePassword,
        token: _token,
        authenticated: true,
        body: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );

      _isLoading = false;
      notifyListeners();

      if (response.statusCode != 200) {
        throw Exception(response.message ?? 'Đổi mật khẩu thất bại');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    await sessionReady;
    FcmNotificationService.instance.setAuthTokenProvider(() => null);
    if (_token != null && _token!.isNotEmpty) {
      try {
        await FcmNotificationService.instance.unregister(_token!);
        // Re-read _token: a 401 during unregister may have rotated it.
        await _api.post(
          ApiConstants.logout,
          token: _token,
          authenticated: true,
          body: {
            if (_refreshToken != null) 'refreshToken': _refreshToken,
          },
        );
      } catch (_) {}
    }
    await _clearLocalSession();
  }

  /// Drops the session on this device only, without calling the server.
  /// Used by logout and when the server rejects the refresh token.
  Future<void> _clearLocalSession() async {
    _user = null;
    _token = null;
    _refreshToken = null;
    FcmNotificationService.instance.setAuthTokenProvider(() => _token);
    final prefs = await SharedPreferences.getInstance();
    await _secureStorage.delete(key: 'token');
    await _secureStorage.delete(key: 'refreshToken');
    await prefs.remove('token'); // legacy cleanup
    await prefs.remove('refreshToken'); // legacy cleanup
    await prefs.remove('user');
    notifyListeners();
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _api.post(
        ApiConstants.forgotPassword,
        body: {'email': email},
      );

      if (response.isSuccess) {
        final data = response.data ?? response.body;
        return data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
      } else {
        throw Exception(response.message ?? 'Yêu cầu OTP thất bại');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> resetPassword(String email, String otp, String newPassword) async {
    try {
      final response = await _api.post(
        ApiConstants.resetPassword,
        body: {
          'email': email,
          'otp': otp,
          'newPassword': newPassword,
        },
      );

      if (response.isSuccess) {
        return true;
      } else {
        throw Exception(response.message ?? 'Đặt lại mật khẩu thất bại');
      }
    } catch (e) {
      rethrow;
    }
  }
}
