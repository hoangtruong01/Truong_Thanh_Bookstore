import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../models/payment_methods_model.dart';
import '../cart/widgets/commerce_widgets.dart';
import '../order/order_detail_screen.dart';

/// Labels shared by the checkout picker and the success summary (same copy as web).
const Map<String, ({String label, String description})> paymentMethodCopy = {
  PaymentMethodsConfig.methodCod: (
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi.',
  ),
  PaymentMethodsConfig.methodBankTransfer: (
    label: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản theo số tài khoản hoặc quét QR, đối soát và xác nhận nhanh.',
  ),
  PaymentMethodsConfig.methodVnpay: (
    label: 'Cổng thanh toán VNPay',
    description: 'Thanh toán an toàn qua VNPAY-QR, thẻ ATM nội địa hoặc thẻ quốc tế.',
  ),
  PaymentMethodsConfig.methodMomo: (
    label: 'Ví điện tử MoMo',
    description: 'Thanh toán qua ứng dụng MoMo.',
  ),
};

String paymentMethodLabel(String method) => paymentMethodCopy[method]?.label ?? method;

/// Everything the success screen shows. All amounts are the server's order total.
class OrderSuccessData {
  final String orderId;
  final String orderCode;
  final num total;
  final String recipientName;
  final String recipientPhone;
  final String address;
  final String paymentMethod;
  final BankTransferConfig? bankTransfer;
  final String? paymentRedirectUrl;
  final String? paymentInstructions;
  final String? paymentError;

  const OrderSuccessData({
    required this.orderId,
    required this.orderCode,
    required this.total,
    required this.recipientName,
    required this.recipientPhone,
    required this.address,
    required this.paymentMethod,
    this.bankTransfer,
    this.paymentRedirectUrl,
    this.paymentInstructions,
    this.paymentError,
  });
}

class OrderSuccessScreen extends StatelessWidget {
  final OrderSuccessData data;

  const OrderSuccessScreen({super.key, required this.data});

  static Future<void> copy(BuildContext context, String text, String label) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Đã sao chép $label')));
  }

  Future<void> _openPayment(BuildContext context) async {
    final uri = Uri.tryParse(data.paymentRedirectUrl ?? '');
    final messenger = ScaffoldMessenger.of(context);
    final launched = uri != null && await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      messenger.showSnackBar(const SnackBar(content: Text('Không mở được trang thanh toán. Vui lòng thử lại.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final hasCode = data.orderCode.isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: const Text('Đặt hàng thành công'), automaticallyImplyLeading: false),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            const SizedBox(height: AppSpacing.sm),
            Center(
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(color: palette.successSoft, shape: BoxShape.circle),
                child: Icon(Icons.check_circle_rounded, size: 56, color: palette.success),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Đặt hàng thành công', textAlign: TextAlign.center, style: textTheme.headlineSmall),
            const SizedBox(height: AppSpacing.xs),
            Text('Cảm ơn quý khách đã đặt mua tại Nhà Sách Trường Thành.',
                textAlign: TextAlign.center, style: textTheme.bodyMedium?.copyWith(color: palette.textSecondary)),
            const SizedBox(height: AppSpacing.xl),
            CommerceCard(
              child: Column(
                children: [
                  _InfoRow(
                    label: 'Mã đơn hàng',
                    value: hasCode ? '#${data.orderCode}' : '-',
                    action: hasCode ? () => copy(context, data.orderCode, 'mã đơn hàng') : null,
                  ),
                  _InfoRow(label: 'Người nhận', value: '${data.recipientName} (${data.recipientPhone})'),
                  _InfoRow(label: 'Địa chỉ giao', value: data.address),
                  _InfoRow(label: 'Phương thức', value: paymentMethodLabel(data.paymentMethod)),
                  Divider(height: AppSpacing.xl, color: palette.border),
                  Row(
                    children: [
                      Expanded(child: Text('Tổng thanh toán', style: textTheme.titleSmall)),
                      Text(Formatters.formatCurrency(data.total),
                          style: textTheme.titleMedium?.copyWith(color: palette.primaryText, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (data.paymentMethod == PaymentMethodsConfig.methodBankTransfer)
              _BankTransferInstructions(data: data)
            else if (data.paymentMethod == PaymentMethodsConfig.methodCod)
              NoticeBanner(
                tone: NoticeTone.info,
                icon: Icons.inventory_2_outlined,
                title: 'Thanh toán khi nhận hàng (COD)',
                messages: [
                  'Đơn hàng sẽ được đóng gói và giao đến quý khách trong 2 - 4 ngày làm việc. '
                      'Quý khách vui lòng chuẩn bị ${Formatters.formatCurrency(data.total)} khi nhận hàng.',
                ],
              )
            else ...[
              if (data.paymentError != null)
                NoticeBanner(tone: NoticeTone.warning, messages: [data.paymentError!])
              else
                NoticeBanner(
                  tone: NoticeTone.info,
                  icon: Icons.open_in_new_rounded,
                  title: 'Hoàn tất thanh toán ${paymentMethodLabel(data.paymentMethod)}',
                  messages: [
                    data.paymentInstructions ??
                        'Trang thanh toán đã được mở. Đơn hàng sẽ được xác nhận sau khi thanh toán thành công.',
                  ],
                ),
              if (data.paymentRedirectUrl != null) ...[
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  onPressed: () => _openPayment(context),
                  icon: const Icon(Icons.payment_rounded),
                  label: const Text('Mở lại trang thanh toán'),
                ),
              ],
            ],
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: data.orderId.isEmpty
                    ? null
                    : () => Navigator.of(context).pushReplacement(MaterialPageRoute(
                          builder: (_) => OrderDetailScreen(orderId: data.orderId),
                        )),
                child: const Text('Xem tình trạng đơn hàng'),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              height: 50,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                child: const Text('Tiếp tục mua sắm'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BankTransferInstructions extends StatelessWidget {
  final OrderSuccessData data;

  const _BankTransferInstructions({required this.data});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final tone = palette.statusPending;
    final bank = data.bankTransfer;
    final amountText = Formatters.formatCurrency(data.total);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tone.background,
        borderRadius: AppRadii.card,
        border: Border.all(color: palette.warning.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.account_balance_outlined, color: tone.foreground),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text('Hướng dẫn chuyển khoản ngân hàng',
                    style: textTheme.titleSmall?.copyWith(color: tone.foreground)),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Quý khách vui lòng chuyển khoản theo đúng thông tin bên dưới và ghi rõ mã đơn hàng trong nội dung '
            'chuyển khoản. Nhà sách sẽ đối soát và xử lý giao hàng ngay sau khi nhận được tiền.',
            style: textTheme.bodySmall?.copyWith(color: tone.foreground),
          ),
          const SizedBox(height: AppSpacing.md),
          if (bank != null && bank.hasAccount)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(color: palette.surface, borderRadius: AppRadii.button),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.xs),
                    decoration: BoxDecoration(
                      // QR codes need a light quiet zone to scan, also in dark mode.
                      color: AppColors.white,
                      borderRadius: AppRadii.button,
                      border: Border.all(color: palette.border),
                    ),
                    child: CachedNetworkImage(
                      imageUrl: bank.vietQrUrl(amount: data.total, orderCode: data.orderCode),
                      width: 176,
                      height: 176,
                      fit: BoxFit.contain,
                      placeholder: (context, url) => const ShimmerSkeleton(width: 176, height: 176),
                      errorWidget: (context, url, error) => SizedBox(
                        width: 176,
                        height: 176,
                        child: Center(
                          child: Text('Không tải được mã QR', style: textTheme.bodySmall, textAlign: TextAlign.center),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text('Quét QR bằng ứng dụng ngân hàng bất kỳ', style: textTheme.labelSmall),
                  const SizedBox(height: AppSpacing.md),
                  _InfoRow(label: 'Ngân hàng', value: bank.bankName.isNotEmpty ? bank.bankName : 'Ngân hàng'),
                  _InfoRow(
                    label: 'Số tài khoản',
                    value: bank.accountNumber,
                    action: () => OrderSuccessScreen.copy(context, bank.accountNumber, 'số tài khoản'),
                  ),
                  _InfoRow(label: 'Chủ tài khoản', value: bank.displayHolder),
                  _InfoRow(
                    label: 'Số tiền',
                    value: amountText,
                    highlight: true,
                    action: () => OrderSuccessScreen.copy(context, '${data.total.round()}', 'số tiền'),
                  ),
                  _InfoRow(
                    label: 'Nội dung (bắt buộc)',
                    value: data.orderCode,
                    highlight: true,
                    action: () => OrderSuccessScreen.copy(context, data.orderCode, 'nội dung chuyển khoản'),
                  ),
                ],
              ),
            )
          else
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(color: palette.surface, borderRadius: AppRadii.button),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InfoRow(label: 'Mã đơn hàng', value: '#${data.orderCode}'),
                  _InfoRow(label: 'Số tiền cần thanh toán', value: amountText, highlight: true),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Vui lòng liên hệ hotline 0982938316 để được hướng dẫn thông tin tài khoản chuyển khoản.',
                    style: textTheme.bodySmall,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback? action;
  final bool highlight;

  const _InfoRow({required this.label, required this.value, this.action, this.highlight = false});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(width: 120, child: Text(label, style: textTheme.bodySmall)),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: highlight ? palette.primaryText : palette.textPrimary,
              ),
            ),
          ),
          if (action != null)
            TextButton(
              onPressed: action,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                minimumSize: const Size(0, 32),
              ),
              child: const Text('Sao chép'),
            ),
        ],
      ),
    );
  }
}
