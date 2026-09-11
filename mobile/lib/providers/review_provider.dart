import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/review_model.dart';

class ReviewProvider with ChangeNotifier {
  ReviewProvider({http.Client? client}) : _client = client;
  final http.Client? _client;
  bool _disposed = false;

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
  List<ReviewModel> _reviews = [];
  RatingBreakdownModel? _breakdown;
  bool _canUserReview = false;
  String? _canReviewReason;
  bool _isLoading = false;
  String? _errorMessage;

  List<ReviewModel> get reviews => List.unmodifiable(_reviews);
  RatingBreakdownModel? get breakdown => _breakdown;
  bool get canUserReview => _canUserReview;
  String? get canReviewReason => _canReviewReason;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchReviews(String productId) async {
    _isLoading = true;
    _errorMessage = null;
    _reviews = [];
    _breakdown = null;
    notifyListeners();

    try {
      final res = await (_client?.get ?? http.get)(
        Uri.parse(ApiConstants.getReviews(productId)),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        final dynamic data = body['data'] ?? body;
        if (data is List) {
          _reviews = data.map((item) => ReviewModel.fromJson(item)).toList();
        }
      } else {
        _errorMessage = 'Không thể tải đánh giá. Vui lòng thử lại.';
      }

      await fetchRatingBreakdown(productId);
    } catch (e) {
      _errorMessage = 'Không thể tải đánh giá. Vui lòng thử lại.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchRatingBreakdown(String productId) async {
    try {
      final res = await (_client?.get ?? http.get)(
        Uri.parse(ApiConstants.getRatingBreakdown(productId)),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        final data = body['data'] ?? body;
        _breakdown = RatingBreakdownModel.fromJson(data);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Lỗi tải rating breakdown: $e');
    }
  }

  Future<void> checkCanReview(String productId, String? token) async {
    _canUserReview = false;
    _canReviewReason = 'Chưa thể xác minh quyền đánh giá. Vui lòng thử lại.';
    if (token == null || token.isEmpty) {
      _canUserReview = false;
      _canReviewReason = 'Vui lòng đăng nhập để đánh giá';
      notifyListeners();
      return;
    }

    try {
      final res = await (_client?.get ?? http.get)(
        Uri.parse(ApiConstants.canReview(productId)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        final data = body['data'] ?? body;
        _canUserReview = data['canReview'] == true && data['hasReviewed'] != true;
        _canReviewReason = data['hasReviewed'] == true
            ? 'Bạn đã đánh giá sản phẩm này'
            : data['reason']?.toString();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Lỗi kiểm tra canReview: $e');
    } finally {
      notifyListeners();
    }
  }

  Future<bool> submitReview({
    required String productId,
    required int rating,
    required String content,
    required String? token,
  }) async {
    if (token == null || token.isEmpty) {
      _errorMessage = 'Vui lòng đăng nhập để gửi đánh giá';
      notifyListeners();
      return false;
    }

    try {
      final res = await (_client?.post ?? http.post)(
        Uri.parse(ApiConstants.getReviews(productId)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'rating': rating,
          'content': content,
        }),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200 || res.statusCode == 201) {
        await fetchReviews(productId);
        _canUserReview = false;
        _canReviewReason = 'Bạn đã đánh giá sản phẩm này';
        notifyListeners();
        return true;
      } else {
        final body = json.decode(res.body);
        final message = body['message'];
        _errorMessage = message is List ? message.join('; ') : message?.toString() ?? 'Không thể gửi đánh giá';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Không thể gửi đánh giá. Vui lòng kiểm tra kết nối và thử lại.';
      notifyListeners();
      return false;
    }
  }
}
