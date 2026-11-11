import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/shimmer_loading.dart';

/// Bordered surface card used by the cart and checkout sections (web `rounded-2xl border`).
class CommerceCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const CommerceCard({super.key, required this.child, this.padding = const EdgeInsets.all(AppSpacing.lg)});

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
      child: child,
    );
  }
}

/// Uppercase-free section title, sentence case like the rest of the app.
class CommerceSectionTitle extends StatelessWidget {
  final String text;
  final Widget? trailing;

  const CommerceSectionTitle(this.text, {super.key, this.trailing});

  @override
  Widget build(BuildContext context) {
    final title = Text(text, style: Theme.of(context).textTheme.titleSmall);
    if (trailing == null) return title;
    return Row(
      children: [
        Expanded(child: title),
        trailing!,
      ],
    );
  }
}

enum NoticeTone { warning, error, success, info }

/// Inline notice (server warnings, pricing errors). [onRetry] adds a "Thử lại" action.
class NoticeBanner extends StatelessWidget {
  final NoticeTone tone;
  final String? title;
  final List<String> messages;
  final VoidCallback? onRetry;
  final IconData? icon;

  const NoticeBanner({
    super.key,
    required this.tone,
    required this.messages,
    this.title,
    this.onRetry,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final (StatusTone colors, Color border, IconData defaultIcon) = switch (tone) {
      NoticeTone.warning => (palette.statusPending, palette.warning, Icons.warning_amber_rounded),
      NoticeTone.error => (palette.statusCancelled, palette.danger, Icons.error_outline_rounded),
      NoticeTone.success => (palette.statusCompleted, palette.success, Icons.check_circle_outline_rounded),
      NoticeTone.info => (palette.statusConfirmed, palette.info, Icons.info_outline_rounded),
    };
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: AppRadii.button,
        border: Border.all(color: border.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon ?? defaultIcon, size: 18, color: colors.foreground),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (title != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.xxs),
                    child: Text(title!,
                        style: textTheme.labelMedium?.copyWith(color: colors.foreground, fontWeight: FontWeight.w700)),
                  ),
                for (final message in messages)
                  Text(message, style: textTheme.bodySmall?.copyWith(color: colors.foreground)),
              ],
            ),
          ),
          if (onRetry != null)
            TextButton(
              onPressed: onRetry,
              style: TextButton.styleFrom(
                foregroundColor: colors.foreground,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                minimumSize: const Size(0, 32),
                textStyle: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              child: const Text('Thử lại'),
            ),
        ],
      ),
    );
  }
}

/// Skeleton shown while the server preview of the totals is loading.
class PricingSkeleton extends StatelessWidget {
  final int lines;

  const PricingSkeleton({super.key, this.lines = 4});

  @override
  Widget build(BuildContext context) {
    return Column(
      key: const ValueKey('pricing-skeleton'),
      children: [
        for (var i = 0; i < lines; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ShimmerSkeleton(width: i == lines - 1 ? 120 : 90, height: 14),
                ShimmerSkeleton(width: i == lines - 1 ? 100 : 70, height: 14),
              ],
            ),
          ),
      ],
    );
  }
}

enum SummaryTone { normal, discount, loyalty, success }

/// One line of a money summary (label left, server value right).
class SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final String? subtitle;
  final String? strikeValue;
  final SummaryTone tone;
  final Widget? labelTrailing;

  const SummaryRow({
    super.key,
    required this.label,
    required this.value,
    this.subtitle,
    this.strikeValue,
    this.tone = SummaryTone.normal,
    this.labelTrailing,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final valueColor = switch (tone) {
      SummaryTone.normal => palette.textPrimary,
      SummaryTone.discount => palette.primaryText,
      SummaryTone.loyalty => palette.statusPending.foreground,
      SummaryTone.success => palette.statusCompleted.foreground,
    };
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(label,
                          style: textTheme.bodyMedium?.copyWith(
                              color: tone == SummaryTone.normal ? palette.textSecondary : valueColor)),
                    ),
                    if (labelTrailing != null) ...[
                      const SizedBox(width: AppSpacing.xs),
                      labelTrailing!,
                    ],
                  ],
                ),
                if (subtitle != null)
                  Text(subtitle!, style: textTheme.labelSmall?.copyWith(color: palette.statusCompleted.foreground)),
              ],
            ),
          ),
          if (strikeValue != null) ...[
            Text(strikeValue!,
                style: textTheme.bodySmall?.copyWith(
                    color: palette.textMuted, decoration: TextDecoration.lineThrough)),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(value, style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700, color: valueColor)),
        ],
      ),
    );
  }
}

/// Small code badge (voucher code, order code).
class CodeBadge extends StatelessWidget {
  final String code;

  const CodeBadge(this.code, {super.key});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs + 2, vertical: AppSpacing.xxs),
      decoration: BoxDecoration(
        color: palette.primarySoft,
        borderRadius: AppRadii.badge,
        border: Border.all(color: palette.primary.withValues(alpha: 0.3)),
      ),
      child: Text(
        code,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: palette.primaryText,
              fontWeight: FontWeight.w800,
              fontFamily: 'monospace',
            ),
      ),
    );
  }
}
