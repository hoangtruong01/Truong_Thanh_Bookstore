import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/banner_model.dart';
import '../models/product_model.dart';

/// Banner trang chủ do admin cấu hình (GET /banners/active, public).
class BannerProvider with ChangeNotifier {
  BannerProvider({ApiClient? apiClient, http.Client? client})
      : _api = apiClient ?? ApiClient(httpClient: client),
        _ownsApi = apiClient == null;
  final ApiClient _api;
  final bool _ownsApi;
  bool _disposed = false;

  @override
  void dispose() {
    _disposed = true;
    if (_ownsApi) _api.close();
    super.dispose();
  }

  List<BannerModel> _mainSlider = [];
  bool _isLoading = false;
  bool _hasLoaded = false;
  String? _errorMessage;

  /// Banner vị trí `main_slider` có ảnh hợp lệ, theo `sortOrder` tăng dần.
  List<BannerModel> get mainSlider => List.unmodifiable(_mainSlider);
  bool get isLoading => _isLoading;

  /// Đã có ít nhất một lần tải xong (thành công hoặc lỗi).
  bool get hasLoaded => _hasLoaded;
  String? get errorMessage => _errorMessage;

  Future<void> fetchActiveBanners() async {
    if (_isLoading) return;
    _isLoading = true;
    _errorMessage = null;
    _notify();

    try {
      final res = await _api.get(ApiConstants.activeBanners);
      if (res.isSuccess) {
        _mainSlider = parseMainSlider(res.data);
      } else {
        _errorMessage = res.message ?? 'Không thể tải banner';
      }
    } on ApiNetworkException catch (e) {
      _errorMessage = e.toString();
    } catch (e) {
      debugPrint('Lỗi tải banner: $e');
      _errorMessage = 'Không thể tải banner';
    } finally {
      _isLoading = false;
      _hasLoaded = true;
      _notify();
    }
  }

  /// Tải sản phẩm theo ID hoặc slug (GET /products/:idOrSlug) để mở từ link banner.
  /// Trả về null nếu không tìm thấy hoặc lỗi mạng.
  Future<ProductModel?> fetchProductByLink(String idOrSlug) async {
    final key = idOrSlug.trim();
    if (key.isEmpty) return null;
    try {
      final res = await _api.get('${ApiConstants.products}/${Uri.encodeComponent(key)}');
      final data = res.mapData;
      if (res.isSuccess && data.isNotEmpty) return ProductModel.fromJson(data);
    } catch (e) {
      debugPrint('Lỗi tải sản phẩm từ banner: $e');
    }
    return null;
  }

  /// Backend trả `{position: Banner[]}`; chấp nhận cả mảng phẳng có `position`.
  static List<BannerModel> parseMainSlider(dynamic data) {
    List<dynamic> raw;
    if (data is Map) {
      final group = data[BannerPositions.mainSlider];
      raw = group is List ? group : const [];
    } else if (data is List) {
      raw = data;
    } else {
      raw = const [];
    }

    final banners = raw
        .whereType<Map>()
        .map((item) => BannerModel.fromJson(Map<String, dynamic>.from(item)))
        .where((b) => b.position == BannerPositions.mainSlider && b.hasImage)
        .toList();
    // Sắp xếp ổn định: cùng sortOrder thì giữ nguyên thứ tự server trả về.
    final order = {for (var i = 0; i < banners.length; i++) banners[i]: i};
    banners.sort((a, b) {
      final bySort = a.sortOrder.compareTo(b.sortOrder);
      return bySort != 0 ? bySort : order[a]!.compareTo(order[b]!);
    });
    return banners;
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }
}
