import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Quản lý chế độ giao diện: Theo hệ thống (mặc định) / Sáng / Tối.
/// Lựa chọn được lưu vào SharedPreferences ('system' | 'light' | 'dark').
class ThemeProvider extends ChangeNotifier {
  static const String _prefKey = 'app_theme_mode';

  ThemeMode _themeMode = ThemeMode.system;
  final Brightness Function() _platformBrightness;
  bool _userChangedBeforeLoad = false;
  late final Future<void> _loaded;

  ThemeMode get themeMode => _themeMode;
  bool get isSystemMode => _themeMode == ThemeMode.system;

  /// Giao diện đang hiển thị có phải nền tối không (tính cả chế độ Theo hệ thống).
  bool get isDarkMode =>
      _themeMode == ThemeMode.dark ||
      (_themeMode == ThemeMode.system && _platformBrightness() == Brightness.dark);

  /// Hoàn tất khi đã đọc xong lựa chọn đã lưu.
  @visibleForTesting
  Future<void> get loaded => _loaded;

  /// [platformBrightness] chỉ dùng để giả lập độ sáng hệ thống trong test.
  ThemeProvider({Brightness Function()? platformBrightness})
      : _platformBrightness = platformBrightness ?? _systemBrightness {
    _loaded = _loadFromPrefs();
  }

  static Brightness _systemBrightness() => PlatformDispatcher.instance.platformBrightness;

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedMode = _decode(prefs.getString(_prefKey));
      // Người dùng đã đổi theme trước khi đọc xong -> giữ lựa chọn mới.
      if (_userChangedBeforeLoad || savedMode == _themeMode) return;
      _themeMode = savedMode;
      notifyListeners();
    } catch (e) {
      debugPrint('Lỗi tải theme: $e');
    }
  }

  /// Bật/tắt nhanh Sáng <-> Tối (dùng ở màn Tài khoản).
  /// Không truyền [isDark] thì đảo theo giao diện đang hiển thị.
  Future<void> toggleTheme([bool? isDark]) {
    final targetDark = isDark ?? !isDarkMode;
    return setThemeMode(targetDark ? ThemeMode.dark : ThemeMode.light);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _userChangedBeforeLoad = true;
    if (_themeMode != mode) {
      _themeMode = mode;
      notifyListeners();
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKey, _encode(mode));
    } catch (e) {
      debugPrint('Lỗi lưu theme mode: $e');
    }
  }

  static ThemeMode _decode(String? value) {
    switch (value) {
      case 'dark':
        return ThemeMode.dark;
      case 'light':
        return ThemeMode.light;
      default:
        return ThemeMode.system;
    }
  }

  static String _encode(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.dark:
        return 'dark';
      case ThemeMode.light:
        return 'light';
      case ThemeMode.system:
        return 'system';
    }
  }
}
