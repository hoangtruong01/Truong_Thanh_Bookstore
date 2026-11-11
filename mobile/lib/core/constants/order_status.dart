import '../theme/app_colors.dart';

/// Tông màu badge trạng thái — cùng tên với `StatusTone` của web
/// (`frontend/src/utils/helpers.ts`). Màu thật lấy từ [AppPalette] nên tự đổi
/// theo Sáng / Tối và luôn đạt tương phản chữ 4.5:1 (xem theme_test).
enum StatusToneName { amber, blue, indigo, purple, emerald, green, rose, sky, slate }

extension StatusToneNameResolve on StatusToneName {
  StatusTone resolve(AppPalette p) {
    switch (this) {
      case StatusToneName.amber:
        return p.statusPending;
      case StatusToneName.blue:
      case StatusToneName.sky:
        return p.statusConfirmed;
      case StatusToneName.indigo:
        return p.statusProcessing;
      case StatusToneName.purple:
        return p.statusShipping;
      case StatusToneName.emerald:
      case StatusToneName.green:
        return p.statusCompleted;
      case StatusToneName.rose:
        return p.statusCancelled;
      case StatusToneName.slate:
        return p.statusNeutral;
    }
  }
}

/// Nhãn + tông màu của một mã trạng thái Backend.
class StatusMeta {
  final String label;
  final StatusToneName tone;

  const StatusMeta(this.label, this.tone);
}

/// Bảng trạng thái chuẩn, chép từ nguồn duy nhất của web
/// (ORDER_STATUS_META / PAYMENT_STATUS_META / REFUND_STATUS_META /
/// PAYMENT_METHOD_LABELS trong `frontend/src/utils/helpers.ts`), khớp enum
/// Backend `backend/src/common/enums`. Đơn / thanh toán / hoàn tiền tách riêng
/// vì PENDING, CANCELLED, PROCESSING, REFUNDED trùng tên nhưng khác nghĩa.
abstract final class OrderStatusMeta {
  static const Map<String, StatusMeta> order = {
    'PENDING': StatusMeta('Chờ xác nhận', StatusToneName.amber),
    'CONFIRMED': StatusMeta('Đã xác nhận', StatusToneName.blue),
    'PROCESSING': StatusMeta('Đang chuẩn bị hàng', StatusToneName.indigo),
    'SHIPPING': StatusMeta('Đang giao hàng', StatusToneName.purple),
    'DELIVERED': StatusMeta('Đã giao thành công', StatusToneName.emerald),
    // Backend đã bỏ COMPLETED, giữ cho đơn cũ.
    'COMPLETED': StatusMeta('Hoàn thành', StatusToneName.green),
    'RETURN_REQUESTED': StatusMeta('Yêu cầu trả hàng', StatusToneName.amber),
    'RETURN_APPROVED': StatusMeta('Đã duyệt trả hàng', StatusToneName.sky),
    'RETURNED': StatusMeta('Đã trả hàng', StatusToneName.slate),
    'CANCELLED': StatusMeta('Đã hủy', StatusToneName.rose),
  };

  static const Map<String, StatusMeta> payment = {
    'UNPAID': StatusMeta('Chưa thanh toán', StatusToneName.amber),
    'PENDING': StatusMeta('Đang chờ thanh toán', StatusToneName.sky),
    'PARTIALLY_PAID': StatusMeta('Thanh toán một phần', StatusToneName.blue),
    'PAID': StatusMeta('Đã thanh toán', StatusToneName.emerald),
    'FAILED': StatusMeta('Thanh toán thất bại', StatusToneName.rose),
    'REFUNDED': StatusMeta('Đã hoàn tiền', StatusToneName.slate),
    'CANCELLED': StatusMeta('Đã hủy thanh toán', StatusToneName.slate),
  };

  /// NONE có nhãn rỗng: không hiển thị.
  static const Map<String, StatusMeta> refund = {
    'NONE': StatusMeta('', StatusToneName.slate),
    'REQUESTED': StatusMeta('Chờ hoàn tiền', StatusToneName.amber),
    'PROCESSING': StatusMeta('Đang hoàn tiền', StatusToneName.blue),
    'REFUNDED': StatusMeta('Đã hoàn tiền', StatusToneName.emerald),
    'FAILED': StatusMeta('Hoàn tiền thất bại', StatusToneName.rose),
    'MANUAL_REQUIRED': StatusMeta('Cần xử lý thủ công', StatusToneName.purple),
  };

  static const Map<String, String> paymentMethod = {
    'COD': 'Thanh toán khi nhận hàng (COD)',
    'BANK_TRANSFER': 'Chuyển khoản ngân hàng',
    'VNPAY': 'Cổng thanh toán VNPay',
    'MOMO': 'Ví điện tử MoMo',
    'EWALLET': 'Ví điện tử',
    'CASH': 'Tiền mặt',
    'CREDIT': 'Công nợ',
  };

  /// Trạng thái thô từ GHN (`order.shippingStatus`), nhóm như `mapGhnStatus`
  /// ở backend/src/modules/shipping/ghn-shipping.service.ts.
  static const Map<String, String> ghnShipping = {
    'ready_to_pick': 'Chờ lấy hàng',
    'picking': 'Đang lấy hàng',
    'money_collect_picking': 'Đang lấy hàng',
    'picked': 'Đã lấy hàng',
    'storing': 'Đang lưu kho',
    'transporting': 'Đang luân chuyển',
    'sorting': 'Đang phân loại',
    'delivering': 'Đang giao hàng',
    'money_collect_delivering': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'delivery_fail': 'Giao hàng thất bại',
    'waiting_to_return': 'Chờ trả hàng',
    'return': 'Trả hàng',
    'return_transporting': 'Đang luân chuyển hàng trả',
    'return_sorting': 'Đang phân loại hàng trả',
    'returning': 'Đang trả hàng',
    'returned': 'Đã trả hàng',
    'cancel': 'Đã hủy',
  };

  static String _key(String? status) => (status ?? '').trim().toUpperCase();

  static StatusMeta? orderMeta(String? status) => order[_key(status)];
  static StatusMeta? paymentMeta(String? status) => payment[_key(status)];
  static StatusMeta? refundMeta(String? status) => refund[_key(status)];

  /// Mã lạ hiển thị nguyên văn (giống web) thay vì để trống.
  static String orderLabel(String? status) => orderMeta(status)?.label ?? (status ?? '');

  /// Thiếu trạng thái thanh toán = chưa thanh toán (giống web).
  static String paymentLabel(String? status) {
    if (_key(status).isEmpty) return payment['UNPAID']!.label;
    return paymentMeta(status)?.label ?? status!;
  }

  static String refundLabel(String? status) => refundMeta(status)?.label ?? (status ?? '');

  static String paymentMethodLabel(String? method) {
    if (_key(method).isEmpty) return 'Chưa xác định';
    return paymentMethod[_key(method)] ?? method!;
  }

  static String ghnShippingLabel(String? status) {
    final raw = (status ?? '').trim();
    return ghnShipping[raw.toLowerCase()] ?? raw;
  }

  /// Tông màu cho badge; mã lạ dùng tông trung tính.
  static StatusTone orderTone(AppPalette p, String? status) =>
      (orderMeta(status)?.tone ?? StatusToneName.slate).resolve(p);
  static StatusTone paymentTone(AppPalette p, String? status) =>
      (paymentMeta(_key(status).isEmpty ? 'UNPAID' : status)?.tone ?? StatusToneName.slate).resolve(p);
  static StatusTone refundTone(AppPalette p, String? status) =>
      (refundMeta(status)?.tone ?? StatusToneName.slate).resolve(p);
}

/// Tab lọc lịch sử đơn hàng. Backend `GET /orders/my-orders` hiện bỏ qua
/// tham số `status`, nên lọc theo nhóm trên các trang đã tải.
enum OrderStatusFilter {
  all('Tất cả', {}),
  pending('Chờ xác nhận', {'PENDING'}),
  // Đơn đã xác nhận / đang chuẩn bị cũng đang trên đường tới khách.
  shipping('Đang giao', {'CONFIRMED', 'PROCESSING', 'SHIPPING'}),
  completed('Hoàn thành', {'DELIVERED', 'COMPLETED'}),
  cancelled('Đã hủy', {'CANCELLED'}),
  returns('Trả hàng', {'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED'});

  const OrderStatusFilter(this.label, this.statuses);

  final String label;
  final Set<String> statuses;

  bool matches(String status) =>
      statuses.isEmpty || statuses.contains(status.trim().toUpperCase());
}

/// Quy tắc thao tác phía khách, chép từ order-lifecycle.service.ts. Chỉ để
/// ẩn/hiện nút — Backend vẫn kiểm tra lại và trả lỗi nếu không hợp lệ.
abstract final class OrderActionRules {
  /// Khách chỉ được hủy đơn đang chờ xác nhận.
  static bool canCancel(String status) => status == 'PENDING';

  static const Duration returnWindow = Duration(days: 7);

  /// Trả hàng: đơn đã giao (DELIVERED / COMPLETED cũ) và trong 7 ngày kể từ
  /// khi giao. [deliveredAt] null (không rõ ngày giao) thì để Backend quyết.
  static bool canRequestReturn(String status, DateTime? deliveredAt, {DateTime? now}) {
    if (status != 'DELIVERED' && status != 'COMPLETED') return false;
    if (deliveredAt == null) return true;
    return (now ?? DateTime.now()).difference(deliveredAt) <= returnWindow;
  }

  static bool isReturnExpired(String status, DateTime? deliveredAt, {DateTime? now}) =>
      (status == 'DELIVERED' || status == 'COMPLETED') &&
      !canRequestReturn(status, deliveredAt, now: now);

  /// Link tra cứu vận đơn — chỉ GHN (backend chỉ hỗ trợ `shippingProvider: 'GHN'`).
  static Uri? ghnTrackingUri(String? provider, String? trackingCode) {
    final code = (trackingCode ?? '').trim();
    if (code.isEmpty) return null;
    final p = (provider ?? '').trim().toUpperCase();
    if (p.isNotEmpty && p != 'GHN') return null;
    return Uri.https('tracking.ghn.vn', '/', {'order_code': code});
  }
}
