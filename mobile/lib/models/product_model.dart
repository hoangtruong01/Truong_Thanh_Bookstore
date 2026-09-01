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
  final num rating;
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
    required this.sold,
    required this.isFeatured,
  });

  num get effectivePrice => (discountPrice > 0) ? discountPrice : price;
  num get displayPrice => effectivePrice;
  bool get hasDiscount => discountPrice > 0 && discountPrice < price;

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    List<String> imgList = [];
    if (json['images'] != null) {
      imgList = List<String>.from(json['images']);
    }

    return ProductModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      sku: json['sku'] ?? '',
      description: json['description'],
      brand: json['brand'],
      author: json['author'],
      publisher: json['publisher'],
      isbn: json['isbn'],
      publicationYear: json['publicationYear'] != null ? int.tryParse(json['publicationYear'].toString()) : null,
      price: json['price'] ?? 0,
      discountPrice: json['discountPrice'] ?? 0,
      stock: json['stock'] ?? 0,
      images: imgList,
      rating: json['rating'] ?? 5.0,
      sold: json['sold'] ?? 0,
      isFeatured: json['isFeatured'] ?? false,
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
      'sold': sold,
      'isFeatured': isFeatured,
    };
  }
}
