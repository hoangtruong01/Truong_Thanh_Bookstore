import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../../../core/widgets/error_retry_widget.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../../../models/promotion_model.dart';
import '../../../providers/cart_provider.dart';

/// Suggested vouchers. The list is display-only: applying a code always goes through the
/// server preview, which decides whether it applies and how much it discounts.
class VoucherBottomSheet extends StatefulWidget {
  const VoucherBottomSheet({super.key});

  @override
  State<VoucherBottomSheet> createState() => _VoucherBottomSheetState();
}

class _VoucherBottomSheetState extends State<VoucherBottomSheet> {
  String? _applyingCode;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final cart = context.read<CartProvider>();
      if (cart.activePromotions.isEmpty && !cart.promotionsLoading) cart.fetchActivePromotions();
    });
  }

  Future<void> _toggle(PromotionModel promo, bool isApplied) async {
    if (_applyingCode != null) return;
    final cart = context.read<CartProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    if (isApplied) {
      await cart.removeCoupon();
      if (mounted) navigator.pop();
      return;
    }
    setState(() => _applyingCode = promo.code);
    final ok = await cart.applyCoupon(promo.code);
    if (!mounted) return;
    setState(() => _applyingCode = null);
    if (ok) {
      navigator.pop();
      messenger.showSnackBar(const SnackBar(content: Text('Áp dụng mã giảm giá thành công')));
    } else {
      messenger.showSnackBar(SnackBar(content: Text(cart.promoError ?? 'Mã giảm giá không hợp lệ')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final promotions = cart.activePromotions;

    Widget body;
    if (cart.promotionsLoading && promotions.isEmpty) {
      body = Column(
        children: List.generate(
          3,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: AppSpacing.md),
            child: ShimmerSkeleton(height: 84, borderRadius: AppRadii.lg),
          ),
        ),
      );
    } else if (cart.promotionsError != null && promotions.isEmpty) {
      body = ErrorRetryWidget(message: cart.promotionsError!, onRetry: cart.fetchActivePromotions);
    } else if (promotions.isEmpty) {
      body = const EmptyStateWidget(
        icon: Icons.confirmation_number_outlined,
        title: 'Chưa có mã giảm giá',
        message: 'Hiện chưa có mã giảm giá nào đang diễn ra.',
      );
    } else {
      body = ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: promotions.length,
        separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (context, index) {
          final promo = promotions[index];
          final isApplied = cart.appliedPromotion?.code.toUpperCase() == promo.code.toUpperCase();
          // Display hint only (mirrors web); the server re-checks the minimum order.
          final belowMinimum = cart.pricing != null && cart.subtotal < promo.minOrderValue;
          return _VoucherTicket(
            promo: promo,
            isApplied: isApplied,
            isBusy: _applyingCode == promo.code,
            enabled: _applyingCode == null && (isApplied || !belowMinimum),
            onPressed: () => _toggle(promo, isApplied),
          );
        },
      );
    }

    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.md, AppSpacing.xl, AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.confirmation_number_outlined, color: palette.primaryText),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: Text('Chọn mã giảm giá', style: textTheme.titleMedium)),
                IconButton(
                  tooltip: 'Đóng',
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            body,
          ],
        ),
      ),
    );
  }
}

class _VoucherTicket extends StatelessWidget {
  final PromotionModel promo;
  final bool isApplied;
  final bool isBusy;
  final bool enabled;
  final VoidCallback onPressed;

  const _VoucherTicket({
    required this.promo,
    required this.isApplied,
    required this.isBusy,
    required this.enabled,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final headline = promo.discountType == 'PERCENT'
        ? 'Giảm ${promo.discountValue}%'
        : 'Giảm ${Formatters.formatCurrency(promo.discountValue)}';
    return ClipPath(
      clipper: TicketClipper(separatorX: 80.0, cutoutRadius: 7.0),
      child: Container(
        constraints: const BoxConstraints(minHeight: 94),
        decoration: BoxDecoration(
          color: isApplied ? palette.primarySoft : palette.surfaceMuted,
          borderRadius: BorderRadius.circular(AppRadii.md + 2),
          border: Border.all(
            color: isApplied ? palette.primary : palette.border,
            width: isApplied ? 1.5 : 1,
          ),
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 80,
                color: isApplied ? palette.primary : palette.textSecondary,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.confirmation_number_rounded, color: palette.onPrimary, size: 26),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Voucher',
                      style: textTheme.labelSmall?.copyWith(color: palette.onPrimary, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: 1,
                child: CustomPaint(
                  painter: DashedLinePainter(
                    color: isApplied ? palette.primary.withValues(alpha: 0.4) : palette.border,
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md + 2, vertical: AppSpacing.sm),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(promo.code,
                                style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
                            const SizedBox(height: AppSpacing.xxs),
                            Text(headline,
                                style: textTheme.labelMedium?.copyWith(color: palette.primaryText)),
                            if ((promo.description ?? '').isNotEmpty)
                              Text(
                                promo.description!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: textTheme.bodySmall,
                              ),
                            if (promo.minOrderValue > 0)
                              Text(
                                'Đơn tối thiểu ${Formatters.formatCurrency(promo.minOrderValue)}',
                                style: textTheme.labelSmall,
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      ElevatedButton(
                        onPressed: enabled ? onPressed : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isApplied ? palette.textSecondary : palette.primary,
                          foregroundColor: palette.onPrimary,
                          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs + 2),
                          minimumSize: const Size(0, 36),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(AppRadii.sm))),
                          textStyle: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        child: isBusy
                            ? SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: palette.onPrimary),
                              )
                            : Text(isApplied ? 'Bỏ chọn' : 'Áp dụng'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TicketClipper extends CustomClipper<Path> {
  final double separatorX;
  final double cutoutRadius;

  TicketClipper({this.separatorX = 80.0, this.cutoutRadius = 7.0});

  @override
  Path getClip(Size size) {
    final path = Path();
    path.moveTo(0, 0);

    // Top edge to cutout
    path.lineTo(separatorX - cutoutRadius, 0);
    path.arcToPoint(
      Offset(separatorX + cutoutRadius, 0),
      radius: Radius.circular(cutoutRadius),
      clockwise: false,
    );
    path.lineTo(size.width, 0);

    // Right edge
    path.lineTo(size.width, size.height);

    // Bottom edge to cutout
    path.lineTo(separatorX + cutoutRadius, size.height);
    path.arcToPoint(
      Offset(separatorX - cutoutRadius, size.height),
      radius: Radius.circular(cutoutRadius),
      clockwise: false,
    );
    path.lineTo(0, size.height);

    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant TicketClipper oldClipper) =>
      oldClipper.separatorX != separatorX || oldClipper.cutoutRadius != cutoutRadius;
}

class DashedLinePainter extends CustomPainter {
  final Color color;
  final double dashHeight;
  final double dashSpace;

  DashedLinePainter({
    required this.color,
    this.dashHeight = 4.0,
    this.dashSpace = 3.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    double startY = 4.0;
    final paint = Paint()
      ..color = color
      ..strokeWidth = size.width
      ..style = PaintingStyle.stroke;

    while (startY < size.height - 4.0) {
      canvas.drawLine(
        Offset(0, startY),
        Offset(0, startY + dashHeight),
        paint,
      );
      startY += dashHeight + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant DashedLinePainter oldDelegate) => oldDelegate.color != color;
}
