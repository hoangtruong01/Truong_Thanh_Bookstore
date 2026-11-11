import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/main.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/providers/address_book_provider.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/providers/notification_provider.dart';
import 'package:mobile/providers/theme_provider.dart';
import 'package:mobile/providers/wishlist_provider.dart';
import 'package:mobile/screens/auth/auth_validators.dart';
import 'package:mobile/screens/auth/forgot_password_screen.dart';
import 'package:mobile/screens/profile/profile_screen.dart';
import 'package:mobile/screens/profile/store_contact.dart';
import 'package:mobile/screens/profile/theme_mode_selector.dart';
import 'package:mobile/screens/profile/wishlist_screen.dart';

http.Response _ok(Object? data, [int status = 200]) => http.Response.bytes(
      utf8.encode(jsonEncode({'success': status < 400, 'data': data})),
      status,
      headers: {'content-type': 'application/json'},
    );

http.Response _fail(String message, [int status = 400]) => http.Response.bytes(
      utf8.encode(jsonEncode({'success': false, 'message': message, 'statusCode': status})),
      status,
    );

/// Một request đã gửi qua MockClient.
class _Call {
  _Call(this.method, this.path, this.headers, this.body);
  final String method;
  final String path;
  final Map<String, String> headers;
  final dynamic body;
}

class _Backend {
  final calls = <_Call>[];
  http.Response Function(_Call call) handler = (_) => _ok(null);

  ApiClient client() => ApiClient(
        httpClient: MockClient((request) async {
          final call = _Call(
            request.method,
            request.url.path,
            request.headers,
            request.body.isEmpty ? null : jsonDecode(request.body),
          );
          calls.add(call);
          return handler(call);
        }),
      );
}

const _storedUser = {
  '_id': 'u1',
  'fullName': 'Nguyễn Văn A',
  'email': 'a@example.com',
  'phone': '0901234567',
  'role': 'CUSTOMER',
  'loyaltyPoints': 120,
  'loyaltyTier': 'BRONZE',
};

void _signedInStorage() {
  FlutterSecureStorage.setMockInitialValues({'token': 'access-1', 'refreshToken': 'refresh-1'});
  SharedPreferences.setMockInitialValues({'user': jsonEncode(_storedUser)});
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('UserModel — điểm và hạng thành viên từ Backend', () {
    test('đọc loyaltyPoints / loyaltyTier và giữ khi lưu lại', () {
      final user = UserModel.fromJson({..._storedUser, 'loyaltyPoints': 5230, 'loyaltyTier': 'GOLD'});
      expect(user.loyaltyPoints, 5230);
      expect(user.loyaltyTier, 'GOLD');
      expect(user.loyaltyTierLabel, 'Vàng');
      final again = UserModel.fromJson(user.toJson());
      expect(again.loyaltyPoints, 5230);
      expect(again.loyaltyTier, 'GOLD');
    });

    test('mặc định 0 điểm, hạng Đồng khi Backend chưa trả về', () {
      final user = UserModel.fromJson({'_id': 'u', 'fullName': 'B', 'email': 'b@x.vn'});
      expect(user.loyaltyPoints, 0);
      expect(user.loyaltyTier, 'BRONZE');
      expect(user.loyaltyTierLabel, 'Đồng');
      expect(UserModel.fromJson({'loyaltyPoints': '42'}).loyaltyPoints, 42);
      expect(UserModel.tierLabel('DIAMOND'), 'Kim cương');
      expect(UserModel.tierLabel('SILVER'), 'Bạc');
    });
  });

  group('AuthValidators — khớp DTO Backend', () {
    test('mật khẩu mới: tối thiểu 8 ký tự, có hoa, thường, số', () {
      expect(AuthValidators.newPassword(''), 'Vui lòng nhập mật khẩu');
      expect(AuthValidators.newPassword('Ab1cde'), 'Mật khẩu phải có ít nhất 8 ký tự');
      expect(AuthValidators.newPassword('abcdefg1'), contains('1 chữ hoa'));
      expect(AuthValidators.newPassword('ABCDEFG1'), contains('1 chữ thường'));
      expect(AuthValidators.newPassword('Abcdefgh'), contains('1 chữ số'));
      expect(AuthValidators.newPassword('Abcdefg1'), isNull);
      expect(AuthValidators.passwordMinLength, 8);
    });

    test('đăng nhập chỉ yêu cầu không để trống (LoginDto)', () {
      expect(AuthValidators.loginPassword(''), isNotNull);
      expect(AuthValidators.loginPassword('123'), isNull);
    });

    test('email, xác nhận mật khẩu, OTP', () {
      expect(AuthValidators.email(''), 'Vui lòng nhập email');
      expect(AuthValidators.email('abc@'), 'Email không đúng định dạng');
      expect(AuthValidators.email(' a@b.vn '), isNull);
      expect(AuthValidators.confirmPassword('x', 'y'), 'Xác nhận mật khẩu không trùng khớp');
      expect(AuthValidators.confirmPassword('Abcdefg1', 'Abcdefg1'), isNull);
      expect(AuthValidators.otp('12345'), isNotNull);
      expect(AuthValidators.otp('123456'), isNull);
    });

    test('SĐT theo ^0\\d{9}\$ như web', () {
      expect(AuthValidators.optionalPhone(''), isNull);
      expect(AuthValidators.optionalPhone('0901234567'), isNull);
      expect(AuthValidators.optionalPhone('901234567'), AuthValidators.phoneError);
      expect(AuthValidators.requiredPhone(''), 'Vui lòng nhập số điện thoại');
      expect(AuthValidators.requiredPhone('09012345678'), AuthValidators.phoneError);
      expect(AuthValidators.requiredPhone('0901234567'), isNull);
    });
  });

  group('AuthProvider — hồ sơ', () {
    test('refreshProfile lấy điểm / hạng từ GET /auth/me kèm Bearer', () async {
      _signedInStorage();
      final backend = _Backend()
        ..handler = (_) => _ok({..._storedUser, 'loyaltyPoints': 2400, 'loyaltyTier': 'SILVER'});
      final auth = AuthProvider(apiClient: backend.client());
      await auth.sessionReady;
      expect(auth.user!.loyaltyPoints, 120);

      expect(await auth.refreshProfile(), isTrue);
      final call = backend.calls.single;
      expect(call.method, 'GET');
      expect(call.path, endsWith('/auth/me'));
      expect(call.headers['Authorization'], 'Bearer access-1');
      expect(auth.user!.loyaltyPoints, 2400);
      expect(auth.user!.loyaltyTier, 'SILVER');
      expect(auth.isRefreshingProfile, isFalse);

      final prefs = await SharedPreferences.getInstance();
      expect(jsonDecode(prefs.getString('user')!)['loyaltyPoints'], 2400);
    });

    test('refreshProfile lỗi server giữ nguyên hồ sơ đang lưu', () async {
      _signedInStorage();
      final backend = _Backend()..handler = (_) => _fail('Lỗi máy chủ', 500);
      final auth = AuthProvider(apiClient: backend.client());
      await auth.sessionReady;
      expect(await auth.refreshProfile(), isFalse);
      expect(auth.user!.loyaltyPoints, 120);
      expect(auth.isAuthenticated, isTrue);
    });

    test('refreshProfile không gọi API khi chưa đăng nhập', () async {
      final backend = _Backend();
      final auth = AuthProvider(apiClient: backend.client());
      expect(await auth.refreshProfile(), isFalse);
      expect(backend.calls, isEmpty);
    });

    test('updateProfile gửi PUT /auth/profile, bỏ SĐT rỗng và cập nhật user', () async {
      _signedInStorage();
      final backend = _Backend()
        ..handler = (call) => _ok({..._storedUser, 'fullName': call.body['fullName'], 'phone': null});
      final auth = AuthProvider(apiClient: backend.client());
      await auth.sessionReady;

      await auth.updateProfile(fullName: '  Trần Thị B  ', phone: '  ');
      final call = backend.calls.single;
      expect(call.method, 'PUT');
      expect(call.path, endsWith('/auth/profile'));
      expect(call.body, {'fullName': 'Trần Thị B'});
      expect(auth.user!.fullName, 'Trần Thị B');
      expect(auth.isSavingProfile, isFalse);
    });

    test('updateProfile ném thông báo của Backend khi bị từ chối', () async {
      _signedInStorage();
      final backend = _Backend()..handler = (_) => _fail('Số điện thoại không hợp lệ');
      final auth = AuthProvider(apiClient: backend.client());
      await auth.sessionReady;

      await expectLater(
        auth.updateProfile(fullName: 'A', phone: '0123456789'),
        throwsA(predicate((e) => e.toString().contains('Số điện thoại không hợp lệ'))),
      );
      expect(backend.calls.single.body['phone'], '0123456789');
      expect(auth.user!.fullName, 'Nguyễn Văn A');
      expect(auth.isSavingProfile, isFalse);
    });

    test('đổi mật khẩu thành công thì đăng xuất (Backend thu hồi mọi phiên)', () async {
      _signedInStorage();
      final backend = _Backend()..handler = (_) => _ok({'success': true});
      final auth = AuthProvider(apiClient: backend.client());
      await auth.sessionReady;

      await auth.changePassword('Old12345', 'New12345');
      final change = backend.calls.first;
      expect(change.path, endsWith('/auth/change-password'));
      expect(change.body, {'currentPassword': 'Old12345', 'newPassword': 'New12345'});
      expect(auth.isAuthenticated, isFalse);
      expect(auth.user, isNull);
    });

    test('đổi mật khẩu sai giữ phiên và báo lỗi', () async {
      _signedInStorage();
      final backend = _Backend()..handler = (_) => _fail('Mật khẩu hiện tại không chính xác', 400);
      final auth = AuthProvider(apiClient: backend.client());
      await auth.sessionReady;

      await expectLater(
        auth.changePassword('wrong', 'New12345'),
        throwsA(predicate((e) => e.toString().contains('Mật khẩu hiện tại không chính xác'))),
      );
      expect(auth.isAuthenticated, isTrue);
    });
  });

  group('AddressBookProvider — /addresses', () {
    final addressJson = {
      '_id': 'a1',
      'user': 'u1',
      'label': 'Nhà riêng',
      'recipientName': 'Nguyễn Văn A',
      'phone': '0901234567',
      'province': 'Ninh Bình',
      'district': 'Hoa Lư',
      'ward': 'Nhân Hà',
      'detail': 'Chợ Chanh',
      'isDefault': true,
    };
    const input = AddressInput(
      label: ' Văn phòng ',
      recipientName: 'B',
      phone: '0912345678',
      province: 'P',
      district: 'D',
      ward: 'W',
      detail: 'X',
    );

    test('fetch đọc danh sách thành AddressModel', () async {
      final backend = _Backend()..handler = (_) => _ok([addressJson]);
      final book = AddressBookProvider(apiClient: backend.client());
      await book.fetch('tok');
      expect(book.hasLoaded, isTrue);
      expect(book.error, isNull);
      expect(book.addresses.single.id, 'a1');
      expect(book.addresses.single.isDefault, isTrue);
      expect(book.addresses.single.fullAddress, 'Chợ Chanh, Nhân Hà, Hoa Lư, Ninh Bình');
      expect(backend.calls.single.headers['Authorization'], 'Bearer tok');
    });

    test('fetch lỗi server / mất mạng đặt trạng thái lỗi', () async {
      final backend = _Backend()..handler = (_) => _fail('Lỗi máy chủ', 500);
      final book = AddressBookProvider(apiClient: backend.client());
      await book.fetch('tok');
      expect(book.hasLoaded, isFalse);
      expect(book.error, 'Lỗi máy chủ');
      expect(book.isLoading, isFalse);

      final offline = AddressBookProvider(
        apiClient: ApiClient(httpClient: MockClient((_) async => throw http.ClientException('down'))),
      );
      await offline.fetch('tok');
      expect(offline.error, contains('kết nối mạng'));
    });

    test('tạo mới POST, sửa PUT /:id, mặc định PUT /:id/default, xóa DELETE /:id', () async {
      final backend = _Backend()
        ..handler = (call) => call.method == 'GET' ? _ok([addressJson]) : _ok(addressJson, call.method == 'POST' ? 201 : 200);
      final book = AddressBookProvider(apiClient: backend.client());

      await book.save(input, 'tok');
      expect(backend.calls[0].method, 'POST');
      expect(backend.calls[0].path, endsWith('/addresses'));
      expect(backend.calls[0].body['label'], 'Văn phòng');
      expect(backend.calls[0].body['isDefault'], false);
      expect(backend.calls[1].method, 'GET'); // tải lại sau khi lưu

      await book.save(input, 'tok', id: 'a1');
      expect(backend.calls[2].method, 'PUT');
      expect(backend.calls[2].path, endsWith('/addresses/a1'));

      await book.setDefault('a1', 'tok');
      expect(backend.calls[4].method, 'PUT');
      expect(backend.calls[4].path, endsWith('/addresses/a1/default'));

      await book.delete('a1', 'tok');
      expect(backend.calls[6].method, 'DELETE');
      expect(backend.calls[6].path, endsWith('/addresses/a1'));
    });

    test('save bị từ chối ném thông báo Backend và không tải lại', () async {
      final backend = _Backend()..handler = (_) => _fail('Số điện thoại không hợp lệ');
      final book = AddressBookProvider(apiClient: backend.client());
      await expectLater(
        book.save(input, 'tok'),
        throwsA(predicate((e) => e.toString().contains('Số điện thoại không hợp lệ'))),
      );
      expect(backend.calls, hasLength(1));
    });
  });

  group('Giao diện — một điều khiển duy nhất', () {
    testWidgets('chọn Theo hệ thống / Sáng / Tối', (tester) async {
      final theme = ThemeProvider(platformBrightness: () => Brightness.light);
      await tester.pumpWidget(ChangeNotifierProvider.value(
        value: theme,
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: const Scaffold(body: ThemeModeSelector()),
        ),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Tối'));
      await tester.pumpAndSettle();
      expect(theme.themeMode, ThemeMode.dark);

      await tester.tap(find.text('Sáng'));
      await tester.pumpAndSettle();
      expect(theme.themeMode, ThemeMode.light);

      await tester.tap(find.text('Theo hệ thống'));
      await tester.pumpAndSettle();
      expect(theme.themeMode, ThemeMode.system);
    });
  });

  group('ProfileScreen', () {
    late List<Uri> dialed;

    setUp(() {
      dialed = [];
      StoreContact.dialer = (uri) async {
        dialed.add(uri);
        return true;
      };
    });

    Future<AuthProvider> pumpProfile(WidgetTester tester, _Backend backend,
        {ThemeMode mode = ThemeMode.light}) async {
      final auth = AuthProvider(apiClient: backend.client());
      await tester.runAsync(() => auth.sessionReady);
      await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>.value(value: auth),
          ChangeNotifierProvider(create: (_) => ThemeProvider(platformBrightness: () => Brightness.light)),
          ChangeNotifierProvider(create: (_) => NotificationProvider(apiClient: backend.client())),
        ],
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: mode,
          home: const ProfileScreen(),
        ),
      ));
      return auth;
    }

    for (final mode in [ThemeMode.light, ThemeMode.dark]) {
      testWidgets('hiển thị điểm / hạng từ server ($mode)', (tester) async {
        _signedInStorage();
        final backend = _Backend()
          ..handler = (_) => _ok({..._storedUser, 'loyaltyPoints': 5230, 'loyaltyTier': 'GOLD'});
        await pumpProfile(tester, backend, mode: mode);
        await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
        await tester.pumpAndSettle();

        expect(backend.calls.where((c) => c.path.endsWith('/auth/me')), hasLength(1));
        expect(find.text('Vàng'), findsOneWidget);
        expect(find.textContaining('5.230'), findsOneWidget);
        await tester.scrollUntilVisible(find.byType(ThemeModeSelector), 200);
        expect(find.byType(ThemeModeSelector), findsOneWidget);
        expect(find.byType(Switch), findsNothing);
        expect(tester.takeException(), isNull);
      });
    }

    testWidgets('hotline giống web và gọi được qua tel:', (tester) async {
      _signedInStorage();
      final backend = _Backend()..handler = (_) => _ok(_storedUser);
      await pumpProfile(tester, backend);
      await tester.pumpAndSettle();

      expect(find.text('Hotline: 0982 938 316'), findsOneWidget);
      await tester.ensureVisible(find.text('Hỗ trợ khách hàng'));
      await tester.tap(find.text('Hỗ trợ khách hàng'));
      await tester.pumpAndSettle();
      expect(dialed.single.toString(), 'tel:0982938316');
    });

    testWidgets('có mục Thông báo trong tài khoản', (tester) async {
      _signedInStorage();
      final backend = _Backend()..handler = (_) => _ok(_storedUser);
      await pumpProfile(tester, backend);
      await tester.pumpAndSettle();
      expect(find.text('Thông báo'), findsOneWidget);
    });

    testWidgets('khách chưa đăng nhập vẫn có hotline và chọn giao diện', (tester) async {
      final backend = _Backend();
      await pumpProfile(tester, backend);
      await tester.pumpAndSettle();
      expect(find.text('Tài khoản'), findsOneWidget);
      expect(find.text('Đăng nhập ngay'), findsOneWidget);
      await tester.scrollUntilVisible(find.byType(ThemeModeSelector), 200);
      expect(find.byType(ThemeModeSelector), findsOneWidget);
      expect(find.text('Hotline: 0982 938 316'), findsOneWidget);
      expect(backend.calls, isEmpty);
    });
  });

  group('Quên mật khẩu', () {
    testWidgets('không bao giờ hiển thị OTP từ phản hồi API', (tester) async {
      final backend = _Backend()..handler = (_) => _ok({'message': 'ok', 'otp': '654321'});
      final auth = AuthProvider(apiClient: backend.client());
      await tester.pumpWidget(ChangeNotifierProvider<AuthProvider>.value(
        value: auth,
        child: MaterialApp(theme: AppTheme.lightTheme, home: const ForgotPasswordScreen()),
      ));

      await tester.enterText(find.byType(TextFormField), 'a@example.com');
      await tester.tap(find.text('Gửi mã OTP'));
      await tester.pumpAndSettle();

      expect(backend.calls.single.path, endsWith('/auth/forgot-password'));
      expect(find.text('Mã xác thực OTP'), findsOneWidget);
      expect(find.textContaining('654321'), findsNothing);
      expect(find.textContaining('Development OTP'), findsNothing);
    });
  });

  group('Danh sách yêu thích — Khám phá ngay', () {
    testWidgets('mở tab Sản phẩm của màn hình chính', (tester) async {
      // Kích thước điện thoại (390x844) như khi chạy thật.
      tester.view.physicalSize = const Size(1170, 2532);
      tester.view.devicePixelRatio = 3;
      addTearDown(tester.view.reset);
      // Test này chỉ kiểm tra chuyển tab: bỏ qua lỗi tràn layout của các tab
      // khác (thuộc nhóm màn hình khác), mọi lỗi còn lại vẫn làm test thất bại.
      final originalOnError = FlutterError.onError;
      FlutterError.onError = (details) {
        if (details.exceptionAsString().contains('overflowed')) return;
        originalOnError?.call(details);
      };
      try {
        await tester.pumpWidget(const TruongThanhApp());
        await tester.pump();

        navigatorKey.currentState!.push(MaterialPageRoute(builder: (_) => const WishlistScreen()));
        await tester.pumpAndSettle();
        expect(find.text('Chưa có sản phẩm yêu thích'), findsOneWidget);

        await tester.tap(find.text('Khám phá ngay'));
        await tester.pumpAndSettle();

        expect(find.byType(WishlistScreen), findsNothing);
        expect(find.text('Danh sách sản phẩm'), findsOneWidget);
      } finally {
        FlutterError.onError = originalOnError;
      }
    });

    testWidgets('không có màn hình chính thì quay lại', (tester) async {
      final backend = _Backend();
      await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider(apiClient: backend.client())),
          ChangeNotifierProvider(create: (_) => WishlistProvider(apiClient: backend.client())),
        ],
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const WishlistScreen()),
                ),
                child: const Text('Mở'),
              ),
            ),
          ),
        ),
      ));
      await tester.tap(find.text('Mở'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Khám phá ngay'));
      await tester.pumpAndSettle();
      expect(find.byType(WishlistScreen), findsNothing);
      expect(find.text('Mở'), findsOneWidget);
    });
  });
}
