import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_tokens.dart';

/// ThemeData Sáng / Tối dựng hoàn toàn từ design tokens của web
/// (xem [AppColors], [AppPalette], [AppRadii]). Font: Outfit (giống web).
///
/// Màn hình nên lấy màu qua `context.palette` và cỡ chữ qua
/// `Theme.of(context).textTheme` thay vì hardcode:
///   11 → labelSmall · 12 → bodySmall / labelMedium · 13 → bodyMedium
///   14 → bodyLarge / titleSmall / labelLarge · 16 → titleMedium
///   18 → titleLarge · 22 → headlineSmall
class AppTheme {
  AppTheme._();

  // ===========================================================================
  // Alias cũ — giữ để các màn hình chưa chuyển đổi không bị vỡ.
  // Màu là hằng số (không đổi theo Sáng / Tối): màn mới hãy dùng context.palette.
  // ===========================================================================

  @Deprecated('Dùng context.palette.primary hoặc AppColors.primary')
  static const Color primaryRed = AppColors.primary;

  /// Trước đây là cam #FB5607 (gradient đỏ → cam). Nay trỏ về cam nhấn của
  /// nút "Thêm vào giỏ" trên web để đồng bộ thương hiệu.
  @Deprecated('Dùng context.palette.accent hoặc AppColors.accentOrange')
  static const Color primaryOrange = AppColors.accentOrange;

  @Deprecated('Dùng context.palette.textPrimary')
  static const Color darkSlate = AppColors.slate900;
  @Deprecated('Dùng context.palette.textPrimary / textSecondary')
  static const Color bodyText = AppColors.slate700;
  @Deprecated('Dùng context.palette.background')
  static const Color bgLight = AppColors.slate50;
  @Deprecated('Dùng context.palette.surface')
  static const Color cardBg = AppColors.white;

  @Deprecated('Dùng context.palette.background')
  static const Color darkBg = AppColors.slate950;
  @Deprecated('Dùng context.palette.surface')
  static const Color darkSurface = AppColors.slate800;
  @Deprecated('Dùng context.palette.surface')
  static const Color darkCardBg = AppColors.slate800;
  @Deprecated('Dùng context.palette.border')
  static const Color darkBorder = AppColors.slate700;
  @Deprecated('Dùng context.palette.textPrimary')
  static const Color darkTextPrimary = AppColors.slate100;
  @Deprecated('Dùng context.palette.textSecondary')
  static const Color darkTextSecondary = AppColors.slate400;

  @Deprecated('Dùng context.palette.primary')
  static const Color primaryColor = AppColors.primary;
  @Deprecated('Dùng context.palette.accent')
  static const Color secondaryColor = AppColors.accentOrange;
  @Deprecated('Dùng context.palette.textPrimary')
  static const Color textPrimary = AppColors.slate800;
  @Deprecated('Dùng context.palette.textSecondary')
  static const Color textSecondary = AppColors.slate500;

  /// Gradient đỏ nhẹ #ef4444 → #dc2626 (thay gradient đỏ → cam cũ).
  @Deprecated('Dùng AppColors.primaryGradient, chỉ ở nơi thật sự cần gradient')
  static const LinearGradient primaryGradient = AppColors.primaryGradient;

  // ===========================================================================
  // ThemeData
  // ===========================================================================

  static ThemeData get lightTheme => _build(Brightness.light);

  static ThemeData get darkTheme => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final p = isDark ? AppPalette.dark : AppPalette.light;
    final scheme = _colorScheme(brightness, p);
    final textTheme = _textTheme(brightness, p);

    final buttonShape = RoundedRectangleBorder(borderRadius: AppRadii.button);
    final buttonText = GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 0);
    const buttonPadding = EdgeInsets.symmetric(vertical: 14, horizontal: 24);

    OutlineInputBorder inputBorder(Color color, [double width = 1]) => OutlineInputBorder(
          borderRadius: AppRadii.input,
          borderSide: BorderSide(color: color, width: width),
        );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: p.background,
      canvasColor: p.background,
      textTheme: textTheme,
      primaryTextTheme: GoogleFonts.outfitTextTheme(
        isDark ? Typography.material2021().white : Typography.material2021().black,
      ),
      extensions: [p],
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? AppColors.slate900 : AppColors.white,
        foregroundColor: p.textPrimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        shadowColor: AppColors.slate900.withValues(alpha: 0.12),
        iconTheme: IconThemeData(color: p.textPrimary),
        actionsIconTheme: IconThemeData(color: p.textPrimary),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: p.textPrimary,
          letterSpacing: 0,
        ),
      ),
      cardTheme: CardThemeData(
        color: p.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadii.card,
          side: BorderSide(color: p.border),
        ),
      ),
      dividerTheme: DividerThemeData(color: p.border, thickness: 1),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: p.surfaceMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: p.textSecondary),
        labelStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500, color: p.textSecondary),
        floatingLabelStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: p.primaryText),
        helperStyle: GoogleFonts.outfit(fontSize: 12, color: p.textSecondary),
        errorStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w500, color: scheme.error),
        prefixIconColor: p.textSecondary,
        suffixIconColor: p.textSecondary,
        border: OutlineInputBorder(borderRadius: AppRadii.input, borderSide: BorderSide.none),
        enabledBorder: inputBorder(p.border),
        disabledBorder: inputBorder(p.border.withValues(alpha: 0.6)),
        focusedBorder: inputBorder(p.primary, 1.5),
        errorBorder: inputBorder(scheme.error),
        focusedErrorBorder: inputBorder(scheme.error, 1.5),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: p.primary,
          foregroundColor: p.onPrimary,
          elevation: 0,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: buttonText,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p.primary,
          foregroundColor: p.onPrimary,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: buttonText,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.textPrimary,
          side: BorderSide(color: scheme.outline),
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: buttonText,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: p.primaryText,
          shape: buttonShape,
          textStyle: buttonText,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: p.surfaceMuted,
        selectedColor: p.primarySoft,
        disabledColor: p.surfaceMuted.withValues(alpha: 0.6),
        checkmarkColor: p.primaryText,
        side: BorderSide(color: p.border),
        shape: const StadiumBorder(),
        labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: p.textPrimary),
        secondaryLabelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: p.primaryText),
        padding: const EdgeInsets.symmetric(horizontal: 8),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: p.surface,
        modalBackgroundColor: p.surface,
        surfaceTintColor: Colors.transparent,
        dragHandleColor: scheme.outline,
        clipBehavior: Clip.antiAlias,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.xl)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: p.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: AppRadii.panel),
        titleTextStyle: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: p.textPrimary),
        contentTextStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500, color: p.textSecondary),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: scheme.inverseSurface,
        actionTextColor: scheme.inversePrimary,
        contentTextStyle: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: scheme.onInverseSurface,
        ),
        shape: RoundedRectangleBorder(borderRadius: AppRadii.button),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: scheme.inverseSurface,
          borderRadius: const BorderRadius.all(Radius.circular(AppRadii.sm)),
        ),
        textStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: scheme.onInverseSurface),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: p.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: AppRadii.button),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: p.textSecondary,
        textColor: p.textPrimary,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: p.primaryText),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: p.primary,
        selectionColor: p.primary.withValues(alpha: 0.25),
        selectionHandleColor: p.primary,
      ),
    );
  }

  static ColorScheme _colorScheme(Brightness brightness, AppPalette p) {
    final isDark = brightness == Brightness.dark;
    return ColorScheme(
      brightness: brightness,
      primary: p.primary,
      onPrimary: p.onPrimary,
      primaryContainer: p.primarySoft,
      onPrimaryContainer: isDark ? AppColors.red200 : AppColors.red800,
      secondary: p.warning,
      onSecondary: AppColors.slate900,
      secondaryContainer: p.warningSoft,
      onSecondaryContainer: p.statusPending.foreground,
      tertiary: p.success,
      onTertiary: AppColors.slate900,
      tertiaryContainer: p.successSoft,
      onTertiaryContainer: p.statusCompleted.foreground,
      // Chữ lỗi cần đủ tương phản: red-600 trên nền sáng, red-400 trên nền tối.
      error: isDark ? AppColors.primaryOnDark : AppColors.primary,
      onError: isDark ? AppColors.slate900 : AppColors.white,
      errorContainer: p.dangerSoft,
      onErrorContainer: p.statusCancelled.foreground,
      surface: p.surface,
      onSurface: p.textPrimary,
      onSurfaceVariant: p.textSecondary,
      surfaceContainerLowest: isDark ? AppColors.slate950 : AppColors.white,
      surfaceContainerLow: isDark ? AppColors.slate900 : AppColors.slate50,
      surfaceContainer: isDark ? AppColors.slate800 : AppColors.slate100,
      surfaceContainerHigh: isDark ? AppColors.slate700 : AppColors.slate100,
      surfaceContainerHighest: isDark ? AppColors.slate700 : AppColors.slate200,
      outline: isDark ? AppColors.slate600 : AppColors.slate300,
      outlineVariant: p.border,
      shadow: AppColors.black,
      scrim: AppColors.black,
      inverseSurface: isDark ? AppColors.slate100 : AppColors.slate800,
      onInverseSurface: isDark ? AppColors.slate900 : AppColors.slate50,
      inversePrimary: isDark ? AppColors.primary : AppColors.primaryOnDark,
      surfaceTint: Colors.transparent,
    );
  }

  /// Thang chữ dùng chung, áp font Outfit cho toàn bộ 15 style.
  static TextTheme _textTheme(Brightness brightness, AppPalette p) {
    final typography = Typography.material2021(platform: defaultTargetPlatform);
    final base = (brightness == Brightness.dark ? typography.white : typography.black)
        .apply(bodyColor: p.textPrimary, displayColor: p.textPrimary);

    TextStyle style(double size, FontWeight weight, double height, Color color) => TextStyle(
          fontSize: size,
          fontWeight: weight,
          height: height,
          letterSpacing: 0,
          color: color,
        );

    return GoogleFonts.outfitTextTheme(
      base.copyWith(
        headlineSmall: style(22, FontWeight.w800, 1.25, p.textPrimary),
        titleLarge: style(18, FontWeight.w800, 1.3, p.textPrimary),
        titleMedium: style(16, FontWeight.w700, 1.35, p.textPrimary),
        titleSmall: style(14, FontWeight.w700, 1.4, p.textPrimary),
        bodyLarge: style(14, FontWeight.w500, 1.45, p.textPrimary),
        bodyMedium: style(13, FontWeight.w500, 1.45, p.textPrimary),
        bodySmall: style(12, FontWeight.w500, 1.4, p.textSecondary),
        labelLarge: style(14, FontWeight.w700, 1.3, p.textPrimary),
        labelMedium: style(12, FontWeight.w600, 1.3, p.textPrimary),
        labelSmall: style(11, FontWeight.w600, 1.3, p.textSecondary),
      ),
    );
  }
}
