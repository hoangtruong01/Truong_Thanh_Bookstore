import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/main.dart';
import 'package:mobile/core/widgets/glass_bottom_navigation.dart';

const _labels = ['Trang chủ', 'Sản phẩm', 'Giỏ hàng', 'Đơn hàng', 'Tài khoản'];

const _items = [
  GlassNavItemData(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Trang chủ'),
  GlassNavItemData(icon: Icons.grid_view_outlined, activeIcon: Icons.grid_view_rounded, label: 'Sản phẩm'),
  GlassNavItemData(
    icon: Icons.shopping_bag_outlined,
    activeIcon: Icons.shopping_bag_rounded,
    label: 'Giỏ hàng',
    hasBadge: true,
  ),
  GlassNavItemData(icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long_rounded, label: 'Đơn hàng'),
  GlassNavItemData(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Tài khoản'),
];

/// Host tối giản giữ state tab để test widget nav độc lập với các màn hình.
class _NavHost extends StatefulWidget {
  final int badgeCount;
  final ThemeMode themeMode;
  const _NavHost({this.badgeCount = 0, this.themeMode = ThemeMode.light});

  @override
  State<_NavHost> createState() => _NavHostState();
}

class _NavHostState extends State<_NavHost> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: widget.themeMode,
      home: Scaffold(
        body: Text('tab:$index'),
        bottomNavigationBar: LiquidGlassBottomNav(
          currentIndex: index,
          onTap: (i) => setState(() => index = i),
          items: _items,
          badgeCount: widget.badgeCount,
        ),
      ),
    );
  }
}

Finder _inNav(Finder finder) => find.descendant(of: find.byType(LiquidGlassBottomNav), matching: finder);

void main() {
  group('LiquidGlassBottomNav — nhãn & trợ năng', () {
    testWidgets('hiển thị 5 nhãn chữ dưới icon', (tester) async {
      await tester.pumpWidget(const _NavHost());
      for (final label in _labels) {
        expect(_inNav(find.text(label)), findsOneWidget, reason: label);
      }
    });

    testWidgets('mỗi tab có Semantics button + label, chỉ tab đang chọn là selected', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(const _NavHost());

      for (var i = 0; i < _labels.length; i++) {
        expect(
          tester.getSemantics(find.bySemanticsLabel(_labels[i])),
          matchesSemantics(
            label: _labels[i],
            isButton: true,
            hasSelectedState: true,
            isSelected: i == 0,
            hasTapAction: true,
          ),
          reason: _labels[i],
        );
      }
      handle.dispose();
    });

    testWidgets('badge giỏ hàng được đọc kèm số lượng', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(const _NavHost(badgeCount: 3));
      expect(find.bySemanticsLabel('Giỏ hàng, 3 sản phẩm'), findsOneWidget);
      expect(_inNav(find.text('3')), findsOneWidget);
      handle.dispose();
    });

    testWidgets('chạm vào nhãn chuyển tab', (tester) async {
      await tester.pumpWidget(const _NavHost());
      expect(find.text('tab:0'), findsOneWidget);

      await tester.tap(_inNav(find.text('Đơn hàng')));
      await tester.pumpAndSettle();
      expect(find.text('tab:3'), findsOneWidget);

      await tester.tap(_inNav(find.text('Sản phẩm')));
      await tester.pumpAndSettle();
      expect(find.text('tab:1'), findsOneWidget);
    });

    testWidgets('semantics tap action (trình đọc màn hình) chuyển tab', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(const _NavHost());

      tester.semantics.tap(find.semantics.byLabel('Tài khoản'));
      await tester.pumpAndSettle();
      expect(find.text('tab:4'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('mỗi tab có vùng chạm tối thiểu 48dp và có tooltip', (tester) async {
      await tester.pumpWidget(const _NavHost());
      for (final label in _labels) {
        final tooltip = find.ancestor(of: _inNav(find.text(label)), matching: find.byType(Tooltip));
        expect(tooltip, findsOneWidget, reason: label);
        expect(tester.widget<Tooltip>(tooltip).message, label);
        final size = tester.getSize(tooltip);
        expect(size.width, greaterThanOrEqualTo(48), reason: label);
        expect(size.height, greaterThanOrEqualTo(48), reason: label);
      }
    });

    testWidgets('render được ở Dark mode và với cỡ chữ lớn không tràn', (tester) async {
      tester.platformDispatcher.textScaleFactorTestValue = 2.0;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      await tester.pumpWidget(const _NavHost(themeMode: ThemeMode.dark, badgeCount: 120));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(_inNav(find.text('99+')), findsOneWidget);
    });
  });

  group('MainNavigationScreen — thứ tự tab', () {
    setUp(() => FlutterSecureStorage.setMockInitialValues({}));

    testWidgets('nhãn tab khớp màn hình tương ứng', (tester) async {
      await tester.pumpWidget(const TruongThanhApp());
      await tester.pump();

      for (final label in _labels) {
        expect(_inNav(find.text(label)), findsOneWidget, reason: label);
      }

      await tester.tap(_inNav(find.text('Sản phẩm')));
      await tester.pumpAndSettle();
      expect(find.text('DANH SÁCH SẢN PHẨM'), findsOneWidget);

      await tester.tap(_inNav(find.text('Giỏ hàng')));
      await tester.pumpAndSettle();
      expect(find.text('GIỎ HÀNG CỦA BẠN'), findsOneWidget);

      await tester.tap(_inNav(find.text('Đơn hàng')));
      await tester.pumpAndSettle();
      expect(find.text('ĐƠN HÀNG CỦA TÔI'), findsOneWidget);

      await tester.tap(_inNav(find.text('Tài khoản')));
      await tester.pumpAndSettle();
      expect(find.text('TÀI KHOẢN'), findsOneWidget);
    });
  });
}
