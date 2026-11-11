import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/utils/formatters.dart';
import '../../../providers/cart_provider.dart';
import 'commerce_widgets.dart';
import 'voucher_bottom_sheet.dart';

/// Voucher entry: the code is validated and priced by the server preview.
class VoucherCard extends StatefulWidget {
  const VoucherCard({super.key});

  @override
  State<VoucherCard> createState() => _VoucherCardState();
}

class _VoucherCardState extends State<VoucherCard> {
  final TextEditingController _controller = TextEditingController();
  bool _applying = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    final code = _controller.text.trim();
    if (_applying || code.isEmpty) return;
    final cart = context.read<CartProvider>();
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _applying = true);
    final ok = await cart.applyCoupon(code);
    if (!mounted) return;
    setState(() => _applying = false);
    if (ok) {
      _controller.clear();
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
    final applied = cart.appliedPromotion;

    return CommerceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CommerceSectionTitle(
            'Mã giảm giá',
            trailing: TextButton(
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                showDragHandle: true,
                builder: (_) => const VoucherBottomSheet(),
              ),
              child: const Text('Chọn mã'),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          if (applied != null)
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: palette.statusCompleted.background,
                borderRadius: AppRadii.button,
                border: Border.all(color: palette.success.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Đã áp dụng: ${applied.code}',
                            style: textTheme.labelMedium?.copyWith(
                                color: palette.statusCompleted.foreground, fontWeight: FontWeight.w700)),
                        Text('Giảm ${Formatters.formatCurrency(cart.discountAmount)}',
                            style: textTheme.bodySmall?.copyWith(color: palette.statusCompleted.foreground)),
                      ],
                    ),
                  ),
                  TextButton(onPressed: cart.removeCoupon, child: const Text('Gỡ mã')),
                ],
              ),
            )
          else
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textCapitalization: TextCapitalization.characters,
                    maxLength: 30,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _apply(),
                    decoration: const InputDecoration(
                      hintText: 'Nhập mã giảm giá',
                      counterText: '',
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                ElevatedButton(
                  onPressed: _applying ? null : _apply,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                  ),
                  child: _applying
                      ? SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: palette.onPrimary),
                        )
                      : const Text('Áp dụng'),
                ),
              ],
            ),
          if (cart.promoError != null && applied == null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(cart.promoError!, style: textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.error)),
          ],
        ],
      ),
    );
  }
}

/// Server-priced totals for the selected lines: skeleton while the first preview loads,
/// error banner with retry when it fails, then the backend numbers.
class CartPricingSummary extends StatelessWidget {
  final String totalLabel;
  final VoidCallback? onRetry;
  final bool showLoyalty;

  const CartPricingSummary({
    super.key,
    required this.totalLabel,
    this.onRetry,
    this.showLoyalty = false,
  });

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final pricing = cart.pricing;

    final children = <Widget>[
      if (cart.pricingError != null) ...[
        NoticeBanner(
          key: const ValueKey('pricing-error'),
          tone: NoticeTone.error,
          messages: [cart.pricingError!],
          onRetry: onRetry ?? () => cart.refreshPricing(immediate: true),
        ),
        const SizedBox(height: AppSpacing.sm),
      ],
    ];

    if (!cart.hasSelection) {
      children.add(Text('Chọn sản phẩm để xem tổng tiền.', style: textTheme.bodySmall));
    } else if (pricing == null && cart.pricingLoading) {
      children.add(const PricingSkeleton());
    } else if (pricing != null) {
      final loyalty = cart.loyalty;
      final standardFee = cart.standardShippingFee ?? 0;
      children.addAll([
        SummaryRow(label: 'Tạm tính', value: Formatters.formatCurrency(cart.subtotal)),
        SummaryRow(
          label: 'Phí vận chuyển',
          value: cart.shippingFee == 0 ? 'Miễn phí' : Formatters.formatCurrency(cart.shippingFee),
          strikeValue: cart.shippingFee == 0 && standardFee > 0 ? Formatters.formatCurrency(standardFee) : null,
          tone: cart.shippingFee == 0 ? SummaryTone.success : SummaryTone.normal,
        ),
        if (cart.discountAmount > 0)
          SummaryRow(
            label: 'Mã giảm giá',
            labelTrailing: cart.appliedPromotion != null ? CodeBadge(cart.appliedPromotion!.code) : null,
            value: '-${Formatters.formatCurrency(cart.discountAmount)}',
            tone: SummaryTone.discount,
          ),
        if (showLoyalty && cart.loyaltyDiscount > 0)
          SummaryRow(
            label: loyalty != null && loyalty.appliedPoints > 0
                ? 'Điểm thưởng (${loyalty.appliedPoints} điểm)'
                : 'Điểm thưởng',
            value: '-${Formatters.formatCurrency(cart.loyaltyDiscount)}',
            tone: SummaryTone.loyalty,
          ),
        Divider(height: AppSpacing.xxl, color: palette.border),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(totalLabel, style: textTheme.titleSmall),
                  Text(cart.pricingLoading ? 'Đang cập nhật giá...' : 'Đã bao gồm VAT',
                      style: textTheme.labelSmall),
                ],
              ),
            ),
            AnimatedOpacity(
              duration: const Duration(milliseconds: 150),
              opacity: cart.pricingLoading ? 0.5 : 1,
              child: Text(
                Formatters.formatCurrency(cart.total),
                key: const ValueKey('pricing-total'),
                style: textTheme.titleLarge?.copyWith(color: palette.primaryText, fontWeight: FontWeight.w900),
              ),
            ),
          ],
        ),
      ]);
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }
}
