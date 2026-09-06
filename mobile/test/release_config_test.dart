import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/constants/api_constants.dart';

void main() {
  for (final url in ['', 'http://shop.example/api', 'https://localhost/api',
    'https://10.0.2.2/api', 'https://shop.example',
    'https://user:password@shop.example/api', 'https://shop.example/api?key=value']) {
    test('Release rejects invalid API URL: $url', () {
      expect(() => ApiConstants.resolveBaseUrl(url, release: true), throwsStateError);
    });
  }
  test('Normalizes valid release URL', () {
    expect(ApiConstants.resolveBaseUrl(' https://shop.example/api/ ', release: true),
      'https://shop.example/api');
  });
  test('Development retains local API support', () {
    expect(ApiConstants.resolveBaseUrl('http://localhost:3000/api', release: false),
      'http://localhost:3000/api');
  });
}
