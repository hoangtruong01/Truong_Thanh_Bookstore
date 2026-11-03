import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_exception.dart';

export 'api_exception.dart';

/// Outcome of a refresh-token exchange.
/// MOB-01: only [rejected] (server answered 401/403) ends the session;
/// [unavailable] (offline, timeout, 5xx, 429) keeps the user signed in.
enum TokenRefreshResult { refreshed, rejected, unavailable }

typedef AccessTokenProvider = String? Function();
typedef TokenRefresher = Future<TokenRefreshResult> Function();

/// A backend response with the `{success, data, meta, message}` envelope unwrapped.
class ApiResponse {
  ApiResponse({
    required this.statusCode,
    this.data,
    this.meta,
    this.message,
    this.errorCode,
    this.body,
  });

  factory ApiResponse.fromHttp(http.Response response) {
    dynamic decoded;
    if (response.bodyBytes.isNotEmpty) {
      // JSON is UTF-8 (RFC 8259) even when the server omits the charset, which
      // would otherwise make package:http fall back to Latin-1 for Vietnamese text.
      final text = utf8.decode(response.bodyBytes, allowMalformed: true);
      try {
        decoded = jsonDecode(text);
      } on FormatException {
        decoded = text;
      }
    }
    final isEnvelope = decoded is Map && decoded.containsKey('data');
    final rawMessage = decoded is Map ? decoded['message'] : null;
    final rawMeta = decoded is Map ? decoded['meta'] : null;
    final rawCode = decoded is Map ? decoded['errorCode'] : null;
    return ApiResponse(
      statusCode: response.statusCode,
      data: isEnvelope ? decoded['data'] : decoded,
      meta: rawMeta is Map ? Map<String, dynamic>.from(rawMeta) : null,
      // class-validator errors arrive as a list of messages.
      message: rawMessage is List
          ? rawMessage.join('; ')
          : rawMessage?.toString(),
      errorCode: rawCode?.toString(),
      body: decoded,
    );
  }

  final int statusCode;

  /// Envelope `data` (or the whole decoded body when there is no envelope).
  final dynamic data;
  final Map<String, dynamic>? meta;
  final String? message;
  final String? errorCode;

  /// Full decoded JSON body, for the rare caller that needs envelope fields.
  final dynamic body;

  bool get isSuccess => statusCode >= 200 && statusCode < 300;

  /// List payload: a bare list, or one nested under [keys]
  /// (paginated `{items}` / legacy `{data}` shapes). Empty when absent.
  List<dynamic> listData([List<String> keys = const ['items', 'data']]) {
    final value = data;
    if (value is List) return value;
    if (value is Map) {
      for (final key in keys) {
        if (value[key] is List) return value[key] as List;
      }
    }
    return <dynamic>[];
  }

  /// Map payload, or an empty map when `data` is not an object.
  Map<String, dynamic> get mapData =>
      data is Map ? Map<String, dynamic>.from(data as Map) : <String, dynamic>{};
}

/// Single HTTP entry point for the app: JSON + platform headers, default
/// timeout, bearer token and one transparent refresh-and-retry on 401.
class ApiClient {
  ApiClient({http.Client? httpClient, this.defaultTimeout = const Duration(seconds: 15)})
      : _http = httpClient ?? http.Client(),
        _ownsHttpClient = httpClient == null;

  final http.Client _http;
  final bool _ownsHttpClient;
  final Duration defaultTimeout;

  AccessTokenProvider? _tokenProvider;
  TokenRefresher? _refresher;
  void Function()? _onSessionExpired;
  Future<TokenRefreshResult>? _refreshFlight;

  /// Connects the client to the session owner (AuthProvider).
  void bindSession({
    required AccessTokenProvider tokenProvider,
    required TokenRefresher refresher,
    required void Function() onSessionExpired,
  }) {
    _tokenProvider = tokenProvider;
    _refresher = refresher;
    _onSessionExpired = onSessionExpired;
  }

  Future<ApiResponse> get(String url, {
    Map<String, String>? query,
    String? token,
    bool authenticated = false,
    Map<String, String>? headers,
    Duration? timeout,
    bool refreshOnUnauthorized = true,
  }) => send('GET', url, query: query, token: token, authenticated: authenticated,
      headers: headers, timeout: timeout, refreshOnUnauthorized: refreshOnUnauthorized);

  Future<ApiResponse> post(String url, {
    Object? body,
    String? token,
    bool authenticated = false,
    Map<String, String>? headers,
    Duration? timeout,
    bool refreshOnUnauthorized = true,
  }) => send('POST', url, body: body, token: token, authenticated: authenticated,
      headers: headers, timeout: timeout, refreshOnUnauthorized: refreshOnUnauthorized);

  Future<ApiResponse> put(String url, {
    Object? body,
    String? token,
    bool authenticated = false,
    Map<String, String>? headers,
    Duration? timeout,
    bool refreshOnUnauthorized = true,
  }) => send('PUT', url, body: body, token: token, authenticated: authenticated,
      headers: headers, timeout: timeout, refreshOnUnauthorized: refreshOnUnauthorized);

  Future<ApiResponse> patch(String url, {
    Object? body,
    String? token,
    bool authenticated = false,
    Map<String, String>? headers,
    Duration? timeout,
    bool refreshOnUnauthorized = true,
  }) => send('PATCH', url, body: body, token: token, authenticated: authenticated,
      headers: headers, timeout: timeout, refreshOnUnauthorized: refreshOnUnauthorized);

  Future<ApiResponse> delete(String url, {
    Object? body,
    String? token,
    bool authenticated = false,
    Map<String, String>? headers,
    Duration? timeout,
    bool refreshOnUnauthorized = true,
  }) => send('DELETE', url, body: body, token: token, authenticated: authenticated,
      headers: headers, timeout: timeout, refreshOnUnauthorized: refreshOnUnauthorized);

  /// Sends a request. A non-empty [token] (or [authenticated] with the bound
  /// session token) adds `Authorization: Bearer`. Throws [ApiNetworkException]
  /// on transport failure/timeout; every HTTP status returns an [ApiResponse].
  Future<ApiResponse> send(String method, String url, {
    Map<String, String>? query,
    Object? body,
    String? token,
    bool authenticated = false,
    Map<String, String>? headers,
    Duration? timeout,
    bool refreshOnUnauthorized = true,
  }) async {
    var uri = Uri.parse(url);
    if (query != null) uri = uri.replace(queryParameters: {...uri.queryParameters, ...query});
    final encodedBody = body == null ? null : (body is String ? body : jsonEncode(body));
    final useAuth = authenticated || _nonEmpty(token) != null;
    final usedToken = useAuth ? (_nonEmpty(token) ?? _nonEmpty(_tokenProvider?.call())) : null;

    var response = await _dispatch(method, uri, encodedBody, headers, usedToken, timeout);
    if (response.statusCode == 401 && usedToken != null && refreshOnUnauthorized &&
        _refresher != null) {
      final freshToken = await _tokenAfterUnauthorized(usedToken);
      if (freshToken != null) {
        // Retry exactly once; a second 401 is returned to the caller as-is.
        response = await _dispatch(method, uri, encodedBody, headers, freshToken, timeout);
      }
    }
    return ApiResponse.fromHttp(response);
  }

  /// Single-flight refresh: concurrent callers share one refresh request and
  /// [onSessionExpired] fires at most once per rejected refresh.
  Future<TokenRefreshResult> refreshSession() {
    final refresher = _refresher;
    if (refresher == null) return Future.value(TokenRefreshResult.unavailable);
    return _refreshFlight ??= _runRefresh(refresher)
        .whenComplete(() => _refreshFlight = null);
  }

  void close() {
    if (_ownsHttpClient) _http.close();
  }

  Future<TokenRefreshResult> _runRefresh(TokenRefresher refresher) async {
    TokenRefreshResult result;
    try {
      result = await refresher();
    } catch (_) {
      result = TokenRefreshResult.unavailable;
    }
    if (result == TokenRefreshResult.rejected) _onSessionExpired?.call();
    return result;
  }

  Future<String?> _tokenAfterUnauthorized(String rejectedToken) async {
    final current = _nonEmpty(_tokenProvider?.call());
    if (_refreshFlight == null) {
      // Signed out meanwhile (e.g. an earlier refresh was rejected): do not refresh again.
      if (current == null) return null;
      // Another request already rotated the token after ours was sent.
      if (current != rejectedToken) return current;
    }
    final result = await refreshSession();
    return result == TokenRefreshResult.refreshed ? _nonEmpty(_tokenProvider?.call()) : null;
  }

  Future<http.Response> _dispatch(String method, Uri uri, String? body,
      Map<String, String>? extraHeaders, String? token, Duration? timeout) async {
    final request = http.Request(method, uri)
      ..headers.addAll({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-client-platform': 'mobile',
        ...?extraHeaders,
        if (token != null) 'Authorization': 'Bearer $token',
      });
    if (body != null) request.body = body;
    try {
      final streamed = await _http.send(request).timeout(timeout ?? defaultTimeout);
      return await http.Response.fromStream(streamed).timeout(timeout ?? defaultTimeout);
    } on TimeoutException catch (e) {
      throw ApiNetworkException('timeout', uri: uri, isTimeout: true, cause: e);
    } on ApiNetworkException {
      rethrow;
    } on http.ClientException catch (e) {
      throw ApiNetworkException(e.message, uri: uri, cause: e);
    } on Exception catch (e) {
      // SocketException, HandshakeException, ... on platforms that do not wrap them.
      throw ApiNetworkException(e.toString(), uri: uri, cause: e);
    }
  }

  static String? _nonEmpty(String? value) =>
      value == null || value.isEmpty ? null : value;
}
