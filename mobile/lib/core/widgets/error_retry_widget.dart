import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_tokens.dart';

/// Trạng thái lỗi kèm nút "Thử lại". Màu lấy từ `context.palette`
/// (dangerSoft / danger) nên đọc được ở cả Sáng / Tối.
class ErrorRetryWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final IconData icon;

  const ErrorRetryWidget({
    super.key,
    required this.message,
    required this.onRetry,
    this.icon = Icons.wifi_off_rounded,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(color: palette.dangerSoft, shape: BoxShape.circle),
              child: Icon(icon, size: 56, color: palette.danger),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Có lỗi xảy ra',
              textAlign: TextAlign.center,
              style: textTheme.titleLarge?.copyWith(color: palette.textPrimary),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              message,
              textAlign: TextAlign.center,
              style: textTheme.bodyLarge?.copyWith(color: palette.textSecondary),
            ),
            const SizedBox(height: AppSpacing.xl),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 20),
              label: const Text('Thử lại'),
              style: OutlinedButton.styleFrom(
                foregroundColor: palette.primaryText,
                side: BorderSide(color: palette.primaryText, width: 1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
