import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/api_constants.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();
  UserModel? _user;
  String? _token;
  String? _refreshToken;
  bool _isLoading = false;

  UserModel? get user => _user;
  String? get token => _token;
  String? get refreshToken => _refreshToken;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _loadStoredSession();
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
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse(ApiConstants.login),
        headers: {
          'Content-Type': 'application/json',
          'x-client-platform': 'mobile',
        },
        body: jsonEncode({'email': email, 'password': password}),
      );

      final body = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = body['data'];
        _token = data['accessToken'];
        _refreshToken = data['refreshToken'];
        _user = UserModel.fromJson(data['user']);

        await _persistSession();

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw Exception(body['message'] ?? 'Đăng nhập thất bại');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> register(String fullName, String email, String password, String? phone) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse(ApiConstants.register),
        headers: {
          'Content-Type': 'application/json',
          'x-client-platform': 'mobile',
        },
        body: jsonEncode({
          'fullName': fullName,
          'email': email,
          'password': password,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
        }),
      );

      final body = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = body['data'];
        _token = data['accessToken'];
        _refreshToken = data['refreshToken'];
        _user = UserModel.fromJson(data['user']);

        await _persistSession();

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw Exception(body['message'] ?? 'Đăng ký thất bại');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> refreshAuthToken() async {
    if (_refreshToken == null || _refreshToken!.isEmpty) return false;

    try {
      final response = await http.post(
        Uri.parse(ApiConstants.refreshToken),
        headers: {
          'Content-Type': 'application/json',
          'x-client-platform': 'mobile',
          if (_token != null) 'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({'refreshToken': _refreshToken}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        final data = body['data'];
        _token = data['accessToken'];
        _refreshToken = data['refreshToken'];
        if (data['user'] != null) {
          _user = UserModel.fromJson(data['user']);
        }

        await _persistSession();

        notifyListeners();
        return true;
      } else {
        await logout();
        return false;
      }
    } catch (_) {
      await logout();
      return false;
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.put(
        Uri.parse(ApiConstants.changePassword),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );

      final body = jsonDecode(response.body);
      _isLoading = false;
      notifyListeners();

      if (response.statusCode != 200) {
        throw Exception(body['message'] ?? 'Đổi mật khẩu thất bại');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    if (_token != null && _token!.isNotEmpty) {
      try {
        await http.post(
          Uri.parse(ApiConstants.logout),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $_token',
          },
          body: jsonEncode({
            if (_refreshToken != null) 'refreshToken': _refreshToken,
          }),
        );
      } catch (_) {}
    }

    _user = null;
    _token = null;
    _refreshToken = null;
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
      final response = await http.post(
        Uri.parse(ApiConstants.forgotPassword),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final body = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return body['data'] ?? body;
      } else {
        throw Exception(body['message'] ?? 'Yêu cầu OTP thất bại');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> resetPassword(String email, String otp, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.resetPassword),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
          'newPassword': newPassword,
        }),
      );

      final body = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      } else {
        throw Exception(body['message'] ?? 'Đặt lại mật khẩu thất bại');
      }
    } catch (e) {
      rethrow;
    }
  }
}
