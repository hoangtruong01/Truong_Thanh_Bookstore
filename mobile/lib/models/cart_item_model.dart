import 'product_model.dart';

class CartItemModel {
  /// Cached product snapshot (name, image, stock, price hint). Prices shown as money
  /// totals always come from the server preview, never from this snapshot.
  ProductModel product;
  int quantity;
  bool selected;

  CartItemModel({
    required this.product,
    this.quantity = 1,
    this.selected = true,
  });

  /// Local persistence shape (shared_preferences): a minimal product snapshot.
  Map<String, dynamic> toJson() => {
        'product': {
          '_id': product.id,
          'name': product.name,
          'slug': product.slug,
          'sku': product.sku,
          'price': product.price,
          'discountPrice': product.discountPrice,
          'stock': product.stock,
          'images': product.images.take(1).toList(),
          'rating': product.rating,
          'sold': product.sold,
          'isFeatured': product.isFeatured,
        },
        'quantity': quantity,
        'selected': selected,
      };

  /// Returns null for malformed entries so a corrupted cache never crashes the app.
  static CartItemModel? tryFromJson(dynamic json) {
    if (json is! Map || json['product'] is! Map) return null;
    try {
      final product = ProductModel.fromJson(Map<String, dynamic>.from(json['product'] as Map));
      final quantity = json['quantity'] is num ? (json['quantity'] as num).toInt() : 0;
      if (product.id.isEmpty || quantity <= 0) return null;
      return CartItemModel(product: product, quantity: quantity, selected: json['selected'] != false);
    } catch (_) {
      return null;
    }
  }
}
