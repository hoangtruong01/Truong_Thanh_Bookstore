import '../../core/utils/formatters.dart';

/// Kiểm tra form phía client, bám theo DTO của Backend (auth.dto.ts,
/// address.dto.ts) và thông báo của web. Chỉ để báo lỗi sớm — Backend vẫn
/// là nơi quyết định cuối cùng.
abstract final class AuthValidators {
  /// Độ dài tối thiểu theo `@MinLength(8)` của RegisterDto / ChangePasswordDto / ResetPasswordDto.
  static const int passwordMinLength = 8;

  static final RegExp _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
  static final RegExp _otp = RegExp(r'^\d{6}$');

  static const String passwordHint = 'Ít nhất 8 ký tự, có chữ hoa, chữ thường và chữ số';

  static String? email(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return 'Vui lòng nhập email';
    if (!_email.hasMatch(v)) return 'Email không đúng định dạng';
    return null;
  }

  /// Đăng nhập chỉ yêu cầu không để trống (LoginDto).
  static String? loginPassword(String? value) =>
      (value == null || value.isEmpty) ? 'Vui lòng nhập mật khẩu' : null;

  /// Mật khẩu mới: tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số.
  static String? newPassword(String? value) {
    final v = value ?? '';
    if (v.isEmpty) return 'Vui lòng nhập mật khẩu';
    if (v.length < passwordMinLength) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!RegExp(r'[a-z]').hasMatch(v) ||
        !RegExp(r'[A-Z]').hasMatch(v) ||
        !RegExp(r'\d').hasMatch(v)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số';
    }
    return null;
  }

  static String? confirmPassword(String? value, String original) {
    if (value == null || value.isEmpty) return 'Vui lòng nhập lại mật khẩu';
    if (value != original) return 'Xác nhận mật khẩu không trùng khớp';
    return null;
  }

  static String? fullName(String? value) =>
      (value == null || value.trim().isEmpty) ? 'Vui lòng nhập họ và tên' : null;

  static const String phoneError = 'Số điện thoại không hợp lệ (10 chữ số, ví dụ 0901234567)';

  /// SĐT không bắt buộc (đăng ký, hồ sơ): bỏ trống được, có nhập thì phải đúng.
  static String? optionalPhone(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return null;
    return Formatters.isValidPhone(v) ? null : phoneError;
  }

  /// SĐT bắt buộc (sổ địa chỉ, thanh toán) — cùng quy tắc `VN_PHONE_REGEX` của Backend.
  static String? requiredPhone(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return 'Vui lòng nhập số điện thoại';
    return Formatters.isValidPhone(v) ? null : phoneError;
  }

  static String? otp(String? value) =>
      _otp.hasMatch(value?.trim() ?? '') ? null : 'Mã OTP phải gồm đúng 6 chữ số';

  static String? required(String? value, String message) =>
      (value == null || value.trim().isEmpty) ? message : null;
}
