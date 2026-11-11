import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/constants/order_status.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/models/notification_model.dart';
import 'package:mobile/models/order_model.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/providers/notification_provider.dart';
import 'package:mobile/providers/order_provider.dart';
import 'package:mobile/screens/auth/login_screen.dart';
import 'package:mobile/screens/notification/notifications_screen.dart';
import 'package:mobile/screens/order/order_detail_screen.dart';
import 'package:mobile/screens/order/order_history_screen.dart';
import 'package:mobile/screens/order/widgets/return_request_sheet.dart';

// Backend enums (backend/src/common/enums/index.ts).
const backendOrderStatuses = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED',
  'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'COMPLETED', 'CANCELLED',
];
const backendPaymentStatuses = ['UNPAID', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED', 'CANCELLED'];
const backendRefundStatuses = ['NONE', 'REQUESTED', 'PROCESSING', 'REFUNDED', 'FAILED', 'MANUAL_REQUIRED'];
const backendPaymentMethods = ['COD', 'BANK_TRANSFER', 'EWALLET', 'VNPAY', 'MOMO', 'CASH', 'CREDIT'];

double _contrast(Color a, Color b) {
  final la = a.computeLuminance();
  final lb = b.computeLuminance();
  return ((la > lb ? la : lb) + 0.05) / ((la > lb ? lb : la) + 0.05);
}

class TestAuth extends AuthProvider {
  @override
  bool get isAuthenticated => true;
  @override
  String get token => 'test-token';
}

Map<String, dynamic> orderJson(String id, String status, {
  String paymentStatus = 'UNPAID',
  String paymentMethod = 'COD',
  List<Map<String, dynamic>> timeline = const [],
  String? trackingCode,
  String? shippingProvider,
  String? shippingStatus,
}) => {
  '_id': id, 'orderCode': 'TT-$id', 'orderStatus': status,
  'paymentStatus': paymentStatus, 'paymentMethod': paymentMethod,
  'items': [{'product': 'p1', 'name': 'Sách $id', 'price': 50000, 'quantity': 2, 'image': ''}],
  'subtotal': 100000, 'shippingFee': 0, 'discount': 0, 'total': 100000,
  'phone': '0901234567', 'shippingAddress': 'Hà Nội', 'createdAt': '2026-11-01T00:00:00Z',
  'timeline': timeline,
  if (trackingCode != null) 'trackingCode': trackingCode,
  if (shippingProvider != null) 'shippingProvider': shippingProvider,
  if (shippingStatus != null) 'shippingStatus': shippingStatus,
};

http.Response jsonResponse(Object body, [int status = 200]) =>
    http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json'});

Widget host({required AuthProvider auth, required OrderProvider orders, NotificationProvider? notifications,
    required Widget child, Brightness brightness = Brightness.light}) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>.value(value: auth),
      ChangeNotifierProvider<OrderProvider>.value(value: orders),
      if (notifications != null) ChangeNotifierProvider<NotificationProvider>.value(value: notifications),
    ],
    child: MaterialApp(
      theme: ThemeData(
        brightness: brightness,
        extensions: [brightness == Brightness.dark ? AppPalette.dark : AppPalette.light],
      ),
      home: child,
    ),
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('OrderStatusMeta mirrors web helpers.ts', () {
    test('every backend enum value has a Vietnamese label', () {
      for (final s in backendOrderStatuses) {
        expect(OrderStatusMeta.orderMeta(s), isNotNull, reason: s);
        expect(OrderStatusMeta.orderLabel(s), isNot(s), reason: s);
      }
      for (final s in backendPaymentStatuses) {
        expect(OrderStatusMeta.paymentMeta(s), isNotNull, reason: s);
      }
      for (final s in backendRefundStatuses) {
        expect(OrderStatusMeta.refundMeta(s), isNotNull, reason: s);
      }
      for (final m in backendPaymentMethods) {
        expect(OrderStatusMeta.paymentMethodLabel(m), isNot(m), reason: m);
      }
      expect(OrderStatusMeta.refundLabel('NONE'), isEmpty);
    });

    test('labels match the web table and domains stay separate', () {
      expect(OrderStatusMeta.orderLabel('PROCESSING'), 'Đang chuẩn bị hàng');
      expect(OrderStatusMeta.orderLabel('DELIVERED'), 'Đã giao thành công');
      expect(OrderStatusMeta.orderLabel('RETURN_REQUESTED'), 'Yêu cầu trả hàng');
      expect(OrderStatusMeta.paymentLabel('PENDING'), 'Đang chờ thanh toán');
      expect(OrderStatusMeta.orderLabel('PENDING'), 'Chờ xác nhận');
      expect(OrderStatusMeta.refundLabel('PROCESSING'), 'Đang hoàn tiền');
      expect(OrderStatusMeta.paymentLabel(null), 'Chưa thanh toán');
      expect(OrderStatusMeta.paymentLabel('paid'), 'Đã thanh toán');
      expect(OrderStatusMeta.orderLabel('MYSTERY'), 'MYSTERY');
      expect(OrderStatusMeta.paymentMethodLabel(null), 'Chưa xác định');
      expect(OrderStatusMeta.paymentMethodLabel('VNPAY'), 'Cổng thanh toán VNPay');
      expect(OrderStatusMeta.ghnShippingLabel('delivering'), 'Đang giao hàng');
      expect(OrderStatusMeta.ghnShippingLabel('odd_state'), 'odd_state');
    });

    test('tones are readable in light and dark', () {
      for (final p in [AppPalette.light, AppPalette.dark]) {
        for (final s in [...backendOrderStatuses, 'X']) {
          final tone = OrderStatusMeta.orderTone(p, s);
          expect(_contrast(tone.foreground, tone.background), greaterThanOrEqualTo(4.5), reason: s);
        }
        for (final s in [...backendPaymentStatuses, null]) {
          final tone = OrderStatusMeta.paymentTone(p, s);
          expect(_contrast(tone.foreground, tone.background), greaterThanOrEqualTo(4.5), reason: '$s');
        }
      }
      expect(OrderStatusMeta.orderTone(AppPalette.light, 'CANCELLED'), AppPalette.light.statusCancelled);
      expect(OrderStatusMeta.orderTone(AppPalette.dark, 'SHIPPING'), AppPalette.dark.statusShipping);
      expect(OrderStatusMeta.orderTone(AppPalette.light, 'nope'), AppPalette.light.statusNeutral);
    });
  });

  group('OrderStatusFilter', () {
    test('each backend status belongs to exactly one tab besides Tất cả', () {
      for (final s in backendOrderStatuses) {
        final tabs = OrderStatusFilter.values
            .where((f) => f != OrderStatusFilter.all && f.matches(s))
            .toList();
        expect(tabs, hasLength(1), reason: s);
        expect(OrderStatusFilter.all.matches(s), isTrue);
      }
      expect(OrderStatusFilter.returns.matches('RETURN_APPROVED'), isTrue);
      expect(OrderStatusFilter.completed.matches('COMPLETED'), isTrue);
      expect(OrderStatusFilter.values.map((f) => f.label),
          ['Tất cả', 'Chờ xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy', 'Trả hàng']);
    });
  });

  group('OrderActionRules mirror order-lifecycle.service.ts', () {
    final now = DateTime.utc(2026, 11, 10);

    test('cancel only while PENDING', () {
      for (final s in backendOrderStatuses) {
        expect(OrderActionRules.canCancel(s), s == 'PENDING', reason: s);
      }
    });

    test('return only for delivered orders within 7 days', () {
      expect(OrderActionRules.canRequestReturn('DELIVERED', now.subtract(const Duration(days: 2)), now: now), isTrue);
      expect(OrderActionRules.canRequestReturn('COMPLETED', now.subtract(const Duration(days: 7)), now: now), isTrue);
      expect(OrderActionRules.canRequestReturn('DELIVERED', now.subtract(const Duration(days: 8)), now: now), isFalse);
      expect(OrderActionRules.isReturnExpired('DELIVERED', now.subtract(const Duration(days: 8)), now: now), isTrue);
      expect(OrderActionRules.canRequestReturn('DELIVERED', null, now: now), isTrue);
      for (final s in ['PENDING', 'SHIPPING', 'RETURN_REQUESTED', 'RETURNED', 'CANCELLED']) {
        expect(OrderActionRules.canRequestReturn(s, now, now: now), isFalse, reason: s);
        expect(OrderActionRules.isReturnExpired(s, null, now: now), isFalse, reason: s);
      }
    });

    test('GHN tracking link is encoded and GHN-only', () {
      expect(OrderActionRules.ghnTrackingUri('GHN', 'LK 123&x')?.toString(),
          'https://tracking.ghn.vn/?order_code=LK+123%26x');
      expect(OrderActionRules.ghnTrackingUri(null, 'ABC')?.host, 'tracking.ghn.vn');
      expect(OrderActionRules.ghnTrackingUri('GHTK', 'ABC'), isNull);
      expect(OrderActionRules.ghnTrackingUri('GHN', '  '), isNull);
    });

    test('order detail derives delivery date from the latest DELIVERED timeline entry', () {
      final order = OrderModel.fromJson(orderJson('o1', 'DELIVERED', timeline: [
        {'status': 'SHIPPING', 'createdAt': '2026-11-01T00:00:00Z'},
        {'status': 'DELIVERED', 'createdAt': '2026-11-03T00:00:00Z'},
      ]));
      expect(OrderDetailScreen.deliveredAtOf(order), DateTime.utc(2026, 11, 3));
      expect(OrderDetailScreen.deliveredAtOf(OrderModel.fromJson(orderJson('o2', 'PENDING'))), isNull);
    });
  });

  test('return reason joins category + detail and respects the 500-char DTO limit', () {
    expect(buildReturnReason('Khác', '  Rách bìa  '), 'Khác: Rách bìa');
    expect(buildReturnReason(returnReasonCategories.first, 'x' * 600).length, returnReasonMaxLength);
  });

  group('OrderProvider history paging + return request', () {
    test('first page then next page via meta.totalPages, de-duplicated', () async {
      final queries = <Map<String, String>>[];
      final orders = OrderProvider(client: MockClient((request) async {
        expect(request.url.path, '/api/orders/my-orders');
        expect(request.headers['Authorization'], 'Bearer access');
        queries.add(request.url.queryParameters);
        final page = request.url.queryParameters['page'];
        return jsonResponse({
          'success': true,
          'data': page == '1'
              ? [orderJson('a', 'PENDING'), orderJson('b', 'SHIPPING')]
              : [orderJson('b', 'SHIPPING'), orderJson('c', 'DELIVERED')],
          'meta': {'page': int.parse(page!), 'limit': 10, 'total': 3, 'totalPages': 2},
        });
      }));
      await orders.fetchMyOrders('access');
      expect(queries.single, {'page': '1', 'limit': '${OrderProvider.myOrdersPageSize}'});
      expect(orders.myOrders.map((o) => o.id), ['a', 'b']);
      expect(orders.myOrdersHasMore, isTrue);

      await orders.loadMoreMyOrders('access');
      expect(queries.last['page'], '2');
      expect(orders.myOrders.map((o) => o.id), ['a', 'b', 'c']);
      expect(orders.myOrdersHasMore, isFalse);

      await orders.loadMoreMyOrders('access'); // last page: no request
      expect(queries, hasLength(2));
      orders.dispose();
    });

    test('a failed first page exposes an error; a failed next page keeps loaded orders', () async {
      var fail = true;
      final orders = OrderProvider(client: MockClient((request) async {
        if (fail) return jsonResponse({'message': 'boom'}, 500);
        return jsonResponse({'data': [orderJson('a', 'PENDING')], 'meta': {'page': 1, 'totalPages': 3}});
      }));
      await orders.fetchMyOrders('access');
      expect(orders.myOrdersError, isNotNull);
      expect(orders.isLoading, isFalse);

      fail = false;
      await orders.fetchMyOrders('access');
      expect(orders.myOrdersError, isNull);
      expect(orders.myOrdersHasMore, isTrue);

      fail = true;
      await orders.loadMoreMyOrders('access');
      expect(orders.loadMoreMyOrdersError, isNotNull);
      expect(orders.myOrders, hasLength(1));
      expect(orders.isLoadingMoreMyOrders, isFalse);
      orders.dispose();
    });

    test('requestReturn posts only the whitelisted reason and re-reads the order', () async {
      final calls = <String>[];
      final orders = OrderProvider(client: MockClient((request) async {
        calls.add('${request.method} ${request.url.path}');
        if (request.method == 'POST') {
          expect(jsonDecode(request.body), {'reason': 'Khác: Rách bìa'});
          expect(request.headers['Authorization'], 'Bearer access');
          return jsonResponse({'data': orderJson('o1', 'RETURN_REQUESTED')}, 201);
        }
        return jsonResponse({'data': orderJson('o1', 'RETURN_REQUESTED')});
      }));
      final updated = await orders.requestReturn('o1', '  Khác: Rách bìa ', 'access');
      expect(updated?.orderStatus, 'RETURN_REQUESTED');
      expect(calls, ['POST /api/orders/o1/return-request', 'GET /api/orders/o1']);
      orders.dispose();
    });

    test('requestReturn surfaces the backend message', () async {
      final orders = OrderProvider(client: MockClient((request) async => jsonResponse({
        'message': 'Đã quá thời hạn 7 ngày kể từ khi nhận hàng. Không thể yêu cầu đổi trả.',
      }, 400)));
      await expectLater(orders.requestReturn('o1', 'Lý do', 'access'),
          throwsA(predicate((e) => e.toString().contains('quá thời hạn 7 ngày'))));
      await expectLater(orders.requestReturn('o1', '   ', 'access'), throwsException);
      orders.dispose();
    });
  });

  group('NotificationProvider read state', () {
    NotificationProvider build(List<String> calls, {int status = 200}) {
      return NotificationProvider(client: MockClient((request) async {
        calls.add('${request.method} ${request.url.path}');
        if (request.method == 'PATCH') return jsonResponse({'data': {}}, status);
        if (request.url.path.endsWith('unread-count')) return jsonResponse({'data': {'unreadCount': 2}});
        return jsonResponse({'data': {'items': [
          {'_id': 'n1', 'title': 'A', 'message': 'a', 'type': 'order', 'isRead': false, 'meta': {'orderId': 'o1'}},
          {'_id': 'n2', 'title': 'B', 'message': 'b', 'type': 'promotion', 'isRead': false},
        ]}});
      }));
    }

    test('mark one / all as read call the API and update the bell count', () async {
      final calls = <String>[];
      final provider = build(calls);
      await provider.fetchNotifications('t');
      expect(provider.unreadCount, 2);
      expect(provider.hasUnread, isTrue);

      expect(await provider.markAsRead('n1', 't'), isTrue);
      expect(calls, contains('PATCH /api/notifications/n1/read'));
      expect(provider.unreadCount, 1);
      expect(provider.notifications.first.isRead, isTrue);

      // Marking an already read item again does not double-decrement.
      await provider.markAsRead('n1', 't');
      expect(provider.unreadCount, 1);

      expect(await provider.markAllAsRead('t'), isTrue);
      expect(calls, contains('PATCH /api/notifications/read-all'));
      expect(provider.unreadCount, 0);
      expect(provider.notifications.every((n) => n.isRead), isTrue);

      provider.reset();
      expect(provider.notifications, isEmpty);
      expect(provider.hasUnread, isFalse);
      provider.dispose();
    });

    test('failed PATCH keeps the unread state; guests never call the API', () async {
      final calls = <String>[];
      final provider = build(calls, status: 500);
      await provider.fetchNotifications('t');
      expect(await provider.markAsRead('n1', 't'), isFalse);
      expect(await provider.markAllAsRead('t'), isFalse);
      expect(provider.unreadCount, 2);
      calls.clear();
      expect(await provider.markAllAsRead(null), isFalse);
      expect(calls, isEmpty);
      provider.dispose();
    });

    test('order id comes only from meta.orderId / order_id', () {
      expect(NotificationModel.fromJson({'meta': {'orderId': 'o1'}}).orderId, 'o1');
      expect(NotificationModel.fromJson({'meta': {'order_id': 'o2'}}).orderId, 'o2');
      expect(NotificationModel.fromJson({'meta': {'id': 'n1'}}).orderId, isNull);
      expect(NotificationModel.fromJson({}).orderId, isNull);
    });
  });

  group('Screens', () {
    testWidgets('history filter tabs narrow the list and show a tab empty state', (tester) async {
      final auth = TestAuth();
      final orders = OrderProvider(client: MockClient((request) async => jsonResponse({
        'data': [orderJson('a', 'PENDING'), orderJson('b', 'SHIPPING'), orderJson('c', 'DELIVERED', paymentStatus: 'PAID')],
        'meta': {'page': 1, 'limit': 10, 'total': 3, 'totalPages': 1},
      })));
      await tester.pumpWidget(host(auth: auth, orders: orders, child: const OrderHistoryScreen()));
      await tester.pumpAndSettle();

      expect(find.text('#TT-a'), findsOneWidget);
      expect(find.text('#TT-b'), findsOneWidget);
      expect(find.text('#TT-c'), findsOneWidget);
      expect(find.text('Đang giao hàng'), findsOneWidget);
      expect(find.text('SHIPPING'), findsNothing);
      expect(find.textContaining('Đã thanh toán'), findsOneWidget);

      Finder tab(String label) => find.descendant(of: find.byType(TabBar), matching: find.text(label));
      await tester.tap(tab('Chờ xác nhận'));
      await tester.pumpAndSettle();
      expect(find.text('#TT-a'), findsOneWidget);
      expect(find.text('#TT-b'), findsNothing);

      await tester.ensureVisible(tab('Trả hàng'));
      await tester.pumpAndSettle();
      await tester.tap(tab('Trả hàng'));
      await tester.pumpAndSettle();
      expect(find.text('Không có đơn hàng trả hàng'), findsOneWidget);
      expect(tester.takeException(), isNull);

      await tester.pumpWidget(const SizedBox.shrink());
      orders.dispose();
      auth.dispose();
    });

    testWidgets('history shows a retry state when the first page fails', (tester) async {
      final auth = TestAuth();
      var fail = true;
      final orders = OrderProvider(client: MockClient((request) async => fail
          ? jsonResponse({'message': 'down'}, 503)
          : jsonResponse({'data': [orderJson('a', 'PENDING')], 'meta': {'page': 1, 'totalPages': 1}})));
      await tester.pumpWidget(host(auth: auth, orders: orders, child: const OrderHistoryScreen()));
      await tester.pumpAndSettle();
      expect(find.text('Thử lại'), findsOneWidget);

      fail = false;
      await tester.tap(find.text('Thử lại'));
      await tester.pumpAndSettle();
      expect(find.text('#TT-a'), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      orders.dispose();
      auth.dispose();
    });

    testWidgets('detail: labels, GHN link, no invoice button, return request flow', (tester) async {
      final auth = TestAuth();
      final posted = <Object?>[];
      final delivered = DateTime.now().toUtc().subtract(const Duration(days: 1)).toIso8601String();
      final orders = OrderProvider(client: MockClient((request) async {
        if (request.method == 'POST') {
          posted.add(jsonDecode(request.body));
          return jsonResponse({'data': orderJson('o1', 'RETURN_REQUESTED')}, 201);
        }
        return jsonResponse({'data': orderJson('o1', 'RETURN_REQUESTED', paymentStatus: 'PAID')});
      }));
      final order = OrderModel.fromJson(orderJson('o1', 'DELIVERED',
          paymentStatus: 'PAID', paymentMethod: 'VNPAY',
          trackingCode: 'LKGHN1', shippingProvider: 'GHN', shippingStatus: 'delivered',
          timeline: [
            {'status': 'PENDING', 'note': 'Đặt hàng', 'createdAt': '2026-11-01T00:00:00Z'},
            {'status': 'DELIVERED', 'note': 'Đã giao', 'createdAt': delivered},
          ]));
      await tester.pumpWidget(host(auth: auth, orders: orders, child: OrderDetailScreen(order: order)));
      await tester.pumpAndSettle();

      expect(find.text('Đơn hàng #TT-o1'), findsOneWidget);
      expect(find.text('DELIVERED'), findsNothing);
      expect(find.text('Đã giao thành công'), findsWidgets);
      expect(find.text('Đã thanh toán'), findsOneWidget);
      expect(find.textContaining('Cổng thanh toán VNPay', findRichText: true), findsOneWidget);
      expect(find.text('Tra cứu GHN'), findsOneWidget);
      expect(find.textContaining('LKGHN1', findRichText: true), findsOneWidget);
      expect(find.text('Tải hóa đơn PDF'), findsNothing);
      expect(find.text('Hủy đơn hàng'), findsNothing);

      final returnButton = find.byIcon(Icons.assignment_return_outlined);
      await tester.scrollUntilVisible(returnButton, 200);
      await tester.tap(returnButton);
      await tester.pumpAndSettle();
      expect(find.text('Yêu cầu đổi/trả hàng'), findsOneWidget);

      await tester.enterText(find.byKey(const ValueKey('return-detail-field')), 'Rách bìa');
      final submit = find.text('Gửi yêu cầu trả hàng');
      await tester.ensureVisible(submit);
      await tester.pumpAndSettle();
      await tester.tap(submit);
      await tester.pumpAndSettle();

      expect(posted, [{'reason': '${returnReasonCategories.first}: Rách bìa'}]);
      expect(find.text('Đã gửi yêu cầu trả hàng. Cửa hàng sẽ sớm xem xét.'), findsOneWidget);
      expect(find.byIcon(Icons.assignment_return_outlined, skipOffstage: false), findsNothing);
      expect(find.text('Yêu cầu trả hàng', skipOffstage: false), findsWidgets); // status badge
      expect(tester.takeException(), isNull);

      await tester.pumpWidget(const SizedBox.shrink());
      orders.dispose();
      auth.dispose();
    });

    testWidgets('detail: guests get a sign-in hint instead of the return button (dark mode)', (tester) async {
      final auth = AuthProvider();
      final orders = OrderProvider(client: MockClient((_) async => jsonResponse({}, 404)));
      final order = OrderModel.fromJson(orderJson('g1', 'DELIVERED'));
      await tester.pumpWidget(host(auth: auth, orders: orders, brightness: Brightness.dark,
          child: OrderDetailScreen(order: order)));
      await tester.pumpAndSettle();

      expect(find.textContaining('Cần đổi/trả hàng?'), findsOneWidget);
      expect(find.byIcon(Icons.assignment_return_outlined, skipOffstage: false), findsNothing);
      expect(tester.takeException(), isNull);

      await tester.pumpWidget(const SizedBox.shrink());
      orders.dispose();
      auth.dispose();
    });

    testWidgets('detail: cancel is offered only for PENDING orders', (tester) async {
      final auth = TestAuth();
      final orders = OrderProvider(client: MockClient((_) async => jsonResponse({}, 404)));
      await tester.pumpWidget(host(auth: auth, orders: orders,
          child: OrderDetailScreen(order: OrderModel.fromJson(orderJson('p1', 'PENDING')))));
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(find.text('Hủy đơn hàng'), 200);
      expect(find.text('Hủy đơn hàng'), findsOneWidget);

      await tester.pumpWidget(host(auth: auth, orders: orders,
          child: OrderDetailScreen(key: const ValueKey('p2'), order: OrderModel.fromJson(orderJson('p2', 'CONFIRMED')))));
      await tester.pumpAndSettle();
      expect(find.text('Đơn hàng #TT-p2'), findsOneWidget);
      expect(find.text('Hủy đơn hàng', skipOffstage: false), findsNothing);

      await tester.pumpWidget(const SizedBox.shrink());
      orders.dispose();
      auth.dispose();
    });

    testWidgets('notifications: guest "Đăng nhập ngay" opens LoginScreen', (tester) async {
      final auth = AuthProvider();
      final orders = OrderProvider(client: MockClient((_) async => jsonResponse({}, 404)));
      final notifications = NotificationProvider(client: MockClient((_) async => jsonResponse({}, 401)));
      await tester.pumpWidget(host(auth: auth, orders: orders, notifications: notifications,
          child: const NotificationsScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng nhập ngay'));
      await tester.pumpAndSettle();
      expect(find.byType(LoginScreen), findsOneWidget);
      expect(find.byType(NotificationsScreen, skipOffstage: false), findsOneWidget);

      await tester.pumpWidget(const SizedBox.shrink());
      notifications.dispose();
      orders.dispose();
      auth.dispose();
    });

    testWidgets('notifications: "Đọc tất cả" calls the API and hides itself', (tester) async {
      final auth = TestAuth();
      final orders = OrderProvider(client: MockClient((_) async => jsonResponse({}, 404)));
      final calls = <String>[];
      final notifications = NotificationProvider(client: MockClient((request) async {
        calls.add('${request.method} ${request.url.path}');
        if (request.method == 'PATCH') return jsonResponse({'data': {}});
        if (request.url.path.endsWith('unread-count')) return jsonResponse({'data': {'unreadCount': 1}});
        return jsonResponse({'data': {'items': [
          {'_id': 'n1', 'title': 'Khuyến mãi', 'message': 'Giảm giá', 'type': 'promotion', 'isRead': false},
        ]}});
      }));
      await tester.pumpWidget(host(auth: auth, orders: orders, notifications: notifications,
          child: const NotificationsScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đọc tất cả'));
      await tester.pumpAndSettle();
      expect(calls, contains('PATCH /api/notifications/read-all'));
      expect(find.text('Đọc tất cả'), findsNothing);
      expect(notifications.unreadCount, 0);

      await tester.pumpWidget(const SizedBox.shrink());
      notifications.dispose();
      orders.dispose();
      auth.dispose();
    });
  });
}
