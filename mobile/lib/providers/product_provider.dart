import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/product_model.dart';
import '../models/category_model.dart';

class ProductProvider with ChangeNotifier {
  List<ProductModel> _products = [];
  List<CategoryModel> _categories = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String? _selectedCategory;
  double? _minPrice;
  double? _maxPrice;
  String? _selectedBrand;
  double? _minRating;
  bool _onlyInStock = false;

  List<ProductModel> get products => _products;
  List<CategoryModel> get categories => _categories;
  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;
  String? get selectedCategory => _selectedCategory;
  double? get minPrice => _minPrice;
  double? get maxPrice => _maxPrice;
  String? get selectedBrand => _selectedBrand;
  double? get minRating => _minRating;
  bool get onlyInStock => _onlyInStock;

  List<ProductModel> get featuredProducts =>
      _products.where((p) => p.isFeatured).toList();

  List<ProductModel> get flashSaleProducts =>
      _products.where((p) => p.discountPrice > 0).toList();

  Future<void> fetchProducts({String? query, String? categoryId}) async {
    _isLoading = true;
    _searchQuery = query ?? _searchQuery;
    _selectedCategory = categoryId ?? _selectedCategory;
    notifyListeners();

    try {
      final queryParams = <String, String>{
        'limit': '50',
        if (_searchQuery.isNotEmpty) 'q': _searchQuery,
        if (_selectedCategory != null && _selectedCategory!.isNotEmpty) 'category': _selectedCategory!,
        if (_minPrice != null) 'minPrice': _minPrice!.toString(),
        if (_maxPrice != null) 'maxPrice': _maxPrice!.toString(),
        if (_selectedBrand != null && _selectedBrand!.isNotEmpty) 'brand': _selectedBrand!,
        if (_minRating != null) 'minRating': _minRating!.toString(),
        if (_onlyInStock) 'inStock': 'true',
      };

      final uri = Uri.parse(ApiConstants.products).replace(queryParameters: queryParams);
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        dynamic rawData = body['data'];
        List dataList = [];
        if (rawData is List) {
          dataList = rawData;
        } else if (rawData is Map && rawData['data'] is List) {
          dataList = rawData['data'];
        } else if (rawData is Map && rawData['items'] is List) {
          dataList = rawData['items'];
        }
        _products = dataList.map((item) => ProductModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchCategories() async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.categories));
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        dynamic rawData = body['data'];
        List dataList = [];
        if (rawData is List) {
          dataList = rawData;
        } else if (rawData is Map && rawData['data'] is List) {
          dataList = rawData['data'];
        }
        _categories = dataList.map((item) => CategoryModel.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching categories: $e');
    }
  }

  void setSearchQuery(String q) {
    _searchQuery = q;
    fetchProducts();
  }

  void selectCategory(String? catId) {
    _selectedCategory = catId;
    fetchProducts();
  }

  void applyFilters({
    double? minPrice,
    double? maxPrice,
    String? brand,
    double? minRating,
    bool? onlyInStock,
  }) {
    _minPrice = minPrice;
    _maxPrice = maxPrice;
    _selectedBrand = brand;
    _minRating = minRating;
    _onlyInStock = onlyInStock ?? false;
    fetchProducts();
  }

  void clearFilters() {
    _minPrice = null;
    _maxPrice = null;
    _selectedBrand = null;
    _minRating = null;
    _onlyInStock = false;
    fetchProducts();
  }
}
