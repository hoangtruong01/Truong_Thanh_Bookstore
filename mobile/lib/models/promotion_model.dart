class PromotionModel {
  final String id;
  final String code;
  final String name;
  final String? description;
  final String discountType; // PERCENT | FIXED
  final num discountValue;
  final num minOrderValue;
  final num? maxDiscount;
  final bool status;

  PromotionModel({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    required this.discountType,
    required this.discountValue,
    required this.minOrderValue,
    this.maxDiscount,
    required this.status,
  });

  factory PromotionModel.fromJson(Map<String, dynamic> json) {
    return PromotionModel(
      id: json['_id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      discountType: json['discountType'] ?? 'PERCENT',
      discountValue: json['discountValue'] ?? 0,
      minOrderValue: json['minOrderValue'] ?? 0,
      maxDiscount: json['maxDiscount'],
      status: json['status'] ?? true,
    );
  }
}
