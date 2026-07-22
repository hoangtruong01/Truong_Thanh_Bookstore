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

  static bool isValidPhone(String phone) {
    final RegExp regExp = RegExp(r'^0\d{9}$');
    return regExp.hasMatch(phone.trim());
  }

  static int getDiscountPercent(num price, num discountPrice) {
    if (discountPrice <= 0 || discountPrice >= price) return 0;
    return (((price - discountPrice) / price) * 100).round();
  }
}
