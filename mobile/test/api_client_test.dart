import 'dart:async';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/api_client.dart';

// Raw UTF-8 bytes without a charset header, like some proxies return.
http.Response _json(Object body, [int status = 200]) =>
    http.Response.bytes(utf8.encode(jsonEncode(body)), status);

/// Fake session owner mirroring AuthProvider's contract with ApiClient.
class _Session {
  _Session(this.token, {this.result = TokenRefreshResult.refreshed});
  static const newToken = 'fresh';
  String? token;
  TokenRefreshResult result;
  int refreshCalls = 0;
  int expiredCalls = 0;
  Completer<void>? gate;

  void bind(ApiClient api) => api.bindSession(
        tokenProvider: () => token,
        refresher: () async {
          refreshCalls++;
          if (gate != null) await gate!.future;
          if (result == TokenRefreshResult.refreshed) token = newToken;
          return result;
        },
        onSessionExpired: () {
          expiredCalls++;
          token = null;
        },
      );
}

void main() {
  group('ApiResponse', () {
    test('unwraps the {success, data, meta} envelope', () async {
      final api = ApiClient(httpClient: MockClient((_) async => _json({
            'success': true, 'message': 'Thao tác thành công',
            'data': [{'_id': 'p1'}], 'meta': {'page': 1, 'total': 1},
          })));
      final res = await api.get('http://test/api/products');
      expect(res.isSuccess, true);
      expect(res.data, [{'_id': 'p1'}]);
      expect(res.listData().single['_id'], 'p1');
      expect(res.meta?['total'], 1);
      expect(res.message, 'Thao tác thành công');
    });

    test('reads nested lists, error envelopes and non-JSON bodies', () async {
      var call = 0;
      final api = ApiClient(httpClient: MockClient((_) async {
        call++;
        if (call == 1) return _json({'data': {'items': [1, 2], 'total': 2}});
        if (call == 2) {
          return _json({'success': false, 'message': ['email must be an email', 'phone too short'],
            'errorCode': 'ERR_VALIDATION', 'statusCode': 400}, 400);
        }
        return http.Response('<html>Bad Gateway</html>', 502);
      }));
      expect((await api.get('http://test/api/x')).listData(), [1, 2]);
      final invalid = await api.post('http://test/api/x', body: {'a': 1});
      expect(invalid.isSuccess, false);
      expect(invalid.message, 'email must be an email; phone too short');
      expect(invalid.errorCode, 'ERR_VALIDATION');
      final gateway = await api.get('http://test/api/x');
      expect(gateway.statusCode, 502);
      expect(gateway.data, '<html>Bad Gateway</html>');
      expect(gateway.mapData, isEmpty);
      expect(gateway.listData(), isEmpty);
    });
  });

  test('sends JSON, platform and bearer headers; guest calls get no bearer', () async {
    final requests = <http.Request>[];
    final api = ApiClient(httpClient: MockClient((request) async {
      requests.add(request);
      return _json({'data': {}});
    }));
    _Session('session-token').bind(api);

    await api.post('http://test/api/orders/authenticated', token: 'explicit', body: {'q': 'sách'},
        headers: {'x-extra': '1'});
    await api.get('http://test/api/me', authenticated: true);
    await api.get('http://test/api/orders/guest/g1', headers: {'x-guest-order-token': 'guest-key'});
    await api.get('http://test/api/products', query: {'q': 'sách tiếng Việt', 'limit': '50'});

    for (final r in requests) {
      expect(r.headers['x-client-platform'], 'mobile');
      expect(r.headers['Accept'], 'application/json');
      expect(r.headers['Content-Type'], startsWith('application/json'));
    }
    expect(requests[0].headers['Authorization'], 'Bearer explicit');
    expect(requests[0].headers['x-extra'], '1');
    expect(jsonDecode(requests[0].body), {'q': 'sách'});
    expect(requests[1].headers['Authorization'], 'Bearer session-token');
    expect(requests[2].headers.containsKey('Authorization'), false);
    expect(requests[2].headers['x-guest-order-token'], 'guest-key');
    expect(requests[3].url.queryParameters['q'], 'sách tiếng Việt');
    expect(requests[3].headers.containsKey('Authorization'), false);
  });

  test('timeout and transport errors become ApiNetworkException without logout', () async {
    final session = _Session('access');
    final never = Completer<http.Response>();
    final slow = ApiClient(httpClient: MockClient((_) => never.future),
        defaultTimeout: const Duration(milliseconds: 20));
    session.bind(slow);
    await expectLater(slow.get('http://test/api/me', token: 'access'),
        throwsA(isA<ApiNetworkException>().having((e) => e.isTimeout, 'isTimeout', true)));

    final offline = ApiClient(httpClient: MockClient((_) async => throw http.ClientException('offline')));
    session.bind(offline);
    final error = await offline.get('http://test/api/me', token: 'access').then<Object?>((_) => null,
        onError: (Object e) => e);
    expect(error, isA<ApiNetworkException>());
    // Still an http.ClientException, so existing `on ClientException` handlers keep working.
    expect(error, isA<http.ClientException>());
    expect((error as ApiNetworkException).isTimeout, false);

    expect(session.refreshCalls, 0);
    expect(session.expiredCalls, 0);
    expect(session.token, 'access');
  });

  test('401 refreshes once and retries the request with the new token', () async {
    final seen = <String?>[];
    final api = ApiClient(httpClient: MockClient((request) async {
      seen.add(request.headers['Authorization']);
      if (request.headers['Authorization'] == 'Bearer fresh') return _json({'data': {'ok': true}});
      return _json({'message': 'Token expired', 'errorCode': 'ERR_TOKEN_EXPIRED'}, 401);
    }));
    final session = _Session('stale')..bind(api);

    final res = await api.post('http://test/api/reviews/product/p1', token: 'stale', body: {'rating': 5});
    expect(res.statusCode, 200);
    expect(res.mapData['ok'], true);
    expect(seen, ['Bearer stale', 'Bearer fresh']);
    expect(session.refreshCalls, 1);
    expect(session.expiredCalls, 0);
  });

  test('concurrent 401s share ONE refresh and all retry successfully', () async {
    final api = ApiClient(httpClient: MockClient((request) async {
      await Future<void>.delayed(Duration.zero);
      return request.headers['Authorization'] == 'Bearer fresh'
          ? _json({'data': request.url.path})
          : _json({'message': 'expired'}, 401);
    }));
    final session = _Session('stale')..gate = Completer<void>();
    session.bind(api);

    final calls = [
      for (final path in ['a', 'b', 'c']) api.get('http://test/api/$path', token: 'stale'),
    ];
    await Future<void>.delayed(const Duration(milliseconds: 10));
    session.gate!.complete();
    final results = await Future.wait(calls);

    expect(results.map((r) => r.statusCode), [200, 200, 200]);
    expect(results.map((r) => r.data), ['/api/a', '/api/b', '/api/c']);
    expect(session.refreshCalls, 1);

    // A late 401 for a token that was already rotated retries without refreshing again.
    final late = await api.get('http://test/api/d', token: 'stale');
    expect(late.statusCode, 200);
    expect(session.refreshCalls, 1);
  });

  test('rejected refresh calls onSessionExpired once and returns the 401', () async {
    final api = ApiClient(httpClient: MockClient((request) async {
      await Future<void>.delayed(Duration.zero);
      return _json({'message': 'expired'}, 401);
    }));
    final session = _Session('stale', result: TokenRefreshResult.rejected)..bind(api);

    final results = await Future.wait([
      api.get('http://test/api/a', token: 'stale'),
      api.get('http://test/api/b', token: 'stale'),
    ]);
    expect(results.map((r) => r.statusCode), [401, 401]);
    expect(session.refreshCalls, 1);
    expect(session.expiredCalls, 1);
    expect(session.token, isNull);
  });

  test('refresh unavailable (offline/5xx) keeps the session (MOB-01)', () async {
    final api = ApiClient(httpClient: MockClient((_) async => _json({'message': 'expired'}, 401)));
    final session = _Session('stale', result: TokenRefreshResult.unavailable)..bind(api);
    final res = await api.get('http://test/api/a', token: 'stale');
    expect(res.statusCode, 401);
    expect(session.refreshCalls, 1);
    expect(session.expiredCalls, 0);
    expect(session.token, 'stale');
  });

  test('403 and unauthenticated 401s never refresh or log out', () async {
    var requests = 0;
    final api = ApiClient(httpClient: MockClient((request) async {
      requests++;
      return request.url.path.endsWith('forbidden')
          ? _json({'message': 'Bạn không có quyền', 'errorCode': 'ERR_FORBIDDEN'}, 403)
          : _json({'message': 'Sai mật khẩu'}, 401);
    }));
    final session = _Session('access')..bind(api);

    final forbidden = await api.get('http://test/api/forbidden', token: 'access');
    expect(forbidden.statusCode, 403);
    expect(forbidden.message, 'Bạn không có quyền');
    // Login failure: no bearer was sent, so a 401 is a normal answer, not an expiry.
    final login = await api.post('http://test/api/auth/login', body: {'email': 'a'});
    expect(login.statusCode, 401);
    // Opt-out used by the refresh call itself to avoid recursion.
    final optOut = await api.get('http://test/api/me', token: 'access', refreshOnUnauthorized: false);
    expect(optOut.statusCode, 401);

    expect(requests, 3);
    expect(session.refreshCalls, 0);
    expect(session.expiredCalls, 0);
  });

  test('a retried request that is still 401 is returned without a second refresh', () async {
    var requests = 0;
    final api = ApiClient(httpClient: MockClient((_) async {
      requests++;
      return _json({'message': 'expired'}, 401);
    }));
    final session = _Session('stale')..bind(api);
    final res = await api.get('http://test/api/a', token: 'stale');
    expect(res.statusCode, 401);
    expect(requests, 2);
    expect(session.refreshCalls, 1);
  });

  test('refreshSession is single-flight and a throwing refresher is unavailable', () async {
    final api = ApiClient(httpClient: MockClient((_) async => _json({})));
    var calls = 0;
    var expired = 0;
    final gate = Completer<void>();
    api.bindSession(
      tokenProvider: () => 'access',
      refresher: () async {
        calls++;
        await gate.future;
        throw StateError('storage unavailable');
      },
      onSessionExpired: () => expired++,
    );
    final first = api.refreshSession();
    final second = api.refreshSession();
    gate.complete();
    expect(await first, TokenRefreshResult.unavailable);
    expect(await second, TokenRefreshResult.unavailable);
    expect(calls, 1);
    expect(expired, 0);
    // The flight is cleared afterwards, so a later refresh runs again.
    await api.refreshSession();
    expect(calls, 2);
  });
}
