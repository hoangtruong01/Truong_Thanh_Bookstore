class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String role;
  final String? avatar;
  final bool status;

  /// Điểm tích lũy do Backend tính (cộng khi đơn hàng hoàn tất).
  final int loyaltyPoints;

  /// Hạng thành viên do Backend xếp: BRONZE | SILVER | GOLD | DIAMOND.
  final String loyaltyTier;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.role,
    this.avatar,
    required this.status,
    this.loyaltyPoints = 0,
    this.loyaltyTier = 'BRONZE',
  });

  bool get isSuperAdmin => role == 'SUPER_ADMIN';
  bool get isAdmin => role == 'ADMIN' || role == 'SUPER_ADMIN';
  bool get isStaff => role == 'STAFF' || role == 'ADMIN' || role == 'SUPER_ADMIN';
  bool get isCustomer => role == 'CUSTOMER';

  /// Tên hạng hiển thị cho người dùng (chỉ đổi nhãn, không tự xếp hạng).
  String get loyaltyTierLabel => tierLabel(loyaltyTier);

  static String tierLabel(String tier) {
    switch (tier) {
      case 'SILVER':
        return 'Bạc';
      case 'GOLD':
        return 'Vàng';
      case 'DIAMOND':
        return 'Kim cương';
      default:
        return 'Đồng';
    }
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final rawPoints = json['loyaltyPoints'];
    final rawTier = json['loyaltyTier']?.toString();
    return UserModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'CUSTOMER',
      avatar: json['avatar'],
      status: json['status'] ?? true,
      loyaltyPoints: rawPoints is num
          ? rawPoints.toInt()
          : int.tryParse(rawPoints?.toString() ?? '') ?? 0,
      loyaltyTier: rawTier == null || rawTier.isEmpty ? 'BRONZE' : rawTier,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'role': role,
      'avatar': avatar,
      'status': status,
      'loyaltyPoints': loyaltyPoints,
      'loyaltyTier': loyaltyTier,
    };
  }
}
