import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';

/// Ba cam kết dịch vụ — cùng nội dung mô tả của web (chính hãng, giao toàn
/// quốc, đổi trả 7 ngày).
class HomeTrustBar extends StatelessWidget {
  const HomeTrustBar({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.sm),
        decoration: BoxDecoration(
          color: palette.surface,
          borderRadius: AppRadii.card,
          border: Border.all(color: palette.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: _TrustItem(
                icon: Icons.verified_user_rounded,
                color: palette.success,
                background: palette.successSoft,
                title: 'Hàng chính hãng',
              ),
            ),
            Expanded(
              child: _TrustItem(
                icon: Icons.local_shipping_rounded,
                color: palette.info,
                background: palette.infoSoft,
                title: 'Giao toàn quốc',
              ),
            ),
            Expanded(
              child: _TrustItem(
                icon: Icons.autorenew_rounded,
                color: palette.accent,
                background: palette.accentSoft,
                title: 'Đổi trả 7 ngày',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final Color background;
  final String title;

  const _TrustItem({
    required this.icon,
    required this.color,
    required this.background,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(color: background, shape: BoxShape.circle),
          child: Icon(icon, size: 14, color: color),
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: context.palette.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
      ],
    );
  }
}
