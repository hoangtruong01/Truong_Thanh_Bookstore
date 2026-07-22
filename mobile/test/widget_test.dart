import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('TruongThanhApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const TruongThanhApp());
    expect(find.text('TRƯỜNG THÀNH'), findsOneWidget);
  });
}
