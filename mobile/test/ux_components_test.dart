import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/shimmer_loading.dart';
import 'package:mobile/widgets/empty_state_widget.dart';
import 'package:mobile/widgets/error_retry_widget.dart';

void main() {
  testWidgets('EmptyStateWidget renders title, message and button with callback', (tester) async {
    bool buttonClicked = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EmptyStateWidget(
            icon: Icons.shopping_bag_outlined,
            title: 'Giỏ hàng trống',
            message: 'Hãy thêm sản phẩm vào giỏ hàng',
            buttonText: 'Mua sắm ngay',
            onButtonPressed: () {
              buttonClicked = true;
            },
          ),
        ),
      ),
    );

    expect(find.text('Giỏ hàng trống'), findsOneWidget);
    expect(find.text('Hãy thêm sản phẩm vào giỏ hàng'), findsOneWidget);
    expect(find.text('Mua sắm ngay'), findsOneWidget);
    expect(find.byIcon(Icons.shopping_bag_outlined), findsOneWidget);

    await tester.tap(find.text('Mua sắm ngay'));
    expect(buttonClicked, true);
  });

  testWidgets('ErrorRetryWidget renders message and triggers onRetry', (tester) async {
    bool retryClicked = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ErrorRetryWidget(
            message: 'Mất kết nối máy chủ',
            onRetry: () {
              retryClicked = true;
            },
          ),
        ),
      ),
    );

    expect(find.text('Có lỗi xảy ra'), findsOneWidget);
    expect(find.text('Mất kết nối máy chủ'), findsOneWidget);
    expect(find.text('Thử lại'), findsOneWidget);

    await tester.tap(find.text('Thử lại'));
    expect(retryClicked, true);
  });

  testWidgets('ShimmerSkeleton renders correctly', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ShimmerSkeleton(width: 100, height: 20, borderRadius: 8),
        ),
      ),
    );

    expect(find.byType(ShimmerSkeleton), findsOneWidget);
  });
}
