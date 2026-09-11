import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/providers/review_provider.dart';

void main() {
  test('Review submission uses product route and the backend DTO, then reloads real reviews', () async {
    final requests = <http.Request>[];
    final client = MockClient((request) async {
      requests.add(request);
      if (request.method == 'POST') {
        expect(request.url.path, '/api/reviews/product/product-1');
        expect(request.headers['Authorization'], 'Bearer access');
        expect(jsonDecode(request.body), {'rating': 4, 'content': 'Good book'});
        return http.Response('{"data":{"_id":"review-1"}}', 201);
      }
      if (request.url.path.endsWith('/breakdown')) {
        return http.Response(jsonEncode({'data': {
          'averageRating': 4, 'totalReviews': 1, 'breakdown': {'4': 1},
          'percentages': {'4': 100},
        }}), 200);
      }
      return http.Response(jsonEncode({'data': [{
        '_id': 'review-1', 'product': 'product-1', 'user': {'_id': 'user-1', 'fullName': 'Buyer'},
        'rating': 4, 'content': 'Good book', 'isVisible': true,
      }]}), 200);
    });
    final provider = ReviewProvider(client: client);
    expect(await provider.submitReview(productId: 'product-1', rating: 4, content: 'Good book', token: 'access'), true);
    expect(provider.reviews.single.content, 'Good book');
    expect(provider.breakdown?.total, 1);
    expect(provider.breakdown?.average, 4);
    expect(provider.breakdown?.counts[4], 1);
    expect(requests, hasLength(3));
    provider.dispose();
    client.close();
  });

  test('Rejected review is not inserted or reported as successful', () async {
    final client = MockClient((request) async => http.Response('{"message":["Not eligible"]}', 403));
    final provider = ReviewProvider(client: client);
    expect(await provider.submitReview(productId: 'p', rating: 5, content: 'Review', token: 'access'), false);
    expect(provider.reviews, isEmpty);
    expect(provider.errorMessage, 'Not eligible');
    provider.dispose();
    client.close();
  });

  test('Previously reviewed products and a failed eligibility check disable submission', () async {
    var calls = 0;
    final client = MockClient((request) async {
      calls++;
      if (calls == 1) return http.Response('{"data":{"canReview":true,"hasReviewed":false}}', 200);
      if (calls == 2) return http.Response('{"data":{"canReview":true,"hasReviewed":true}}', 200);
      return http.Response('{}', 503);
    });
    final provider = ReviewProvider(client: client);
    await provider.checkCanReview('p', 'access');
    expect(provider.canUserReview, true);
    await provider.checkCanReview('p', 'access');
    expect(provider.canUserReview, false);
    await provider.checkCanReview('p', 'access');
    expect(provider.canUserReview, false);
    provider.dispose();
    client.close();
  });
}
