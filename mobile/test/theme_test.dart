import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/providers/theme_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Tỉ lệ tương phản WCAG 2.x giữa 2 màu đặc.
double contrastRatio(Color a, Color b) {
  final la = a.computeLuminance();
  final lb = b.computeLuminance();
  final hi = la > lb ? la : lb;
  final lo = la > lb ? lb : la;
  return (hi + 0.05) / (lo + 0.05);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppTheme — tokens bám theo web', () {
    for (final entry in {
      'light': (() => AppTheme.lightTheme, Brightness.light, AppPalette.light),
      'dark': (() => AppTheme.darkTheme, Brightness.dark, AppPalette.dark),
    }.entries) {
      // ThemeData dựng trong từng testWidgets: google_fonts tải font bất đồng bộ,
      // binding của testWidgets nuốt lỗi tải mạng (HTTP 400) giống các test app khác.
      final (buildTheme, brightness, expected) = entry.value;

      testWidgets('${entry.key}: build đầy đủ và gắn AppPalette', (tester) async {
        final theme = buildTheme();
        expect(theme.brightness, brightness);
        expect(theme.colorScheme.brightness, brightness);
        expect(theme.extension<AppPalette>(), same(expected));
        expect(theme.colorScheme.primary, AppColors.primary);
        expect(theme.colorScheme.surface, expected.surface);
        expect(theme.colorScheme.onSurface, expected.textPrimary);
        expect(theme.colorScheme.outlineVariant, expected.border);
        expect(theme.scaffoldBackgroundColor, expected.background);
      });

      testWidgets('${entry.key}: font Outfit + thang cỡ chữ chuẩn', (tester) async {
        final t = buildTheme().textTheme;
        for (final style in [t.bodyLarge, t.bodyMedium, t.bodySmall, t.titleLarge, t.labelSmall]) {
          expect(style?.fontFamily, contains('Outfit'));
        }
        expect(t.labelSmall?.fontSize, 11);
        expect(t.bodySmall?.fontSize, 12);
        expect(t.bodyMedium?.fontSize, 13);
        expect(t.bodyLarge?.fontSize, 14);
        expect(t.titleMedium?.fontSize, 16);
        expect(t.titleLarge?.fontSize, 18);
        expect(t.headlineSmall?.fontSize, 22);
        expect(t.bodyMedium?.color, expected.textPrimary);
        expect(t.bodySmall?.color, expected.textSecondary);
      });

      testWidgets('${entry.key}: bo góc thẻ 16, nút & ô nhập 12', (tester) async {
        final theme = buildTheme();
        final cardShape = theme.cardTheme.shape as RoundedRectangleBorder;
        expect(cardShape.borderRadius, BorderRadius.circular(16));

        final input = theme.inputDecorationTheme.enabledBorder as OutlineInputBorder;
        expect(input.borderRadius, BorderRadius.circular(12));

        final buttonShape = theme.elevatedButtonTheme.style!.shape!.resolve({}) as RoundedRectangleBorder;
        expect(buttonShape.borderRadius, BorderRadius.circular(12));
      });

      testWidgets('${entry.key}: tương phản chữ đạt chuẩn WCAG', (tester) async {
        final theme = buildTheme();
        final p = expected;
        expect(contrastRatio(p.textPrimary, p.surface), greaterThanOrEqualTo(7.0));
        expect(contrastRatio(p.textPrimary, p.background), greaterThanOrEqualTo(7.0));
        expect(contrastRatio(p.textSecondary, p.surface), greaterThanOrEqualTo(4.5));
        expect(contrastRatio(p.primaryText, p.surface), greaterThanOrEqualTo(4.5));
        expect(contrastRatio(p.onPrimary, p.primary), greaterThanOrEqualTo(4.5));
        expect(contrastRatio(p.accent, p.surface), greaterThanOrEqualTo(4.5));
        // Cặp #c2410c / #ffebd5 lấy nguyên từ nút "Thêm vào giỏ" của web (~4.46:1):
        // chỉ đạt mức chữ đậm/lớn, nên chặn dưới 3:1 để phát hiện nếu bị đổi tệ hơn.
        expect(contrastRatio(p.accent, p.accentSoft), greaterThanOrEqualTo(3.0));
        expect(contrastRatio(theme.colorScheme.onError, theme.colorScheme.error), greaterThanOrEqualTo(4.5));
        for (final code in ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'RETURNED', 'CANCELLED', 'X']) {
          final tone = p.orderStatus(code);
          expect(contrastRatio(tone.foreground, tone.background), greaterThanOrEqualTo(4.5), reason: code);
        }
      });
    }

    test('primary là đỏ đặc #dc2626, gradient cũ đỏ → cam đã bỏ', () {
      expect(AppColors.primary, const Color(0xFFDC2626));
      expect(AppTheme.primaryGradient.colors, [const Color(0xFFEF4444), const Color(0xFFDC2626)]);
      expect(AppTheme.primaryOrange, isNot(const Color(0xFFFB5607)));
    });

    test('orderStatus map DELIVERED & COMPLETED về cùng tông, mã lạ về neutral', () {
      const p = AppPalette.light;
      expect(p.orderStatus('DELIVERED'), p.statusCompleted);
      expect(p.orderStatus('COMPLETED'), p.statusCompleted);
      expect(p.orderStatus('UNKNOWN'), p.statusNeutral);
    });

    test('AppPalette.lerp đi từ light sang dark', () {
      expect(AppPalette.light.lerp(AppPalette.dark, 0).surface, AppPalette.light.surface);
      expect(AppPalette.light.lerp(AppPalette.dark, 1).surface, AppPalette.dark.surface);
      expect(AppPalette.light.lerp(null, 0.5), same(AppPalette.light));
    });

    testWidgets('context.palette đổi theo theme đang dùng', (tester) async {
      late AppPalette captured;
      Widget app(ThemeMode mode) => MaterialApp(
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: mode,
            home: Builder(builder: (context) {
              captured = context.palette;
              return const SizedBox();
            }),
          );

      await tester.pumpWidget(app(ThemeMode.light));
      expect(captured.surface, AppPalette.light.surface);

      await tester.pumpWidget(app(ThemeMode.dark));
      await tester.pumpAndSettle();
      expect(captured.surface, AppPalette.dark.surface);
    });

    testWidgets('context.palette có fallback khi theme không gắn extension', (tester) async {
      late AppPalette captured;
      await tester.pumpWidget(MaterialApp(
        theme: ThemeData(brightness: Brightness.dark),
        home: Builder(builder: (context) {
          captured = context.palette;
          return const SizedBox();
        }),
      ));
      expect(captured, same(AppPalette.dark));
    });
  });

  group('ThemeProvider — Theo hệ thống / Sáng / Tối', () {
    test('mặc định Theo hệ thống khi chưa lưu lựa chọn', () async {
      SharedPreferences.setMockInitialValues({});
      final provider = ThemeProvider(platformBrightness: () => Brightness.light);
      await provider.loaded;
      expect(provider.themeMode, ThemeMode.system);
      expect(provider.isSystemMode, isTrue);
      expect(provider.isDarkMode, isFalse);
    });

    test('isDarkMode theo độ sáng hệ thống khi ở chế độ system', () async {
      SharedPreferences.setMockInitialValues({});
      final provider = ThemeProvider(platformBrightness: () => Brightness.dark);
      await provider.loaded;
      expect(provider.isDarkMode, isTrue);
    });

    test('khôi phục lựa chọn đã lưu', () async {
      SharedPreferences.setMockInitialValues({'app_theme_mode': 'dark'});
      final provider = ThemeProvider(platformBrightness: () => Brightness.light);
      await provider.loaded;
      expect(provider.themeMode, ThemeMode.dark);
      expect(provider.isDarkMode, isTrue);
    });

    test('giá trị lưu không hợp lệ -> về system', () async {
      SharedPreferences.setMockInitialValues({'app_theme_mode': 'purple'});
      final provider = ThemeProvider(platformBrightness: () => Brightness.light);
      await provider.loaded;
      expect(provider.themeMode, ThemeMode.system);
    });

    test('setThemeMode lưu cả 3 chế độ', () async {
      SharedPreferences.setMockInitialValues({});
      final provider = ThemeProvider(platformBrightness: () => Brightness.light);
      await provider.loaded;

      for (final entry in {
        ThemeMode.dark: 'dark',
        ThemeMode.light: 'light',
        ThemeMode.system: 'system',
      }.entries) {
        await provider.setThemeMode(entry.key);
        expect(provider.themeMode, entry.key);
        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('app_theme_mode'), entry.value);
      }
    });

    test('toggleTheme() đảo theo giao diện đang hiển thị (kể cả system)', () async {
      SharedPreferences.setMockInitialValues({});
      final provider = ThemeProvider(platformBrightness: () => Brightness.dark);
      await provider.loaded;
      expect(provider.isDarkMode, isTrue); // system + OS tối

      await provider.toggleTheme();
      expect(provider.themeMode, ThemeMode.light);

      await provider.toggleTheme();
      expect(provider.themeMode, ThemeMode.dark);

      await provider.toggleTheme(false);
      expect(provider.themeMode, ThemeMode.light);
      expect(provider.isDarkMode, isFalse);
    });

    test('đổi theme trước khi đọc xong prefs không bị ghi đè', () async {
      SharedPreferences.setMockInitialValues({'app_theme_mode': 'dark'});
      final provider = ThemeProvider(platformBrightness: () => Brightness.light);
      final pending = provider.setThemeMode(ThemeMode.light);
      await provider.loaded;
      await pending;
      expect(provider.themeMode, ThemeMode.light);
    });
  });
}
