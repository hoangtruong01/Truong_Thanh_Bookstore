import 'package:flutter/material.dart';

/// Bảng màu gốc (raw tokens) bám sát design tokens của web
/// (`frontend/src/style.css`, Tailwind v4). Màn hình KHÔNG nên dùng trực tiếp
/// các hằng số này — hãy dùng `context.palette` (tự đổi theo Sáng / Tối) hoặc
/// `Theme.of(context).colorScheme`.
abstract final class AppColors {
  // Thương hiệu — đỏ đặc #dc2626 giống web (bỏ gradient đỏ → cam cũ)
  static const Color primary = Color(0xFFDC2626); // --color-primary
  static const Color primaryLight = Color(0xFFEF4444); // --color-primary-light
  static const Color primaryDark = Color(0xFFB91C1C); // --color-primary-dark / hover
  static const Color primaryOnDark = Color(0xFFF87171); // red-400: chữ/icon đỏ trên nền tối
  static const Color red50 = Color(0xFFFEF2F2);
  static const Color red100 = Color(0xFFFEE2E2);
  static const Color red200 = Color(0xFFFECACA);
  static const Color red800 = Color(0xFF991B1B);
  static const Color red950 = Color(0xFF450A0A);

  static const Color secondary = Color(0xFFF59E0B); // --color-secondary (amber)
  static const Color success = Color(0xFF10B981); // --color-accent (emerald)
  static const Color danger = Color(0xFFEF4444); // --color-danger
  static const Color info = Color(0xFF3B82F6);
  static const Color star = Color(0xFFF59E0B);

  // Cam của nút "Thêm vào giỏ" trên web
  static const Color accentOrange = Color(0xFFC2410C); // text
  static const Color accentOrangeSoft = Color(0xFFFFEBD5); // bg
  static const Color accentOrangeBorder = Color(0xFFFED7AA); // border

  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);

  // Tailwind slate scale
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate950 = Color(0xFF020617);

  /// Gradient đỏ nhẹ — chỉ dùng khi thực sự cần gradient (hero, badge giảm giá).
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryLight, primary],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
}

/// Cặp màu nền / chữ cho badge trạng thái (đơn hàng, thanh toán...).
@immutable
class StatusTone {
  final Color background;
  final Color foreground;

  const StatusTone({required this.background, required this.foreground});

  static StatusTone lerp(StatusTone a, StatusTone b, double t) {
    return StatusTone(
      background: Color.lerp(a.background, b.background, t)!,
      foreground: Color.lerp(a.foreground, b.foreground, t)!,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is StatusTone && other.background == background && other.foreground == foreground;

  @override
  int get hashCode => Object.hash(background, foreground);
}

/// Bảng màu ngữ nghĩa theo theme (Sáng / Tối), gắn vào ThemeData qua
/// `extensions`. Truy cập bằng `context.palette`.
///
/// Lưu ý tương phản: các màu `success / warning / danger / info` là màu nhấn
/// (icon, viền, nền đặc). Chữ nhỏ trên nền `*Soft` nên dùng [StatusTone].
@immutable
class AppPalette extends ThemeExtension<AppPalette> {
  final Color background;
  final Color surface;
  final Color surfaceMuted;
  final Color border;

  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;

  /// Màu nền đặc thương hiệu (nút chính, badge). Chữ trên nó dùng [onPrimary].
  final Color primary;

  /// Màu chữ / icon đỏ thương hiệu đặt trên [surface] (đủ tương phản cả 2 theme).
  final Color primaryText;
  final Color primarySoft;
  final Color onPrimary;

  /// Cam của nút "Thêm vào giỏ" (chữ), kèm nền và viền nhạt.
  final Color accent;
  final Color accentSoft;
  final Color accentBorder;

  final Color success;
  final Color successSoft;
  final Color warning;
  final Color warningSoft;
  final Color danger;
  final Color dangerSoft;
  final Color info;
  final Color infoSoft;
  final Color star;

  // Tông màu trạng thái đơn hàng
  final StatusTone statusNeutral;
  final StatusTone statusPending;
  final StatusTone statusConfirmed;
  final StatusTone statusProcessing;
  final StatusTone statusShipping;
  final StatusTone statusCompleted;
  final StatusTone statusReturned;
  final StatusTone statusCancelled;

  const AppPalette({
    required this.background,
    required this.surface,
    required this.surfaceMuted,
    required this.border,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.primary,
    required this.primaryText,
    required this.primarySoft,
    required this.onPrimary,
    required this.accent,
    required this.accentSoft,
    required this.accentBorder,
    required this.success,
    required this.successSoft,
    required this.warning,
    required this.warningSoft,
    required this.danger,
    required this.dangerSoft,
    required this.info,
    required this.infoSoft,
    required this.star,
    required this.statusNeutral,
    required this.statusPending,
    required this.statusConfirmed,
    required this.statusProcessing,
    required this.statusShipping,
    required this.statusCompleted,
    required this.statusReturned,
    required this.statusCancelled,
  });

  static const AppPalette light = AppPalette(
    background: AppColors.slate50,
    surface: AppColors.white,
    surfaceMuted: AppColors.slate100,
    border: AppColors.slate200,
    textPrimary: AppColors.slate800,
    textSecondary: AppColors.slate500,
    textMuted: AppColors.slate400,
    primary: AppColors.primary,
    primaryText: AppColors.primary,
    primarySoft: AppColors.red50,
    onPrimary: AppColors.white,
    accent: AppColors.accentOrange,
    accentSoft: AppColors.accentOrangeSoft,
    accentBorder: AppColors.accentOrangeBorder,
    success: AppColors.success,
    successSoft: Color(0xFFECFDF5),
    warning: AppColors.secondary,
    warningSoft: Color(0xFFFFFBEB),
    danger: AppColors.danger,
    dangerSoft: AppColors.red50,
    info: AppColors.info,
    infoSoft: Color(0xFFEFF6FF),
    star: AppColors.star,
    statusNeutral: StatusTone(background: AppColors.slate100, foreground: AppColors.slate600),
    statusPending: StatusTone(background: Color(0xFFFEF3C7), foreground: Color(0xFF92400E)),
    statusConfirmed: StatusTone(background: Color(0xFFDBEAFE), foreground: Color(0xFF1E40AF)),
    statusProcessing: StatusTone(background: Color(0xFFFFEDD5), foreground: Color(0xFF9A3412)),
    statusShipping: StatusTone(background: Color(0xFFF3E8FF), foreground: Color(0xFF6B21A8)),
    statusCompleted: StatusTone(background: Color(0xFFDCFCE7), foreground: Color(0xFF166534)),
    statusReturned: StatusTone(background: Color(0xFFFAE8FF), foreground: Color(0xFF86198F)),
    statusCancelled: StatusTone(background: AppColors.red100, foreground: AppColors.red800),
  );

  static const AppPalette dark = AppPalette(
    background: AppColors.slate950,
    surface: AppColors.slate800,
    surfaceMuted: AppColors.slate900,
    border: AppColors.slate700,
    textPrimary: AppColors.slate100,
    textSecondary: AppColors.slate400,
    textMuted: AppColors.slate500,
    primary: AppColors.primary,
    primaryText: AppColors.primaryOnDark,
    primarySoft: AppColors.red950,
    onPrimary: AppColors.white,
    accent: Color(0xFFFDBA74),
    accentSoft: Color(0xFF431407),
    accentBorder: Color(0xFF7C2D12),
    success: Color(0xFF34D399),
    successSoft: Color(0xFF022C22),
    warning: Color(0xFFFBBF24),
    warningSoft: Color(0xFF451A03),
    danger: AppColors.primaryOnDark,
    dangerSoft: AppColors.red950,
    info: Color(0xFF60A5FA),
    infoSoft: Color(0xFF172554),
    star: Color(0xFFFBBF24),
    statusNeutral: StatusTone(background: AppColors.slate700, foreground: AppColors.slate200),
    statusPending: StatusTone(background: Color(0xFF451A03), foreground: Color(0xFFFCD34D)),
    statusConfirmed: StatusTone(background: Color(0xFF172554), foreground: Color(0xFF93C5FD)),
    statusProcessing: StatusTone(background: Color(0xFF431407), foreground: Color(0xFFFDBA74)),
    statusShipping: StatusTone(background: Color(0xFF3B0764), foreground: Color(0xFFD8B4FE)),
    statusCompleted: StatusTone(background: Color(0xFF052E16), foreground: Color(0xFF86EFAC)),
    statusReturned: StatusTone(background: Color(0xFF4A044E), foreground: Color(0xFFF0ABFC)),
    statusCancelled: StatusTone(background: AppColors.red950, foreground: Color(0xFFFCA5A5)),
  );

  /// Tông màu cho mã trạng thái đơn hàng từ Backend (PENDING, SHIPPING...).
  StatusTone orderStatus(String status) {
    switch (status) {
      case 'PENDING':
        return statusPending;
      case 'CONFIRMED':
        return statusConfirmed;
      case 'PROCESSING':
        return statusProcessing;
      case 'SHIPPING':
        return statusShipping;
      case 'DELIVERED':
      case 'COMPLETED':
        return statusCompleted;
      case 'RETURNED':
        return statusReturned;
      case 'CANCELLED':
        return statusCancelled;
      default:
        return statusNeutral;
    }
  }

  @override
  AppPalette copyWith({
    Color? background,
    Color? surface,
    Color? surfaceMuted,
    Color? border,
    Color? textPrimary,
    Color? textSecondary,
    Color? textMuted,
    Color? primary,
    Color? primaryText,
    Color? primarySoft,
    Color? onPrimary,
    Color? accent,
    Color? accentSoft,
    Color? accentBorder,
    Color? success,
    Color? successSoft,
    Color? warning,
    Color? warningSoft,
    Color? danger,
    Color? dangerSoft,
    Color? info,
    Color? infoSoft,
    Color? star,
    StatusTone? statusNeutral,
    StatusTone? statusPending,
    StatusTone? statusConfirmed,
    StatusTone? statusProcessing,
    StatusTone? statusShipping,
    StatusTone? statusCompleted,
    StatusTone? statusReturned,
    StatusTone? statusCancelled,
  }) {
    return AppPalette(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceMuted: surfaceMuted ?? this.surfaceMuted,
      border: border ?? this.border,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textMuted: textMuted ?? this.textMuted,
      primary: primary ?? this.primary,
      primaryText: primaryText ?? this.primaryText,
      primarySoft: primarySoft ?? this.primarySoft,
      onPrimary: onPrimary ?? this.onPrimary,
      accent: accent ?? this.accent,
      accentSoft: accentSoft ?? this.accentSoft,
      accentBorder: accentBorder ?? this.accentBorder,
      success: success ?? this.success,
      successSoft: successSoft ?? this.successSoft,
      warning: warning ?? this.warning,
      warningSoft: warningSoft ?? this.warningSoft,
      danger: danger ?? this.danger,
      dangerSoft: dangerSoft ?? this.dangerSoft,
      info: info ?? this.info,
      infoSoft: infoSoft ?? this.infoSoft,
      star: star ?? this.star,
      statusNeutral: statusNeutral ?? this.statusNeutral,
      statusPending: statusPending ?? this.statusPending,
      statusConfirmed: statusConfirmed ?? this.statusConfirmed,
      statusProcessing: statusProcessing ?? this.statusProcessing,
      statusShipping: statusShipping ?? this.statusShipping,
      statusCompleted: statusCompleted ?? this.statusCompleted,
      statusReturned: statusReturned ?? this.statusReturned,
      statusCancelled: statusCancelled ?? this.statusCancelled,
    );
  }

  @override
  AppPalette lerp(covariant ThemeExtension<AppPalette>? other, double t) {
    if (other is! AppPalette) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    StatusTone s(StatusTone a, StatusTone b) => StatusTone.lerp(a, b, t);
    return AppPalette(
      background: c(background, other.background),
      surface: c(surface, other.surface),
      surfaceMuted: c(surfaceMuted, other.surfaceMuted),
      border: c(border, other.border),
      textPrimary: c(textPrimary, other.textPrimary),
      textSecondary: c(textSecondary, other.textSecondary),
      textMuted: c(textMuted, other.textMuted),
      primary: c(primary, other.primary),
      primaryText: c(primaryText, other.primaryText),
      primarySoft: c(primarySoft, other.primarySoft),
      onPrimary: c(onPrimary, other.onPrimary),
      accent: c(accent, other.accent),
      accentSoft: c(accentSoft, other.accentSoft),
      accentBorder: c(accentBorder, other.accentBorder),
      success: c(success, other.success),
      successSoft: c(successSoft, other.successSoft),
      warning: c(warning, other.warning),
      warningSoft: c(warningSoft, other.warningSoft),
      danger: c(danger, other.danger),
      dangerSoft: c(dangerSoft, other.dangerSoft),
      info: c(info, other.info),
      infoSoft: c(infoSoft, other.infoSoft),
      star: c(star, other.star),
      statusNeutral: s(statusNeutral, other.statusNeutral),
      statusPending: s(statusPending, other.statusPending),
      statusConfirmed: s(statusConfirmed, other.statusConfirmed),
      statusProcessing: s(statusProcessing, other.statusProcessing),
      statusShipping: s(statusShipping, other.statusShipping),
      statusCompleted: s(statusCompleted, other.statusCompleted),
      statusReturned: s(statusReturned, other.statusReturned),
      statusCancelled: s(statusCancelled, other.statusCancelled),
    );
  }
}

extension AppPaletteContext on BuildContext {
  /// Bảng màu ngữ nghĩa của theme hiện tại. Nếu ThemeData chưa gắn extension
  /// (vd. test dựng MaterialApp trần) thì suy ra theo độ sáng của theme.
  AppPalette get palette {
    final theme = Theme.of(this);
    return theme.extension<AppPalette>() ??
        (theme.brightness == Brightness.dark ? AppPalette.dark : AppPalette.light);
  }
}
