class OrderItemModel {
  final String product;
  final String name;
  final num price;
  final int quantity;
  final String? image;

  OrderItemModel({
    required this.product,
    required this.name,
    required this.price,
    required this.quantity,
    this.image,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      product: json['product'] is Map ? json['product']['_id'] : (json['product']?.toString() ?? ''),
      name: json['name'] ?? '',
      price: json['price'] ?? 0,
      quantity: json['quantity'] ?? 1,
      image: json['image'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product': product,
      'name': name,
      'price': price,
      'quantity': quantity,
      'image': image,
    };
  }
}

class OrderModel {
  final String id;
  final String orderCode;
  final List<OrderItemModel> items;
  final String shippingAddress;
  final String phone;
  final String? note;
  final String paymentMethod;
  final String paymentStatus;
  final String orderStatus;
  final num subtotal;
  final num shippingFee;
  final num discount;
  final num total;
  final String? customerName;
  final String? customerEmail;
  final String? promotionCode;
  final String createdAt;

  OrderModel({
    required this.id,
    required this.orderCode,
    required this.items,
    required this.shippingAddress,
    required this.phone,
    this.note,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.orderStatus,
    required this.subtotal,
    required this.shippingFee,
    required this.discount,
    required this.total,
    this.customerName,
    this.customerEmail,
    this.promotionCode,
    required this.createdAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    List<OrderItemModel> itemList = [];
    if (json['items'] != null) {
      itemList = (json['items'] as List).map((i) => OrderItemModel.fromJson(i)).toList();
    }

    return OrderModel(
      id: json['_id'] ?? '',
      orderCode: json['orderCode'] ?? '',
      items: itemList,
      shippingAddress: json['shippingAddress'] ?? '',
      phone: json['phone'] ?? '',
      note: json['note'],
      paymentMethod: json['paymentMethod'] ?? 'COD',
      paymentStatus: json['paymentStatus'] ?? 'UNPAID',
      orderStatus: json['orderStatus'] ?? 'PENDING',
      subtotal: json['subtotal'] ?? 0,
      shippingFee: json['shippingFee'] ?? 0,
      discount: json['discount'] ?? 0,
      total: json['total'] ?? 0,
      customerName: json['customerName'],
      customerEmail: json['customerEmail'],
      promotionCode: json['promotionCode'],
      createdAt: json['createdAt'] ?? '',
    );
  }
}
