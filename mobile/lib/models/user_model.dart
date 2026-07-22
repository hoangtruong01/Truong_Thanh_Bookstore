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
