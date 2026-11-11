import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/product_model.dart';
import '../models/category_model.dart';

/// Một lựa chọn sắp xếp — giá trị khớp `ProductQueryDto.sort` của Backend
/// và dropdown "Sắp xếp theo" trên web.
class ProductSortOption {
  final String value;
  final String label;
  const ProductSortOption(this.value, this.label);
}

/// Lỗi HTTP khi tải dữ liệu sản phẩm (thông điệp đã thân thiện với người dùng).
class ProductLoadException implements Exception {
  final String message;
  const ProductLoadException(this.message);

  @override
  String toString() => message;
}

const List<ProductSortOption> productSortOptions = [
  ProductSortOption('newest', 'Mới nhất'),
  ProductSortOption('price_asc', 'Giá: thấp đến cao'),
  ProductSortOption('price_desc', 'Giá: cao đến thấp'),
  ProductSortOption('best_selling', 'Bán chạy nhất'),
  ProductSortOption('rating', 'Đánh giá cao nhất'),
  ProductSortOption('name_asc', 'Tên: A đến Z'),
  ProductSortOption('name_desc', 'Tên: Z đến A'),
  ProductSortOption('discount_desc', 'Giảm giá nhiều nhất'),
];

/// Dữ liệu dùng chung: sản phẩm của Trang chủ (mới nhất, không lọc) và danh mục.
/// Bộ lọc / sắp xếp / phân trang của màn danh sách nằm trong [ProductCatalog]
/// riêng, nên thao tác lọc không làm thay đổi các khu vực của Trang chủ.
class ProductProvider with ChangeNotifier {
  ProductProvider({ApiClient? apiClient, http.Client? client})
      : _api = apiClient ?? ApiClient(httpClient: client),
        _ownsApi = apiClient == null;
  final ApiClient _api;
  final bool _ownsApi;
  bool _disposed = false;

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

  List<ProductModel> _products = [];
  List<CategoryModel> _categories = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<ProductModel> get products => _products;
  List<CategoryModel> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<ProductModel> get featuredProducts =>
      _products.where((p) => p.isFeatured).toList();

  /// Discounted products among the Home list (0 < discountPrice < price), used until
  /// [fetchDiscountedProducts] has loaded the full server list.
  List<ProductModel> get flashSaleProducts =>
      _products.where((p) => p.discountPrice > 0 && p.discountPrice < p.price).toList();

  // Categories (Home "Danh mục nổi bật").
  bool _isLoadingCategories = false;
  String? _categoriesError;
  bool get isLoadingCategories => _isLoadingCategories;
  String? get categoriesError => _categoriesError;

  // Discounted products from GET /products/discounted (Home deal block, Deal hot screen).
  List<ProductModel> _discountedProducts = [];
  bool _discountedLoaded = false;
  bool _isLoadingDiscounted = false;
  String? _discountedError;
  bool get discountedLoaded => _discountedLoaded;
  bool get isLoadingDiscounted => _isLoadingDiscounted;
  String? get discountedError => _discountedError;

  /// Products on sale: the server list once loaded, the Home subset before that.
  List<ProductModel> get dealProductsSource =>
      _discountedLoaded ? _discountedProducts : flashSaleProducts;

  Future<void> fetchDiscountedProducts({int limit = 60}) async {
    _isLoadingDiscounted = true;
    _discountedError = null;
    notifyListeners();
    try {
      final response = await _api.get(ApiConstants.discountedProducts, query: {'limit': '$limit'});
      if (response.isSuccess) {
        _discountedProducts = response
            .listData()
            .whereType<Map>()
            .map((item) => ProductModel.fromJson(Map<String, dynamic>.from(item)))
            .where((p) => p.discountPrice > 0 && p.discountPrice < p.price)
            .toList();
        _discountedLoaded = true;
      } else {
        _discountedError = response.message ?? 'Không thể tải sản phẩm đang giảm giá. Vui lòng thử lại.';
      }
    } catch (e) {
      debugPrint('Error fetching discounted products: $e');
      _discountedError = 'Không thể tải sản phẩm đang giảm giá. Vui lòng kiểm tra kết nối và thử lại.';
    } finally {
      _isLoadingDiscounted = false;
      notifyListeners();
    }
  }

  /// Tải danh sách sản phẩm cho Trang chủ. [query] / [categoryId] chỉ áp dụng
  /// cho lần gọi này (không lưu thành bộ lọc dùng chung).
  Future<void> fetchProducts({String? query, String? categoryId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final queryParams = <String, String>{
        'limit': '50',
        'sort': 'newest',
        if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
        if (categoryId != null && categoryId.isNotEmpty) 'category': categoryId,
      };

      final response = await _api.get(ApiConstants.products, query: queryParams);

      if (response.statusCode == 200) {
        _products = response.listData().map((item) => ProductModel.fromJson(item)).toList();
      } else {
        _errorMessage = response.message ?? 'Không thể tải sản phẩm. Vui lòng thử lại.';
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
      _errorMessage = 'Không thể tải sản phẩm. Vui lòng kiểm tra kết nối và thử lại.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchCategories() async {
    _isLoadingCategories = true;
    _categoriesError = null;
    notifyListeners();
    try {
      final response = await _api.get(ApiConstants.categories);
      if (response.statusCode == 200) {
        _categories = response.listData().map((item) => CategoryModel.fromJson(item)).toList();
      } else {
        _categoriesError = response.message ?? 'Không thể tải danh mục. Vui lòng thử lại.';
      }
    } catch (e) {
      debugPrint('Error fetching categories: $e');
      _categoriesError = 'Không thể tải danh mục. Vui lòng kiểm tra kết nối và thử lại.';
    } finally {
      _isLoadingCategories = false;
      notifyListeners();
    }
  }

  /// Sản phẩm tương tự từ `GET /products/:id/related` (Backend chọn theo
  /// danh mục / tác giả / NXB / thương hiệu). Ném [ApiException] khi lỗi
  /// để màn hình tự hiển thị trạng thái lỗi.
  Future<List<ProductModel>> fetchRelatedProducts(String productId, {int limit = 6}) async {
    final response = await _api.get(
      ApiConstants.relatedProducts(productId),
      query: {'limit': '$limit'},
    );
    if (!response.isSuccess) {
      throw ProductLoadException(response.message ?? 'Không thể tải sản phẩm tương tự.');
    }
    return response
        .listData()
        .whereType<Map>()
        .map((item) => ProductModel.fromJson(Map<String, dynamic>.from(item)))
        .where((p) => p.id != productId)
        .toList();
  }

  /// Tạo bộ duyệt danh mục có trạng thái riêng, dùng chung HTTP client này.
  ProductCatalog createCatalog({
    int pageSize = ProductCatalog.defaultPageSize,
    Duration searchDebounce = ProductCatalog.defaultSearchDebounce,
  }) =>
      ProductCatalog(api: _api, pageSize: pageSize, searchDebounce: searchDebounce);
}

/// Trạng thái của màn danh sách sản phẩm: tìm kiếm (debounce), bộ lọc,
/// sắp xếp và phân trang cuộn vô hạn theo `meta.totalPages` của Backend.
class ProductCatalog with ChangeNotifier {
  ProductCatalog({
    required ApiClient api,
    this.pageSize = defaultPageSize,
    this.searchDebounce = defaultSearchDebounce,
  }) : _api = api;

  static const int defaultPageSize = 20;
  static const Duration defaultSearchDebounce = Duration(milliseconds: 400);

  final ApiClient _api;
  final int pageSize;
  final Duration searchDebounce;

  bool _disposed = false;
  Timer? _debounce;
  int _generation = 0;

  List<ProductModel> _items = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  bool _hasLoaded = false;
  String? _errorMessage;
  String? _loadMoreError;
  int _page = 0;
  int _totalPages = 0;
  int _total = 0;

  String _searchQuery = '';
  String? _selectedCategory;
  double? _minPrice;
  double? _maxPrice;
  String? _selectedBrand;
  double? _minRating;
  bool _onlyInStock = false;
  String _sortBy = 'newest';

  List<ProductModel> get items => List.unmodifiable(_items);
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  bool get hasLoaded => _hasLoaded;
  String? get errorMessage => _errorMessage;
  String? get loadMoreError => _loadMoreError;
  int get page => _page;
  int get totalPages => _totalPages;
  int get total => _total;
  bool get hasMore => _page < _totalPages;

  String get searchQuery => _searchQuery;
  String? get selectedCategory => _selectedCategory;
  double? get minPrice => _minPrice;
  double? get maxPrice => _maxPrice;
  String? get selectedBrand => _selectedBrand;
  double? get minRating => _minRating;
  bool get onlyInStock => _onlyInStock;
  String get sortBy => _sortBy;

  bool get hasActiveFilters =>
      _minPrice != null || _maxPrice != null || _selectedBrand != null ||
      _minRating != null || _onlyInStock;

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _debounce?.cancel();
    super.dispose();
  }

  /// Tham số truy vấn gửi lên `GET /products` cho trang [page].
  Map<String, String> buildQuery(int page) => <String, String>{
        'page': '$page',
        'limit': '$pageSize',
        'sort': _sortBy,
        if (_searchQuery.isNotEmpty) 'q': _searchQuery,
        if (_selectedCategory != null && _selectedCategory!.isNotEmpty) 'category': _selectedCategory!,
        if (_minPrice != null) 'minPrice': _formatNumber(_minPrice!),
        if (_maxPrice != null) 'maxPrice': _formatNumber(_maxPrice!),
        if (_selectedBrand != null && _selectedBrand!.isNotEmpty) 'brand': _selectedBrand!,
        if (_minRating != null) 'minRating': _formatNumber(_minRating!),
        if (_onlyInStock) 'inStock': 'true',
      };

  static String _formatNumber(double value) =>
      value == value.roundToDouble() ? value.toInt().toString() : value.toString();

  /// Tải lại từ trang 1 với bộ lọc hiện tại.
  Future<void> refresh() async {
    _debounce?.cancel();
    final generation = ++_generation;
    _isLoading = true;
    _isLoadingMore = false;
    _errorMessage = null;
    _loadMoreError = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConstants.products, query: buildQuery(1));
      if (generation != _generation || _disposed) return;
      if (response.isSuccess) {
        final pageItems = _parseItems(response);
        _items = pageItems;
        _page = 1;
        _readPaging(response, pageItems.length);
      } else {
        _errorMessage = response.message ?? 'Không thể tải sản phẩm. Vui lòng thử lại.';
      }
    } catch (e) {
      if (generation != _generation || _disposed) return;
      debugPrint('Error fetching catalogue: $e');
      _errorMessage = 'Không thể tải sản phẩm. Vui lòng kiểm tra kết nối và thử lại.';
    }
    _isLoading = false;
    _hasLoaded = true;
    notifyListeners();
  }

  /// Tải trang kế tiếp (cuộn vô hạn). Bỏ qua khi đang tải hoặc đã hết trang.
  Future<void> loadMore() async {
    if (_isLoading || _isLoadingMore || !hasMore) return;
    final generation = _generation;
    final nextPage = _page + 1;
    _isLoadingMore = true;
    _loadMoreError = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConstants.products, query: buildQuery(nextPage));
      if (generation != _generation || _disposed) return;
      if (response.isSuccess) {
        final pageItems = _parseItems(response);
        final seen = _items.map((p) => p.id).toSet();
        _items = [..._items, ...pageItems.where((p) => seen.add(p.id))];
        _page = nextPage;
        _readPaging(response, pageItems.length);
      } else {
        _loadMoreError = response.message ?? 'Không thể tải thêm sản phẩm.';
      }
    } catch (e) {
      if (generation != _generation || _disposed) return;
      _loadMoreError = 'Không thể tải thêm sản phẩm. Vui lòng thử lại.';
    }
    _isLoadingMore = false;
    notifyListeners();
  }

  List<ProductModel> _parseItems(ApiResponse response) => response
      .listData()
      .whereType<Map>()
      .map((item) => ProductModel.fromJson(Map<String, dynamic>.from(item)))
      .toList();

  void _readPaging(ApiResponse response, int pageCount) {
    final source = response.meta ?? (response.data is Map ? response.mapData : const <String, dynamic>{});
    final totalPages = _asInt(source['totalPages']);
    final total = _asInt(source['total']);
    if (totalPages != null) {
      _totalPages = totalPages;
      _total = total ?? _items.length;
    } else {
      // API không trả meta: còn trang sau khi trang này đầy.
      _totalPages = pageCount >= pageSize ? _page + 1 : _page;
      _total = total ?? _items.length;
    }
  }

  static int? _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return value == null ? null : int.tryParse(value.toString());
  }

  /// Cập nhật từ khóa và tải lại sau [searchDebounce] (gõ liên tục chỉ gửi 1 request).
  void setSearchQuery(String q) {
    final next = q.trim();
    _debounce?.cancel();
    if (next == _searchQuery) return;
    _searchQuery = next;
    if (searchDebounce == Duration.zero) {
      refresh();
      return;
    }
    _debounce = Timer(searchDebounce, refresh);
  }

  /// Lần tải đầu của màn danh sách, có thể kèm danh mục / từ khóa ban đầu.
  Future<void> load({String? categoryId, String? query}) {
    if (categoryId != null && categoryId.isNotEmpty) _selectedCategory = categoryId;
    if (query != null) _searchQuery = query.trim();
    return refresh();
  }

  /// Đặt từ khóa và tải ngay (vd. mở từ ô tìm kiếm Trang chủ).
  Future<void> searchNow(String q) {
    _debounce?.cancel();
    _searchQuery = q.trim();
    return refresh();
  }

  Future<void> setSortBy(String sort) {
    if (productSortOptions.every((o) => o.value != sort)) return Future.value();
    _sortBy = sort;
    return refresh();
  }

  Future<void> selectCategory(String? categoryId) {
    _selectedCategory = (categoryId == null || categoryId.isEmpty) ? null : categoryId;
    return refresh();
  }

  Future<void> applyFilters({
    double? minPrice,
    double? maxPrice,
    String? brand,
    double? minRating,
    bool onlyInStock = false,
  }) {
    _minPrice = (minPrice != null && minPrice >= 0) ? minPrice : null;
    _maxPrice = (maxPrice != null && maxPrice >= 0) ? maxPrice : null;
    if (_minPrice != null && _maxPrice != null && _minPrice! > _maxPrice!) {
      final swap = _minPrice;
      _minPrice = _maxPrice;
      _maxPrice = swap;
    }
    _selectedBrand = (brand == null || brand.isEmpty) ? null : brand;
    _minRating = minRating;
    _onlyInStock = onlyInStock;
    return refresh();
  }

  /// Bỏ từ khóa, danh mục và mọi bộ lọc rồi tải lại một lần.
  Future<void> resetAll() {
    _searchQuery = '';
    _selectedCategory = null;
    return clearFilters();
  }

  Future<void> clearFilters() {
    _minPrice = null;
    _maxPrice = null;
    _selectedBrand = null;
    _minRating = null;
    _onlyInStock = false;
    _sortBy = 'newest';
    return refresh();
  }
}
