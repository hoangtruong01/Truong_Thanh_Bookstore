import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/shimmer_loading.dart';

/// Pill trạng thái (đơn hàng / thanh toán) với tông màu theo theme.
class OrderStatusBadge extends StatelessWidget {
  final String label;
  final StatusTone tone;

  const OrderStatusBadge({super.key, required this.label, required this.tone});

  @override
  Widget build(BuildContext context) {
    if (label.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm + 2, vertical: AppSpacing.xs),
      decoration: BoxDecoration(
        color: tone.background,
        borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: tone.foreground,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

/// Thẻ nội dung dùng chung cho màn đơn hàng (nền + viền theo theme).
class OrderSectionCard extends StatelessWidget {
  final String? title;
  final Widget child;
  final EdgeInsetsGeometry padding;

  const OrderSectionCard({
    super.key,
    this.title,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.lg),
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: AppRadii.card,
        border: Border.all(color: palette.border),
      ),
      child: title == null
          ? child
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title!, style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: AppSpacing.md),
                child,
              ],
            ),
    );
  }
}

/// Ảnh sản phẩm trong đơn, có cache + skeleton + ảnh dự phòng.
class OrderItemThumbnail extends StatelessWidget {
  final String? imageUrl;
  final double size;

  const OrderItemThumbnail({super.key, required this.imageUrl, this.size = 48});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final fallback = Container(
      width: size,
      height: size,
      color: palette.surfaceMuted,
      child: Icon(Icons.menu_book_rounded, size: size / 2, color: palette.textMuted),
    );
    final url = imageUrl?.trim() ?? '';
    return ClipRRect(
      borderRadius: const BorderRadius.all(Radius.circular(AppRadii.sm)),
      child: url.isEmpty
          ? fallback
          : CachedNetworkImage(
              imageUrl: url,
              width: size,
              height: size,
              fit: BoxFit.cover,
              placeholder: (context, url) => ShimmerSkeleton(width: size, height: size, borderRadius: 0),
              errorWidget: (context, url, error) => fallback,
            ),
    );
  }
}

/// Một dòng nhãn — giá trị (tóm tắt chi phí, thông tin thanh toán).
class OrderInfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool emphasize;

  const OrderInfoRow({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
    this.emphasize = false,
  });

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: text.bodySmall)),
        const SizedBox(width: AppSpacing.md),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: (emphasize ? text.titleMedium : text.labelMedium)?.copyWith(
              color: valueColor,
              fontWeight: emphasize ? FontWeight.w800 : FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}
