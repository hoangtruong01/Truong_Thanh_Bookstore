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

  List<ProductModel> get products => _products;
  List<CategoryModel> get categories => _categories;
  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;
  String? get selectedCategory => _selectedCategory;

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
      };

      final uri = Uri.parse(ApiConstants.products).replace(queryParameters: queryParams);
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final List dataList = body['data']['data'] ?? [];
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
        final List dataList = body['data'] ?? [];
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
}
