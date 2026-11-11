import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/order_status.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/error_retry_widget.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';
import '../auth/login_screen.dart';
import 'widgets/order_widgets.dart';
import 'widgets/return_request_sheet.dart';

// Invoice PDF: GET /orders/:id/invoice needs an Authorization (or guest token)
// header, which an external browser cannot send, and the app has no
// file-saving package. The download button stays hidden until an
// authenticated download flow exists.

class OrderDetailScreen extends StatefulWidget {
  final OrderModel? order;
  final String? orderId;

  const OrderDetailScreen({
    super.key,
    this.order,
    this.orderId,
  }) : assert(order != null || orderId != null, 'Either order or orderId must be provided');

  /// Ngày giao lấy từ mốc DELIVERED mới nhất trong hành trình đơn.
  static DateTime? deliveredAtOf(OrderModel order) {
    for (final entry in order.timeline.reversed) {
      if (entry.status == 'DELIVERED') return DateTime.tryParse(entry.createdAt);
    }
    return null;
  }

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  OrderModel? _order;
  bool _isLoading = false;
  bool _isCancelling = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
    if (_order == null && widget.orderId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadOrder());
    }
  }

  String? get _orderId => _order?.id ?? widget.orderId;

  Future<void> _loadOrder() async {
    final id = _orderId;
    if (!mounted || id == null) return;
    setState(() {
      _isLoading = _order == null;
      _errorMessage = null;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final orderProvider = Provider.of<OrderProvider>(context, listen: false);
    await auth.sessionReady;
    if (!mounted) return;
    final fetched = await orderProvider.fetchOrderById(id, auth.token);

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (fetched != null) {
        _order = fetched;
      } else if (_order == null) {
        _errorMessage = 'Không tìm thấy thông tin đơn hàng';
      }
    });
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _cancelOrder(OrderModel order) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hủy đơn hàng?'),
        content: const Text('Bạn có chắc chắn muốn hủy đơn hàng này không?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Không')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Hủy đơn')),
        ],
      ),
    );
    if (confirm != true || !mounted) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final orderProvider = Provider.of<OrderProvider>(context, listen: false);
    setState(() => _isCancelling = true);
    final success = await orderProvider.cancelOrder(order.id, auth.token);
    if (!mounted) return;
    setState(() => _isCancelling = false);
    if (success) {
      _showSnack('Hủy đơn hàng thành công');
      await _loadOrder();
    } else {
      _showSnack('Không thể hủy đơn hàng. Vui lòng thử lại.');
    }
  }

  Future<void> _requestReturn(OrderModel order) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final orderProvider = Provider.of<OrderProvider>(context, listen: false);
    final sent = await showReturnRequestSheet(
      context,
      orderCode: order.orderCode,
      onSubmit: (reason) async {
        final token = auth.token;
        if (token == null || token.isEmpty) {
          throw Exception('Vui lòng đăng nhập để gửi yêu cầu trả hàng');
        }
        final updated = await orderProvider.requestReturn(order.id, reason, token);
        if (mounted && updated != null) setState(() => _order = updated);
      },
    );
    if (sent && mounted) {
      _showSnack('Đã gửi yêu cầu trả hàng. Cửa hàng sẽ sớm xem xét.');
    }
  }

  Future<void> _openTracking(Uri uri) async {
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && mounted) _showSnack('Không thể mở trang tra cứu vận đơn');
    } catch (_) {
      if (mounted) _showSnack('Không thể mở trang tra cứu vận đơn');
    }
  }

  Future<void> _copy(String value) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (mounted) _showSnack('Đã sao chép mã vận đơn');
  }

  void _openLogin() {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi tiết đơn hàng')),
        body: ListView(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          children: const [OrderItemSkeleton(), OrderItemSkeleton()],
        ),
      );
    }

    if (_errorMessage != null || _order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi tiết đơn hàng')),
        body: ErrorRetryWidget(
          icon: Icons.receipt_long_outlined,
          message: _errorMessage ?? 'Không tìm thấy thông tin đơn hàng',
          onRetry: _loadOrder,
        ),
      );
    }

    final order = _order!;
    final auth = Provider.of<AuthProvider>(context);
    final palette = context.palette;
    final text = Theme.of(context).textTheme;
    final isAuth = auth.isAuthenticated;
    final deliveredAt = OrderDetailScreen.deliveredAtOf(order);
    final canCancel = OrderActionRules.canCancel(order.orderStatus);
    final canReturn = isAuth && OrderActionRules.canRequestReturn(order.orderStatus, deliveredAt);
    final returnExpired = isAuth && OrderActionRules.isReturnExpired(order.orderStatus, deliveredAt);
    final showGuestReturnHint = !isAuth &&
        (order.orderStatus == 'DELIVERED' || order.orderStatus == 'COMPLETED');

    return Scaffold(
      appBar: AppBar(title: Text('Đơn hàng #${order.orderCode}')),
      body: RefreshIndicator(
        onRefresh: _loadOrder,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xxxl),
          children: [
            _buildHeader(context, order),
            if (showGuestReturnHint) ...[
              const SizedBox(height: AppSpacing.md),
              _Notice(
                tone: palette.statusPending,
                message: 'Cần đổi/trả hàng? Vui lòng đăng nhập bằng tài khoản đã đặt đơn '
                    'hoặc liên hệ hotline 0982938316 để được hỗ trợ.',
                actionLabel: 'Đăng nhập',
                onAction: _openLogin,
              ),
            ],
            if (returnExpired) ...[
              const SizedBox(height: AppSpacing.md),
              _Notice(
                tone: palette.statusNeutral,
                message: 'Đơn hàng đã giao quá 7 ngày nên không thể gửi yêu cầu trả hàng.',
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            _buildPaymentShipping(context, order),
            const SizedBox(height: AppSpacing.lg),
            OrderSectionCard(
              title: 'Thông tin người nhận',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _line(context, 'Họ tên', order.customerName ?? 'N/A'),
                  _line(context, 'Số điện thoại', order.phone),
                  if ((order.customerEmail ?? '').isNotEmpty) _line(context, 'Email', order.customerEmail!),
                  _line(context, 'Địa chỉ', order.shippingAddress),
                  if (order.note != null && order.note!.isNotEmpty) _line(context, 'Ghi chú', order.note!),
                ],
              ),
            ),
            if (order.timeline.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.lg),
              _buildTimeline(context, order),
            ],
            const SizedBox(height: AppSpacing.lg),
            _buildItems(context, order),
            const SizedBox(height: AppSpacing.lg),
            _buildSummary(context, order),
            if (canReturn) ...[
              const SizedBox(height: AppSpacing.xxl),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _requestReturn(order),
                  icon: const Icon(Icons.assignment_return_outlined, size: 18),
                  label: const Text('Yêu cầu trả hàng'),
                ),
              ),
            ],
            if (canCancel) ...[
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _isCancelling ? null : () => _cancelOrder(order),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: palette.primaryText,
                    side: BorderSide(color: palette.primaryText),
                  ),
                  child: _isCancelling
                      ? SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: palette.primaryText),
                        )
                      : const Text('Hủy đơn hàng'),
                ),
              ),
            ],
            if (!isAuth && order.orderStatus == 'PENDING') ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Bạn chỉ có thể hủy khi đơn đang chờ xác nhận.',
                textAlign: TextAlign.center,
                style: text.labelSmall,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _line(BuildContext context, String label, String value) {
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Text.rich(
        TextSpan(children: [
          TextSpan(text: '$label: ', style: text.bodySmall),
          TextSpan(text: value, style: text.bodyMedium),
        ]),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, OrderModel order) {
    final palette = context.palette;
    final text = Theme.of(context).textTheme;
    return OrderSectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('Mã đơn: #${order.orderCode}', style: text.titleSmall),
              ),
              const SizedBox(width: AppSpacing.sm),
              OrderStatusBadge(
                label: OrderStatusMeta.orderLabel(order.orderStatus),
                tone: OrderStatusMeta.orderTone(palette, order.orderStatus),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text('Ngày đặt: ${Formatters.formatDate(order.createdAt)}', style: text.labelSmall),
        ],
      ),
    );
  }

  Widget _buildPaymentShipping(BuildContext context, OrderModel order) {
    final palette = context.palette;
    final text = Theme.of(context).textTheme;
    final trackingCode = order.trackingCode?.trim() ?? '';
    final trackingUri = OrderActionRules.ghnTrackingUri(order.shippingProvider, trackingCode);
    final shippingStatus = order.shippingStatus?.trim() ?? '';

    return OrderSectionCard(
      title: 'Thanh toán và vận chuyển',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _line(context, 'Phương thức', OrderStatusMeta.paymentMethodLabel(order.paymentMethod)),
          const SizedBox(height: AppSpacing.xxs),
          Row(
            children: [
              Text('Trạng thái thanh toán: ', style: text.bodySmall),
              Flexible(
                child: OrderStatusBadge(
                  label: OrderStatusMeta.paymentLabel(order.paymentStatus),
                  tone: OrderStatusMeta.paymentTone(palette, order.paymentStatus),
                ),
              ),
            ],
          ),
          if ((order.promotionCode ?? '').isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            _line(context, 'Mã giảm giá đã dùng', order.promotionCode!),
          ],
          if (trackingCode.isNotEmpty) ...[
            const Divider(height: AppSpacing.xxl),
            Row(
              children: [
                Expanded(
                  child: _line(context, 'Mã vận đơn ${order.shippingProvider ?? 'GHN'}', trackingCode),
                ),
                IconButton(
                  tooltip: 'Sao chép mã vận đơn',
                  icon: const Icon(Icons.copy_rounded, size: 18),
                  onPressed: () => _copy(trackingCode),
                ),
              ],
            ),
            if (shippingStatus.isNotEmpty)
              _line(context, 'Trạng thái đối tác', OrderStatusMeta.ghnShippingLabel(shippingStatus)),
            if (trackingUri != null)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  style: TextButton.styleFrom(padding: EdgeInsets.zero),
                  onPressed: () => _openTracking(trackingUri),
                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                  label: const Text('Tra cứu GHN'),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildTimeline(BuildContext context, OrderModel order) {
    final palette = context.palette;
    final text = Theme.of(context).textTheme;
    final entries = order.timeline.reversed.toList();
    return OrderSectionCard(
      title: 'Hành trình đơn hàng',
      child: Column(
        children: List.generate(entries.length, (index) {
          final entry = entries[index];
          final isFirst = index == 0;
          final isLast = index == entries.length - 1;
          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      margin: const EdgeInsets.only(top: AppSpacing.xxs),
                      decoration: BoxDecoration(
                        color: isFirst ? palette.primary : palette.border,
                        shape: BoxShape.circle,
                        border: isFirst
                            ? Border.all(color: palette.primarySoft, width: 3, strokeAlign: BorderSide.strokeAlignOutside)
                            : null,
                      ),
                    ),
                    if (!isLast)
                      Expanded(child: Container(width: 2, color: palette.border)),
                  ],
                ),
                const SizedBox(width: AppSpacing.lg),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          OrderStatusMeta.orderLabel(entry.status),
                          style: text.labelMedium?.copyWith(
                            color: isFirst ? palette.primaryText : palette.textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        Text(Formatters.formatDate(entry.createdAt), style: text.labelSmall),
                        if (entry.note.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.xs),
                          Text(entry.note, style: text.bodySmall),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildItems(BuildContext context, OrderModel order) {
    final text = Theme.of(context).textTheme;
    return OrderSectionCard(
      title: 'Danh sách sản phẩm (${order.items.length})',
      child: Column(
        children: [
          for (var i = 0; i < order.items.length; i++) ...[
            if (i > 0) const Divider(height: AppSpacing.xl),
            Row(
              children: [
                OrderItemThumbnail(imageUrl: order.items[i].image),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(order.items[i].name, style: text.labelMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        '${Formatters.formatCurrency(order.items[i].price)} x ${order.items[i].quantity}',
                        style: text.labelSmall,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  Formatters.formatCurrency(order.items[i].price * order.items[i].quantity),
                  style: text.labelMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSummary(BuildContext context, OrderModel order) {
    final palette = context.palette;
    return OrderSectionCard(
      child: Column(
        children: [
          OrderInfoRow(label: 'Tạm tính', value: Formatters.formatCurrency(order.subtotal)),
          const SizedBox(height: AppSpacing.sm),
          OrderInfoRow(
            label: 'Phí vận chuyển',
            value: order.shippingFee == 0 ? 'Miễn phí' : Formatters.formatCurrency(order.shippingFee),
          ),
          if (order.discount > 0) ...[
            const SizedBox(height: AppSpacing.sm),
            OrderInfoRow(
              label: 'Giảm giá',
              value: '-${Formatters.formatCurrency(order.discount)}',
              valueColor: palette.primaryText,
            ),
          ],
          if (order.loyaltyDiscount > 0) ...[
            const SizedBox(height: AppSpacing.sm),
            OrderInfoRow(
              label: 'Điểm thưởng (${order.loyaltyPointsUsed} điểm)',
              value: '-${Formatters.formatCurrency(order.loyaltyDiscount)}',
              valueColor: palette.primaryText,
            ),
          ],
          const Divider(height: AppSpacing.xxl),
          OrderInfoRow(
            label: 'Tổng cộng',
            value: Formatters.formatCurrency(order.total),
            valueColor: palette.primaryText,
            emphasize: true,
          ),
        ],
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  final StatusTone tone;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _Notice({required this.tone, required this.message, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(color: tone.background, borderRadius: AppRadii.button),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded, size: 18, color: tone.foreground),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(message, style: text.bodySmall?.copyWith(color: tone.foreground))),
          if (actionLabel != null && onAction != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(foregroundColor: tone.foreground),
              child: Text(actionLabel!),
            ),
        ],
      ),
    );
  }
}
