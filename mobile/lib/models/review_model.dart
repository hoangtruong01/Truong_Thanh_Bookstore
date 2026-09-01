class ReviewUserModel {
  final String id;
  final String fullName;
  final String? avatar;

  ReviewUserModel({
    required this.id,
    required this.fullName,
    this.avatar,
  });

  factory ReviewUserModel.fromJson(dynamic json) {
    if (json is String) {
      return ReviewUserModel(id: json, fullName: 'Khách hàng');
    }
    if (json is Map<String, dynamic>) {
      return ReviewUserModel(
        id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
        fullName: json['fullName']?.toString() ?? 'Khách hàng',
        avatar: json['avatar']?.toString(),
      );
    }
    return ReviewUserModel(id: '', fullName: 'Khách hàng');
  }
}

class ReviewModel {
  final String id;
  final String productId;
  final ReviewUserModel user;
  final int rating;
  final String content;
  final bool isVerifiedPurchase;
  final String? adminReply;
  final DateTime? adminReplyAt;
  final bool isApproved;
  final DateTime? createdAt;

  ReviewModel({
    required this.id,
    required this.productId,
    required this.user,
    required this.rating,
    required this.content,
    this.isVerifiedPurchase = false,
    this.adminReply,
    this.adminReplyAt,
    this.isApproved = true,
    this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      productId: json['product']?.toString() ?? '',
      user: ReviewUserModel.fromJson(json['user']),
      rating: (json['rating'] as num?)?.toInt() ?? 5,
      content: json['content']?.toString() ?? '',
      isVerifiedPurchase: json['isVerifiedPurchase'] == true,
      adminReply: json['adminReply']?.toString(),
      adminReplyAt: json['adminReplyAt'] != null
          ? DateTime.tryParse(json['adminReplyAt'].toString())
          : null,
      isApproved: json['isApproved'] != false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'product': productId,
      'user': user.id,
      'rating': rating,
      'content': content,
      'isVerifiedPurchase': isVerifiedPurchase,
      'adminReply': adminReply,
      'adminReplyAt': adminReplyAt?.toIso8601String(),
      'isApproved': isApproved,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

class RatingBreakdownModel {
  final int total;
  final double average;
  final Map<int, int> counts;
  final Map<int, double> percentages;

  RatingBreakdownModel({
    required this.total,
    required this.average,
    required this.counts,
    required this.percentages,
  });

  factory RatingBreakdownModel.fromJson(Map<String, dynamic> json) {
    final rawCounts = json['counts'] as Map<String, dynamic>? ?? {};
    final rawPercentages = json['percentages'] as Map<String, dynamic>? ?? {};

    final Map<int, int> counts = {};
    final Map<int, double> percentages = {};

    for (int star = 1; star <= 5; star++) {
      counts[star] = (rawCounts[star.toString()] as num?)?.toInt() ?? 0;
      percentages[star] = (rawPercentages[star.toString()] as num?)?.toDouble() ?? 0.0;
    }

    return RatingBreakdownModel(
      total: (json['total'] as num?)?.toInt() ?? 0,
      average: (json['average'] as num?)?.toDouble() ?? 0.0,
      counts: counts,
      percentages: percentages,
    );
  }
}
