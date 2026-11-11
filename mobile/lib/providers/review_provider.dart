import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/review_model.dart';

/// Đánh giá của một sản phẩm. ReviewProvider là instance dùng chung toàn app,
/// nên mỗi màn chi tiết đọc trạng thái theo đúng `productId` của nó
/// (mở chồng nhiều màn chi tiết không ghi đè lẫn nhau).
class ProductReviewState {
  const ProductReviewState({
    this.reviews = const [],
    this.breakdown,
    this.isLoading = false,
    this.errorMessage,
  });

  final List<ReviewModel> reviews;
  final RatingBreakdownModel? breakdown;
  final bool isLoading;
  final String? errorMessage;

  static const empty = ProductReviewState();
}

class ReviewProvider with ChangeNotifier {
  ReviewProvider({ApiClient? apiClient, http.Client? client})
      : _api = apiClient ?? ApiClient(httpClient: client),
        _ownsApi = apiClient == null;
  final ApiClient _api;
  final bool _ownsApi;
  bool _disposed = false;

  /// Giới hạn số sản phẩm giữ trong bộ nhớ đệm đánh giá.
  static const int _maxCachedProducts = 20;

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    if (_ownsApi) _api.close();
    super.dispose();
  }
  List<ReviewModel> _reviews = [];
  RatingBreakdownModel? _breakdown;
  bool _canUserReview = false;
  String? _canReviewReason;
  bool _isLoading = false;
  String? _errorMessage;
  String? _currentProductId;
  final Map<String, ProductReviewState> _byProduct = {};
  final Map<String, int> _requestIds = {};
  int _requestCounter = 0;

  List<ReviewModel> get reviews => List.unmodifiable(_reviews);
  RatingBreakdownModel? get breakdown => _breakdown;
  bool get canUserReview => _canUserReview;
  String? get canReviewReason => _canReviewReason;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Trạng thái đánh giá của riêng [productId] (rỗng nếu chưa tải).
  ProductReviewState stateFor(String productId) =>
      _byProduct[productId] ?? ProductReviewState.empty;

  void _setState(String productId, ProductReviewState state) {
    _byProduct.remove(productId);
    _byProduct[productId] = state;
    while (_byProduct.length > _maxCachedProducts) {
      _byProduct.remove(_byProduct.keys.first);
    }
  }

  Future<void> fetchReviews(String productId) async {
    final requestId = ++_requestCounter;
    _requestIds[productId] = requestId;
    _currentProductId = productId;
    _isLoading = true;
    _errorMessage = null;
    _reviews = [];
    _breakdown = null;
    final previous = stateFor(productId);
    _setState(productId, ProductReviewState(
      reviews: previous.reviews,
      breakdown: previous.breakdown,
      isLoading: true,
    ));
    notifyListeners();

    List<ReviewModel> loaded = previous.reviews;
    RatingBreakdownModel? breakdown = previous.breakdown;
    String? error;
    try {
      final res = await _api.get(ApiConstants.getReviews(productId));

      if (res.statusCode == 200) {
        loaded = res.listData()
            .whereType<Map>()
            .map((item) => ReviewModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
      } else {
        error = 'Không thể tải đánh giá. Vui lòng thử lại.';
      }

      breakdown = await _loadBreakdown(productId) ?? breakdown;
    } catch (e) {
      error = 'Không thể tải đánh giá. Vui lòng thử lại.';
    }

    // Một lần tải mới hơn cho cùng sản phẩm đã bắt đầu: bỏ kết quả cũ.
    if (_requestIds[productId] != requestId) return;
    _setState(productId, ProductReviewState(
      reviews: loaded,
      breakdown: breakdown,
      errorMessage: error,
    ));
    if (_currentProductId == productId) {
      _reviews = loaded;
      _breakdown = breakdown;
      _errorMessage = error;
      _isLoading = false;
    }
    notifyListeners();
  }

  Future<RatingBreakdownModel?> _loadBreakdown(String productId) async {
    try {
      final res = await _api.get(ApiConstants.getRatingBreakdown(productId));
      if (res.statusCode == 200) return RatingBreakdownModel.fromJson(res.mapData);
    } catch (e) {
      debugPrint('Lỗi tải rating breakdown: $e');
    }
    return null;
  }

  Future<void> fetchRatingBreakdown(String productId) async {
    final breakdown = await _loadBreakdown(productId);
    if (breakdown == null) return;
    final current = stateFor(productId);
    _setState(productId, ProductReviewState(
      reviews: current.reviews,
      breakdown: breakdown,
      isLoading: current.isLoading,
      errorMessage: current.errorMessage,
    ));
    if (_currentProductId == productId) _breakdown = breakdown;
    notifyListeners();
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
      final res = await _api.get(ApiConstants.canReview(productId), token: token);

      if (res.statusCode == 200) {
        final data = res.mapData;
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
      final res = await _api.post(
        ApiConstants.getReviews(productId),
        token: token,
        body: {
          'rating': rating,
          'content': content,
        },
      );

      if (res.isSuccess) {
        await fetchReviews(productId);
        _canUserReview = false;
        _canReviewReason = 'Bạn đã đánh giá sản phẩm này';
        notifyListeners();
        return true;
      } else {
        _errorMessage = res.message ?? 'Không thể gửi đánh giá';
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
