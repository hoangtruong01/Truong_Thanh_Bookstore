import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('TruongThanhApp smoke test', (WidgetTester tester) async {
    FlutterSecureStorage.setMockInitialValues({});
    await tester.pumpWidget(const TruongThanhApp());
    await tester.pump();
    expect(find.text('TRƯỜNG THÀNH'), findsOneWidget);
  });
}
