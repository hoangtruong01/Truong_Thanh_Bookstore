class ProductModel {
  final String id;
  final String name;
  final String slug;
  final String sku;
  final String? description;
  final String? brand;
  final String? author;
  final String? publisher;
  final String? isbn;
  final int? publicationYear;
  final num price;
  final num discountPrice;
  final int stock;
  final List<String> images;

  /// Điểm đánh giá trung bình do Backend tính. 0 = chưa có đánh giá
  /// (không tự gán điểm mặc định, giống web "Chưa có đánh giá").
  final num rating;

  /// Số lượt đánh giá nếu Backend trả về (`reviewCount` / `numReviews`);
  /// null khi API không cung cấp trường này.
  final int? reviewCount;
  final int sold;
  final bool isFeatured;

  ProductModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.sku,
    this.description,
    this.brand,
    this.author,
    this.publisher,
    this.isbn,
    this.publicationYear,
    required this.price,
    required this.discountPrice,
    required this.stock,
    required this.images,
    required this.rating,
    this.reviewCount,
    required this.sold,
    required this.isFeatured,
  });

  num get effectivePrice => (discountPrice > 0) ? discountPrice : price;
  num get displayPrice => effectivePrice;
  bool get hasDiscount => discountPrice > 0 && discountPrice < price;

  bool get isInStock => stock > 0;

  /// Có điểm đánh giá thật để hiển thị (rating > 0 và không bị báo 0 lượt).
  bool get hasRating => rating > 0 && (reviewCount == null || reviewCount! > 0);

  /// Số lượng còn có thể thêm vào giỏ khi giỏ đã có [inCart] sản phẩm này.
  /// Chỉ là chặn hiển thị phía app; Backend vẫn kiểm tra tồn kho khi đặt hàng.
  int addableQuantity({int inCart = 0, required int requested}) {
    final remaining = stock - inCart;
    if (remaining <= 0 || requested <= 0) return 0;
    return requested > remaining ? remaining : requested;
  }

  /// Khóa định danh trên URL web (`/products/:slug || :id`).
  String get urlKey => slug.isNotEmpty ? slug : id;

  static int? _toInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString());
  }

  static num _toNum(dynamic value) {
    if (value is num) return value;
    if (value == null) return 0;
    return num.tryParse(value.toString()) ?? 0;
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    List<String> imgList = [];
    if (json['images'] is List) {
      imgList = (json['images'] as List)
          .where((e) => e != null && e.toString().isNotEmpty)
          .map((e) => e.toString())
          .toList();
    }

    return ProductModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      sku: json['sku']?.toString() ?? '',
      description: json['description']?.toString(),
      brand: json['brand']?.toString(),
      author: json['author']?.toString(),
      publisher: json['publisher']?.toString(),
      isbn: json['isbn']?.toString(),
      publicationYear: _toInt(json['publicationYear']),
      price: _toNum(json['price']),
      discountPrice: _toNum(json['discountPrice']),
      stock: _toInt(json['stock']) ?? 0,
      images: imgList,
      rating: _toNum(json['rating']),
      reviewCount: _toInt(json['reviewCount'] ?? json['numReviews']),
      sold: _toInt(json['sold']) ?? 0,
      isFeatured: json['isFeatured'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'slug': slug,
      'sku': sku,
      'description': description,
      'brand': brand,
      'author': author,
      'publisher': publisher,
      'isbn': isbn,
      'publicationYear': publicationYear,
      'price': price,
      'discountPrice': discountPrice,
      'stock': stock,
      'images': images,
      'rating': rating,
      if (reviewCount != null) 'reviewCount': reviewCount,
      'sold': sold,
      'isFeatured': isFeatured,
    };
  }
}
