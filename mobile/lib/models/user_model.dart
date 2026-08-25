class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String role;
  final String? avatar;
  final bool status;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.role,
    this.avatar,
    required this.status,
  });

  bool get isSuperAdmin => role == 'SUPER_ADMIN';
  bool get isAdmin => role == 'ADMIN' || role == 'SUPER_ADMIN';
  bool get isStaff => role == 'STAFF' || role == 'ADMIN' || role == 'SUPER_ADMIN';
  bool get isCustomer => role == 'CUSTOMER';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'CUSTOMER',
      avatar: json['avatar'],
      status: json['status'] ?? true,
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
    };
  }
}
