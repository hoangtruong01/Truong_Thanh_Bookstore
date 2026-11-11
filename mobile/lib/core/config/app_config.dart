/// Cấu hình công khai của app (không chứa secret).
///
/// `WEB_URL` truyền qua `--dart-define=WEB_URL=https://...` giống cách
/// `API_URL` được đọc trong `ApiConstants`; không truyền thì dùng web chính thức.
class AppConfig {
  AppConfig._();

  static const String defaultWebUrl = 'https://truong-thanh-bookstore.vercel.app';

  static String get webBaseUrl {
    const configured = String.fromEnvironment('WEB_URL', defaultValue: '');
    return resolveWebBaseUrl(configured);
  }

  /// Chuẩn hóa URL web: bỏ dấu `/` cuối, chỉ nhận http(s) có host,
  /// ngược lại quay về [defaultWebUrl].
  static String resolveWebBaseUrl(String configured) {
    final trimmed = configured.trim().replaceFirst(RegExp(r'/+$'), '');
    if (trimmed.isEmpty) return defaultWebUrl;
    final uri = Uri.tryParse(trimmed);
    if (uri == null || !(uri.scheme == 'https' || uri.scheme == 'http') || uri.host.isEmpty) {
      return defaultWebUrl;
    }
    return trimmed;
  }

  /// Liên kết chia sẻ sản phẩm trên web: `<WEB_URL>/products/<slug|id>`.
  static String productUrl(String slugOrId, {String? baseUrl}) {
    final base = baseUrl == null ? webBaseUrl : resolveWebBaseUrl(baseUrl);
    return '$base/products/${Uri.encodeComponent(slugOrId)}';
  }
}
