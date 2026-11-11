import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

/// Thông tin liên hệ cửa hàng — cùng hotline web đang hiển thị ở footer
/// (frontend/src/layouts/CustomerLayout.vue, `tel:0982938316`).
abstract final class StoreContact {
  static const String hotline = '0982938316';
  static const String hotlineDisplay = '0982 938 316';

  static Uri get hotlineUri => Uri(scheme: 'tel', path: hotline);

  /// Mở trình gọi điện; thay được trong test.
  @visibleForTesting
  static Future<bool> Function(Uri uri) dialer = launchUrl;

  /// Trả về false khi thiết bị không mở được trình gọi điện.
  static Future<bool> callHotline() async {
    try {
      return await dialer(hotlineUri);
    } catch (_) {
      return false;
    }
  }
}
