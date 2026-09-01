class AddressModel {
  final String id;
  final String user;
  final String label;
  final String recipientName;
  final String phone;
  final String province;
  final String district;
  final String ward;
  final String detail;
  final bool isDefault;
  final bool isDeleted;

  AddressModel({
    required this.id,
    required this.user,
    required this.label,
    required this.recipientName,
    required this.phone,
    required this.province,
    required this.district,
    required this.ward,
    required this.detail,
    this.isDefault = false,
    this.isDeleted = false,
  });

  String get fullAddress {
    final parts = [detail, ward, district, province].where((p) => p.isNotEmpty).toList();
    return parts.join(', ');
  }

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      user: json['user']?.toString() ?? '',
      label: json['label']?.toString() ?? 'Nhà riêng',
      recipientName: json['recipientName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      province: json['province']?.toString() ?? '',
      district: json['district']?.toString() ?? '',
      ward: json['ward']?.toString() ?? '',
      detail: json['detail']?.toString() ?? '',
      isDefault: json['isDefault'] == true,
      isDeleted: json['isDeleted'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user': user,
      'label': label,
      'recipientName': recipientName,
      'phone': phone,
      'province': province,
      'district': district,
      'ward': ward,
      'detail': detail,
      'isDefault': isDefault,
      'isDeleted': isDeleted,
    };
  }
}
