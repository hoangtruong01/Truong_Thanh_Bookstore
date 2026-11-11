import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';

/// Tiêu đề một khối trên trang chủ: icon + tiêu đề + nút "Xem tất cả".
class HomeSectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onSeeAll;
  final EdgeInsetsGeometry padding;

  const HomeSectionHeader({
    super.key,
    required this.icon,
    required this.title,
    this.onSeeAll,
    this.padding = const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: padding,
      child: Row(
        children: [
          Icon(icon, size: 18, color: palette.primaryText),
          const SizedBox(width: 6),
          Expanded(
            child: Semantics(
              header: true,
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
          ),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                foregroundColor: palette.textSecondary,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                minimumSize: const Size(48, 36),
                textStyle: textTheme.labelMedium,
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Xem tất cả'),
                  Icon(Icons.chevron_right_rounded, size: 16),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
