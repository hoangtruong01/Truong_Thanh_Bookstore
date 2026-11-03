import 'package:http/http.dart' as http;

/// Transport-level failure (offline, DNS, connection reset, timeout).
///
/// HTTP error statuses are NOT exceptions: they come back as an [ApiResponse].
/// Extends [http.ClientException] so existing `on http.ClientException` handling
/// keeps working. MOB-01: a network error never ends the user's session.
class ApiNetworkException extends http.ClientException {
  ApiNetworkException(String message, {Uri? uri, this.isTimeout = false, this.cause})
      : super(message, uri);

  final bool isTimeout;
  final Object? cause;

  /// User-facing text; technical detail stays in [message] / [cause].
  @override
  String toString() => isTimeout
      ? 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.'
      : 'Lỗi kết nối mạng. Vui lòng kiểm tra Internet và thử lại.';
}
