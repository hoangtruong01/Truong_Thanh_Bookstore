import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import 'home_navigation.dart';

/// Ô tìm kiếm dạng pill — chạm để mở danh sách sản phẩm.
class HomeSearchPill extends StatelessWidget {
  const HomeSearchPill({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.md),
      child: Semantics(
        button: true,
        label: 'Tìm kiếm sản phẩm',
        child: Material(
          color: palette.surface,
          shape: StadiumBorder(side: BorderSide(color: palette.border)),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => openProductList(context),
            child: SizedBox(
              height: 48,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Row(
                  children: [
                    Icon(Icons.search_rounded, color: palette.primaryText, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ExcludeSemantics(
                        child: Text(
                          'Tìm kiếm bút viết, sổ tập, máy tính...',
                          overflow: TextOverflow.ellipsis,
                          style: textTheme.bodyMedium?.copyWith(color: palette.textMuted),
                        ),
                      ),
                    ),
                    Icon(Icons.tune_rounded, color: palette.textSecondary, size: 18),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
