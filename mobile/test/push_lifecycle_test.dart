import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/order_model.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/providers/order_provider.dart';
import 'package:mobile/screens/order/order_detail_screen.dart';
import 'package:mobile/services/fcm_notification_service.dart';

class DelayedAuth extends AuthProvider {
  final ready = Completer<void>();
  @override
  Future<void> get sessionReady => ready.future;
  @override
  String? get token => ready.isCompleted ? 'restored-access' : null;
}

class RecordingOrders extends OrderProvider {
  final tokens = <String?>[];
  @override
  Future<OrderModel?> fetchOrderById(String id, String? token) async {
    tokens.add(token);
    return OrderModel.fromJson({'_id': id, 'items': [], 'orderCode': 'TT-PUSH'});
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  for (final closeBeforeRestore in [false, true]) {
    testWidgets('Cold-start waits for auth; closed=$closeBeforeRestore', (tester) async {
      final auth = DelayedAuth();
      final orders = RecordingOrders();
      await tester.pumpWidget(MultiProvider(providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: auth),
        ChangeNotifierProvider<OrderProvider>.value(value: orders),
      ], child: const MaterialApp(home: OrderDetailScreen(orderId: 'order-1'))));
      await tester.pump();
      expect(orders.tokens, isEmpty);
      if (closeBeforeRestore) await tester.pumpWidget(const SizedBox.shrink());
      auth.ready.complete();
      await tester.pumpAndSettle();
      expect(orders.tokens, closeBeforeRestore ? isEmpty : ['restored-access']);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      auth.dispose(); orders.dispose();
    });
  }

  testWidgets('Foreground notice is visible without exposing payload text', (tester) async {
    final service = FcmNotificationService.forTesting(
      client: MockClient((_) async => http.Response('{}', 200)), tokenLoader: () async => null);
    final messenger = GlobalKey<ScaffoldMessengerState>();
    service.setMessengerKey(messenger);
    await tester.pumpWidget(MaterialApp(scaffoldMessengerKey: messenger,
      home: const Scaffold(body: Text('Home'))));
    service.handleForegroundMessage(const RemoteMessage(
      data: {'orderId': 'order-1'}, notification: RemoteNotification(title: 'Private order info')));
    await tester.pumpAndSettle();
    expect(find.text('Bạn có thông báo mới'), findsOneWidget);
    expect(find.text('Xem đơn'), findsOneWidget);
    expect(find.text('Private order info'), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('General notification id is not treated as an order id', (tester) async {
    final service = FcmNotificationService.forTesting(
      client: MockClient((_) async => http.Response('{}', 200)), tokenLoader: () async => null);
    final messenger = GlobalKey<ScaffoldMessengerState>();
    service.setMessengerKey(messenger);
    await tester.pumpWidget(MaterialApp(scaffoldMessengerKey: messenger,
      home: const Scaffold(body: Text('Home'))));
    service.handleForegroundMessage(const RemoteMessage(data: {'type': 'general', 'id': 'notification-1'}));
    await tester.pumpAndSettle();
    expect(find.text('Xem đơn'), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
  });
}
