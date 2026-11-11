import 'package:intl/intl.dart';

class Formatters {
  static String formatCurrency(dynamic price) {
    if (price == null) return '0đ';
    final num number = price is num ? price : num.tryParse(price.toString()) ?? 0;
    final formatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);
    return formatter.format(number).replaceAll(' ', '');
  }

  static String formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final DateTime dt = DateTime.parse(dateStr).toLocal();
      return DateFormat('dd/MM/yyyy HH:mm').format(dt);
    } catch (_) {
      return dateStr;
    }
  }

  /// Same rule as the backend `VN_PHONE_REGEX` (`@IsPhoneNumberVN`): mobile prefixes
  /// 03x/05x/07x/08x/09x, written as `0…` or `+84…`.
  static final RegExp vnPhoneRegex = RegExp(r'^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$');

  static bool isValidPhone(String phone) => vnPhoneRegex.hasMatch(phone.trim());

  /// Rewrites a `+84…` / `84…` number to the 10-digit `0…` form used by the input fields
  /// (spaces, dots and dashes removed). Other values are returned trimmed.
  static String normalizePhone(String? phone) {
    final raw = (phone ?? '').trim();
    final compact = raw.replaceAll(RegExp(r'[\s.\-]'), '');
    if (compact.startsWith('+84') && compact.length == 12) return '0${compact.substring(3)}';
    if (compact.startsWith('84') && compact.length == 11) return '0${compact.substring(2)}';
    return RegExp(r'^\d+$').hasMatch(compact) ? compact : raw;
  }

  static int getDiscountPercent(num price, num discountPrice) {
    if (discountPrice <= 0 || discountPrice >= price) return 0;
    return (((price - discountPrice) / price) * 100).round();
  }
}
