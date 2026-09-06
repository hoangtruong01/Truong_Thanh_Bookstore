import 'dart:async';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/services/fcm_notification_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('Firebase failure does not fail authentication', () async {
    final service = FcmNotificationService.forTesting(
      client: MockClient((_) async => throw StateError('Must not send')),
      tokenLoader: () async => throw StateError('APNs unavailable'));
    expect(await service.registerForAuthenticatedUser('access'), false);
  });

  test('Token rotation uses current session and stops syncing after logout', () async {
    final requests = <http.Request>[];
    String? auth = 'access-1';
    final service = FcmNotificationService.forTesting(
      client: MockClient((request) async {
        requests.add(request);
        return http.Response('{}', 201);
      }), tokenLoader: () async => 'device-1');
    service.setAuthTokenProvider(() => auth);
    expect(await service.registerForAuthenticatedUser(auth), true);
    auth = 'access-2';
    await service.setDeviceToken('device-2');
    expect(requests.last.headers['Authorization'], 'Bearer access-2');
    expect(jsonDecode(requests.last.body)['deviceToken'], 'device-2');
    auth = null;
    await service.setDeviceToken('device-3');
    expect(requests.length, 2);
    expect(await service.getDeviceToken(), 'device-3');
  });

  test('Late Firebase token is not registered to logged out session', () async {
    final pending = Completer<String?>();
    String? auth = 'access';
    final service = FcmNotificationService.forTesting(
      client: MockClient((_) async => throw StateError('Must not send')),
      tokenLoader: () => pending.future);
    service.setAuthTokenProvider(() => auth);
    final registration = service.registerForAuthenticatedUser(auth);
    auth = null;
    pending.complete('device');
    expect(await registration, false);
  });

  test('Backend rejects registration without throwing into auth flow', () async {
    final service = FcmNotificationService.forTesting(
      client: MockClient((_) async => http.Response('{}', 401)),
      tokenLoader: () async => 'device');
    expect(await service.registerForAuthenticatedUser('expired'), false);
  });
}
